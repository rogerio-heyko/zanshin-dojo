import React, { useMemo } from 'react';
import { useStore, BELT_LEVELS } from '../store/useStore';
import { useI18n } from '../hooks/useI18n';

const TOTAL_ORBS = 5;

const getBeltHex = (beltName) => {
    const map = {
        'Branca': '#FFFFFF', 'Amarela': '#FFD700', 'Vermelha': '#FF0000',
        'Laranja': '#FF8C00', 'Verde': '#228B22', 'Roxa': '#800080', 'Marrom': '#8B4513',
    };
    return map[beltName] ?? '#7EB8FF';
};

const HUD = () => {
    const { score, health, combo, belt, kime } = useStore();
    const { t } = useI18n();

    const beltColor = getBeltHex(belt);

    // Map 0-100 health to 0-5 orbs (each orb = 20 HP)
    const filledOrbs = Math.ceil((health / 100) * TOTAL_ORBS);
    const partialFill = (health % 20) / 20;

    const orbs = useMemo(() =>
        Array.from({ length: TOTAL_ORBS }, (_, i) => {
            if (i < filledOrbs - 1) return 'full';
            if (i === filledOrbs - 1) return health > 0 ? 'partial' : 'empty';
            return 'empty';
        }),
    [filledOrbs, health]);

    const kimeReady = kime >= 100;

    return (
        <div className="hud-container">
            <div className="current-stats">
                {/* Ki Orbs */}
                <div className="vitality">
                    <span className="label">{t('hud.ki')}</span>
                    <div className="ki-orbs">
                        {orbs.map((state, i) => (
                            <div
                                key={i}
                                className={`ki-orb ${state}`}
                                style={{
                                    '--orb-color': health > 60 ? '#F5F5F1' : health > 30 ? '#FFD700' : '#B71C1C',
                                    '--partial': state === 'partial' ? partialFill : 1,
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* Belt */}
                <div className="belt-indicator">
                    <span className="label">{t('hud.belt')}</span>
                    <span className="belt-color">{belt}</span>
                </div>

                {/* Score */}
                <div className="score-display">
                    <span>{score.toString().padStart(5, '0')}</span>
                </div>
            </div>

            {/* Kime Bar */}
            <div className={`kime-bar-container ${kimeReady ? 'kime-ready' : ''}`}>
                <span className="kime-label">{kimeReady ? t('hud.kimeReady') : t('hud.kime')}</span>
                <div className="kime-bar-track">
                    <div
                        className="kime-bar-fill"
                        style={{
                            width: `${kime}%`,
                            background: kimeReady
                                ? `linear-gradient(90deg, ${beltColor}, #FFD700)`
                                : '#F5F5F1',
                        }}
                    />
                </div>
            </div>

            {combo > 4 && (
                <div
                    className="combo-display"
                    style={{ color: beltColor, textShadow: `0 0 12px ${beltColor}` }}
                >
                    {t('hud.combo')} {combo}×
                </div>
            )}
        </div>
    );
};

export default HUD;
