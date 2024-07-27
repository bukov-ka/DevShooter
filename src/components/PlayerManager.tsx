import React, { useEffect, useRef } from 'react';
import Matter from 'matter-js';
import { Socket } from 'socket.io-client';
import { useStore, PlayerType } from '../hooks/useStore';

interface PlayerManagerProps {
  socketRef: React.RefObject<Socket | null>;
  engineRef: React.RefObject<Matter.Engine | null>;
  playerBodiesRef: React.MutableRefObject<{ [id: string]: Matter.Body }>;
}

const PlayerManager: React.FC<PlayerManagerProps> = ({ socketRef, engineRef, playerBodiesRef }) => {
  const { addPlayer, updatePlayer, removePlayer, players, setLocalPlayerType, localPlayerId } = useStore();
  const addedPlayersRef = useRef<Set<string>>(new Set());

  const getRandomPlayerType = (): PlayerType => {
    const types: PlayerType[] = ['Backend Developer', 'Frontend Developer', 'QA'];
    return types[Math.floor(Math.random() * types.length)];
  };

  const createPlayerBody = (id: string, x: number, y: number, isLocal: boolean) => {
    if (engineRef.current && !playerBodiesRef.current[id]) {
      const newBody = Matter.Bodies.circle(x, y, 25, {
        render: { fillStyle: isLocal ? 'blue' : 'red' },
        friction: 0.1,  // Add some friction (0 to 1)
        frictionAir: 0.2,  // Add air friction (0 to 1)
        restitution: 0.3,  // Add some bounce (0 to 1)
        density: 0.001,  // Adjust density to make the body lighter
      });
      Matter.World.add(engineRef.current.world, newBody);
      playerBodiesRef.current[id] = newBody;
    }
  };

  useEffect(() => {
    if (!socketRef.current || !engineRef.current) return;

    const socket = socketRef.current;

    socket.on('currentPlayers', (serverPlayers: any) => {
      Object.entries(serverPlayers).forEach(([id, playerData]: [string, any]) => {
        if (!addedPlayersRef.current.has(id)) {
          const type = playerData.type || getRandomPlayerType();
          addPlayer(id, playerData.x, playerData.y, playerData.health, type);
          createPlayerBody(id, playerData.x, playerData.y, id === socket.id);
          addedPlayersRef.current.add(id);
          if (id === socket.id) {
            setLocalPlayerType(type);
          }
        }
      });
    });

    socket.on('newPlayer', (player: any) => {
      if (!addedPlayersRef.current.has(player.id)) {
        const type = player.type || getRandomPlayerType();
        addPlayer(player.id, player.x, player.y, player.health, type);
        createPlayerBody(player.id, player.x, player.y, player.id === socket.id);
        addedPlayersRef.current.add(player.id);
        if (player.id === socket.id) {
          setLocalPlayerType(type);
        }
      }
    });

    socket.on('playerMoved', ({ id, x, y }: { id: string, x: number, y: number }) => {
      updatePlayer(id, x, y);
      if (playerBodiesRef.current[id]) {
        Matter.Body.setPosition(playerBodiesRef.current[id], { x, y });
      }
    });

    socket.on('playerDisconnected', (id: string) => {
      removePlayer(id);
      if (playerBodiesRef.current[id]) {
        Matter.World.remove(engineRef.current.world, playerBodiesRef.current[id]);
        delete playerBodiesRef.current[id];
      }
      addedPlayersRef.current.delete(id);
    });

    return () => {
      socket.off('currentPlayers');
      socket.off('newPlayer');
      socket.off('playerMoved');
      socket.off('playerDisconnected');
    };
  }, [socketRef, engineRef, addPlayer, updatePlayer, removePlayer, setLocalPlayerType, playerBodiesRef]);

  return null;
};

export default PlayerManager;