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

    const belt = useStore((state) => state.belt);

    let idleImg = belt.includes('Preta') ? '/player_idle.png' : '/player_idle_white.png';
    let punchImg = belt.includes('Preta') ? '/player_punch.png' : '/player_punch_white.png';
    let kickImg = belt.includes('Preta') ? '/player_kick.png' : '/player_kick_white.png';

    let imageSrc = idleImg;
    if (playerState === 'ATTACK_L_PERFECT') {
        imageSrc = punchImg;
    } else if (playerState === 'ATTACK_R_PERFECT') {
        imageSrc = kickImg;
    }

    const getAuraColor = (beltName) => {
        if (beltName === 'Branca') return 'rgba(255, 255, 255, 0.4)';
        if (beltName === 'Amarela') return 'rgba(255, 215, 0, 0.6)';
        if (beltName === 'Vermelha') return 'rgba(255, 0, 0, 0.6)';
        if (beltName === 'Laranja') return 'rgba(255, 140, 0, 0.6)';
        if (beltName === 'Verde') return 'rgba(0, 128, 0, 0.6)';
        if (beltName === 'Roxa') return 'rgba(128, 0, 128, 0.6)';
        if (beltName === 'Marrom') return 'rgba(139, 69, 19, 0.6)';
        if (beltName.includes('Preta')) return 'rgba(150, 150, 255, 0.8)'; // Ghostly/Blueish master aura
        return 'rgba(255, 255, 255, 0.2)';
    };

    const getBeltHex = (beltName) => {
        if (beltName === 'Branca') return '#EEEEEE';
        if (beltName === 'Amarela') return '#FFD700';
        if (beltName === 'Vermelha') return '#FF0000';
        if (beltName === 'Laranja') return '#FF8C00';
        if (beltName === 'Verde') return '#008000';
        if (beltName === 'Roxa') return '#800080';
        if (beltName === 'Marrom') return '#8B4513';
        return '#111111'; // Preta
    };

    const getDansCount = (beltName) => {
        if (!beltName.includes('Preta')) return 0;
        const match = beltName.match(/(\d+)º/);
        return match ? parseInt(match[1]) : 0;
    };

    return (
        <div className={`player-container ${getPlayerClass()}`}>
            <div className="belt-indicator" style={{ backgroundColor: getBeltHex(belt) }}>
                {getDansCount(belt) > 0 && Array.from({ length: getDansCount(belt) }).map((_, i) => (
                    <span key={i} className="dan-stripe" />
                ))}
            </div>
            <img
                src={imageSrc}
                alt="Player Kimono"
                className="player-sprite"
                style={{ filter: `drop-shadow(0 0 15px ${getAuraColor(belt)})` }}
            />
        </div>
    );
};

export default Player;
