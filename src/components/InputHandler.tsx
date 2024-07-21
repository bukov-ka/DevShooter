import React, { useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { useStore } from '../hooks/useStore';

interface InputHandlerProps {
  socketRef: React.RefObject<Socket | null>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

const InputHandler: React.FC<InputHandlerProps> = ({ socketRef, canvasRef }) => {
  const { players, updatePlayer } = useStore();

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
      if (!localPlayer || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
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
  }, [players, updatePlayer, socketRef, canvasRef]);

  return null;
};

export default InputHandler;