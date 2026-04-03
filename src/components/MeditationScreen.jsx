import React from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { useI18n } from '../hooks/useI18n';
import { AVAILABLE_LANGUAGES } from '../hooks/useI18n';

const MeditationScreen = ({ onClose }) => {
    const {
        masterVolume, setMasterVolume,
        sfxEnabled, setSfxEnabled,
        highScore, totalTrainingYears,
        language, setLanguage,
    } = useStore();
    const { t } = useI18n();

    return (
        <motion.div
            className="game-over-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                className="game-over-modal meditation-modal"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            >
                <h2 className="title" style={{ color: '#F5F5F1', fontSize: 'clamp(1.5rem, 5vw, 2.2rem)' }}>
                    {t('meditation.kanji')}
                </h2>
                <p style={{ color: '#757575', fontSize: 'clamp(0.55rem, 1.3vw, 0.65rem)', letterSpacing: '0.2em', marginBottom: '20px' }}>
                    {t('meditation.title')}
                </p>

                {/* Volume */}
                <div className="meditation-setting">
                    <label className="setting-label">{t('meditation.volume')}</label>
                    <div className="setting-control">
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={Math.round(masterVolume * 100)}
                            onChange={(e) => setMasterVolume(Number(e.target.value) / 100)}
                            className="volume-slider"
                        />
                        <span className="setting-value">{Math.round(masterVolume * 100)}%</span>
                    </div>
                </div>

                {/* SFX Toggle */}
                <div className="meditation-setting">
                    <label className="setting-label">{t('meditation.sfx')}</label>
                    <div className="setting-control">
                        <button
                            className={`toggle-btn ${sfxEnabled ? 'active' : ''}`}
                            onClick={() => setSfxEnabled(!sfxEnabled)}
                        >
                            {sfxEnabled ? t('meditation.sfxOn') : t('meditation.sfxOff')}
                        </button>
                    </div>
                </div>

                {/* Language Toggle */}
                <div className="meditation-setting">
                    <label className="setting-label">{t('meditation.language')}</label>
                    <div className="setting-control" style={{ gap: '8px' }}>
                        {AVAILABLE_LANGUAGES.map((lang) => (
                            <button
                                key={lang.code}
                                className={`toggle-btn ${language === lang.code ? 'active' : ''}`}
                                onClick={() => setLanguage(lang.code)}
                                style={{ minWidth: '80px' }}
                            >
                                {lang.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Legacy Stats */}
                <div className="meditation-legacy">
                    <div className="legacy-row">
                        <span>{t('meditation.record')}</span>
                        <span className="legacy-value">{highScore.toString().padStart(5, '0')}</span>
                    </div>
                    <div className="legacy-row">
                        <span>{t('meditation.trainingYears')}</span>
                        <span className="legacy-value">{totalTrainingYears.toLocaleString()}</span>
                    </div>
                </div>

                <button className="retry-button" onClick={onClose} style={{ marginTop: '24px' }}>
                    {t('meditation.back')}
                </button>
            </motion.div>
        </motion.div>
    );
};

export default MeditationScreen;
