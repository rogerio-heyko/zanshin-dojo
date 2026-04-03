import React, { useMemo } from 'react';

const INK_COUNT = 8;

const InkParticles = () => {
    const particles = useMemo(() =>
        Array.from({ length: INK_COUNT }, (_, i) => ({
            id: i,
            left: `${10 + Math.random() * 80}%`,
            delay: `${Math.random() * 6}s`,
            duration: `${5 + Math.random() * 5}s`,
            height: `${10 + Math.random() * 14}px`,
        })),
    []);

    return (
        <div className="sakura-container" aria-hidden="true">
            {particles.map(p => (
                <div
                    key={p.id}
                    className="ink-particle"
                    style={{
                        left: p.left,
                        height: p.height,
                        animationDelay: p.delay,
                        animationDuration: p.duration,
                    }}
                />
            ))}
        </div>
    );
};

export default InkParticles;
