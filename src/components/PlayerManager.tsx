import React, { useEffect, useState } from 'react';
import Matter from 'matter-js';
import { Socket } from 'socket.io-client';
import { useStore } from '../hooks/useStore';

interface PlayerManagerProps {
  socketRef: React.RefObject<Socket | null>;
  engineRef: React.RefObject<Matter.Engine | null>;
}

const PlayerManager: React.FC<PlayerManagerProps> = ({ socketRef, engineRef }) => {
  const [playerBodies, setPlayerBodies] = useState<{ [id: string]: Matter.Body }>({});
  const { addPlayer, updatePlayer, removePlayer, players } = useStore();

  useEffect(() => {
    if (!socketRef.current) {
      console.log('Socket not initialized');
      return;
    }

    console.log('Setting up socket listeners in PlayerManager');

    const socket = socketRef.current;

    socket.on('currentPlayers', (serverPlayers: any) => {
      console.log('Received currentPlayers:', serverPlayers);
      Object.entries(serverPlayers).forEach(([id, playerData]: [string, any]) => {
        console.log('Adding player:', id, playerData);
        addPlayer(id, playerData.x, playerData.y, playerData.health);
      });
    });

    socket.on('newPlayer', (player: any) => {
      console.log('New player joined:', player);
      addPlayer(player.id, player.x, player.y, player.health);
    });

    socket.on('playerMoved', ({ id, x, y }: { id: string, x: number, y: number }) => {
      console.log('Player moved:', id, x, y);
      updatePlayer(id, x, y);
    });

    socket.on('playerDisconnected', (id: string) => {
      console.log('Player disconnected:', id);
      removePlayer(id);
    });

    return () => {
      socket.off('currentPlayers');
      socket.off('newPlayer');
      socket.off('playerMoved');
      socket.off('playerDisconnected');
    };
  }, [socketRef, addPlayer, updatePlayer, removePlayer]);

  useEffect(() => {
    if (!engineRef.current) {
      console.log('Engine not initialized');
      return;
    }

    console.log('Updating player bodies. Current players:', players);

    const engine = engineRef.current;

    // Remove disconnected players
    Object.keys(playerBodies).forEach((id) => {
      if (!players.find(p => p.id === id)) {
        console.log('Removing disconnected player:', id);
        Matter.World.remove(engine.world, playerBodies[id]);
        setPlayerBodies(prev => {
          const newBodies = { ...prev };
          delete newBodies[id];
          return newBodies;
        });
      }
    });

    // Add new players and update existing ones
    players.forEach((player) => {
      if (playerBodies[player.id]) {
        console.log('Updating player position:', player.id, player.x, player.y);
        Matter.Body.setPosition(playerBodies[player.id], { x: player.x, y: player.y });
      } else {
        console.log('Creating new player body:', player.id, player.x, player.y);
        const newBody = Matter.Bodies.rectangle(player.x, player.y, 50, 50, {
          render: { fillStyle: player.id === socketRef.current?.id ? 'yellow' : 'blue' },
          frictionAir: 0,
          friction: 0,
          inertia: Infinity,
        });
        Matter.World.add(engine.world, newBody);
        setPlayerBodies(prev => ({ ...prev, [player.id]: newBody }));
      }
    });
  }, [players, playerBodies, engineRef, socketRef]);

  return null;
};

export default PlayerManager;