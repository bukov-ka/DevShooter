// src/components/Game.tsx

import React, { useRef, useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import Matter from "matter-js";
import { useStore } from "../hooks/useStore";
import GameCanvas from "./GameCanvas";
import PlayerManager from "./PlayerManager";
import BulletManager from "./BulletManager";
import InputHandler from "./InputHandler";
import Error500Grenade from "./abilities/Error500Grenade";
import CSSShift from "./abilities/CSSShift";
import LoadTesting from "./abilities/LoadTesting";
import PlayerHUD from "./PlayerHUD";
import DeathScreen from "./DeathScreen";

const Game: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const [engine, setEngine] = useState<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const playerBodiesRef = useRef<{ [id: string]: Matter.Body }>({});
  const { 
    localPlayerId, 
    localPlayerType, 
    setLocalPlayerId,
    players,
    updatePlayer,
    respawnPlayer,
    playerKilled,
    setPlayerKilled
  } = useStore();
  const [showDeathScreen, setShowDeathScreen] = useState(false);

  useEffect(() => {
    console.log("[Game] Initializing game...");
    const newSocket = io("http://localhost:3000");
    socketRef.current = newSocket;

    newSocket.on("connect", () => {
      console.log("[Game] Connected to server with ID:", newSocket.id);
      setLocalPlayerId(newSocket.id);
    });

    const newEngine = Matter.Engine.create({
      gravity: { x: 0, y: 0 },
    });
    setEngine(newEngine);

    return () => {
      console.log("[Game] Cleaning up game resources...");
      newSocket.disconnect();
      if (renderRef.current) Matter.Render.stop(renderRef.current);
      if (runnerRef.current) Matter.Runner.stop(runnerRef.current);
      if (newEngine) Matter.Engine.clear(newEngine);
    };
  }, [setLocalPlayerId]);

  useEffect(() => {
    if (!canvasRef.current || !engine) return;

    console.log("[Game] Setting up game renderer");
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

  const handlePlayerKilled = useCallback(({ killedId, killerId }: { killedId: string, killerId: string }) => {
    console.log(`[Death] Player killed event received in handlePlayerKilled. KilledId: ${killedId}, KillerId: ${killerId}, LocalPlayerId: ${localPlayerId}`);
    if (killedId === localPlayerId) {
      console.log("[Death] Local player killed, setting showDeathScreen to true");
      setShowDeathScreen(true);
    } else {
      console.log("[Death] Another player was killed, not showing death screen");
    }
  }, [localPlayerId]);

  useEffect(() => {
    if (playerKilled) {
      handlePlayerKilled(playerKilled);
      setPlayerKilled(null); // reset the state after handling
    }
  }, [playerKilled, handlePlayerKilled, setPlayerKilled]);

  const handleRespawn = useCallback(() => {
    if (!socketRef.current || !localPlayerId) return;

    console.log("[Death] Respawn requested");
    socketRef.current.emit('playerRespawn');
    setShowDeathScreen(false);
  }, [localPlayerId]);

  if (!engine) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <GameCanvas canvasRef={canvasRef} />
      <PlayerManager
        socketRef={socketRef}
        engineRef={{ current: engine }}
        playerBodiesRef={playerBodiesRef}
      />
      <BulletManager
        socketRef={socketRef}
        engineRef={{ current: engine }}
      />
      <InputHandler
        socketRef={socketRef}
        canvasRef={canvasRef}
        engineRef={{ current: engine }}
        playerBodiesRef={playerBodiesRef}
      />
      {localPlayerType === "Backend Developer" && (
        <Error500Grenade
          engine={engine}
          socketRef={socketRef}
          playerId={localPlayerId || ''}
        />
      )}
      {localPlayerType === "Frontend Developer" && (
        <CSSShift
          socketRef={socketRef}
          playerId={localPlayerId || ''}
          engineRef={{ current: engine }}
          playerBodiesRef={playerBodiesRef}
        />
      )}
      {localPlayerType === "QA" && (
        <LoadTesting
          engine={engine}
          socketRef={socketRef}
          playerId={localPlayerId || ''}
        />
      )}
      <PlayerHUD />
      {showDeathScreen && <DeathScreen onRespawn={handleRespawn} />}
    </>
  );
};

export default Game;
