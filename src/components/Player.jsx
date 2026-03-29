import React from 'react';
import { useStore } from '../store/useStore';

const Player = () => {
    const playerState = useStore((state) => state.playerState);

    const getPlayerClass = () => {
        switch (playerState) {
            case 'ATTACK_L_PERFECT': return 'player-strike-left';
            case 'ATTACK_R_PERFECT': return 'player-strike-right';
            case 'MISS': return 'player-vulnerable';
            case 'HIT': return 'player-damaged';
            case 'DEFEATED': return 'player-defeated';
            default: return 'player-idle';
        }
    };

    return (
        <div className={`player-container ${getPlayerClass()}`}>
            <img
                src="/player.png"
                alt="Player Kimono"
                className="player-sprite"
            />
        </div>
    );
};

export default Player;
