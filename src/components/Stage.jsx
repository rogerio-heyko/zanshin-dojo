import React, { useEffect, useState, useRef, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore, BELT_LEVELS } from '../store/useStore';
import { useGameLoop } from '../hooks/useGameLoop';
import { useInput } from '../hooks/useInput';
import { usePokiSDK } from '../hooks/usePokiSDK';
import { useI18n } from '../hooks/useI18n';
import { initAudio, startBackgroundMusic, stopBackgroundMusic, updateAudioLayer, playAplausos, playHajime, setMasterVolume as setAudioVolume, setSfxEnabled as setAudioSfx } from '../utils/audio';
import { apiService } from '../utils/api';
import confetti from 'canvas-confetti';

import Player from './Player';
import Enemy from './Enemy';
import Boss from './Boss';
import HUD from './HUD';
import GameOver from './GameOver';
import ComboEffect from './ComboEffect';
import SakuraParticles from './SakuraParticles';
import InkParticles from './InkParticles';
import Leaderboard from './Leaderboard';
import MeditationScreen from './MeditationScreen';

const getScenarioConfig = (beltIndex) => {
    if (beltIndex >= 12) return { bgClass: 'bg-mushin',  skyClass: 'sky-mushin',  particles: 'ink' };
    if (beltIndex >= 7)  return { bgClass: 'bg-temple',  skyClass: 'sky-temple',  particles: null };
    if (beltIndex >= 4)  return { bgClass: 'bg-sakura',  skyClass: 'sky-sakura',  particles: 'sakura' };
    return                      { bgClass: 'bg-dojo',    skyClass: 'sky-base',    particles: null };
};

const getBeltHex = (beltName) => {
    const map = {
        'Branca': '#FFFFFF', 'Amarela': '#FFD700', 'Vermelha': '#FF0000',
        'Laranja': '#FF8C00', 'Verde': '#228B22', 'Roxa': '#800080', 'Marrom': '#8B4513',
    };
    return map[beltName] ?? '#111111';
};

const triggerFireworks = (beltName) => {
    const color = getBeltHex(beltName);
    const end = Date.now() + 2500;
    (function frame() {
        confetti({ particleCount: 8, angle: 60,  spread: 55, origin: { x: 0 }, colors: [color, '#ffffff', '#FFD700'] });
        confetti({ particleCount: 8, angle: 120, spread: 55, origin: { x: 1 }, colors: [color, '#ffffff', '#FFD700'] });
        if (Date.now() < end) requestAnimationFrame(frame);
    }());
};

const triggerGameOverConfetti = () => {
    confetti({ particleCount: 60, angle: 90, spread: 80, origin: { x: 0.5, y: 0.4 }, colors: ['#B71C1C', '#555', '#888', '#333'] });
};

const HowToPlay = ({ t }) => (
    <div className="how-to-play">
        <p className="how-to-play-title">{t('howToPlay.title')}</p>
        <div className="controls-grid">
            <div className="control-hint">
                <div className="control-key">
                    <kbd>A</kbd>
                    <span className="touch-icon">👈</span>
                </div>
                <span className="control-direction">{t('howToPlay.leftDir')}</span>
                <span className="control-label">{t('howToPlay.leftAction')}</span>
            </div>
            <div className="control-hint">
                <div className="control-key">
                    <kbd>D</kbd>
                    <span className="touch-icon">👉</span>
                </div>
                <span className="control-direction">{t('howToPlay.rightDir')}</span>
                <span className="control-label">{t('howToPlay.rightAction')}</span>
            </div>
        </div>
        <p className="game-objective">{t('howToPlay.objective')}</p>
    </div>
);

