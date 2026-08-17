import React from 'react';
import { Play, Pause, Volume2, VolumeX, Sun, Moon, Terminal, ShoppingBag } from 'lucide-react';
import { MallSimulationEngine } from '../game/engine';
import { isAudioEnabled, initAudio } from '../game/sound';

export type UITheme = 'dark_studio' | 'light_executive' | 'cyber_blueprint';

interface TopHeaderProps {
  engine: MallSimulationEngine;
  theme: UITheme;
  onThemeChange: (theme: UITheme) => void;
  onSpeedChange: (spd: number) => void;
  onPauseToggle: () => void;
  onSoundToggle: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  engine,
  theme,
  onThemeChange,
  onSpeedChange,
  onPauseToggle,
  onSoundToggle
}) => {
  const audioOn = isAudioEnabled();

  const isLight = theme === 'light_executive';
  const isCyber = theme === 'cyber_blueprint';

  return (
    <header
      className={`px-5 py-3.5 border-b transition-colors flex flex-wrap items-center justify-between gap-4 ${
        isLight
          ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
          : isCyber
          ? 'bg-[#0b101b] border-cyan-900/60 text-cyan-50 shadow-md'
          : 'bg-slate-900/95 border-slate-800 text-slate-100 shadow-md'
      }`}
    >
      {/* Brand Identity */}
      <div className="flex items-center gap-3.5">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl transition-all shadow-md ${
            isLight
              ? 'bg-slate-900 text-white'
              : isCyber
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
              : 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]'
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-base sm:text-lg font-extrabold tracking-tight m-0">
              MERIDIAN COMMONS
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium ${
                isLight
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE SIM
            </span>
          </div>
          <p
            className={`text-[11px] font-medium tracking-wide m-0 ${
              isLight ? 'text-slate-500' : isCyber ? 'text-cyan-400/80 font-mono' : 'text-slate-400'
            }`}
          >
            Real-Time Galleria & Tenant Operations
          </p>
        </div>
      </div>

      {/* Control Actions & Theme Switcher */}
      <div className="flex items-center flex-wrap gap-2.5">
        {/* Modern UI Theme Selector */}
        <div
          className={`flex items-center p-1 rounded-xl border text-xs ${
            isLight
              ? 'bg-slate-100 border-slate-200'
              : isCyber
              ? 'bg-slate-950/80 border-cyan-900/60'
              : 'bg-slate-950 border-slate-800'
          }`}
        >
          <button
            onClick={() => onThemeChange('dark_studio')}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-[11px] font-medium transition-all cursor-pointer ${
              theme === 'dark_studio'
                ? 'bg-slate-800 text-cyan-300 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Modern Dark Studio (Sleek Obsidian & Cyan)"
          >
            <Moon className="w-3 h-3" />
            <span className="hidden sm:inline">Studio</span>
          </button>
          <button
            onClick={() => onThemeChange('light_executive')}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-[11px] font-medium transition-all cursor-pointer ${
              theme === 'light_executive'
                ? 'bg-white text-slate-900 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Modern Light Executive (Scandinavian Minimalist Luxury)"
          >
            <Sun className="w-3 h-3" />
            <span className="hidden sm:inline">Light</span>
          </button>
          <button
            onClick={() => onThemeChange('cyber_blueprint')}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-[11px] font-medium transition-all cursor-pointer ${
              theme === 'cyber_blueprint'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Cyber Blueprint (Electric Navy & Wireframe)"
          >
            <Terminal className="w-3 h-3" />
            <span className="hidden sm:inline">Cyber</span>
          </button>
        </div>

        {/* Play / Pause Toggle */}
        <button
          onClick={() => {
            initAudio();
            onPauseToggle();
          }}
          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
            engine.isPaused
              ? 'bg-amber-500 text-slate-950 border-amber-400 hover:bg-amber-400'
              : isLight
              ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
          }`}
        >
          {engine.isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          {engine.isPaused ? 'RESUME' : 'PAUSE'}
        </button>

        {/* Speed Controller (1x, 2x, 4x) */}
        <div
          className={`flex items-center p-0.5 rounded-xl border ${
            isLight
              ? 'bg-slate-100 border-slate-200'
              : isCyber
              ? 'bg-slate-950/80 border-cyan-900/60'
              : 'bg-slate-950 border-slate-800'
          }`}
        >
          {[1, 2, 4].map((spd) => (
            <button
              key={spd}
              onClick={() => {
                initAudio();
                onSpeedChange(spd);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                engine.simSpeed === spd && !engine.isPaused
                  ? isLight
                    ? 'bg-slate-900 text-white font-bold'
                    : 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>

        {/* Audio Toggle */}
        <button
          onClick={() => {
            initAudio();
            onSoundToggle();
          }}
          className={`p-2 rounded-xl border transition-all cursor-pointer shadow-sm ${
            audioOn
              ? isLight
                ? 'bg-slate-100 text-slate-900 border-slate-300 hover:bg-slate-200'
                : 'bg-slate-800 text-cyan-400 border-slate-700 hover:bg-slate-700'
              : isLight
              ? 'bg-slate-50 text-slate-400 border-slate-200'
              : 'bg-slate-950 text-slate-500 border-slate-800'
          }`}
          title={audioOn ? 'Mute Procedural Sound' : 'Enable Procedural Sound'}
        >
          {audioOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
