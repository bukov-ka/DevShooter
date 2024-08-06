import React from 'react';
import { useStore } from '../hooks/useStore';

interface DeathScreenProps {
  onRespawn: () => void;
}

const DeathScreen: React.FC<DeathScreenProps> = ({ onRespawn }) => {
  const { players } = useStore();

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
      <table style={{ margin: '20px', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ padding: '10px', border: '1px solid white' }}>Player Name</th>
            <th style={{ padding: '10px', border: '1px solid white' }}>Bullets Fired</th>
            <th style={{ padding: '10px', border: '1px solid white' }}>Deaths</th>
            <th style={{ padding: '10px', border: '1px solid white' }}>Kills</th>
          </tr>
        </thead>
        <tbody>
          {sortedPlayers.map(player => (
            <tr key={player.id}>
              <td style={{ padding: '10px', border: '1px solid white' }}>{player.name}</td>
              <td style={{ padding: '10px', border: '1px solid white' }}>{player.bulletsFired}</td>
              <td style={{ padding: '10px', border: '1px solid white' }}>{player.deaths}</td>
              <td style={{ padding: '10px', border: '1px solid white' }}>{player.kills}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