const Stage = () => {
    useGameLoop();
    useInput();
    const poki = usePokiSDK();
    const prevGameMode = useRef('MENU');
    const { t } = useI18n();

    const {
        enemies, comboEffects, gameMode, handleAttack,
        playerState, belt, startGame, pauseGame, score, kime
    } = useStore();

    const beltIndex = BELT_LEVELS.findIndex(b => b.name === belt);
    const scenario = getScenarioConfig(beltIndex >= 0 ? beltIndex : 0);

    const [hitFlash, setHitFlash] = useState(null);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [showMeditation, setShowMeditation] = useState(false);
    const [katanaSlash, setKatanaSlash] = useState(false);
    const [superFlash, setSuperFlash] = useState(false);
    const prevKime = useRef(kime);

    // Super flash when kime drops from 100 to 0 (Super activated)
    useEffect(() => {
        if (prevKime.current >= 100 && kime === 0) {
            setSuperFlash(true);
            setTimeout(() => setSuperFlash(false), 400);
        }
        prevKime.current = kime;
    }, [kime]);

    // Critical approach vignette — glow when enemy is in the perfect-hit zone (45-55%)
    const criticalGlow = useMemo(() => {
        if (gameMode !== 'PLAYING') return 0;
        let closestDist = Infinity;
        enemies.forEach(e => {
            const dist = Math.abs(e.position - 50);
            if (dist < closestDist) closestDist = dist;
        });
        // Glow intensity: max at distance 0, starts at distance 8 (≈zone boundary)
        if (closestDist > 8) return 0;
        return Math.min(1, (8 - closestDist) / 8);
    }, [enemies, gameMode]);

    // Watch playerState for hit flash
    useEffect(() => {
        if (playerState === 'ATTACK_L_PERFECT' || playerState === 'ATTACK_R_PERFECT') {
            setHitFlash('perfect');
            const t = setTimeout(() => setHitFlash(null), 220);
            return () => clearTimeout(t);
        }
    }, [playerState]);

    // Poki SDK events + audio tied to gameMode transitions
    useEffect(() => {
        const prev = prevGameMode.current;
        prevGameMode.current = gameMode;

        updateAudioLayer(beltIndex !== -1 ? beltIndex : 0);

        if (gameMode === 'PLAYING') {
            // commercialBreak before gameplayStart on transition/unpause (Poki requirement)
            const resumePlay = async () => {
                if (prev === 'TRANSITION' || prev === 'PAUSED') {
                    await poki.commercialBreak();
                }
                startBackgroundMusic();
                poki.gameplayStart();
            };
            if (prev !== 'PLAYING') {
                resumePlay();
            } else {
                startBackgroundMusic();
            }
        } else if (gameMode === 'TRANSITION') {
            startBackgroundMusic();
            triggerFireworks(belt);
            playAplausos(beltIndex);
            poki.gameplayStop();
        } else if (gameMode === 'GAMEOVER') {
            stopBackgroundMusic();
            triggerGameOverConfetti();
            playAplausos(0);
            poki.gameplayStop();
        } else if (gameMode === 'PAUSED') {
            poki.gameplayStop();
        } else if (gameMode === 'MENU') {
            stopBackgroundMusic();
        }

        return () => stopBackgroundMusic();
    }, [gameMode, belt]);

    // Tab visibility: pause audio + Poki events when tab is hidden
    useEffect(() => {
        const handleVisibility = () => {
            if (document.hidden) {
                stopBackgroundMusic();
                if (gameMode === 'PLAYING') poki.gameplayStop();
            } else {
                if (gameMode === 'PLAYING') {
                    startBackgroundMusic();
                    poki.gameplayStart();
                }
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, [gameMode, poki]);

    const handleStart = () => {
        initAudio().then(() => {
            const { masterVolume, sfxEnabled } = useStore.getState();
            setAudioVolume(masterVolume);
            setAudioSfx(sfxEnabled);
            playHajime();
        });
        setKatanaSlash(true);
        setTimeout(() => {
            startGame();
            poki.gameplayStart();
            setTimeout(() => setKatanaSlash(false), 600);
        }, 400);
    };

    // Restart with commercialBreak (Poki requirement)
    const handleRestart = async () => {
        initAudio();
        await poki.commercialBreak();
        playHajime();
        startGame();
        startBackgroundMusic();
        poki.gameplayStart();
    };

    const handleSubmitScore = async (playerName, playerScore, playerBelt) => {
        await apiService.submitScore(playerName, playerScore, playerBelt);
    };

    // Rewarded break for extra life
    const handleRewardedRevive = async () => {
        const rewarded = await poki.rewardedBreak();
        return rewarded;
    };

    return (
        <div className={`stage-wrapper ${scenario.bgClass} ${scenario.skyClass}`}>

            {/* Critical approach vignette */}
            {criticalGlow > 0 && (
                <div
                    className="critical-vignette"
                    style={{ opacity: criticalGlow * 0.6 }}
                />
            )}

            {/* Katana slash transition */}
            <AnimatePresence>
                {katanaSlash && (
                    <motion.div
                        className="katana-slash-overlay"
                        initial={{ clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)' }}
                        animate={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    />
                )}
            </AnimatePresence>

            <svg style={{ width: 0, height: 0, position: 'absolute' }}>
                <defs>
                    <filter id="ink-bleed">
                        <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="3" result="noise" />
                        <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G" />
                        <feGaussianBlur stdDeviation="0.8" />
                    </filter>
                </defs>
            </svg>

            {scenario.particles === 'sakura' && <SakuraParticles />}
            {scenario.particles === 'ink' && <InkParticles />}

            <HUD />

            <main className={`stage-container ${playerState === 'HIT' ? 'screen-shake' : ''}`}>
                <div className="impact-zone-visual" />

                {hitFlash && (
                    <div
                        key={Date.now()}
                        className={`hit-flash-overlay ${hitFlash}`}
                        aria-hidden="true"
                    />
                )}

                <AnimatePresence>
                    {enemies.map((enemy) => (
                        <Enemy key={enemy.id} data={enemy} />
                    ))}
                </AnimatePresence>

                {beltIndex >= 7 && <Boss />}

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
                    >
                        <span className="touch-arrow">←</span>
                    </div>
                    <div
                        className="touch-btn right"
                        onTouchStart={(e) => { e.preventDefault(); handleAttack('right'); }}
                        onClick={() => handleAttack('right')}
                    >
                        <span className="touch-arrow">→</span>
                    </div>
                </div>
            </main>

            <AnimatePresence>
                {gameMode === 'GAMEOVER' && (
                    <GameOver
                        onRestart={handleRestart}
                        onRewardedRevive={handleRewardedRevive}
                    />
                )}

                {gameMode === 'MENU' && (
                    <motion.div
                        className="game-over-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="game-over-modal">
                            <h1 className="title">{t('menu.title')}</h1>
                            <p style={{ marginBottom: '4px', fontSize: 'clamp(0.6rem, 1.5vw, 0.75rem)', color: '#9e9e9e', letterSpacing: '0.2em' }}>
                                {t('menu.subtitle')}
                            </p>

                            <HowToPlay t={t} />

                            <button className="retry-button" onClick={handleStart}>
                                {t('menu.startGame')}
                            </button>

                            <button
                                className="leaderboard-button"
                                onClick={() => setShowMeditation(true)}
                            >
                                {t('menu.meditation')}
                            </button>

                            <button
                                className="leaderboard-button"
                                onClick={() => setShowLeaderboard(true)}
                                style={{ marginTop: '8px' }}
                            >
                                {t('menu.ranking')}
                            </button>
                        </div>
                    </motion.div>
                )}

                {gameMode === 'PAUSED' && (
                    <motion.div
                        className="game-over-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="game-over-modal">
                            <h2 className="title" style={{ color: '#fff' }}>{t('pause.title')}</h2>
                            <p style={{ marginTop: '12px', color: '#9e9e9e', fontSize: 'clamp(0.6rem, 1.5vw, 0.75rem)' }}>
                                {t('pause.subtitle')}
                            </p>
                            <button className="retry-button" style={{ marginTop: '24px' }} onClick={pauseGame}>
                                {t('pause.resume')}
                            </button>
                        </div>
                    </motion.div>
                )}

                {gameMode === 'TRANSITION' && (
                    <motion.div
                        className="transition-overlay"
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h2 className="transition-title">{belt.toUpperCase()}</h2>
                        <p className="transition-quote">
                            &ldquo;{BELT_LEVELS.find(b => b.name === belt)?.quote}&rdquo;
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showLeaderboard && (
                    <Leaderboard
                        onClose={() => setShowLeaderboard(false)}
                        onSubmitScore={handleSubmitScore}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showMeditation && (
                    <MeditationScreen onClose={() => setShowMeditation(false)} />
                )}
            </AnimatePresence>

            {/* Super activation flash */}
            <AnimatePresence>
                {superFlash && (
                    <motion.div
                        className="super-flash-overlay"
                        initial={{ opacity: 1 }}
                        animate={{ opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                    />
                )}
            </AnimatePresence>

            <div className="ink-frame-overlay" />
        </div>
    );
};

export default Stage;
