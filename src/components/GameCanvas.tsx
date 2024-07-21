import React from 'react';

interface GameCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ canvasRef }) => {
  return <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0 }}></canvas>;
};

export default GameCanvas;