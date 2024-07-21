// src/hooks/useStore.ts
import create from 'zustand';

interface GameState {
  players: { id: string; x: number; y: number; health: number }[];
  addPlayer: (id: string) => void;
  removePlayer: (id: string) => void;
  updatePlayer: (id: string, x: number, y: number) => void;
}

export const useStore = create<GameState>((set) => ({
  players: [],
  addPlayer: (id) => set((state) => ({ players: [...state.players, { id, x: 0, y: 0, health: 100 }] })),
  removePlayer: (id) => set((state) => ({ players: state.players.filter((player) => player.id !== id) })),
  updatePlayer: (id, x, y) => set((state) => ({
    players: state.players.map((player) =>
      player.id === id ? { ...player, x, y } : player
    ),
  })),
}));
