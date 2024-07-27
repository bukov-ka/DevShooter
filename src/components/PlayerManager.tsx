import React, { useEffect, useRef, useCallback } from 'react';
import Matter from 'matter-js';
import { Socket } from 'socket.io-client';
import { useStore } from '../hooks/useStore';

interface PlayerManagerProps {
  socketRef: React.RefObject<Socket | null>;
  engineRef: React.RefObject<Matter.Engine | null>;
  playerBodiesRef: React.RefObject<{ [id: string]: Matter.Body }>;
}

const PlayerManager: React.FC<PlayerManagerProps> = ({ socketRef, engineRef, playerBodiesRef }) => {
  const { addPlayer, updatePlayer, removePlayer, players } = useStore();
  const lastUpdateRef = useRef<{ [id: string]: number }>({});

  const handleCurrentPlayers = useCallback((serverPlayers: any) => {
    console.log('Received currentPlayers:', serverPlayers);
    Object.entries(serverPlayers).forEach(([id, playerData]: [string, any]) => {
      console.log('Adding player:', id, playerData);
      addPlayer(id, playerData.x, playerData.y, playerData.health);
    });
  }, [addPlayer]);

  const handleNewPlayer = useCallback((player: any) => {
    console.log('New player joined:', player);
    addPlayer(player.id, player.x, player.y, player.health);
  }, [addPlayer]);

  const handlePlayerMoved = useCallback(({ id, x, y }: { id: string, x: number, y: number }) => {
    console.log('Player moved:', id, x, y);
    updatePlayer(id, x, y);
    lastUpdateRef.current[id] = Date.now();
  }, [updatePlayer]);

  const handlePlayerDisconnected = useCallback((id: string) => {
    console.log('Player disconnected:', id);
    removePlayer(id);
  }, [removePlayer]);

  useEffect(() => {
    if (!socketRef.current) {
      console.log('Socket not initialized');
      return;
    }

    console.log('Setting up socket listeners in PlayerManager');

    const socket = socketRef.current;

    socket.on('currentPlayers', handleCurrentPlayers);
    socket.on('newPlayer', handleNewPlayer);
    socket.on('playerMoved', handlePlayerMoved);
    socket.on('playerDisconnected', handlePlayerDisconnected);

    return () => {
      socket.off('currentPlayers', handleCurrentPlayers);
      socket.off('newPlayer', handleNewPlayer);
      socket.off('playerMoved', handlePlayerMoved);
      socket.off('playerDisconnected', handlePlayerDisconnected);
    };
  }, [socketRef, handleCurrentPlayers, handleNewPlayer, handlePlayerMoved, handlePlayerDisconnected]);

  useEffect(() => {
    if (!engineRef.current) {
      console.log('Engine not initialized');
      return;
    }

    const engine = engineRef.current;

    // Remove disconnected players
    Object.keys(playerBodiesRef.current).forEach((id) => {
      if (!players.find(p => p.id === id)) {
        console.log('Removing disconnected player:', id);
        Matter.World.remove(engine.world, playerBodiesRef.current[id]);
        delete playerBodiesRef.current[id];
      }
    });

    // Add new players and update existing ones
    players.forEach((player) => {
      if (playerBodiesRef.current[player.id]) {
        const body = playerBodiesRef.current[player.id];
        const lastUpdate = lastUpdateRef.current[player.id] || 0;
        const currentTime = Date.now();

        // Only update position if it's a recent server update or local player
        if (currentTime - lastUpdate < 100 || player.id === socketRef.current?.id) {
          Matter.Body.setPosition(body, { x: player.x, y: player.y });
        }
      } else {
        console.log('Creating new player body:', player.id, player.x, player.y);
        const newBody = Matter.Bodies.rectangle(player.x, player.y, 50, 50, {
          render: { fillStyle: player.id === socketRef.current?.id ? 'yellow' : 'blue' },
          frictionAir: 0.1,
          friction: 0.1,
          inertia: Infinity,
        });
        Matter.World.add(engine.world, newBody);
        playerBodiesRef.current[player.id] = newBody;
      }
    });
  }, [players, engineRef, socketRef, playerBodiesRef]);

  return null;
};

export default PlayerManager;