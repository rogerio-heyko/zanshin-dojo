import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '../utils/api';
import { useStore } from '../store/useStore';
import { useI18n } from '../hooks/useI18n';
import { containsProfanity } from '../utils/profanityFilter';

const BELT_COLORS = {
    'Branca': '#FFFFFF', 'Amarela': '#FFD700', 'Vermelha': '#FF0000',
    'Laranja': '#FF8C00', 'Verde': '#228B22', 'Roxa': '#800080', 'Marrom': '#8B4513',
    'Preta - 1º Dan': '#111111', 'Preta - 2º Dan': '#111111', 'Preta - 3º Dan': '#111111',
    'Preta - 4º Dan': '#111111', 'Preta - 5º Dan': '#111111', 'Preta - 6º Dan': '#111111',
    'Preta - 7º Dan': '#111111', 'Preta - 8º Dan': '#111111', 'Preta - 9º Dan': '#111111',
    'Preta - 10º Dan': '#111111',
};

const Leaderboard = ({ onClose, onSubmitScore }) => {
    const [scores, setScores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBelt, setSelectedBelt] = useState(null);
    const [playerName, setPlayerName] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const { score, belt } = useStore();
    const { t } = useI18n();

    const loadScores = async (beltFilter = null) => {
        setLoading(true);
        const data = await apiService.getScores(beltFilter);
        setScores(data);
        setLoading(false);
    };

    useEffect(() => {
        loadScores(selectedBelt);
    }, [selectedBelt]);

    const handleSubmit = async () => {
        if (!playerName.trim() || score === 0) return;

        if (containsProfanity(playerName)) {
            setSubmitError(t('leaderboard.profanityError'));
            return;
        }
        setSubmitError('');
        setSubmitting(true);
        await onSubmitScore(playerName.trim(), score, belt);
        setSubmitting(false);
        setPlayerName('');
        loadScores(selectedBelt);
    };

    const belts = [null, 'Branca', 'Verde', 'Marrom', 'Preta - 1º Dan'];

    return (
        <motion.div
            className="leaderboard-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                className="leaderboard-modal"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
            >
                <button className="leaderboard-close" onClick={onClose}>×</button>

                <h2 className="leaderboard-title">{t('leaderboard.title')}</h2>

                <div className="leaderboard-filters">
                    {belts.map(b => (
                        <button
                            key={b ?? 'all'}
                            className={`filter-btn ${selectedBelt === b ? 'active' : ''}`}
                            onClick={() => setSelectedBelt(b)}
                        >
                            {b ?? t('leaderboard.all')}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="leaderboard-loading">{t('leaderboard.loading')}</div>
                ) : scores.length === 0 ? (
                    <div className="leaderboard-empty">{t('leaderboard.empty')}</div>
                ) : (
                    <div className="leaderboard-list">
                        {scores.map((entry, idx) => (
                            <div key={idx} className={`leaderboard-entry rank-${idx + 1}`}>
                                <span className="rank-num">#{idx + 1}</span>
                                <span className="player-name">{entry.player_name}</span>
                                <span
                                    className="player-belt"
                                    style={{ color: BELT_COLORS[entry.belt] || '#fff' }}
                                >
                                    {entry.belt}
                                </span>
                                <span className="player-score">{entry.score.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                )}

                {score > 0 && (
                    <div className="leaderboard-submit">
                        <p className="your-score">{t('leaderboard.yourScore')} <strong>{score}</strong> ({belt})</p>
                        <div className="submit-row">
                            <input
                                type="text"
                                placeholder={t('leaderboard.namePlaceholder')}
                                value={playerName}
                                onChange={(e) => { setPlayerName(e.target.value); setSubmitError(''); }}
                                maxLength={20}
                            />
                            <button
                                onClick={handleSubmit}
                                disabled={submitting || !playerName.trim()}
                            >
                                {submitting ? t('leaderboard.submitting') : t('leaderboard.submit')}
                            </button>
                        </div>
                        {submitError && (
                            <p style={{ color: '#B71C1C', fontSize: '0.7rem', marginTop: '6px' }}>{submitError}</p>
                        )}
                    </div>
                )}

                <p className="privacy-notice">{t('leaderboard.privacyNotice')}</p>
            </motion.div>
        </motion.div>
    );
};

export default Leaderboard;