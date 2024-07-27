import React, { useRef, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import Matter from 'matter-js';
import { useStore } from '../hooks/useStore';
import GameCanvas from './GameCanvas';
import PlayerManager from './PlayerManager';
import BulletManager from './BulletManager';
import InputHandler from './InputHandler';
import Error500Grenade from './abilities/Error500Grenade';
import CSSShift from './abilities/CSSShift';
import LoadTesting from './abilities/LoadTesting';

const Game: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [engine, setEngine] = useState<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const playerBodiesRef = useRef<{ [id: string]: Matter.Body }>({});
  const { localPlayerId, localPlayerType, setLocalPlayerId } = useStore();

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server with ID:', newSocket.id);
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
        playerBodiesRef={playerBodiesRef}
      />
      <BulletManager
        socketRef={{ current: socket }}
        engineRef={{ current: engine }}
      />
      <InputHandler
        socketRef={{ current: socket }}
        canvasRef={canvasRef}
        engineRef={{ current: engine }}
        playerBodiesRef={playerBodiesRef}
      />
      {localPlayerType === 'Backend Developer' && (
        <Error500Grenade
          engine={engine}
          socketRef={{ current: socket }}
          playerId={localPlayerId!}
        />
      )}
      {localPlayerType === 'Frontend Developer' && (
        <CSSShift
          socketRef={{ current: socket }}
          playerId={localPlayerId!}
        />
      )}
      {localPlayerType === 'QA' && (
        <LoadTesting
          engine={engine}
          socketRef={{ current: socket }}
          playerId={localPlayerId!}
        />
      )}
    </>
  );
};

export default Game;