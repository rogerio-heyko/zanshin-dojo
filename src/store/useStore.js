import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { playImpact, playMiss, playLevelUp, playDamage } from '../utils/audio';

const ZONES = {
    PERFECT_MIN: 42, PERFECT_MAX: 48, // Lado Esquerdo (0 a 100)
    HIT_MIN: 35, HIT_MAX: 41,
    CENTER: 50,
    SAFE_ZONE: 5,
};

// 17-Stage Progression roadmap with wisdom quotes and scaling speed.
export const BELT_LEVELS = [
    { name: 'Branca', minScore: 0, speed: 0.2, quote: "Caminhe suavemente, respire fundo." },
    { name: 'Amarela', minScore: 50, speed: 0.25, quote: "A luz do sol desperta a determinação." },
    { name: 'Vermelha', minScore: 150, speed: 0.3, quote: "O fogo forja a persistência." },
    { name: 'Laranja', minScore: 300, speed: 0.35, quote: "O amanhecer revela o guerreiro paciente." },
    { name: 'Verde', minScore: 500, speed: 0.4, quote: "Crescer exige raízes fortes." },
    { name: 'Roxa', minScore: 750, speed: 0.5, quote: "A intuição guia a percepção." },
    { name: 'Marrom', minScore: 1000, speed: 0.6, quote: "A terra firme sustenta o espírito." },
    { name: 'Preta - 1º Dan', minScore: 1300, speed: 0.7, quote: "O vazio inicial, uma nova jornada começa." },
    { name: 'Preta - 2º Dan', minScore: 1700, speed: 0.8, quote: "A técnica se dissolve, resta o instinto." },
    { name: 'Preta - 3º Dan', minScore: 2200, speed: 0.9, quote: "A espada não corta a si mesma." },
    { name: 'Preta - 4º Dan', minScore: 2800, speed: 1.0, quote: "Quatro ventos não abalam a montanha." },
    { name: 'Preta - 5º Dan', minScore: 3500, speed: 1.1, quote: "Flua como a água, adapte-se." },
    { name: 'Preta - 6º Dan', minScore: 4300, speed: 1.2, quote: "Harmonia interior é invulnerabilidade." },
    { name: 'Preta - 7º Dan', minScore: 5200, speed: 1.3, quote: "O verdadeiro poder não levanta poeira." },
    { name: 'Preta - 8º Dan', minScore: 6200, speed: 1.4, quote: "Sem forma, sem limites." },
    { name: 'Preta - 9º Dan', minScore: 7300, speed: 1.5, quote: "Apenas um com o todo." },
    { name: 'Preta - 10º Dan', minScore: 8500, speed: 1.6, quote: "Mushin: A mente sem mente." }
];

