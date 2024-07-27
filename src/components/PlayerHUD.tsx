import React from 'react';
import { useStore } from '../hooks/useStore';

const PlayerHUD: React.FC = () => {
  const { localPlayerId, localPlayerType, players } = useStore();

  const localPlayer = players.find(p => p.id === localPlayerId);
  const cooldown = localPlayer?.specialAbilityCooldown || 0;
  const readinessPercentage = Math.max(0, Math.min(100, (1 - cooldown / 15) * 100));

  return (
    <div style={{
      position: 'absolute',
      top: 10,
      left: 10,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div>Player Type: {localPlayerType || 'Unknown'}</div>
      <div>
        Super-ability Readiness: {readinessPercentage.toFixed(0)}%
        <div style={{
          width: '100px',
          height: '10px',
          backgroundColor: 'gray',
          marginTop: '5px'
        }}>
          <div style={{
            width: `${readinessPercentage}px`,
            height: '100%',
            backgroundColor: 'green'
          }}></div>
        </div>
      </div>
    </div>
  );
};

export default PlayerHUD;