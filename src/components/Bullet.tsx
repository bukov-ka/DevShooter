import React, { useEffect, useRef } from 'react';
import Matter from 'matter-js';

interface BulletProps {
  engine: Matter.Engine;
  position: { x: number; y: number };
  direction: { x: number; y: number };
}

const Bullet: React.FC<BulletProps> = ({ engine, position, direction }) => {
  const bulletRef = useRef<Matter.Body | null>(null);

  useEffect(() => {
    const bullet = Matter.Bodies.circle(position.x, position.y, 5, {
      render: { fillStyle: 'red' },
    });
    bulletRef.current = bullet;
    Matter.World.add(engine.world, [bullet]);

    Matter.Body.setVelocity(bullet, {
      x: direction.x * 10, // Adjust the multiplier as needed for speed
      y: direction.y * 10, // Adjust the multiplier as needed for speed
    });

    console.log('Bullet added to world with velocity:', {
      x: direction.x * 10,
      y: direction.y * 10,
    });

    return () => {
      if (bulletRef.current) {
        Matter.World.remove(engine.world, bulletRef.current);
      }
    };
  }, [position, direction, engine]);

  return null;
};

export default Bullet;
