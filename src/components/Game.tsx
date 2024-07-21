import React, { useRef, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import Matter from 'matter-js';
import { useStore } from '../hooks/useStore';

const Game: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const {
    addPlayer,
    updatePlayer,
    removePlayer,
    players,
    setLocalPlayerId
  } = useStore();
  const [playerBodies, setPlayerBodies] = useState<{ [id: string]: Matter.Body }>({});
  const [bullets, setBullets] = useState<{ id: string; body: Matter.Body }[]>([]);

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io('http://localhost:3000');

      socketRef.current.on('connect', () => {
        console.log('Connected to server');
        setLocalPlayerId(socketRef.current!.id);
      });

      socketRef.current.on('currentPlayers', (serverPlayers) => {
        Object.entries(serverPlayers).forEach(([id, playerData]: [string, any]) => {
          addPlayer(id, playerData.x, playerData.y, playerData.health);
        });
      });

      socketRef.current.on('newPlayer', (player) => {
        addPlayer(player.id, player.x, player.y, player.health);
      });

      socketRef.current.on('playerMoved', ({ id, x, y }) => {
        updatePlayer(id, x, y);
      });

      socketRef.current.on('playerDisconnected', (id) => {
        removePlayer(id);
      });

      socketRef.current.on('bulletShot', (bullet) => {
        if (engineRef.current) {
          const newBullet = Matter.Bodies.circle(bullet.position.x, bullet.position.y, 5, {
            render: { fillStyle: 'red' },
            frictionAir: 0,
            friction: 0,
            inertia: Infinity,
          });
          Matter.Body.setVelocity(newBullet, {
            x: bullet.direction.x * 10,
            y: bullet.direction.y * 10,
          });
          Matter.World.add(engineRef.current.world, newBullet);
          setBullets((prev) => [...prev, { id: Math.random().toString(), body: newBullet }]);
        }
      });
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    engineRef.current = Matter.Engine.create({
      gravity: { x: 0, y: 0 },
    });
    
    renderRef.current = Matter.Render.create({
      canvas: canvas,
      engine: engineRef.current,
      options: {
        width: window.innerWidth,
        height: window.innerHeight,
        wireframes: false,
      },
    });

    runnerRef.current = Matter.Runner.create();
    Matter.Runner.run(runnerRef.current, engineRef.current);
    Matter.Render.run(renderRef.current);

    return () => {
      if (renderRef.current) Matter.Render.stop(renderRef.current);
      if (runnerRef.current) Matter.Runner.stop(runnerRef.current);
      if (engineRef.current) Matter.Engine.clear(engineRef.current);
      socketRef.current?.disconnect();
    };
  }, [addPlayer, updatePlayer, removePlayer, setLocalPlayerId]);

  useEffect(() => {
    if (!engineRef.current) return;

    // Remove disconnected players
    Object.keys(playerBodies).forEach((id) => {
      if (!players.find(p => p.id === id)) {
        Matter.World.remove(engineRef.current!.world, playerBodies[id]);
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
        Matter.Body.setPosition(playerBodies[player.id], { x: player.x, y: player.y });
      } else {
        const newBody = Matter.Bodies.rectangle(player.x, player.y, 50, 50, {
          render: { fillStyle: player.id === socketRef.current?.id ? 'yellow' : 'blue' },
          frictionAir: 0,
          friction: 0,
          inertia: Infinity,
        });
        Matter.World.add(engineRef.current.world, newBody);
        setPlayerBodies(prev => ({ ...prev, [player.id]: newBody }));
      }
    });
  }, [players, playerBodies]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const localPlayer = players.find(p => p.id === socketRef.current?.id);
      if (!localPlayer) return;

      const speed = 5;
      let velocityChange = { x: 0, y: 0 };

      switch (e.key) {
        case 'w': velocityChange.y = -speed; break;
        case 'a': velocityChange.x = -speed; break;
        case 's': velocityChange.y = speed; break;
        case 'd': velocityChange.x = speed; break;
      }

      const newPosition = {
        x: localPlayer.x + velocityChange.x,
        y: localPlayer.y + velocityChange.y,
      };

      updatePlayer(localPlayer.id, newPosition.x, newPosition.y);
      socketRef.current?.emit('playerMove', newPosition);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['w', 'a', 's', 'd'].includes(e.key)) {
        const localPlayer = players.find(p => p.id === socketRef.current?.id);
        if (localPlayer) {
          socketRef.current?.emit('playerMove', { x: localPlayer.x, y: localPlayer.y });
        }
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      const localPlayer = players.find(p => p.id === socketRef.current?.id);
      if (!localPlayer || !engineRef.current) return;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const direction = {
        x: mouseX - localPlayer.x,
        y: mouseY - localPlayer.y,
      };

      const magnitude = Math.sqrt(direction.x ** 2 + direction.y ** 2);
      const normalizedDirection = {
        x: direction.x / magnitude,
        y: direction.y / magnitude,
      };

      socketRef.current?.emit('shoot', { position: { x: localPlayer.x, y: localPlayer.y }, direction: normalizedDirection });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, [players, updatePlayer]);

  return <canvas ref={canvasRef}></canvas>;
};

export default Game;