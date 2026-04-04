import React from 'react';
import { motion } from 'framer-motion';

const DURATIONS = {
    perfect: { opacity: [1, 1, 0], y: [0, -30, -60], scale: [1, 1.3, 1.1], duration: 1.8 },
    normal:  { opacity: [1, 1, 0], y: [0, -20, -45], scale: [0.8, 1.1, 1],  duration: 1.2 },
};

const ComboEffect = ({ effect }) => {
    const config = DURATIONS[effect.type] || DURATIONS.normal;

    return (
        <motion.div
            className={`combo-text ${effect.type}`}
            style={{ left: `${effect.x}%`, top: `${effect.y}%` }}
            initial={{ opacity: 0, y: 0, scale: effect.type === 'perfect' ? 0.6 : 0.5 }}
            animate={{
                opacity: config.opacity,
                y: config.y,
                scale: config.scale,
            }}
            transition={{ duration: config.duration, ease: 'easeOut', times: [0, 0.3, 1] }}
        >
            {effect.text}
        </motion.div>
    );
};

export default ComboEffect;