export const useStore = create(
    persist(
        (set, get) => ({
            // --- DADOS VOLÁTEIS ---
            gameMode: 'MENU', // MENU, PLAYING, PAUSED, TRANSITION, GAMEOVER
            score: 0,
            health: 100,
            combo: 0,
            enemies: [],
            comboEffects: [],
            playerState: 'IDLE',
            belt: 'Branca',

            // --- DADOS PERSISTENTES ---
            highScore: 0,
            totalTrainingYears: 0,

            // --- AÇÕES DO GAME FLOW ---
            startGame: () => set({
                gameMode: 'PLAYING',
                score: 0, health: 100, combo: 0, enemies: [], comboEffects: [],
                playerState: 'IDLE', belt: 'Branca'
            }),

            pauseGame: () => set((state) => ({
                gameMode: state.gameMode === 'PLAYING' ? 'PAUSED' : 'PLAYING'
            })),

            // --- AÇÕES DO JOGO ---
            spawnEnemy: () => {
                const { gameMode, belt, enemies } = get();
                if (gameMode !== 'PLAYING') return; // Pause and transitions stop spawns

                const currentBeltConfig = BELT_LEVELS.find(b => b.name === belt);
                const beltIndex = BELT_LEVELS.findIndex(b => b.name === belt);

                // Boss Combo Boss Burst Mode (Index 7+ / Faixas Pretas)
                if (beltIndex >= 7) {
                    if (enemies.length === 0) {
                        const minCombos = 2;
                        const maxCombos = 3 + (beltIndex - 7); // Increases by 1 each Dan
                        const comboLength = Math.floor(Math.random() * (maxCombos - minCombos + 1)) + minCombos;

                        const newEnemies = [];
                        let lastSide = Math.random() > 0.5 ? 'left' : 'right';
                        for (let i = 0; i < comboLength; i++) {
                            if (Math.random() > 0.4) lastSide = lastSide === 'left' ? 'right' : 'left';
                            newEnemies.push({
                                id: Date.now() + i,
                                side: lastSide,
                                // Espaçamento apertado para combates rítmicos relâmpago
                                position: lastSide === 'left' ? -(i * 15) : 100 + (i * 15),
                                speed: currentBeltConfig.speed + 0.3,
                                type: 'shadow', // They act exactly like normal shadows for impact checking
                            });
                        }
                        set({ enemies: newEnemies });
                    }
                    return;
                }

                // Normal Spawning (Faixa Branca a Marrom)
                const side = Math.random() > 0.5 ? 'left' : 'right';
                const newEnemy = {
                    id: Date.now() + Math.random(),
                    side: side,
                    position: side === 'left' ? 0 : 100,
                    speed: currentBeltConfig.speed + (Math.random() * 0.05), // Less random to keep metronome feel
                    type: 'shadow',
                };
                set((state) => ({ enemies: [...state.enemies, newEnemy] }));
            },

            updateEnemies: () => {
                const { gameMode, enemies, takeDamage } = get();
                // Allow enemies to continue moving during transition, but not during pause
                if (gameMode === 'PAUSED' || gameMode === 'MENU' || gameMode === 'GAMEOVER') return;

                let hitByEnemy = false;
                const updatedEnemies = enemies.map(enemy => {
                    const newPos = enemy.side === 'left' ? enemy.position + enemy.speed : enemy.position - enemy.speed;

                    if ((enemy.side === 'left' && newPos >= 49) || (enemy.side === 'right' && newPos <= 51)) {
                        hitByEnemy = true;
                        return null; // Atingiu o jogador, some
                    }
                    return { ...enemy, position: newPos };
                }).filter(e => e !== null);

                if (hitByEnemy && gameMode === 'PLAYING') takeDamage();
                set({ enemies: updatedEnemies });
            },

            addComboEffect: (side, isPerfect) => {
                const id = Date.now();
                const newEffect = {
                    id,
                    x: side === 'left' ? 30 : 70,
                    y: Math.random() * 20 + 40,
                    text: isPerfect ? 'PERFEITO!' : `+${get().combo + 1}`,
                    type: isPerfect ? 'perfect' : 'normal'
                };
                set(state => ({ comboEffects: [...state.comboEffects, newEffect] }));
                setTimeout(() => {
                    set(state => ({
                        comboEffects: state.comboEffects.filter(e => e.id !== id)
                    }));
                }, 800);
            },

            handleAttack: (side) => {
                const { enemies, combo, score, gameMode, playerState, addComboEffect, belt } = get();
                if (gameMode !== 'PLAYING' || playerState === 'MISS') return;

                const potentialTargets = enemies.filter(e => e.side === side);
                const closest = potentialTargets.sort((a, b) =>
                    side === 'left' ? b.position - a.position : a.position - b.position
                )[0];

                if (!closest) {
                    playMiss();
                    set({ playerState: 'MISS', combo: 0 });
                    setTimeout(() => set({ playerState: 'IDLE' }), 500);
                    return;
                }

                const pos = closest.position;
                const isLeft = side === 'left';

                const isPerfect = isLeft
                    ? (pos >= ZONES.PERFECT_MIN && pos <= ZONES.PERFECT_MAX)
                    : (pos <= (100 - ZONES.PERFECT_MIN) && pos >= (100 - ZONES.PERFECT_MAX));
                const isHit = isLeft
                    ? (pos >= ZONES.HIT_MIN && pos < ZONES.PERFECT_MIN)
                    : (pos <= (100 - ZONES.HIT_MIN) && pos > (100 - ZONES.PERFECT_MAX));

                if (isPerfect || isHit) {
                    playImpact(isPerfect ? 'PERFECT' : 'NORMAL');
                    const points = isPerfect ? 20 : 10;
                    const newScore = score + points;
                    const newCombo = combo + 1;

                    addComboEffect(side, isPerfect);

                    let nextBelt = belt;
                    const futureBelt = [...BELT_LEVELS].reverse().find(b => newScore >= b.minScore).name;

                    // Verifica se houve mudança de faixa
                    if (futureBelt !== belt) {
                        nextBelt = futureBelt;
                        playLevelUp();
                        // Inicia transição para pausa da faixa
                        set({ gameMode: 'TRANSITION', belt: futureBelt });

                        // Opcional: explodir todos inimigos da tela na hora de trocar de faixa para um clean slate
                        set({ enemies: [] });

                        setTimeout(() => {
                            set({ gameMode: 'PLAYING' });
                        }, 3000); // 3 segundos para respirar
                    }

                    set(state => ({
                        enemies: state.enemies.filter(e => e.id !== closest.id),
                        score: newScore,
                        combo: newCombo,
                        belt: nextBelt,
                        playerState: side === 'left' ? 'ATTACK_L_PERFECT' : 'ATTACK_R_PERFECT'
                    }));

                    setTimeout(() => {
                        if (get().playerState !== 'MISS') set({ playerState: 'IDLE' });
                    }, 150);
                } else {
                    // Atacou longe
                    playMiss();
                    set({ playerState: 'MISS', combo: 0 });
                    setTimeout(() => set({ playerState: 'IDLE' }), 500);
                }
            },

            takeDamage: () => {
                const { health, score, highScore, totalTrainingYears } = get();
                playDamage();
                const newHealth = Math.max(0, health - 20); // Dano maior

                set({ combo: 0 }); // Zera combo

                if (newHealth <= 0) {
                    set({
                        gameMode: 'GAMEOVER',
                        health: 0,
                        highScore: Math.max(highScore, score),
                        totalTrainingYears: totalTrainingYears + score,
                        playerState: 'DEFEATED'
                    });
                } else {
                    set({ health: newHealth, playerState: 'HIT' });
                    setTimeout(() => set({ playerState: 'IDLE' }), 300);
                }
            },

            resetGame: () => set({
                gameMode: 'MENU',
                score: 0, health: 100, combo: 0, enemies: [], comboEffects: [],
                playerState: 'IDLE', belt: 'Branca'
            }),
        }),
        {
            name: 'zanshin-save-data',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                highScore: state.highScore,
                totalTrainingYears: state.totalTrainingYears
            }),
        }
    )
);
