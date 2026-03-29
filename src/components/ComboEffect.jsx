import React from 'react';
import { motion } from 'framer-motion';

const ComboEffect = ({ effect }) => (
    <motion.div
        initial={{ opacity: 1, y: 0, scale: 0.5 }}
        animate={{ opacity: 0, y: -50, scale: 1.2 }}
        className={`combo-text ${effect.type}`}
        style={{ left: `${effect.x}%`, top: `${effect.y}%` }}
    >
        {effect.text}
    </motion.div>
);

export default ComboEffect;
