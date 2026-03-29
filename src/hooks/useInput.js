import { useEffect } from 'react';
import { useStore } from '../store/useStore';

export const useInput = () => {
    const handleAttack = useStore((state) => state.handleAttack);
    const pauseGame = useStore((state) => state.pauseGame);
    const gameMode = useStore((state) => state.gameMode);

    useEffect(() => {
        const handleKeyDown = (event) => {
            // Pause trigger via Escape key
            if (event.key === 'Escape' && (gameMode === 'PLAYING' || gameMode === 'PAUSED')) {
                pauseGame();
                return;
            }

            if (gameMode !== 'PLAYING') return;

            const key = event.key.toLowerCase();

            if (key === 'a' || key === 'arrowleft') {
                handleAttack('left');
            }
            if (key === 'd' || key === 'arrowright') {
                handleAttack('right');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleAttack, gameMode, pauseGame]);
};
