import React, { useState, useEffect } from 'react';
import { MallSimulationEngine } from './game/engine';
import { setAudioEnabled, isAudioEnabled } from './game/sound';
import { TopHeader, UITheme } from './components/TopHeader';
import { StatsBar } from './components/StatsBar';
import { MallCanvas } from './components/MallCanvas';
import { Sidebar } from './components/Sidebar';

export const App: React.FC = () => {
  // UI Theme state with live instant switching
  const [theme, setTheme] = useState<UITheme>('dark_studio');

  // Single game simulation engine instance
  const [engine] = useState(() => new MallSimulationEngine());
  const [, setTick] = useState(0);

  // Force re-render on simulation state updates
  useEffect(() => {
    engine.setCallback(() => {
      setTick((t) => (t + 1) % 100000);
    });
  }, [engine]);

  const handleSpeedChange = (speed: number) => {
    engine.simSpeed = speed;
    engine.isPaused = false;
    setTick((t) => t + 1);
  };

  const handlePauseToggle = () => {
    engine.isPaused = !engine.isPaused;
    setTick((t) => t + 1);
  };

  const handleSoundToggle = () => {
    setAudioEnabled(!isAudioEnabled());
    setTick((t) => t + 1);
  };

  const handleStoreSelected = () => {
    setTick((t) => t + 1);
  };

  const isLight = theme === 'light_executive';
  const isCyber = theme === 'cyber_blueprint';

  return (
    <div
      className={`min-h-screen transition-colors duration-200 font-sans flex items-center justify-center p-2 sm:p-4 md:p-6 ${
        isLight
          ? 'bg-slate-100 text-slate-900'
          : isCyber
          ? 'bg-[#050811] text-cyan-50'
          : 'bg-[#0f1420] text-slate-100'
      }`}
    >
      {/* Central App Card Container */}
      <div
        className={`w-full max-w-[1920px] rounded-2xl overflow-hidden transition-all duration-200 border flex flex-col ${
          isLight
            ? 'bg-white border-slate-200 shadow-xl'
            : isCyber
            ? 'bg-[#090e1a] border-cyan-900/50 shadow-[0_20px_70px_rgba(6,182,212,0.15)]'
            : 'bg-slate-900 border-slate-800 shadow-[0_25px_80px_rgba(0,0,0,0.6)]'
        }`}
      >
        {/* Top Header with Theme Switcher, Speed & Audio Controls */}
        {!engine.blueprintMode && <TopHeader
          engine={engine}
          theme={theme}
          onThemeChange={setTheme}
          onSpeedChange={handleSpeedChange}
          onPauseToggle={handlePauseToggle}
          onSoundToggle={handleSoundToggle}
        />}

        {/* Global Statistics & Metric Tiles HUD */}
        {!engine.blueprintMode && <StatsBar stats={engine.stats} leasedCount={engine.stores.length} unitCount={engine.units.length} theme={theme} />}

        {/* Main Interactive Simulation Body */}
        <div className={`grid grid-cols-1 min-h-[760px] ${engine.blueprintMode ? '' : 'xl:grid-cols-[minmax(0,1fr)_420px]'}`}>
          {/* 2D Mall Simulation Viewport */}
          <main
            className={`flex flex-col justify-center border-b xl:border-b-0 xl:border-r ${
              isLight
                ? 'border-slate-200 bg-slate-50/50'
                : isCyber
                ? 'border-cyan-950 bg-[#070b14]'
                : 'border-slate-800 bg-slate-950/40'
            }`}
          >
            <MallCanvas engine={engine} onStoreSelected={handleStoreSelected} />
          </main>

          {/* Interactive Management Sidebar */}
          {!engine.blueprintMode && <Sidebar engine={engine} theme={theme} onUpdate={() => setTick((t) => t + 1)} />}
        </div>
      </div>
    </div>
  );
};

export default App;
