import React, { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { useStore } from '../../hooks/useStore';

interface CSSShiftProps {
  socketRef: React.RefObject<Socket | null>;
  playerId: string;
}

const CSSShift: React.FC<CSSShiftProps> = ({ socketRef, playerId }) => {
  const [cooldown, setCooldown] = useState(0);
  const { updatePlayer, updateSpecialAbilityCooldown } = useStore();

  useEffect(() => {
    const interval = setInterval(() => {
      if (cooldown > 0) {
        setCooldown(prev => prev - 1);
        updateSpecialAbilityCooldown(playerId, cooldown - 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldown, playerId, updateSpecialAbilityCooldown]);

  const teleport = () => {
    if (cooldown > 0 || !socketRef.current) return;

    const newPosition = {
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
    };

    updatePlayer(playerId, newPosition.x, newPosition.y);
    socketRef.current.emit('playerMoved', newPosition);

    setCooldown(15);
    updateSpecialAbilityCooldown(playerId, 15);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        teleport();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return null;
};

export default CSSShift;