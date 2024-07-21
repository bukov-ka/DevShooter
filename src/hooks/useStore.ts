import create from 'zustand';

interface Player {
  id: string;
  x: number;
  y: number;
  health: number;
}

interface GameState {
  players: Player[];
  localPlayerId: string | null;
  addPlayer: (id: string, x: number, y: number, health: number) => void;
  removePlayer: (id: string) => void;
  updatePlayer: (id: string, x: number, y: number) => void;
  setLocalPlayerId: (id: string) => void;
}

export const useStore = create<GameState>((set) => ({
  players: [],
  localPlayerId: null,
  addPlayer: (id, x, y, health) => set((state) => ({
    players: [...state.players, { id, x, y, health }]
  })),
  removePlayer: (id) => set((state) => ({
    players: state.players.filter((player) => player.id !== id)
  })),
  updatePlayer: (id, x, y) => set((state) => ({
    players: state.players.map((player) =>
      player.id === id ? { ...player, x, y } : player
    ),
  })),
  setLocalPlayerId: (id) => set({ localPlayerId: id }),
}));