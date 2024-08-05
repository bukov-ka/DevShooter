import React, { useEffect } from 'react';
import { useStore } from '../hooks/useStore';

interface DeathScreenProps {
  onRespawn: () => void;
}

const DeathScreen: React.FC<DeathScreenProps> = ({ onRespawn }) => {
  const { players } = useStore();

  useEffect(() => {
    console.log("[DeathScreen] Rendered with players:", players);
  }, [players]);

  const sortedPlayers = [...players].sort((a, b) => b.kills - a.kills);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontFamily: 'Arial, sans-serif',
      zIndex: 1000,
    }}>
      <h2>Game Over</h2>
      {/* ... (rest of the component remains the same) */}
      <button 
        onClick={() => {
          console.log("[DeathScreen] Respawn button clicked");
          onRespawn();
        }}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        Respawn
      </button>
    </div>
  );
};

export default DeathScreen;