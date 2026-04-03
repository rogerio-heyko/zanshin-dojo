import React from 'react';
import { useStore } from '../store/useStore';

const Player = () => {
    const playerState = useStore((state) => state.playerState);
    const belt = useStore((state) => state.belt);

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

    // Use original sprites (perfect transparency) — white for colored belts, black for Preta
    const isBlack = belt.includes('Preta');
    const variant = isBlack ? '' : '_white';
    
    let imageSrc = `/player_idle${variant}.png`;
    if (playerState === 'ATTACK_L_PERFECT') imageSrc = `/player_punch${variant}.png`;
    else if (playerState === 'ATTACK_R_PERFECT') imageSrc = `/player_kick${variant}.png`;

    const getAuraColor = (beltName) => {
        if (beltName === 'Branca') return 'rgba(255, 255, 255, 0.4)';
        if (beltName === 'Amarela') return 'rgba(255, 215, 0, 0.6)';
        if (beltName === 'Vermelha') return 'rgba(255, 0, 0, 0.6)';
        if (beltName === 'Laranja') return 'rgba(255, 140, 0, 0.6)';
        if (beltName === 'Verde') return 'rgba(0, 128, 0, 0.6)';
        if (beltName === 'Roxa') return 'rgba(128, 0, 128, 0.6)';
        if (beltName === 'Marrom') return 'rgba(139, 69, 19, 0.6)';
        if (beltName.includes('Preta')) return 'rgba(150, 150, 255, 0.8)';
        return 'rgba(255, 255, 255, 0.2)';
    };

    const getBeltColor = (beltName) => {
        if (beltName === 'Branca') return null; // No overlay needed
        if (beltName === 'Amarela') return '#FFD700';
        if (beltName === 'Vermelha') return '#E80000';
        if (beltName === 'Laranja') return '#FF8C00';
        if (beltName === 'Verde') return '#228B22';
        if (beltName === 'Roxa') return '#7B2D8E';
        if (beltName === 'Marrom') return '#8B4513';
        return null; // Black belt uses its own sprite
    };

    const beltColor = getBeltColor(belt);

    return (
        <div className={`player-container ${getPlayerClass()}`}>
            <img
                src={imageSrc}
                alt="Player Kimono"
                className="player-sprite"
                style={{ filter: `drop-shadow(0 0 15px ${getAuraColor(belt)})` }}
            />
            {beltColor && (
                <div
                    className="belt-color-overlay"
                    style={{ backgroundColor: beltColor }}
                />
            )}
        </div>
    );
};

export default Player;
