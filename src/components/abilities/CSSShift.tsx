import React, { useEffect, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { useStore } from '../../hooks/useStore';
import Matter from 'matter-js';

interface CSSShiftProps {
  socketRef: React.RefObject<Socket | null>;
  playerId: string;
  engineRef: React.RefObject<Matter.Engine | null>;
  playerBodiesRef: React.MutableRefObject<{ [id: string]: Matter.Body }>;
}

const CSSShift: React.FC<CSSShiftProps> = ({ socketRef, playerId, engineRef, playerBodiesRef }) => {
  const [cooldown, setCooldown] = useState(0);
  const { updatePlayer, updateSpecialAbilityCooldown } = useStore();

  useEffect(() => {
    const interval = setInterval(() => {
      if (cooldown > 0) {
        const newCooldown = cooldown - 1;
        setCooldown(newCooldown);
        updateSpecialAbilityCooldown(playerId, newCooldown);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldown, playerId, updateSpecialAbilityCooldown]);

  const teleport = useCallback(() => {
    if (cooldown > 0 || !socketRef.current || !engineRef.current) return;

    const newPosition = {
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
    };

    // Update the player's position in the game state
    updatePlayer(playerId, newPosition.x, newPosition.y);

    // Update the player's position in the physics engine
    const playerBody = playerBodiesRef.current[playerId];
    if (playerBody) {
      Matter.Body.setPosition(playerBody, newPosition);
    }

    // Emit the new position to the server
    socketRef.current.emit('playerMove', newPosition);

    const newCooldown = 15;
    setCooldown(newCooldown);
    updateSpecialAbilityCooldown(playerId, newCooldown);

    console.log('Teleported to:', newPosition);
  }, [cooldown, socketRef, engineRef, playerId, updatePlayer, updateSpecialAbilityCooldown, playerBodiesRef]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        teleport();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [teleport]);

  return null;
};

export default CSSShift;