import { useEffect, useRef } from 'react';
import { useStore, BELT_LEVELS } from '../store/useStore';
import { playTaiko } from '../utils/audio';

export const useGameLoop = () => {
    const { updateEnemies, spawnEnemy, belt, gameMode } = useStore();
    const lastSpawnTime = useRef(0);
    const lastFrameTime = useRef(0);

    useEffect(() => {
        let frameId;

        // Derive spawn rate from belt index for all belts
        const beltIndex = BELT_LEVELS.findIndex(b => b.name === belt);
        const baseRate = 3000;
        const spawnRate = Math.max(800, baseRate - (beltIndex * 150));

        const loop = (time) => {
            // Calculate deltaTime in seconds (capped at 100ms to prevent spiral of death)
            const deltaTime = lastFrameTime.current
                ? Math.min((time - lastFrameTime.current) / 1000, 0.1)
                : 1 / 60;
            lastFrameTime.current = time;

            if (gameMode === 'PLAYING') {
                updateEnemies(deltaTime);

                if (time - lastSpawnTime.current > spawnRate) {
                    spawnEnemy();
                    playTaiko();
                    lastSpawnTime.current = time;
                }
            }

            if (gameMode === 'TRANSITION') {
                updateEnemies(deltaTime);
            }

            frameId = requestAnimationFrame(loop);
        };

        frameId = requestAnimationFrame(loop);
        return () => {
            cancelAnimationFrame(frameId);
            lastFrameTime.current = 0;
        };
    }, [updateEnemies, spawnEnemy, belt, gameMode]);
};
