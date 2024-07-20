// src/components/Game.tsx
import React, { useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import Matter from 'matter-js';

const Game: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socket = useRef(io('http://localhost:3000')); // Adjust the server URL if needed

  useEffect(() => {
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

    const player = Matter.Bodies.rectangle(400, 200, 50, 50);
    Matter.World.add(engine.world, [player]);

    Matter.Engine.run(engine);
    Matter.Render.run(render);

    return () => {
      Matter.Render.stop(render);
      Matter.Engine.clear(engine);
    };
  }, []);

  return <canvas ref={canvasRef}></canvas>;
};

export default Game;
