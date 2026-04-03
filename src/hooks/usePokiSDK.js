import { useEffect, useRef, useCallback } from 'react';
import { stopBackgroundMusic, startBackgroundMusic, muteAll, unmuteAll } from '../utils/audio';

export const usePokiSDK = () => {
    const initialized = useRef(false);
    const isGameplayActive = useRef(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const initPoki = () => {
            if (initialized.current || !window.PokiSDK) return;

            try {
                window.PokiSDK.init().then(() => {
                    initialized.current = true;
                    console.log('[Poki] SDK initialized');
                    window.PokiSDK.gameLoadingFinished();
                    console.log('[Poki] gameLoadingFinished fired');
                }).catch((err) => {
                    console.warn('[Poki] Init failed (loading game anyway):', err);
                    initialized.current = true;
                });
            } catch (e) {
                console.warn('[Poki] SDK not available:', e);
            }
        };

        initPoki();
    }, []);

    const gameplayStart = useCallback(() => {
        if (!initialized.current || !window.PokiSDK) return;
        if (isGameplayActive.current) return; // Prevent double-fire
        try {
            window.PokiSDK.gameplayStart();
            isGameplayActive.current = true;
            console.log('[Poki] gameplayStart');
        } catch (e) { /* silent */ }
    }, []);

    const gameplayStop = useCallback(() => {
        if (!initialized.current || !window.PokiSDK) return;
        if (!isGameplayActive.current) return; // Prevent double-fire
        try {
            window.PokiSDK.gameplayStop();
            isGameplayActive.current = false;
            console.log('[Poki] gameplayStop');
        } catch (e) { /* silent */ }
    }, []);

    const commercialBreak = useCallback(() => {
        if (!initialized.current || !window.PokiSDK) return Promise.resolve();

        return new Promise((resolve) => {
            try {
                window.PokiSDK.commercialBreak(() => {
                    // Ad is actually showing — mute now
                    stopBackgroundMusic();
                    muteAll();
                }).then(() => {
                    console.log('[Poki] commercialBreak finished');
                    unmuteAll();
                    resolve();
                });
            } catch (e) {
                unmuteAll();
                resolve();
            }
        });
    }, []);

    const rewardedBreak = useCallback(() => {
        if (!initialized.current || !window.PokiSDK) return Promise.resolve(false);

        return new Promise((resolve) => {
            try {
                window.PokiSDK.rewardedBreak(() => {
                    // Ad is actually showing — mute now
                    stopBackgroundMusic();
                    muteAll();
                }).then((success) => {
                    console.log('[Poki] rewardedBreak finished, reward:', success);
                    unmuteAll();
                    resolve(success);
                });
            } catch (e) {
                unmuteAll();
                resolve(false);
            }
        });
    }, []);

    return { gameplayStart, gameplayStop, commercialBreak, rewardedBreak };
};