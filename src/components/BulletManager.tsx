import React, { useState, useEffect } from 'react';
import Matter from 'matter-js';
import { Socket } from 'socket.io-client';

interface BulletManagerProps {
  socketRef: React.RefObject<Socket | null>;
  engineRef: React.RefObject<Matter.Engine | null>;
}

interface Bullet {
  id: string;
  body: Matter.Body;
}

const BulletManager: React.FC<BulletManagerProps> = ({ socketRef, engineRef }) => {
  const [bullets, setBullets] = useState<Bullet[]>([]);

  useEffect(() => {
    if (!socketRef.current || !engineRef.current) return;

    const socket = socketRef.current;
    const engine = engineRef.current;

    const handleBulletFired = (bulletData: any) => {
      const { position, velocity, playerId } = bulletData;
      const bullet = Matter.Bodies.circle(position.x, position.y, 5, {
        render: { fillStyle: 'red' },
        frictionAir: 0,
        friction: 0,
        restitution: 0,
      });

      Matter.Body.setVelocity(bullet, {
        x: velocity.x * 10,
        y: velocity.y * 10,
      });

      Matter.World.add(engine.world, bullet);
      setBullets((prevBullets) => [...prevBullets, { id: bulletData.id, body: bullet }]);
    };

    socket.on('bulletFired', handleBulletFired);

    return () => {
      socket.off('bulletFired', handleBulletFired);
    };
  }, [socketRef, engineRef]);

  // Clean up bullets that have traveled too far
  useEffect(() => {
    if (!engineRef.current) return;

    const engine = engineRef.current;

    const cleanupInterval = setInterval(() => {
      setBullets((prevBullets) => {
        const newBullets = prevBullets.filter((bullet) => {
          const position = bullet.body.position;
          const isOutOfBounds = 
            position.x < 0 || 
            position.x > window.innerWidth || 
            position.y < 0 || 
            position.y > window.innerHeight;
          
          if (isOutOfBounds) {
            Matter.World.remove(engine.world, bullet.body);
          }
          return !isOutOfBounds;
        });
        return newBullets;
      });
    }, 1000); // Check every second

    return () => clearInterval(cleanupInterval);
  }, [engineRef]);

  return null;
};

export default BulletManager;