import React, { useMemo } from 'react';

const PETAL_COUNT = 12;

const SakuraParticles = () => {
    const petals = useMemo(() =>
        Array.from({ length: PETAL_COUNT }, (_, i) => ({
            id: i,
            left: `${Math.random() * 100}%`,
            delay: `${Math.random() * 8}s`,
            duration: `${6 + Math.random() * 6}s`,
            size: `${6 + Math.random() * 8}px`,
        })),
    []);

    return (
        <div className="sakura-container" aria-hidden="true">
            {petals.map(p => (
                <div
                    key={p.id}
                    className="petal"
                    style={{
                        left: p.left,
                        width: p.size,
                        height: p.size,
                        animationDelay: p.delay,
                        animationDuration: p.duration,
                    }}
                />
            ))}
        </div>
    );
};

export default SakuraParticles;
