import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { playImpact, playMiss, playLevelUp, playDamage, playKiai, playOss, playAplausos, setMasterVolume as setAudioMasterVolume, setSfxEnabled as setAudioSfxEnabled } from '../utils/audio';

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

// --- ENEMY OBJECT POOL ---
const POOL_SIZE = 20;
let enemyPool = [];
let nextEnemyId = 1;

const acquireEnemy = (side, speed) => {
    let enemy = enemyPool.pop();
    if (!enemy) enemy = {};
    enemy.id = nextEnemyId++;
    enemy.side = side;
    enemy.position = side === 'left' ? 0 : 100;
    enemy.speed = speed;
    enemy.type = 'shadow';
    enemy.active = true;
    return enemy;
};

const releaseEnemy = (enemy) => {
    enemy.active = false;
    if (enemyPool.length < POOL_SIZE) enemyPool.push(enemy);
};

export const useStore = create(
    persist(
        (set, get) => ({
            // --- DADOS VOLÁTEIS ---
            gameMode: 'MENU', // MENU, PLAYING, PAUSED, TRANSITION, GAMEOVER
            score: 0,
            health: 100,
            combo: 0,
            kime: 0, // 0-100, builds with perfect hits, activates Super
            enemies: [],
            comboEffects: [],
            playerState: 'IDLE',
            belt: 'Branca',
            bossState: 'IDLE', // IDLE, DEMONSTRATING, WAITING_PLAYER, SUCCESS, FAIL
            bossSequence: [],
            playerSequenceIndex: 0,
            bossChances: 3,
            danScore: 0, // points earned in current Dan phase (resets each Dan)

            // --- DADOS PERSISTENTES ---
            highScore: 0,
            totalTrainingYears: 0,
            masterVolume: 1.0,
            sfxEnabled: true,
            language: 'pt-BR',

            // --- AÇÕES DO GAME FLOW ---
            startGame: () => set({
                gameMode: 'PLAYING',
                score: 0, health: 100, combo: 0, kime: 0, enemies: [], comboEffects: [],
                playerState: 'IDLE', belt: 'Branca',
                bossState: 'IDLE', bossSequence: [], playerSequenceIndex: 0, bossChances: 3,
                danScore: 0,
            }),

            pauseGame: () => set((state) => ({
                gameMode: state.gameMode === 'PLAYING' ? 'PAUSED' : 'PLAYING'
            })),

            setMasterVolume: (vol) => {
                setAudioMasterVolume(vol);
                set({ masterVolume: vol });
            },
            setSfxEnabled: (enabled) => {
                setAudioSfxEnabled(enabled);
                set({ sfxEnabled: enabled });
            },

            setLanguage: (lang) => set({ language: lang }),

            setBossState: (state) => set({ bossState: state }),

            // --- SUPER (KIME) ---
            activateSuper: () => {
                const { kime, enemies, score, gameMode } = get();
                if (kime < 100 || gameMode !== 'PLAYING') return false;
                const bonus = enemies.length * 30;
                playImpact('PERFECT');
                set({
                    kime: 0,
                    enemies: [],
                    score: score + bonus,
                    playerState: 'ATTACK_L_PERFECT',
                });
                setTimeout(() => set({ playerState: 'IDLE' }), 400);
                return true;
            },

            // --- AÇÕES DO JOGO ---
            spawnEnemy: () => {
                const { gameMode, belt, bossState, danScore } = get();
                if (gameMode !== 'PLAYING') return;

                const currentBeltConfig = BELT_LEVELS.find(b => b.name === belt);
                const beltIndex = BELT_LEVELS.findIndex(b => b.name === belt);

                // 1º Dan (index 7) — pure Simon Says from the start
                if (beltIndex === 7) {
                    if (bossState === 'IDLE') {
                        get()._triggerBoss(beltIndex);
                    }
                    return;
                }

                // 2º Dan+ (index 8+) — Mixed mode: ninjas until danScore threshold
                if (beltIndex >= 8) {
                    const DAN_BOSS_THRESHOLD = 500;

                    if (bossState !== 'IDLE') return; // Boss active, no ninja spawning

                    if (danScore >= DAN_BOSS_THRESHOLD) {
                        // Threshold reached — trigger boss transition
                        get().enemies.forEach(releaseEnemy);
                        set({ enemies: [], bossState: 'DEMONSTRATING' }); // trigger Boss via _triggerBoss below
                        get()._triggerBoss(beltIndex);
                        return;
                    }

                    // Normal ninja spawn with slight Dan speed boost
                    const danBoost = (beltIndex - 7) * 0.04; // +0.04 per Dan above 1st
                    const side = Math.random() > 0.5 ? 'left' : 'right';
                    const speed = currentBeltConfig.speed + danBoost + (Math.random() * 0.05);
                    const newEnemy = acquireEnemy(side, speed);
                    set(state => ({ enemies: [...state.enemies, newEnemy] }));
                    return;
                }

                // Normal Spawning (Faixa Branca a Marrom) — uses object pool
                const side = Math.random() > 0.5 ? 'left' : 'right';
                const speed = currentBeltConfig.speed + (Math.random() * 0.05);
                const newEnemy = acquireEnemy(side, speed);
                set(state => ({ enemies: [...state.enemies, newEnemy] }));
            },

            _triggerBoss: (beltIndex) => {
                const minLength = 3;
                const maxLength = 3 + Math.floor((beltIndex - 7) / 2);
                const comboLength = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
                const newSequence = Array.from({ length: comboLength }, () =>
                    Math.random() > 0.5 ? 'left' : 'right'
                );
                playOss();
                playAplausos(beltIndex);
                set({
                    enemies: [],
                    bossState: 'DEMONSTRATING',
                    bossSequence: newSequence,
                    playerSequenceIndex: 0,
                    bossChances: 3,
                    danScore: 0, // reset for next Dan phase
                });
            },

            updateEnemies: (deltaTime = 1/60) => {
                const { gameMode, enemies, takeDamage } = get();
                if (gameMode === 'PAUSED' || gameMode === 'MENU' || gameMode === 'GAMEOVER') return;

                const dt = deltaTime * 60; // Normalize: at 60fps dt≈1, preserving original speed values
                let hitByEnemy = false;
                const surviving = [];
                for (const enemy of enemies) {
                    const newPos = enemy.side === 'left' ? enemy.position + enemy.speed * dt : enemy.position - enemy.speed * dt;

                    if ((enemy.side === 'left' && newPos >= 49) || (enemy.side === 'right' && newPos <= 51)) {
                        hitByEnemy = true;
                        releaseEnemy(enemy); // return to pool
                    } else {
                        // Spread to new object: React needs a new reference to detect change
                        surviving.push({ ...enemy, position: newPos });
                    }
                }

                if (hitByEnemy && gameMode === 'PLAYING') takeDamage();
                set({ enemies: surviving });
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
                // Timeout matches animation: 2000ms for perfect, 1400ms for normal
                const removeDelay = isPerfect ? 2000 : 1400;
                setTimeout(() => {
                    set(state => ({
                        comboEffects: state.comboEffects.filter(e => e.id !== id)
                    }));
                }, removeDelay);
            },

            handleAttack: (side) => {
                const { enemies, combo, score, gameMode, playerState, addComboEffect, belt, health, takeDamage } = get();
                if (gameMode !== 'PLAYING' || playerState === 'MISS') return;

                const beltIndex = BELT_LEVELS.findIndex(b => b.name === belt);

                // MODO BOSS SIMON-SAYS
                if (beltIndex >= 7) {
                    const { bossState, bossSequence, playerSequenceIndex, bossChances } = get();
                    if (bossState !== 'WAITING_PLAYER') return;

                    const expected = bossSequence[playerSequenceIndex];
                    if (side === expected) {
                        playImpact('PERFECT');
                        playKiai(beltIndex);
                        addComboEffect(side, true);
                        const nextIndex = playerSequenceIndex + 1;
                        const newScore = score + 50;
                        set({ playerSequenceIndex: nextIndex, combo: combo + 1, score: newScore, playerState: side === 'left' ? 'ATTACK_L_PERFECT' : 'ATTACK_R_PERFECT' });
                        setTimeout(() => set({ playerState: 'IDLE' }), 300);

                        // Check if completed
                        if (nextIndex >= bossSequence.length) {
                            setTimeout(() => {
                                set({ bossState: 'SUCCESS', score: newScore + 500, bossChances: 3 });

                                const futureBelt = [...BELT_LEVELS].reverse().find(b => (newScore + 500) >= b.minScore).name;
                                if (futureBelt !== belt) {
                                    set({ belt: futureBelt, gameMode: 'TRANSITION', bossState: 'IDLE' });
                                    playLevelUp();
                                    playOss();
                                    setTimeout(() => set({ gameMode: 'PLAYING' }), 4000);
                                } else {
                                    setTimeout(() => set({ bossState: 'IDLE' }), 1500); // Trigger next sequence
                                }
                            }, 500);
                        }
                    } else {
                        // Wrong input!
                        playMiss();
                        const newChances = bossChances - 1;

                        if (newChances <= 0) {
                            playDamage();
                            takeDamage();
                            set({ bossState: 'FAIL', playerSequenceIndex: 0, combo: 0, bossChances: 3 });
                            setTimeout(() => set({ bossState: 'IDLE' }), 2000); // retry
                        } else {
                            // Perdeu 1 chance, tenta novamente
                            set({ bossState: 'FAIL', playerSequenceIndex: 0, combo: 0, bossChances: newChances });
                            setTimeout(() => set({ bossState: 'IDLE' }), 1000); // new sequence
                        }
                    }
                    return;
                }

                // MODO NORMAL DE SOBREVIVÊNCIA
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
                    playKiai(beltIndex);
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
                        playOss();
                        // Inicia transição para pausa da faixa
                        set({ gameMode: 'TRANSITION', belt: futureBelt });

                        // Release all enemies back to pool for a clean slate
                        get().enemies.forEach(releaseEnemy);
                        set({ enemies: [] });

                        setTimeout(() => {
                            set({ gameMode: 'PLAYING' });
                        }, 3000); // 3 segundos para respirar
                    }

                    // Capture id BEFORE releasing — spawnEnemy may recycle this object
                    // before the filter closure runs, overwriting the id (race condition)
                    const killedId = closest.id;
                    releaseEnemy(closest);

                    // Accumulate danScore for 2nd Dan+ mixed mode
                    const currentBeltIdx = BELT_LEVELS.findIndex(b => b.name === nextBelt);
                    const danScoreDelta = currentBeltIdx >= 8 ? points : 0;

                    set(state => ({
                        enemies: state.enemies.filter(e => e.id !== killedId),
                        score: newScore,
                        combo: newCombo,
                        kime: Math.min(100, state.kime + (isPerfect ? 15 : 5)),
                        belt: nextBelt,
                        danScore: futureBelt !== belt ? 0 : state.danScore + danScoreDelta,
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

            resetGame: () => {
                get().enemies.forEach(releaseEnemy);
                set({
                    gameMode: 'MENU',
                    score: 0, health: 100, combo: 0, kime: 0, enemies: [], comboEffects: [],
                    playerState: 'IDLE', belt: 'Branca'
                });
            },
        }),
        {
            name: 'zanshin-save-data',
            storage: createJSONStorage(() => {
                try {
                    // Test localStorage availability (incognito safety)
                    localStorage.setItem('__test', '1');
                    localStorage.removeItem('__test');
                    return localStorage;
                } catch {
                    // Fallback: in-memory storage for incognito mode
                    const mem = {};
                    return {
                        getItem: (k) => mem[k] ?? null,
                        setItem: (k, v) => { mem[k] = v; },
                        removeItem: (k) => { delete mem[k]; },
                    };
                }
            }),
            partialize: (state) => ({
                highScore: state.highScore,
                totalTrainingYears: state.totalTrainingYears,
                masterVolume: state.masterVolume,
                sfxEnabled: state.sfxEnabled,
                language: state.language,
            }),
        }
    )
);
