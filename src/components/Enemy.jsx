import React from 'react';
import { motion } from 'framer-motion';

const DEFEAT_VARIANTS = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: {
        opacity: 0,
        y: -60,
        scale: 0,
        rotate: 45,
        filter: 'blur(4px)',
        transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] }
    },
};

const Enemy = ({ data }) => {
    return (
        <motion.div
            variants={DEFEAT_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
            className="enemy-shadow"
            style={{ left: `${data.position}%` }}
        >
            <img
                src="/enemy.png"
                alt="Enemy Shadow"
                className={`enemy-sprite ${data.side === 'right' ? 'face-left' : 'face-right'}`}
            />
        </motion.div>
    );
};

export default Enemy;
