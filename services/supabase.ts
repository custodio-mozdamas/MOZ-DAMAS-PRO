
import { supabase } from '../lib/supabase';
import { PlayerProfile, Room, Game, BoardState } from '../types';
import { createInitialBoard } from './gameLogic';

export const authService = {
  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
    return data;
  },
  login: async (email: string, pass: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
    const { data: profile } = await supabase.from('users').select('*').eq('id', data.user.id).single();
    return profile;
  },
  logout: async () => {
    await supabase.auth.signOut();
  },
  register: async (userData: any) => {
    const { data, error } = await supabase.auth.signUp({ 
      email: userData.email, 
      password: userData.password,
      options: { 
        data: { 
          username: userData.username 
        } 
      }
    });
    if (error) throw error;
    
    const { data: profile } = await supabase.from('users').select('*').eq('id', data.user!.id).single();
    return profile;
  },
  updateUser: async (updates: Partial<PlayerProfile>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase.from('users').update(updates).eq('id', user.id).select().single();
    return data;
  }
};

export const gameService = {
  getRooms: async () => {
    // DEFINITIVO: Apenas salas criadas nas últimas 6 horas são consideradas "vivas"
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase.from('rooms')
      .select('*, player_white:player_white_id(username), player_red:player_red_id(username)')
      .neq('status', 'finished')
      .gt('created_at', sixHoursAgo) // Filtro temporal dinâmico
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Erro ao buscar salas:", error);
      return [];
    }
    
    // Filtro de Integridade: Remove salas que por algum erro ficaram sem nenhum jogador
    return (data || []).filter(room => room.player_white_id !== null || room.player_red_id !== null);
  },
  purgeAllRooms: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Tentamos deletar as salas vinculadas ao usuário atual que ficaram "presas"
    // O RLS do Supabase geralmente impede deletar salas de outros usuários, 
    // por isso focamos em limpar as próprias salas para manter o banco saudável.
    await supabase.from('rooms')
      .delete()
      .or(`player_white_id.eq.${user.id},player_red_id.eq.${user.id}`);
  },
  createRoom: async (config: any, userId: string) => {
    const initialTimeMin = parseInt(config.time, 10);
    const initialTimeSec = initialTimeMin * 60;
    
    const roomPayload = {
      room_name: config.name || `Sala de ${userId.slice(0, 4)}`,
      theme: config.theme,
      initial_time: initialTimeMin,
      player_white_id: config.side === 'white' ? userId : null,
      player_red_id: config.side === 'red' ? userId : null,
      status: 'waiting'
    };

    const { data: rooms, error: roomError } = await supabase
      .from('rooms')
      .insert([roomPayload])
      .select();

    if (roomError) throw roomError;

    const room = rooms![0];

    const gamePayload = {
      room_id: room.id,
      board_state: createInitialBoard(),
      current_turn: 'white',
      white_time: initialTimeSec,
      red_time: initialTimeSec,
      has_started: false
    };

    const { error: gameError } = await supabase.from('games').insert([gamePayload]);
    if (gameError) {
      await supabase.from('rooms').delete().eq('id', room.id);
      throw gameError;
    }

    return room;
  },
  joinRoom: async (roomId: string, userId: string) => {
    const { data: room } = await supabase.from('rooms').select('*').eq('id', roomId).single();
    if (!room) return null;

    if (room.player_white_id === userId || room.player_red_id === userId) return room;

    const updates: any = {};
    if (!room.player_white_id) {
      updates.player_white_id = userId;
      if (room.player_red_id) updates.status = 'active';
    } else if (!room.player_red_id) {
      updates.player_red_id = userId;
      if (room.player_white_id) updates.status = 'active';
    }
    
    if (Object.keys(updates).length > 0) {
      const { data: updatedRooms } = await supabase.from('rooms').update(updates).eq('id', roomId).select();
      return (updatedRooms && updatedRooms.length > 0) ? updatedRooms[0] : room;
    }
    
    return room;
  },
  leaveRoom: async (roomId: string, userId: string) => {
    const { data: roomBefore } = await supabase.from('rooms').select('*').eq('id', roomId).single();
    if (!roomBefore) return;

    const updates: any = {};
    if (roomBefore.player_white_id === userId) updates.player_white_id = null;
    if (roomBefore.player_red_id === userId) updates.player_red_id = null;

    if (Object.keys(updates).length === 0) return;

    const { data: updatedRoom } = await supabase
      .from('rooms')
      .update(updates)
      .eq('id', roomId)
      .select()
      .single();

    // Se a sala ficou vazia, deletamos de vez
    if (updatedRoom && updatedRoom.player_white_id === null && updatedRoom.player_red_id === null) {
      await supabase.from('games').delete().eq('room_id', roomId);
      await supabase.from('rooms').delete().eq('id', roomId);
    }
  },
  updateGameState: async (gameId: string, updates: any) => {
    await supabase.from('games').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', gameId);
  },
  processGameEnd: async (winnerId: string | 'draw', room: Room) => {
    if (winnerId === 'draw') {
      if (room.player_white_id) await gameService.updateElo(room.player_white_id, 5, 'draw');
      if (room.player_red_id) await gameService.updateElo(room.player_red_id, 5, 'draw');
    } else {
      const loserId = room.player_white_id === winnerId ? room.player_red_id : room.player_white_id;
      await gameService.updateElo(winnerId, 20, 'win');
      if (loserId) await gameService.updateElo(loserId, -15, 'loss');
    }
  },
  updateElo: async (userId: string, points: number, type: 'win' | 'loss' | 'draw') => {
    const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();
    if (!user) return;
    
    const newElo = Math.max(100, (user.elo || 1200) + points);
    const updates: any = { elo: newElo };
    if (type === 'win') updates.wins = (user.wins || 0) + 1;
    if (type === 'loss') updates.losses = (user.losses || 0) + 1;
    if (type === 'draw') updates.draws = (user.draws || 0) + 1;

    await supabase.from('users').update(updates).eq('id', userId);
  },
  resetGame: async (gameId: string, initialTimeMinutes: number) => {
    const initialTimeSec = initialTimeMinutes * 60;
    await supabase.from('games').update({
      board_state: createInitialBoard(),
      current_turn: 'white',
      white_time: initialTimeSec,
      red_time: initialTimeSec,
      winner_id: null,
      draw_offered_by: null,
      must_continue_piece_id: null,
      has_started: false,
      updated_at: new Date().toISOString()
    }).eq('id', gameId);
  },
  startGame: async (gameId: string) => {
    await supabase.from('games').update({ has_started: true }).eq('id', gameId);
  }
};

export const leaderboardService = {
  getTopPlayers: async () => {
    const { data, error } = await supabase.from('users').select('*').order('elo', { ascending: false }).limit(20);
    if (error) return [];
    return (data || []).map((p: any, index: number) => ({
      ...p,
      rank: index + 1,
      country: 'MZ'
    }));
  }
};
