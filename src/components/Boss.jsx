import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';

const Boss = () => {
    const { bossState, bossSequence, playerSequenceIndex, setBossState, bossChances } = useStore();
    const [activeFlash, setActiveFlash] = useState(null);

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
            }, 700); // 350ms on, 350ms off

            return () => clearInterval(interval);
        } else {
            setActiveFlash(null);
        }
    }, [bossState, bossSequence]);

    return (
        <motion.div
            className={`boss-container ${bossState === 'FAIL' ? 'boss-fail' : ''}`}
            initial={{ opacity: 0, scale: 0.8, y: -50 }}
            animate={{ opacity: 0.5, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ duration: 2 }}
        >
            <img src="/boss.png" alt="Ancestral Boss" className="boss-sprite" />

            {activeFlash === 'left' && <div className="boss-flash flash-left" />}
            {activeFlash === 'right' && <div className="boss-flash flash-right" />}

            {(bossState === 'WAITING_PLAYER' || bossState === 'SUCCESS' || bossState === 'FAIL') && (
                <div className="boss-sequence-ui">
                    <div className="boss-chances">Chances: {bossChances}</div>
                    {bossSequence.map((step, idx) => (
                        <div
                            key={idx}
                            className={`sequence-orb ${step} ${idx < playerSequenceIndex ? 'filled' : ''} ${bossState === 'FAIL' ? 'fail-orb' : ''}`}
                        >
                            {step === 'left' ? '←' : '→'}
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );
};

export default Boss;
