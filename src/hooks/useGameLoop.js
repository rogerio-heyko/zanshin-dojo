import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { playTaiko } from '../utils/audio';

export const useGameLoop = () => {
    const { updateEnemies, spawnEnemy, belt, gameMode } = useStore();
    const lastSpawnTime = useRef(0);

    useEffect(() => {
        let frameId;
        let spawnRate = 3000;

        // Ler a dificuldade atual pela belt
        if (belt === 'Amarela') spawnRate = 2500;
        if (belt === 'Verde') spawnRate = 2000;
        if (belt === 'Marrom') spawnRate = 1500;
        if (belt === 'Preta') spawnRate = 1000;

        const loop = (time) => {
            if (gameMode === 'PLAYING') {
                updateEnemies();

                // Timer baseado no spawnRate (funciona como metrônomo)
                if (time - lastSpawnTime.current > spawnRate) {
                    spawnEnemy();
                    playTaiko(); // Som de batida ritmica a cada spawn (TOC)
                    lastSpawnTime.current = time;
                }
            }
            // Se estiver em TRANSITION (Subida de faixa), enemies terminam de sumir da tela mas não spawna novos.
            if (gameMode === 'TRANSITION') {
                updateEnemies();
            }

            frameId = requestAnimationFrame(loop);
        };

        frameId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(frameId);
    }, [updateEnemies, spawnEnemy, belt, gameMode]);
};
