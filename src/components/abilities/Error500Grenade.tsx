import React, { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import { Socket } from 'socket.io-client';
import { useStore } from '../../hooks/useStore';

interface Error500GrenadeProps {
  engine: Matter.Engine;
  socketRef: React.RefObject<Socket | null>;
  playerId: string;
}

const Error500Grenade: React.FC<Error500GrenadeProps> = ({ engine, socketRef, playerId }) => {
  const [cooldown, setCooldown] = useState(0);
  const grenadeRef = useRef<Matter.Body | null>(null);
  const { players, updateSpecialAbilityCooldown } = useStore();
  const mousePositionRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      if (cooldown > 0) {
        setCooldown(prev => prev - 1);
        updateSpecialAbilityCooldown(playerId, cooldown - 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldown, playerId, updateSpecialAbilityCooldown]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const throwGrenade = (position: { x: number; y: number }) => {
    if (cooldown > 0 || !socketRef.current) return;

    const grenade = Matter.Bodies.circle(position.x, position.y, 10, {
      render: { fillStyle: 'green' },
      frictionAir: 0.05,
      restitution: 0.8,
    });
    grenadeRef.current = grenade;
    Matter.World.add(engine.world, [grenade]);

    const throwDirection = Matter.Vector.normalise(
      Matter.Vector.sub(mousePositionRef.current, position)
    );
    const throwForce = 0.025; // Increased velocity by 50%
    Matter.Body.applyForce(grenade, position, {
      x: throwDirection.x * throwForce,
      y: throwDirection.y * throwForce,
    });

    setCooldown(15);
    updateSpecialAbilityCooldown(playerId, 15);

    socketRef.current.emit('grenadeThrown', { position, playerId });

    // Set timeout for grenade explosion
    setTimeout(() => {
      explodeGrenade(grenade.position);
      Matter.World.remove(engine.world, grenade);
    }, 3000); // 5 seconds delay
  };

  const explodeGrenade = (position: { x: number; y: number }) => {
    if (!socketRef.current) return;

    for (let i = 0; i < 20; i++) {
      const angle = (i * Math.PI * 2) / 20;
      const bulletVelocity = { x: Math.cos(angle) * 5, y: Math.sin(angle) * 5 };
      socketRef.current.emit('bulletFired', { position, velocity: bulletVelocity, playerId });
    }

    console.log('Grenade exploded at:', position);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        const player = players.find(p => p.id === playerId);
        if (player) {
          throwGrenade({ x: player.x, y: player.y });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [players, playerId]);

  return null;
};

export default Error500Grenade;