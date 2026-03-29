import React from 'react';
import { motion } from 'framer-motion';

const Enemy = ({ data }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.5, filter: 'blur(10px)' }}
            className="enemy-shadow"
            style={{ left: `${data.position}%` }}
        >
            <img
                src="/enemy.png"
                alt="Enemy Shadow"
                className="enemy-sprite"
                style={{ transform: data.side === 'left' ? 'scaleX(-1)' : 'scaleX(1)' }}
            />
        </motion.div>
    );
};

export default Enemy;
