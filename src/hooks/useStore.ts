// src/hooks/useStore.ts

import create from 'zustand';

export type PlayerType = 'Backend Developer' | 'Frontend Developer' | 'QA';

interface Player {
  id: string;
  x: number;
  y: number;
  health: number;
  type: PlayerType;
  specialAbilityCooldown: number;
  name: string;
  kills: number;
  deaths: number;
  bulletsFired: number;
}

interface GameState {
  players: Player[];
  localPlayerId: string | null;
  localPlayerType: PlayerType | null;
  bulletDamage: number;
  addPlayer: (id: string, x: number, y: number, health: number, type: PlayerType, name: string) => void;
  removePlayer: (id: string) => void;
  updatePlayer: (id: string, data: Partial<Player>) => void;
  setLocalPlayerId: (id: string) => void;
  setLocalPlayerType: (type: PlayerType) => void;
  updateSpecialAbilityCooldown: (id: string, cooldown: number) => void;
  damagePlayer: (id: string, damage: number) => void;
  incrementKills: (id: string) => void;
  incrementDeaths: (id: string) => void;
  incrementBulletsFired: (id: string) => void;
  respawnPlayer: (id: string) => void;
  playerKilled: { killedId: string, killerId: string } | null;
  setPlayerKilled: (event: { killedId: string, killerId: string } | null) => void;
}

export const useStore = create<GameState>((set) => ({
  players: [],
  localPlayerId: null,
  localPlayerType: null,
  bulletDamage: 34,
  addPlayer: (id, x, y, health, type, name) => set((state) => ({
    players: [...state.players, { 
      id, x, y, health, type, name,
      specialAbilityCooldown: 0, 
      kills: 0,
      deaths: 0,
      bulletsFired: 0
    }]
  })),
  removePlayer: (id) => set((state) => ({
    players: state.players.filter((player) => player.id !== id)
  })),
  updatePlayer: (id, data) => set((state) => ({
    players: state.players.map((player) =>
      player.id === id ? { ...player, ...data } : player
    ),
  })),
  setLocalPlayerId: (id) => set({ localPlayerId: id }),
  setLocalPlayerType: (type) => set({ localPlayerType: type }),
  updateSpecialAbilityCooldown: (id, cooldown) => set((state) => ({
    players: state.players.map((player) =>
      player.id === id ? { ...player, specialAbilityCooldown: cooldown } : player
    ),
  })),
  damagePlayer: (id, damage) => set((state) => ({
    players: state.players.map((player) =>
      player.id === id ? { ...player, health: Math.max(0, player.health - damage) } : player
    ),
  })),
  incrementKills: (id) => set((state) => ({
    players: state.players.map((player) =>
      player.id === id ? { ...player, kills: player.kills + 1 } : player
    ),
  })),
  incrementDeaths: (id) => set((state) => ({
    players: state.players.map((player) =>
      player.id === id ? { ...player, deaths: player.deaths + 1 } : player
    ),
  })),
  incrementBulletsFired: (id) => set((state) => ({
    players: state.players.map((player) =>
      player.id === id ? { ...player, bulletsFired: player.bulletsFired + 1 } : player
    ),
  })),
  respawnPlayer: (id) => set((state) => ({
    players: state.players.map((player) =>
      player.id === id ? { ...player, health: 100 } : player
    ),
  })),
  playerKilled: null,
  setPlayerKilled: (event) => set({ playerKilled: event }),
}));