import React, { useRef, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import Matter from 'matter-js';
import { useStore } from '../hooks/useStore';
import GameCanvas from './GameCanvas.tsx';
import PlayerManager from './PlayerManager.tsx';
import BulletManager from './BulletManager.tsx';
import InputHandler from './InputHandler.tsx';

const Game: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [engine, setEngine] = useState<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const { setLocalPlayerId } = useStore();

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setLocalPlayerId(newSocket.id);
    });

    const newEngine = Matter.Engine.create({
      gravity: { x: 0, y: 0 },
    });
    setEngine(newEngine);

    return () => {
      newSocket.disconnect();
      if (renderRef.current) Matter.Render.stop(renderRef.current);
      if (runnerRef.current) Matter.Runner.stop(runnerRef.current);
      if (newEngine) Matter.Engine.clear(newEngine);
    };
  }, [setLocalPlayerId]);

  useEffect(() => {
    if (!canvasRef.current || !engine) return;

    renderRef.current = Matter.Render.create({
      canvas: canvasRef.current,
      engine: engine,
      options: {
        width: window.innerWidth,
        height: window.innerHeight,
        wireframes: false,
      },
    });

    runnerRef.current = Matter.Runner.create();
    Matter.Runner.run(runnerRef.current, engine);
    Matter.Render.run(renderRef.current);

  }, [engine]);

  if (!socket || !engine) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <GameCanvas canvasRef={canvasRef} />
      <PlayerManager 
        socketRef={{ current: socket }}
        engineRef={{ current: engine }}
      />
      <BulletManager
        socketRef={{ current: socket }}
        engineRef={{ current: engine }}
      />
      <InputHandler
        socketRef={{ current: socket }}
        canvasRef={canvasRef}
      />
    </>
  );
};

export default Game;