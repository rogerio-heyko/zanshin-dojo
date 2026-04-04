import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore, BELT_LEVELS } from '../store/useStore';

const DAN_BOSS_THRESHOLD = 500;

const Boss = () => {
    const { bossState, bossSequence, playerSequenceIndex, setBossState, bossChances, belt, danScore } = useStore();
    const [activeFlash, setActiveFlash] = useState(null);

    const beltIndex = BELT_LEVELS.findIndex(b => b.name === belt);
    const isMixedMode = beltIndex >= 8;
    const danProgress = Math.min(100, (danScore / DAN_BOSS_THRESHOLD) * 100);

    useEffect(() => {
        if (bossState === 'DEMONSTRATING' && bossSequence.length > 0) {
            let i = 0;
            const interval = setInterval(() => {
                if (i >= bossSequence.length) {
                    clearInterval(interval);
                    setBossState('WAITING_PLAYER');
                    setActiveFlash(null);
                    return;
                }
                setActiveFlash(bossSequence[i]);
                i++;
                setTimeout(() => setActiveFlash(null), 350);
            }, 700);

            return () => clearInterval(interval);
        } else {
            setActiveFlash(null);
        }
    }, [bossState, bossSequence]);

    return (
        <>
            {/* Dan Progress Bar — shown in ninja phase of mixed mode */}
            <AnimatePresence>
                {isMixedMode && bossState === 'IDLE' && (
                    <motion.div
                        className="dan-progress-container"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                    >
                        <span className="dan-progress-label">
                            ⚡ {danScore} / {DAN_BOSS_THRESHOLD}
                        </span>
                        <div className="dan-progress-track">
                            <motion.div
                                className="dan-progress-fill"
                                animate={{ width: `${danProgress}%` }}
                                transition={{ duration: 0.3, ease: 'easeOut' }}
                            />
                        </div>
                        <span className="dan-progress-boss-hint">
                            {danProgress >= 80 ? '⚠️ BOSS CHEGANDO...' : 'DERROTE OS NINJAS →'}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Boss Sprite — only shown during boss phase */}
            <AnimatePresence>
                {bossState !== 'IDLE' && (
                    <motion.div
                        className={`boss-container ${bossState === 'FAIL' ? 'boss-fail' : ''}`}
                        initial={{ opacity: 0, scale: 0.8, y: -50 }}
                        animate={{ opacity: 0.5, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 1.2 }}
                        transition={{ duration: 0.6 }}
                    >
                        <img src="/boss.png" alt="Ancestral Boss" className="boss-sprite" />

                        {activeFlash === 'left'  && <div className="boss-flash flash-left"  />}
                        {activeFlash === 'right' && <div className="boss-flash flash-right" />}

                        {(bossState === 'WAITING_PLAYER' || bossState === 'SUCCESS' || bossState === 'FAIL') && (
                            <div className="boss-sequence-ui">
                                <div className="boss-chances">Chances: {bossChances}</div>
                                <div className="boss-orbs-row">
                                    {bossSequence.map((step, idx) => (
                                        <div
                                            key={idx}
                                            className={`sequence-orb ${step} ${idx < playerSequenceIndex ? 'filled' : ''} ${bossState === 'FAIL' ? 'fail-orb' : ''}`}
                                        >
                                            {/* Arrow + Letter hint */}
                                            <span className="orb-arrow">
                                                {step === 'left' ? '←' : '→'}
                                            </span>
                                            <span className="orb-key">
                                                {step === 'left' ? 'A' : 'D'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Boss;
