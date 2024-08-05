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
  const { 
    addPlayer, 
    updatePlayer, 
    removePlayer, 
    players, 
    setLocalPlayerType, 
    localPlayerId,
    damagePlayer,
    incrementKills,
    incrementDeaths,
    respawnPlayer
  } = useStore();
  const addedPlayersRef = useRef<Set<string>>(new Set());

  const createPlayerBody = (id: string, x: number, y: number, isLocal: boolean) => {
    
    if (engineRef.current && !playerBodiesRef.current[id]) {
      const newBody = Matter.Bodies.circle(x, y, 25, {
        render: { 
          fillStyle: isLocal ? 'blue' : 'red',
          sprite: {
            texture: createPlayerTexture(id),
            xScale: 0.5,
            yScale: 0.5
          }
        },
        friction: 0.1,
        frictionAir: 0.2,
        restitution: 0.3,
        density: 0.001,
        label: 'player',
        id: id
      });
      Matter.World.add(engineRef.current.world, newBody);
      playerBodiesRef.current[id] = newBody;
      
    } else {
      
    }
  };

  const createPlayerTexture = (id: string) => {
    const player = players.find(p => p.id === id);
    if (!player) {
      
      return '';
    }

    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      
      return '';
    }

    // Draw player circle
    ctx.beginPath();
    ctx.arc(50, 50, 45, 0, 2 * Math.PI);
    ctx.fillStyle = id === localPlayerId ? 'blue' : 'red';
    ctx.fill();

    // Draw health bar
    ctx.beginPath();
    ctx.moveTo(50, 50);
    ctx.arc(50, 50, 45, -Math.PI / 2, -Math.PI / 2 + (player.health / 100) * 2 * Math.PI);
    ctx.lineTo(50, 50);
    ctx.fillStyle = 'green';
    ctx.fill();

    // Draw player name
    ctx.font = '24px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText(player.name, 50, 100);

    
    return canvas.toDataURL();
  };

  useEffect(() => {
    if (!socketRef.current || !engineRef.current) {
      
      return;
    }

    const socket = socketRef.current;

    socket.on('currentPlayers', (serverPlayers: any) => {
      
      Object.entries(serverPlayers).forEach(([id, playerData]: [string, any]) => {
        if (!addedPlayersRef.current.has(id)) {
          
          addPlayer(id, playerData.x, playerData.y, playerData.health, playerData.type, playerData.name);
          createPlayerBody(id, playerData.x, playerData.y, id === socket.id);
          addedPlayersRef.current.add(id);
          if (id === socket.id) {
            setLocalPlayerType(playerData.type);
          }
        }
      });
    });

    socket.on('newPlayer', (player: any) => {
      
      if (!addedPlayersRef.current.has(player.id)) {
        addPlayer(player.id, player.x, player.y, player.health, player.type, player.name);
        createPlayerBody(player.id, player.x, player.y, player.id === socket.id);
        addedPlayersRef.current.add(player.id);
        if (player.id === socket.id) {
          setLocalPlayerType(player.type);
        }
      }
    });

    socket.on('playerMoved', ({ id, x, y }: { id: string, x: number, y: number }) => {
      
      updatePlayer(id, { x, y });
      if (playerBodiesRef.current[id]) {
        Matter.Body.setPosition(playerBodiesRef.current[id], { x, y });
      }
    });

    socket.on('playerUpdated', ({ id, ...data }: { id: string, [key: string]: any }) => {
      
      updatePlayer(id, data);
    });

    socket.on('playerHit', ({ hitPlayerId, damage }: { hitPlayerId: string, damage: number }) => {
      
      damagePlayer(hitPlayerId, damage);
    });

    socket.on('playerKilled', ({ killedId, killerId }: { killedId: string, killerId: string }) => {
      console.log('player killed caught');
      
      incrementDeaths(killedId);
      incrementKills(killerId);
      if (playerBodiesRef.current[killedId]) {
        Matter.World.remove(engineRef.current.world, playerBodiesRef.current[killedId]);
        delete playerBodiesRef.current[killedId];
      }
      useStore.getState().setPlayerKilled({ killedId, killerId });
    });

    socket.on('playerRespawned', ({ id, x, y, health }: { id: string, x: number, y: number, health: number }) => {
      
      respawnPlayer(id);
      updatePlayer(id, { x, y, health });
      createPlayerBody(id, x, y, id === localPlayerId);
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
      socket.off('playerUpdated');
      socket.off('playerHit');
      socket.off('playerKilled');
      socket.off('playerRespawned');
      socket.off('playerDisconnected');
    };
  }, [
    socketRef, 
    engineRef, 
    addPlayer, 
    updatePlayer, 
    removePlayer, 
    setLocalPlayerType, 
    damagePlayer, 
    incrementKills, 
    incrementDeaths, 
    respawnPlayer, 
    playerBodiesRef, 
    players, 
    localPlayerId
  ]);

  // Update player textures when health changes
  useEffect(() => {
    
    players.forEach(player => {
      if (playerBodiesRef.current[player.id]) {
        const body = playerBodiesRef.current[player.id];
        (body.render as any).sprite.texture = createPlayerTexture(player.id);
        
      } else {
        
      }
    });
  }, [players, playerBodiesRef, localPlayerId]);

  

  return null;
};

export default PlayerManager;