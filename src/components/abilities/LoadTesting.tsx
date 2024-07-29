import React, { useEffect, useState } from 'react';
import Matter from 'matter-js';
import { Socket } from 'socket.io-client';
import { useStore } from '../../hooks/useStore';

interface LoadTestingProps {
  engine: Matter.Engine;
  socketRef: React.RefObject<Socket | null>;
  playerId: string;
}

const LoadTesting: React.FC<LoadTestingProps> = ({ engine, socketRef, playerId }) => {
  const [cooldown, setCooldown] = useState(0);
  const { players, updateSpecialAbilityCooldown } = useStore();

  useEffect(() => {
    const interval = setInterval(() => {
      if (cooldown > 0) {
        setCooldown(prev => prev - 1);
        updateSpecialAbilityCooldown(playerId, cooldown - 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldown, playerId, updateSpecialAbilityCooldown]);

  const shootBurst = () => {
    if (cooldown > 0 || !socketRef.current) return;

    const player = players.find(p => p.id === playerId);
    if (!player) return;

    const raysCount = 6;
    for (let i = 0; i < raysCount; i++) {
      const angle = (i * Math.PI * 2) / raysCount;
      const bulletVelocity = {
        x: Math.cos(angle) * 5,
        y: Math.sin(angle) * 5
      };
      socketRef.current.emit('bulletFired', {
        position: { x: player.x, y: player.y },
        velocity: bulletVelocity,
        playerId
      });
    }

    setCooldown(15);
    updateSpecialAbilityCooldown(playerId, 15);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        shootBurst();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [players, playerId]);

  return null;
};

export default LoadTesting;