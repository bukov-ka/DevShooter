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
  const addPlayer = useStore((state) => state.addPlayer);
  const updatePlayer = useStore((state) => state.updatePlayer);
  const players = useStore((state) => state.players);
  const [playerBody, setPlayerBody] = useState<Matter.Body | null>(null);
  const [bullets, setBullets] = useState<{ id: string; body: Matter.Body }[]>([]);

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io('http://localhost:3000');

      socketRef.current.on('connect', () => {
        addPlayer(socketRef.current!.id);
        socketRef.current!.on('playerUpdate', ({ id, x, y }) => {
          updatePlayer(id, x, y);
        });

        socketRef.current!.on('bulletShot', (bullet) => {
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
      });

      socketRef.current.on('disconnect', () => {
        console.log('user disconnected');
      });
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    engineRef.current = Matter.Engine.create({
      gravity: { x: 0, y: 0 }, // Set gravity to zero
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

    const player = Matter.Bodies.rectangle(400, 200, 50, 50, {
      render: { fillStyle: 'yellow' },
      frictionAir: 0,
      friction: 0,
      inertia: Infinity,
    });
    setPlayerBody(player);
    Matter.World.add(engineRef.current.world, [player]);

    runnerRef.current = Matter.Runner.create();
    Matter.Runner.run(runnerRef.current, engineRef.current);
    Matter.Render.run(renderRef.current);

    return () => {
      if (renderRef.current) Matter.Render.stop(renderRef.current);
      if (runnerRef.current) Matter.Runner.stop(runnerRef.current);
      if (engineRef.current) Matter.Engine.clear(engineRef.current);
      socketRef.current?.disconnect();
    };
  }, [addPlayer, updatePlayer]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!playerBody) return;

      const speed = 5;
      let velocityChange = { x: 0, y: 0 };

      switch (e.key) {
        case 'w':
          velocityChange.y = -speed;
          break;
        case 'a':
          velocityChange.x = -speed;
          break;
        case 's':
          velocityChange.y = speed;
          break;
        case 'd':
          velocityChange.x = speed;
          break;
      }

      Matter.Body.setVelocity(playerBody, velocityChange);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!playerBody) return;
      if (['w', 'a', 's', 'd'].includes(e.key)) {
        Matter.Body.setVelocity(playerBody, { x: 0, y: 0 });
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (!playerBody || !engineRef.current) return;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const direction = {
        x: mouseX - playerBody.position.x,
        y: mouseY - playerBody.position.y,
      };

      const magnitude = Math.sqrt(direction.x ** 2 + direction.y ** 2);
      const normalizedDirection = {
        x: direction.x / magnitude,
        y: direction.y / magnitude,
      };

      const bulletBody = Matter.Bodies.circle(playerBody.position.x, playerBody.position.y, 5, {
        render: { fillStyle: 'red' },
        frictionAir: 0,
        friction: 0,
        inertia: Infinity,
      });
      Matter.Body.setVelocity(bulletBody, {
        x: normalizedDirection.x * 10,
        y: normalizedDirection.y * 10,
      });
      Matter.World.add(engineRef.current.world, bulletBody);

      setBullets((prev) => [...prev, { id: Math.random().toString(), body: bulletBody }]);
      socketRef.current?.emit('shoot', { position: playerBody.position, direction: normalizedDirection });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, [playerBody]);

  useEffect(() => {
    const updatePlayerPosition = () => {
      if (playerBody) {
        socketRef.current?.emit('playerMove', { x: playerBody.position.x, y: playerBody.position.y });
      }
    };

    const interval = setInterval(updatePlayerPosition, 1000 / 30);

    return () => clearInterval(interval);
  }, [playerBody]);

  return (
    <canvas ref={canvasRef}></canvas>
  );
};

export default Game;