import React from 'react';
import { motion } from 'framer-motion';

const Boss = () => {
    return (
        <motion.div
            className="boss-container"
            initial={{ opacity: 0, scale: 0.8, y: -50 }}
            animate={{ opacity: 0.5, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ duration: 2 }}
        >
            <img src="/boss.png" alt="Ancestral Boss" className="boss-sprite" />
        </motion.div>
    );
};

export default Boss;
