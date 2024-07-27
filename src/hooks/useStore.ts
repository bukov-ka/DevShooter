import create from 'zustand';

export type PlayerType = 'Backend Developer' | 'Frontend Developer' | 'QA';

interface Player {
  id: string;
  x: number;
  y: number;
  health: number;
  type: PlayerType;
  specialAbilityCooldown: number;
}

interface GameState {
  players: Player[];
  localPlayerId: string | null;
  localPlayerType: PlayerType | null;
  addPlayer: (id: string, x: number, y: number, health: number, type: PlayerType) => void;
  removePlayer: (id: string) => void;
  updatePlayer: (id: string, x: number, y: number) => void;
  setLocalPlayerId: (id: string) => void;
  setLocalPlayerType: (type: PlayerType) => void;
  updateSpecialAbilityCooldown: (id: string, cooldown: number) => void;
}

export const useStore = create<GameState>((set) => ({
  players: [],
  localPlayerId: null,
  localPlayerType: null,
  addPlayer: (id, x, y, health, type) => set((state) => ({
    players: [...state.players, { id, x, y, health, type, specialAbilityCooldown: 0 }]
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
  setLocalPlayerType: (type) => set({ localPlayerType: type }),
  updateSpecialAbilityCooldown: (id, cooldown) => set((state) => ({
    players: state.players.map((player) =>
      player.id === id ? { ...player, specialAbilityCooldown: cooldown } : player
    ),
  })),
}));