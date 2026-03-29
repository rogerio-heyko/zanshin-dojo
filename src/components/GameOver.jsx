import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import './GameOver.css';

const WISDOM_QUOTES = [
    { text: "Não faça nada que seja inútil.", author: "Miyamoto Musashi" },
    { text: "No meio do caos, há sempre uma oportunidade.", author: "Sun Tzu" },
    { text: "O objetivo final do Karatê é o aperfeiçoamento do caráter.", author: "Gichin Funakoshi" },
    { text: "Aquele que conhece a si mesmo é invencível.", author: "Sun Tzu" },
    { text: "O tempo é tudo. Se o seu tempo falha, a técnica falha.", author: "Miyamoto Musashi" }
];

const GameOver = () => {
    const { score, highScore, resetGame, totalTrainingYears } = useStore();

    const quote = useMemo(() =>
        WISDOM_QUOTES[Math.floor(Math.random() * WISDOM_QUOTES.length)],
        []);

    const isNewRecord = score >= highScore && score > 0;

    return (
        <motion.div
            className="game-over-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
        >
            <div className="game-over-modal">
                <h2 className="title">O DOJO CAIU</h2>

                <div className="stats-container">
                    <div className="stat-box">
                        <span className="label">PONTUAÇÃO ATUAL</span>
                        <span className="value">{score}</span>
                    </div>

                    {isNewRecord && (
                        <motion.div
                            className="new-record-badge"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                        >
                            NOVO RECORDE!
                        </motion.div>
                    )}

                    <div className="stat-box secondary">
                        <span className="label">RECORDE PESSOAL</span>
                        <span className="value">{highScore}</span>
                    </div>
                </div>

                <div className="wisdom-section">
                    <p className="quote">"{quote.text}"</p>
                    <span className="author">— {quote.author}</span>
                </div>

                <div className="legacy-footer">
                    Seu legado total: <strong>{totalTrainingYears}</strong> anos de treino acumulados.
                </div>

                <button className="retry-button" onClick={resetGame}>
                    TREINAR NOVAMENTE
                </button>
            </div>
        </motion.div>
    );
};

export default GameOver;
