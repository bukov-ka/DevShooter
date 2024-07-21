import React, { useState, useEffect } from 'react';
import Matter from 'matter-js';
import { Socket } from 'socket.io-client';

interface BulletManagerProps {
  socketRef: React.RefObject<Socket | null>;
  engineRef: React.RefObject<Matter.Engine | null>;
}

const BulletManager: React.FC<BulletManagerProps> = ({ socketRef, engineRef }) => {
  const [bullets, setBullets] = useState<{ id: string; body: Matter.Body }[]>([]);

  useEffect(() => {
    if (!socketRef.current || !engineRef.current) return;

    socketRef.current.on('bulletShot', (bullet: any) => {
      if (engineRef.current) {
        const newBullet = Matter.Bodies.circle(bullet.position.x, bullet.position.y, 5, {
          render: { fillStyle: 'red' },
          frictionAir: 0,
          friction: 0,
          inertia: Infinity,
        });
        Matter.Body.setVelocity(newBullet, {
          x: bullet.direction.x * 10,
          y: bullet.direction.y * 10,
        });
        Matter.World.add(engineRef.current.world, newBullet);
        setBullets((prev) => [...prev, { id: Math.random().toString(), body: newBullet }]);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.off('bulletShot');
      }
    };
  }, [socketRef, engineRef]);

  // Clean up bullets that have traveled too far
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      if (engineRef.current) {
        setBullets((prevBullets) => {
          const newBullets = prevBullets.filter((bullet) => {
            const position = bullet.body.position;
            const isOutOfBounds = position.x < 0 || position.x > window.innerWidth || position.y < 0 || position.y > window.innerHeight;
            if (isOutOfBounds) {
              Matter.World.remove(engineRef.current!.world, bullet.body);
            }
            return !isOutOfBounds;
          });
          return newBullets;
        });
      }
    }, 1000); // Check every second

    return () => clearInterval(cleanupInterval);
  }, [engineRef]);

  return null;
};

export default BulletManager;