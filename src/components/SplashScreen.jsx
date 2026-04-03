import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '../hooks/useI18n';

const SplashScreen = ({ onFinished }) => {
    const [visible, setVisible] = useState(true);
    const { t } = useI18n();

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(onFinished, 600);
        }, 2200);
        return () => clearTimeout(timer);
    }, [onFinished]);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    className="splash-screen"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <motion.div
                        className="splash-kanji"
                        initial={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                    >
                        {t('splash.kanji')}
                    </motion.div>
                    <motion.p
                        className="splash-meaning"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 0.6, y: 0 }}
                        transition={{ delay: 1.0, duration: 0.5 }}
                    >
                        {t('splash.meaning')}
                    </motion.p>
                    <motion.div
                        className="splash-loading"
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 2.0, ease: 'linear' }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SplashScreen;
