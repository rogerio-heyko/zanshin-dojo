import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore, BELT_LEVELS } from '../store/useStore';
import { useGameLoop } from '../hooks/useGameLoop';
import { useInput } from '../hooks/useInput';
import { initAudio, startBackgroundMusic, stopBackgroundMusic, updateAudioLayer } from '../utils/audio';

import Player from './Player';
import Enemy from './Enemy';
import Boss from './Boss';
import HUD from './HUD';
import GameOver from './GameOver';
import ComboEffect from './ComboEffect';

const Stage = () => {
    useGameLoop();
    useInput();

    const {
        enemies,
        comboEffects,
        gameMode,
        handleAttack,
        playerState,
        belt,
        startGame,
        pauseGame
    } = useStore();

    const getAtmosphereClass = () => {
        if (belt.includes('Preta')) return 'sky-mushin';
        if (belt === 'Marrom' || belt === 'Roxa') return 'sky-dusk';
        return 'sky-base';
    };

    useEffect(() => {
        const index = BELT_LEVELS.findIndex(b => b.name === belt);
        updateAudioLayer(index !== -1 ? index : 0);

        if (gameMode === 'PLAYING' || gameMode === 'TRANSITION') {
            startBackgroundMusic();
        } else if (gameMode === 'GAMEOVER' || gameMode === 'MENU' || gameMode === 'PAUSED') {
            stopBackgroundMusic();
        }

        // Cleanup on unmount
        return () => stopBackgroundMusic();
    }, [gameMode, belt]);

    const handleStart = () => {
        initAudio();
        startGame();
    };

    return (
        <div className={`stage-wrapper ${getAtmosphereClass()}`}>

            {/* SVG Filters for Sumi-e Ink Effect */}
            <svg style={{ width: 0, height: 0, position: 'absolute' }}>
                <defs>
                    <filter id="ink-bleed">
                        <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="3" result="noise" />
                        <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G" />
                        <feGaussianBlur stdDeviation="0.8" />
                    </filter>
                </defs>
            </svg>

            <HUD />

            <main className={`stage-container ${playerState === 'HIT' ? 'screen-shake' : ''}`}>
                <div className="impact-zone-visual" />

                <AnimatePresence>
                    {enemies.map((enemy) => (
                        <Enemy key={enemy.id} data={enemy} />
                    ))}
                </AnimatePresence>

                {BELT_LEVELS.findIndex(b => b.name === belt) >= 7 && <Boss />}

                <Player />

                <AnimatePresence>
                    {comboEffects.map((effect) => (
                        <ComboEffect key={effect.id} effect={effect} />
                    ))}
                </AnimatePresence>

                <div className="touch-interface">
                    <div
                        className="touch-btn left"
                        onTouchStart={(e) => { e.preventDefault(); handleAttack('left'); }}
                        onClick={() => handleAttack('left')}
                    />
                    <div
                        className="touch-btn right"
                        onTouchStart={(e) => { e.preventDefault(); handleAttack('right'); }}
                        onClick={() => handleAttack('right')}
                    />
                </div>
            </main>

            {/* OVERLAYS FOR GAME MODES */}
            <AnimatePresence>
                {gameMode === 'GAMEOVER' && <GameOver />}

                {gameMode === 'MENU' && (
                    <motion.div className="game-over-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="game-over-modal">
                            <h1 className="title">ZANSHIN</h1>
                            <p style={{ marginBottom: '20px' }}>O Último Dojo</p>
                            <button className="retry-button" onClick={handleStart}>INICIAR TREINO</button>
                        </div>
                    </motion.div>
                )}

                {gameMode === 'PAUSED' && (
                    <motion.div className="game-over-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="game-over-modal">
                            <h2 className="title" style={{ color: '#fff' }}>PAUSADO</h2>
                            <p>Respire. O estado de fluxo o aguarda.</p>
                            <button className="retry-button" style={{ marginTop: '30px' }} onClick={pauseGame}>CONTINUAR</button>
                        </div>
                    </motion.div>
                )}

                {gameMode === 'TRANSITION' && (
                    <motion.div className="transition-overlay" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                        <h2 className="transition-title">{belt.toUpperCase()}</h2>
                        <p className="transition-quote">"{BELT_LEVELS.find(b => b.name === belt)?.quote}"</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="ink-frame-overlay" />
        </div>
    );
};

export default Stage;
