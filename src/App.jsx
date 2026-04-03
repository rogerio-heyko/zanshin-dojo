import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import SplashScreen from './components/SplashScreen';
import Stage from './components/Stage';

function App() {
    const [loaded, setLoaded] = useState(false);

    return (
        <div className="app-container">
            <AnimatePresence mode="wait">
                {!loaded ? (
                    <SplashScreen key="splash" onFinished={() => setLoaded(true)} />
                ) : (
                    <Stage key="stage" />
                )}
            </AnimatePresence>
        </div>
    );
}

export default App;
