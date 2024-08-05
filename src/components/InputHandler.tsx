import React, { useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import Matter from 'matter-js';
import { useStore } from '../hooks/useStore';

interface InputHandlerProps {
  socketRef: React.RefObject<Socket | null>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  engineRef: React.RefObject<Matter.Engine | null>;
  playerBodiesRef: React.MutableRefObject<{ [id: string]: Matter.Body }>;
}

const InputHandler: React.FC<InputHandlerProps> = ({ socketRef, canvasRef, engineRef, playerBodiesRef }) => {
  const { players, updatePlayer, localPlayerId, incrementBulletsFired } = useStore();
  const keysPressed = useRef<Set<string>>(new Set());

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    keysPressed.current.add(e.key.toLowerCase());
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keysPressed.current.delete(e.key.toLowerCase());
  }, []);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (!socketRef.current || !canvasRef.current || !localPlayerId) return;

    const localPlayerBody = playerBodiesRef.current[localPlayerId];
    if (!localPlayerBody) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const playerPosition = localPlayerBody.position;

    const direction = {
      x: mouseX - playerPosition.x,
      y: mouseY - playerPosition.y,
    };

    const magnitude = Math.sqrt(direction.x ** 2 + direction.y ** 2);
    const normalizedDirection = {
      x: direction.x / magnitude,
      y: direction.y / magnitude,
    };

    socketRef.current.emit('bulletFired', { 
      position: { x: playerPosition.x, y: playerPosition.y }, 
      velocity: normalizedDirection,
      playerId: localPlayerId
    });

    incrementBulletsFired(localPlayerId);
  }, [localPlayerId, socketRef, canvasRef, playerBodiesRef, incrementBulletsFired]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, [handleKeyDown, handleKeyUp, handleMouseDown]);

  useEffect(() => {
    if (!engineRef.current || !playerBodiesRef.current || !localPlayerId) return;

    const updateInterval = setInterval(() => {
      const playerBody = playerBodiesRef.current[localPlayerId];
      if (!playerBody) return;

      const force = { x: 0, y: 0 };
      const speed = 0.007;

      if (keysPressed.current.has('w')) force.y -= speed;
      if (keysPressed.current.has('s')) force.y += speed;
      if (keysPressed.current.has('a')) force.x -= speed;
      if (keysPressed.current.has('d')) force.x += speed;

      Matter.Body.applyForce(playerBody, playerBody.position, force);

      updatePlayer(localPlayerId, { x: playerBody.position.x, y: playerBody.position.y });
      socketRef.current?.emit('playerMove', { x: playerBody.position.x, y: playerBody.position.y });
    }, 1000 / 60);

    return () => clearInterval(updateInterval);
  }, [updatePlayer, socketRef, engineRef, playerBodiesRef, localPlayerId]);

  return null;
};

export default InputHandler;