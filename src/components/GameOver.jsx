import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { useI18n } from '../hooks/useI18n';
import { initAudio, startBackgroundMusic } from '../utils/audio';

const WISDOM_QUOTES = {
    'pt-BR': [
        { text: "Não faça nada que seja inútil.", author: "Miyamoto Musashi" },
        { text: "No meio do caos, há sempre uma oportunidade.", author: "Sun Tzu" },
        { text: "O objetivo final do Karatê é o aperfeiçoamento do caráter.", author: "Gichin Funakoshi" },
        { text: "Aquele que conhece a si mesmo é invencível.", author: "Sun Tzu" },
        { text: "O tempo é tudo. Se o seu tempo falha, a técnica falha.", author: "Miyamoto Musashi" },
        { text: "A derrota é o começo do aprendizado.", author: "Jigoro Kano" },
        { text: "Nunca interrompa o inimigo quando ele está cometendo um erro.", author: "Sun Tzu" },
    ],
    'en': [
        { text: "Do nothing that is of no use.", author: "Miyamoto Musashi" },
        { text: "In the midst of chaos, there is also opportunity.", author: "Sun Tzu" },
        { text: "The ultimate aim of Karate is the perfection of character.", author: "Gichin Funakoshi" },
        { text: "He who knows himself is invincible.", author: "Sun Tzu" },
        { text: "Timing is everything. If your timing fails, your technique fails.", author: "Miyamoto Musashi" },
        { text: "Defeat is the beginning of learning.", author: "Jigoro Kano" },
        { text: "Never interrupt your enemy when he is making a mistake.", author: "Sun Tzu" },
    ],
};

const ScoreCounter = ({ value }) => (
    <motion.span
        className="score-value"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
    >
        {value.toString().padStart(5, '0')}
    </motion.span>
);

const GameOver = ({ onRestart, onRewardedRevive }) => {
    const { score, highScore, totalTrainingYears } = useStore();
    const { t, language } = useI18n();
    const [reviving, setReviving] = useState(false);
    const [reviveUsed, setReviveUsed] = useState(false);

    const quotes = WISDOM_QUOTES[language] || WISDOM_QUOTES['pt-BR'];
    const quote = useMemo(() =>
        quotes[Math.floor(Math.random() * quotes.length)],
    [quotes]);

    const isNewRecord = score >= highScore && score > 0;

    const handleRevive = async () => {
        if (reviving || reviveUsed) return;
        setReviving(true);
        const success = await onRewardedRevive();
        if (success) {
            setReviveUsed(true);
            useStore.setState({ health: 50, gameMode: 'PLAYING', playerState: 'IDLE' });
            initAudio();
            startBackgroundMusic();
        }
        setReviving(false);
    };

    const titleLines = t('gameOver.title').split('\n');

    return (
        <motion.div
            className="game-over-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
        >
            <motion.div
                className="game-over-modal"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }}
            >
                <motion.h2
                    className="game-over-title"
                    initial={{ opacity: 0, scale: 1.5, filter: 'blur(8px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                >
                    {titleLines[0]}<br />{titleLines[1]}
                </motion.h2>

                <div style={{ marginTop: '20px' }}>
                    <div className="score-row">
                        <span>{t('gameOver.currentScore')}</span>
                        <ScoreCounter value={score} />
                    </div>

                    {isNewRecord && (
                        <motion.div
                            style={{
                                textAlign: 'center', color: '#D4AF37',
                                fontSize: 'clamp(0.55rem, 1.4vw, 0.65rem)',
                                letterSpacing: '0.2em', padding: '6px 0',
                            }}
                            animate={{ opacity: [1, 0.5, 1] }}
                            transition={{ repeat: Infinity, duration: 1.4 }}
                        >
                            {t('gameOver.newRecord')}
                        </motion.div>
                    )}

                    <div className="score-row">
                        <span>{t('gameOver.personalRecord')}</span>
                        <ScoreCounter value={highScore} />
                    </div>
                </div>

                <motion.div
                    className="quote-block"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    style={{ marginTop: '16px' }}
                >
                    <p className="quote-text">&ldquo;{quote.text}&rdquo;</p>
                    <p className="quote-author">— {quote.author.toUpperCase()}</p>
                </motion.div>

                <p className="legacy-text" style={{ marginTop: '12px' }}>
                    {t('gameOver.legacy')} <strong style={{ color: '#D4AF37' }}>{totalTrainingYears}</strong> {t('gameOver.legacyUnit')}
                </p>

                <button className="retry-button" onClick={onRestart}>
                    {t('gameOver.restart')}
                </button>

                {!reviveUsed && score > 0 && (
                    <button
                        className="revive-button"
                        onClick={handleRevive}
                        disabled={reviving}
                    >
                        🎬 {reviving ? t('gameOver.loading') : t('gameOver.revive')}
                    </button>
                )}
            </motion.div>
        </motion.div>
    );
};

export default GameOver;
