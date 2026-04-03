import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { resolveAction, PREVENT_DEFAULT_KEYS } from '../utils/inputMap';

export const useInput = () => {
    const handleAttack = useStore((state) => state.handleAttack);
    const pauseGame = useStore((state) => state.pauseGame);
    const activateSuper = useStore((state) => state.activateSuper);
    const gameMode = useStore((state) => state.gameMode);

    // Prevent page jump (Poki requirement)
    useEffect(() => {
        const preventScroll = (event) => {
            if (PREVENT_DEFAULT_KEYS.includes(event.key.toLowerCase())) {
                event.preventDefault();
            }
        };
        const preventWheel = (event) => event.preventDefault();

        window.addEventListener('keydown', preventScroll);
        window.addEventListener('wheel', preventWheel, { passive: false });

        return () => {
            window.removeEventListener('keydown', preventScroll);
            window.removeEventListener('wheel', preventWheel);
        };
    }, []);

    // Game input via action map
    useEffect(() => {
        const handleKeyDown = (event) => {
            const action = resolveAction(event.key);
            if (!action) return;

            if (action === 'PAUSE' && (gameMode === 'PLAYING' || gameMode === 'PAUSED')) {
                pauseGame();
                return;
            }

            if (gameMode !== 'PLAYING') return;

            if (action === 'ATTACK_LEFT') handleAttack('left');
            if (action === 'ATTACK_RIGHT') handleAttack('right');
            if (action === 'SUPER') activateSuper();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleAttack, gameMode, pauseGame, activateSuper]);
};
