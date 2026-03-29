import React from 'react';
import { useStore } from '../store/useStore';

const Player = () => {
    const playerState = useStore((state) => state.playerState);

    const getPlayerClass = () => {
        switch (playerState) {
            case 'IDLE': return 'player-idle';
            case 'ATTACK_L_PERFECT': return 'player-strike-left';
            case 'ATTACK_R_PERFECT': return 'player-strike-right';
            case 'MISS': return 'player-vulnerable';
            case 'HIT': return 'player-damaged';
            case 'DEFEATED': return 'player-damaged';
            default: return 'player-idle';
        }
    };

    let imageSrc = '/player_idle.png';
    if (playerState === 'ATTACK_L_PERFECT') {
        imageSrc = '/player_punch.png';
    } else if (playerState === 'ATTACK_R_PERFECT') {
        imageSrc = '/player_kick.png';
    }

    return (
        <div className={`player-container ${getPlayerClass()}`}>
            <img
                src={imageSrc}
                alt="Player Kimono"
                className="player-sprite"
            />
        </div>
    );
};

export default Player;
