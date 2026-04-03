import { useCallback } from 'react';
import { useStore } from '../store/useStore';
import ptBR from '../i18n/pt-BR.json';
import en from '../i18n/en.json';

const LOCALES = {
    'pt-BR': ptBR,
    'en': en,
};

export const AVAILABLE_LANGUAGES = [
    { code: 'pt-BR', label: 'Português' },
    { code: 'en', label: 'English' },
];

/**
 * Lightweight i18n hook — no external deps.
 * Uses dot-notation keys: t('menu.title') → "ZANSHIN"
 */
export const useI18n = () => {
    const language = useStore((state) => state.language);

    const t = useCallback((key) => {
        const locale = LOCALES[language] || LOCALES['pt-BR'];
        const parts = key.split('.');
        let value = locale;
        for (const part of parts) {
            value = value?.[part];
            if (value === undefined) break;
        }
        // Fallback to pt-BR if key missing in current locale
        if (value === undefined) {
            let fallback = LOCALES['pt-BR'];
            for (const part of parts) {
                fallback = fallback?.[part];
                if (fallback === undefined) break;
            }
            return fallback ?? key;
        }
        return value;
    }, [language]);

    return { t, language };
};
