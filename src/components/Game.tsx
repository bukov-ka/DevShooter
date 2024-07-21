// src/components/Game.tsx
import React, { useRef, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import Matter from 'matter-js';
import { useStore } from '../hooks/useStore';

const Game: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<Socket | null>(null); // Use ref for the socket
  const addPlayer = useStore((state) => state.addPlayer);
  const updatePlayer = useStore((state) => state.updatePlayer);
  const players = useStore((state) => state.players);
  const [playerBody, setPlayerBody] = useState<Matter.Body | null>(null);

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io('http://localhost:3000'); // Adjust the server URL if needed

      socketRef.current.on('connect', () => {
        addPlayer(socketRef.current!.id);
        socketRef.current!.on('playerUpdate', ({ id, x, y }) => {
          updatePlayer(id, x, y);
        });
      });

      socketRef.current.on('disconnect', () => {
        console.log('user disconnected');
      });
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = Matter.Engine.create();
    const render = Matter.Render.create({
      canvas: canvas,
      engine: engine,
      options: {
        width: window.innerWidth,
        height: window.innerHeight,
        wireframes: false,
      },
    });

    const player = Matter.Bodies.rectangle(400, 200, 50, 50, {
      render: {
        fillStyle: 'yellow',
      },
    });
    setPlayerBody(player);
    Matter.World.add(engine.world, [player]);

    Matter.Engine.run(engine);
    Matter.Render.run(render);

    return () => {
      Matter.Render.stop(render);
      Matter.Engine.clear(engine);
      socketRef.current?.disconnect();
    };
  }, [addPlayer, updatePlayer]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      console.log('Key down:', e.key);
      if (!playerBody) return;

      switch (e.key) {
        case 'w':
          Matter.Body.setPosition(playerBody, { x: playerBody.position.x, y: playerBody.position.y - 5 });
          break;
        case 'a':
          Matter.Body.setPosition(playerBody, { x: playerBody.position.x - 5, y: playerBody.position.y });
          break;
        case 's':
          Matter.Body.setPosition(playerBody, { x: playerBody.position.x, y: playerBody.position.y + 5 });
          break;
        case 'd':
          Matter.Body.setPosition(playerBody, { x: playerBody.position.x + 5, y: playerBody.position.y });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [playerBody]);

  useEffect(() => {
    const updatePlayerPosition = () => {
      if (playerBody) {
        console.log('Player position:', playerBody.position);
        socketRef.current?.emit('playerMove', { x: playerBody.position.x, y: playerBody.position.y });
      }
    };

    const interval = setInterval(updatePlayerPosition, 1000 / 30); // Update 30 times per second

    return () => clearInterval(interval);
  }, [playerBody]);

  return <canvas ref={canvasRef}></canvas>;
};

export default Game;
