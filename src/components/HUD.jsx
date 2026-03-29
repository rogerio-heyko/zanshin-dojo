import React from 'react';
import { useStore } from '../store/useStore';

const HUD = () => {
    const { score, health, combo, belt, highScore, totalTrainingYears } = useStore();

    return (
        <div className="hud-container">
            <div className="current-stats">
                <div className="vitality">
                    <span className="label">VITALIDADE</span>
                    <div className="health-bar-container">
                        <div className="health-bar" style={{ width: `${health}%`, backgroundColor: health > 30 ? '#fff' : '#B71C1C' }} />
                    </div>
                </div>
                <div className="belt-indicator">
                    <span className="label">FAIXA:</span>
                    <span className={`belt-color ${belt.toLowerCase()}`}>{belt}</span>
                </div>

                <div className="score-display">
                    <span>SCORE: {score.toString().padStart(5, '0')}</span>
                </div>
            </div>

            {combo > 5 && (
                <div className="combo-display">
                    <span>COMBO: {combo}x</span>
                </div>
            )}
        </div>
    );
};

export default HUD;
