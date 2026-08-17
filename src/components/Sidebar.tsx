import React, { useState } from 'react';
import {
  Store,
  Building2,
  Activity,
  ScrollText,
  ArrowUpCircle,
  Trash2,
  Users,
  UtensilsCrossed,
  Sparkles,
  ShieldCheck,
  BadgePercent,
  CheckCircle2,
  Flame,
  Layers,
  ChevronRight,
  Clapperboard,
  Grid,
  Paintbrush,
  ArrowUpDown,
  Compass,
  Sparkle
} from 'lucide-react';
import { MallSimulationEngine } from '../game/engine';
import { TENANTS_CATALOG, AMENITIES_CATALOG } from '../game/constants';
import { TenantCategory, TenantDefinition, MallUnit, AmenityDefinition, HallwayStyle } from '../game/types';
import { initAudio, playBeep, playPlaceSound } from '../game/sound';
import { UITheme } from './TopHeader';

interface SidebarProps {
  engine: MallSimulationEngine;
  theme: UITheme;
  onUpdate: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ engine, theme, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'directory' | 'architect' | 'inspector' | 'health' | 'events'>('directory');
  const [selectedCat, setSelectedCat] = useState<TenantCategory | 'All'>('All');

  // Custom Lot Configurator Local State
  const [customW, setCustomW] = useState(6);
  const [customH, setCustomH] = useState(5);
  const [customName, setCustomName] = useState('Custom Commercial Lot');

  // Inspected Lot Reconfiguration State
  const [editLotName, setEditLotName] = useState('');
  const [editLotW, setEditLotW] = useState(6);
  const [editLotH, setEditLotH] = useState(5);
  const [editDoorDir, setEditDoorDir] = useState<'south' | 'north' | 'east' | 'west'>('south');

  const isLight = theme === 'light_executive';
  const isCyber = theme === 'cyber_blueprint';

  const categories: Array<TenantCategory | 'All'> = ['All', 'Luxury', 'Food', 'Fashion', 'Entertainment', 'Specialty'];

  const filteredTenants = selectedCat === 'All'
    ? TENANTS_CATALOG
    : TENANTS_CATALOG.filter((t) => t.cat === selectedCat);

  const inspected = engine.inspectedStore;
  const inspectedAmenity = engine.inspectedAmenity;
  const inspectedUnit = engine.hoveredUnit || (inspected ? inspected.unit : null);

  const handleSelectTenant = (t: TenantDefinition) => {
    initAudio();
    if (engine.selectedTenant?.id === t.id) {
      engine.selectedTenant = null;
    } else {
      engine.selectedTenant = t;
      engine.architectMode = 'select';
      engine.inspectedStore = null;
      engine.inspectedAmenity = null;
      playBeep(520, 'sine', 0.08, 0.06);
    }
    onUpdate();
  };

  const handleSelectAmenity = (amen: AmenityDefinition) => {
    initAudio();
    if (engine.selectedAmenity?.type === amen.type) {
      engine.selectedAmenity = null;
      engine.architectMode = 'select';
    } else {
      engine.selectedAmenity = amen;
      engine.architectMode = 'place_amenity';
      engine.selectedTenant = null;
      engine.inspectedStore = null;
      engine.inspectedAmenity = null;
      playBeep(580, 'sine', 0.08, 0.06);
    }
    onUpdate();
  };

  const handleStartCustomZoning = (w = customW, h = customH, name = customName) => {
    initAudio();
    const cost = Math.round(w * h * 30);
    engine.customLotConfig = {
      w,
      h,
      cost,
      name: name || `Zoned ${w}×${h} Lot`
    };
    engine.architectMode = 'zone';
    engine.selectedTenant = null;
    engine.selectedAmenity = null;
    playPlaceSound();
    onUpdate();
  };

  const handlePlaceInUnit = (unit: MallUnit) => {
    if (!engine.selectedTenant) return;
    engine.placeTenant(engine.selectedTenant, unit);
    onUpdate();
  };

  const handleUpgrade = () => {
    initAudio();
    engine.upgradeInspectedStore();
    onUpdate();
  };

  const handleEvict = () => {
    initAudio();
    engine.evictInspectedStore();
    onUpdate();
  };

  const handleCleanMall = () => {
    initAudio();
    engine.performMallAction('clean');
    onUpdate();
  };

  const handleSecurityMall = () => {
    initAudio();
    engine.performMallAction('security');
    onUpdate();
  };

  const handleLaunchMarketing = () => {
    initAudio();
    engine.performMallAction('campaign');
    onUpdate();
  };

  // Seating statistics calculation for currently inspected store
  const totalSeats = inspected
    ? inspected.interior.tables.reduce((acc, tbl) => acc + tbl.seats.length, 0)
    : 0;
  const occupiedSeats = inspected
    ? inspected.interior.tables.reduce(
        (acc, tbl) => acc + tbl.seats.filter((s) => s.occupiedBy !== null).length,
        0
      )
    : 0;

  const nextUpgradeTier = inspected
    ? inspected.tenant.upgrades.find((u) => u.tier === inspected.level + 1)
    : null;

  const zoningCost = Math.round(customW * customH * 30);

  const hallwayStyles: Array<{ id: HallwayStyle; name: string; cost: number; desc: string; icon: string }> = [
    { id: 'marble_carrara', name: 'Carrara Marble', cost: 15, desc: 'Luxury polished tile with gold vein inlays', icon: '🏛️' },
    { id: 'terrazzo_mosaic', name: 'Terrazzo Mosaic', cost: 20, desc: 'Venetian composite stone with brass dividers', icon: '🎨' },
    { id: 'granite_dark', name: 'Nero Marquina Granite', cost: 25, desc: 'High-contrast black stone for luxury wing', icon: '🖤' },
    { id: 'chevron_wood', name: 'French Chevron Wood', cost: 22, desc: 'Warm engineered oak parquet herringbone', icon: '🪵' },
    { id: 'outdoor_stone', name: 'Terracotta Pavers', cost: 18, desc: 'Santana Row style outdoor promenade flagstone', icon: '☀️' },
    { id: 'glass_atrium', name: 'Skylight Glass Grid', cost: 35, desc: 'Translucent architectural glass concourse', icon: '💎' }
  ];

  return (
    <aside
      className={`w-full flex flex-col h-full max-h-[740px] overflow-hidden transition-colors ${
        isLight
          ? 'bg-slate-50/80 text-slate-800'
          : isCyber
          ? 'bg-[#080d1a] text-cyan-50'
          : 'bg-[#0d131f] text-slate-100'
      }`}
    >
      {/* Segmented Tab Header */}
      <div className="p-3 pb-2">
        <div
          className={`flex p-1 rounded-xl border backdrop-blur-md gap-0.5 ${
            isLight
              ? 'bg-slate-200/70 border-slate-300/80'
              : isCyber
              ? 'bg-slate-950/90 border-cyan-900/60'
              : 'bg-slate-950/80 border-slate-800/80'
          }`}
        >
          <button
            onClick={() => setActiveTab('directory')}
            className={`flex-1 py-1.5 px-1 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'directory'
                ? isLight
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'bg-slate-800 text-cyan-300 shadow-sm border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Stores</span>
          </button>

          <button
            onClick={() => setActiveTab('architect')}
            className={`flex-1 py-1.5 px-1 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'architect'
                ? isLight
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'bg-amber-900/50 text-amber-300 shadow-sm border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Paintbrush className="w-3.5 h-3.5 text-amber-400" />
            <span>Architect</span>
          </button>

          <button
            onClick={() => setActiveTab('inspector')}
            className={`flex-1 py-1.5 px-1 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer relative ${
              activeTab === 'inspector'
                ? isLight
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'bg-slate-800 text-cyan-300 shadow-sm border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Inspect</span>
            {(inspected || inspectedAmenity) && (
              <span className="w-2 h-2 rounded-full bg-cyan-400 absolute top-1 right-1 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('health')}
            className={`flex-1 py-1.5 px-1 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'health'
                ? isLight
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'bg-slate-800 text-cyan-300 shadow-sm border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Ops</span>
          </button>

          <button
            onClick={() => setActiveTab('events')}
            className={`flex-1 py-1.5 px-1 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer relative ${
              activeTab === 'events'
                ? isLight
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'bg-slate-800 text-cyan-300 shadow-sm border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ScrollText className="w-3.5 h-3.5" />
            <span>Feed</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3.5">
        {/* ================= STORE LEASING CATALOG TAB ================= */}
        {activeTab === 'directory' && (
          <div className="space-y-3">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCat(cat)}
                  className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
                    selectedCat === cat
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                      : isLight
                      ? 'bg-slate-200/80 text-slate-600 hover:bg-slate-300'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Tenant Cards */}
            <div className="space-y-2">
              {filteredTenants.map((t) => {
                const isSelected = engine.selectedTenant?.id === t.id;
                const canAfford = engine.stats.cash >= t.cost;

                return (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTenant(t)}
                    className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-950/40 shadow-md ring-1 ring-cyan-400/50'
                        : isLight
                        ? 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-md text-white font-black shrink-0"
                        style={{ backgroundColor: t.color }}
                      >
                        {t.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold truncate">{t.name}</h4>
                          <span
                            className={`text-xs font-mono font-bold ${
                              canAfford ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            ${t.cost.toLocaleString()}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                          {t.itemDescription}
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-1.5 border-t border-slate-800">
                          <span className="text-amber-300 font-medium">Draw: +{t.draw} pts</span>
                          <span className="font-mono text-cyan-300 font-semibold">{t.w}×{t.h} footprint</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* If tenant selected: Quick Available Lot Picker */}
            {engine.selectedTenant && (
              <div
                className={`p-3 rounded-xl border space-y-2 ${
                  isLight
                    ? 'bg-cyan-50 border-cyan-200 text-cyan-950'
                    : 'bg-cyan-950/30 border-cyan-800/80 text-cyan-200'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>SELECT A COMPATIBLE LOT ON MAP</span>
                  <span className="font-mono text-[11px]">
                    Size: {engine.selectedTenant.w}×{engine.selectedTenant.h}
                  </span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {engine.units
                    .filter((u) => engine.canFitTenant(engine.selectedTenant!, u) && !engine.stores.some(s => s.unit === u))
                    .map((u, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-2.5 rounded-lg border text-xs ${
                          isLight
                            ? 'bg-white border-slate-200'
                            : 'bg-slate-900/90 border-slate-800'
                        }`}
                      >
                        <div>
                          <strong className="block text-[11px] font-semibold">{u[0]}</strong>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Lot #{engine.units.indexOf(u) + 1} ({u[3]}×{u[4]} tiles)
                          </span>
                        </div>
                        <button
                          onClick={() => handlePlaceInUnit(u)}
                          className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg text-[11px] font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1 active:scale-95"
                        >
                          LEASE LOT
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= ARCHITECT & MALL CUSTOMIZER TAB ================= */}
        {activeTab === 'architect' && (
          <div className="space-y-3.5">
            {/* 1. HALLWAY & CONCOURSE PAINTER */}
            <div
              className={`p-3.5 rounded-xl border space-y-3 ${
                isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Paintbrush className="w-4 h-4" /> Hallway Flooring & Walkways
                </span>
                <span className="font-mono text-[11px] text-cyan-300">
                  {engine.customHallways.length} Paved
                </span>
              </div>

              <p className="text-xs text-slate-400">
                Design custom concourses and connect new corridors. Shoppers automatically route through painted hallways!
              </p>

              {/* Style Palette */}
              <div className="grid grid-cols-2 gap-2">
                {hallwayStyles.map((style) => {
                  const isSelected = engine.activeHallwayStyle === style.id && engine.architectMode === 'paint_hallway';
                  return (
                    <button
                      key={style.id}
                      onClick={() => {
                        initAudio();
                        engine.activeHallwayStyle = style.id;
                        engine.architectMode = 'paint_hallway';
                        engine.selectedTenant = null;
                        engine.selectedAmenity = null;
                        onUpdate();
                      }}
                      className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-amber-400 bg-amber-950/40 shadow-sm ring-1 ring-amber-400/50'
                          : isLight
                          ? 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold truncate">{style.icon} {style.name}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                        <span>${style.cost}/tile</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => {
                  initAudio();
                  engine.architectMode = 'paint_hallway';
                  engine.selectedTenant = null;
                  engine.selectedAmenity = null;
                  onUpdate();
                }}
                className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                  engine.architectMode === 'paint_hallway'
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                <Paintbrush className="w-4 h-4" />
                {engine.architectMode === 'paint_hallway'
                  ? `Painting: ${engine.activeHallwayStyle.replace('_', ' ')}`
                  : 'Equip Hallway Brush'}
              </button>
            </div>

            {/* 2. WALLS, RAILINGS & BARRIERS */}
            <div
              className={`p-3.5 rounded-xl border space-y-3 ${
                isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Layers className="w-4 h-4" /> Walls & Railings
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'glass_railing' as const, name: 'Glass Railing', cost: 30, icon: '🪟' },
                  { id: 'planter_wall' as const, name: 'Planter Wall', cost: 45, icon: '🌿' },
                  { id: 'pillar' as const, name: 'Marble Pillar', cost: 60, icon: '🏛️' }
                ].map((w) => {
                  const isSelected = engine.activeWallType === w.id && engine.architectMode === 'build_wall';
                  return (
                    <button
                      key={w.id}
                      onClick={() => {
                        initAudio();
                        engine.activeWallType = w.id;
                        engine.architectMode = 'build_wall';
                        engine.selectedTenant = null;
                        engine.selectedAmenity = null;
                        onUpdate();
                      }}
                      className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-emerald-400 bg-emerald-950/40 shadow-sm ring-1 ring-emerald-400/50'
                          : isLight
                          ? 'bg-slate-50 border-slate-200'
                          : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <span className="block text-xs font-bold">{w.icon} {w.name}</span>
                      <span className="text-[10px] text-slate-400">${w.cost}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. VERTICAL TRANSIT (ESCALATORS & ELEVATORS) */}
            <div
              className={`p-3.5 rounded-xl border space-y-3 ${
                isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <ArrowUpDown className="w-4 h-4" /> Escalators & Elevators
                </span>
                <span className="font-mono text-[11px] text-slate-400">
                  {engine.escalators.length} Active
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    initAudio();
                    engine.activeEscalatorType = 'escalator_glass';
                    engine.architectMode = 'place_escalator';
                    engine.selectedTenant = null;
                    engine.selectedAmenity = null;
                    onUpdate();
                  }}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    engine.activeEscalatorType === 'escalator_glass' && engine.architectMode === 'place_escalator'
                      ? 'border-blue-400 bg-blue-950/40'
                      : isLight
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="text-xs font-bold">⚡ Glass Escalator</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">$850 · +5 Rep</div>
                </button>

                <button
                  onClick={() => {
                    initAudio();
                    engine.activeEscalatorType = 'elevator_panoramic';
                    engine.architectMode = 'place_escalator';
                    engine.selectedTenant = null;
                    engine.selectedAmenity = null;
                    onUpdate();
                  }}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    engine.activeEscalatorType === 'elevator_panoramic' && engine.architectMode === 'place_escalator'
                      ? 'border-blue-400 bg-blue-950/40'
                      : isLight
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="text-xs font-bold">🛗 Glass Elevator</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">$1,400 · +8 Rep</div>
                </button>
              </div>
            </div>

            {/* 4. CUSTOM LOT ZONING ENGINE */}
            <div
              className={`p-3.5 rounded-xl border space-y-3 ${
                isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Grid className="w-4 h-4" /> Zone Custom Commercial Lot
                </span>
                <span className="font-mono text-xs font-bold text-emerald-400">
                  ${zoningCost}
                </span>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {[
                  { name: 'Boutique', w: 4, h: 4 },
                  { name: 'Standard', w: 6, h: 5 },
                  { name: 'Flagship', w: 8, h: 6 },
                  { name: 'Anchor/Cinema', w: 12, h: 8 }
                ].map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      setCustomW(preset.w);
                      setCustomH(preset.h);
                      setCustomName(`${preset.name} Commercial Unit`);
                      handleStartCustomZoning(preset.w, preset.h, `${preset.name} Commercial Unit`);
                    }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap cursor-pointer transition-all ${
                      customW === preset.w && customH === preset.h
                        ? 'bg-teal-600 text-white font-bold'
                        : isLight
                        ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {preset.name} ({preset.w}×{preset.h})
                  </button>
                ))}
              </div>

              {/* Dimension Sliders */}
              <div className="space-y-2 pt-1">
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Lot Width:</span>
                    <span className="font-mono text-teal-300 font-bold">{customW} tiles ({(customW * 32)}px)</span>
                  </div>
                  <input
                    type="range"
                    min={4}
                    max={16}
                    value={customW}
                    onChange={(e) => setCustomW(Number(e.target.value))}
                    className="w-full accent-teal-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Lot Depth (Height):</span>
                    <span className="font-mono text-teal-300 font-bold">{customH} tiles ({(customH * 32)}px)</span>
                  </div>
                  <input
                    type="range"
                    min={4}
                    max={12}
                    value={customH}
                    onChange={(e) => setCustomH(Number(e.target.value))}
                    className="w-full accent-teal-400 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Lot Zone Label:</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-teal-400"
                    placeholder="e.g. North Promenade Boutique"
                  />
                </div>
              </div>

              <button
                onClick={() => handleStartCustomZoning()}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer"
              >
                <Grid className="w-4 h-4" />
                Activate {customW}×{customH} Zoning Brush (${zoningCost})
              </button>
            </div>

            {/* 5. CONCOURSE AMENITIES CATALOG */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Concourse Amenities & Kiosks
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {engine.amenities.length} Placed
                </span>
              </div>

              <div className="space-y-2">
                {AMENITIES_CATALOG.map((amen) => {
                  const isSelected = engine.selectedAmenity?.type === amen.type;
                  const canAfford = engine.stats.cash >= amen.cost;

                  return (
                    <button
                      key={amen.type}
                      onClick={() => handleSelectAmenity(amen)}
                      className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-indigo-400 bg-indigo-950/40 shadow-md ring-1 ring-indigo-400/50'
                          : isLight
                          ? 'bg-white border-slate-200 hover:border-slate-300'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-lg shrink-0">
                          {amen.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold truncate">{amen.name}</h4>
                            <span className={`text-xs font-mono font-bold ${canAfford ? 'text-indigo-300' : 'text-rose-400'}`}>
                              ${amen.cost}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                            {amen.description}
                          </p>
                          <div className="flex items-center justify-between text-[9.5px] text-slate-400 mt-1.5 pt-1 border-t border-slate-800">
                            <span className="text-amber-300 font-medium">+{amen.reputationBonus}% Draw</span>
                            <span className="font-mono text-cyan-300">{amen.w}×{amen.h} footprint</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 6. DEMOLISH & RECLAIM SPACE */}
            <div
              className={`p-3 rounded-xl border space-y-2 ${
                isLight ? 'bg-rose-50 border-rose-200' : 'bg-rose-950/20 border-rose-900/40'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-rose-300">
                <span className="flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5" /> Floor Space Reclaim
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Demolish vacant lots, custom hallways, walls, or amenities to remodel your mall floorplan with cash refund.
              </p>
              <button
                onClick={() => {
                  engine.architectMode = 'demolish';
                  engine.selectedTenant = null;
                  engine.selectedAmenity = null;
                  onUpdate();
                }}
                className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  engine.architectMode === 'demolish'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 border border-rose-800'
                }`}
              >
                {engine.architectMode === 'demolish' ? 'Demolish Tool Active (Click Map)' : 'Equip Demolition Tool'}
              </button>
            </div>
          </div>
        )}

        {/* ================= INSPECTOR TAB ================= */}
        {activeTab === 'inspector' && (
          <div>
            {inspectedAmenity ? (
              <div className="space-y-3.5">
                <div
                  className={`p-3.5 rounded-xl border space-y-2.5 ${
                    isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/80 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-800 flex items-center justify-center text-2xl shadow-md">
                      {inspectedAmenity.icon}
                    </div>
                    <div>
                      <h2 className="text-sm font-bold m-0 leading-tight">
                        {inspectedAmenity.name}
                      </h2>
                      <div className="text-[11px] text-indigo-400 font-semibold mt-0.5">
                        Concourse Amenity Facility
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
                      <span className="text-slate-400 block text-[10px]">Total Visitors</span>
                      <span className="font-bold text-cyan-300 text-sm">{inspectedAmenity.useCount}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
                      <span className="text-slate-400 block text-[10px]">Net Earnings</span>
                      <span className="font-bold text-emerald-400 text-sm">+${inspectedAmenity.earnings}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      engine.demolishAt(inspectedAmenity.x, inspectedAmenity.y);
                      onUpdate();
                    }}
                    className="w-full mt-2 py-2 px-3 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove Amenity (+$150 Refund)
                  </button>
                </div>
              </div>
            ) : inspected ? (
              <div className="space-y-3.5">
                {/* Store Header Card */}
                <div
                  className={`p-3.5 rounded-xl border space-y-2.5 ${
                    isLight
                      ? 'bg-white border-slate-200 shadow-sm'
                      : 'bg-slate-900/80 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-md text-white font-black"
                        style={{ backgroundColor: inspected.tenant.color }}
                      >
                        {inspected.tenant.icon}
                      </div>
                      <div>
                        <h2 className="text-sm font-bold m-0 leading-tight">
                          {inspected.tenant.name}
                        </h2>
                        <div className="text-[11px] text-cyan-400 font-semibold flex items-center gap-1.5 mt-0.5">
                          <span>Tier {inspected.level} {inspected.tenant.cat} Store</span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-1 rounded-md text-[10px] font-mono border font-semibold ${
                        isLight
                          ? 'bg-slate-100 border-slate-200 text-slate-700'
                          : 'bg-slate-950 border-slate-800 text-amber-300'
                      }`}
                    >
                      {inspected.unit[0]}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed pt-0.5">
                    {inspected.tenant.itemDescription}
                  </p>

                  <div className="pt-2 border-t border-slate-800 flex items-center gap-2 text-xs">
                    <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-amber-300 font-medium text-[11px]">
                      Top Seller: {inspected.tenant.signatureItem}
                    </span>
                  </div>
                </div>

                {/* SHOWPLACE ICON CINEMA DETAILS */}
                {inspected.tenant.id === 'cinema' && inspected.cinemaState && (
                  <div
                    className={`p-3.5 rounded-xl border space-y-2.5 ${
                      isLight
                        ? 'bg-sky-50/80 border-sky-200'
                        : 'bg-sky-950/40 border-sky-800/80 shadow-lg'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
                        <Clapperboard className="w-4 h-4 text-amber-400" />
                        <span>NOW SHOWING: {inspected.cinemaState.currentMovie}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-sky-900/60 border border-sky-700 text-[10px] font-mono text-sky-200">
                        {inspected.cinemaState.genre}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Auditorium Phase:</span>
                        <span className="font-bold text-amber-300 uppercase">
                          {inspected.cinemaState.phase.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Box Office Admission:</span>
                        <span className="font-bold text-emerald-400">${inspected.cinemaState.ticketPrice}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Auditorium Tickets Sold:</span>
                        <span className="font-mono text-cyan-300 font-bold">
                          {inspected.cinemaState.ticketsSold} / {inspected.cinemaState.auditoriumCapacity} seats
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Real-time Metrics Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div
                    className={`p-3 rounded-xl border ${
                      isLight
                        ? 'bg-white border-slate-200'
                        : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                      <Users className="w-3.5 h-3.5 text-cyan-400" />
                      Queue Length
                    </div>
                    <div className="text-base font-bold mt-1">
                      {inspected.currentQueue.length}{' '}
                      <span className="text-xs font-normal text-slate-400">in line</span>
                    </div>
                  </div>

                  <div
                    className={`p-3 rounded-xl border ${
                      isLight
                        ? 'bg-white border-slate-200'
                        : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                      <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400" />
                      Tables & Seats
                    </div>
                    <div className="text-base font-bold mt-1">
                      {occupiedSeats} / {totalSeats}{' '}
                      <span className="text-xs font-normal text-slate-400">active</span>
                    </div>
                  </div>

                  <div
                    className={`p-3 rounded-xl border ${
                      isLight
                        ? 'bg-white border-slate-200'
                        : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                      <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                      Staff Count
                    </div>
                    <div className="text-base font-bold mt-1">
                      {inspected.staffCount}{' '}
                      <span className="text-xs font-normal text-slate-400">on floor</span>
                    </div>
                  </div>

                  <div
                    className={`p-3 rounded-xl border ${
                      isLight
                        ? 'bg-white border-slate-200'
                        : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                      <BadgePercent className="w-3.5 h-3.5 text-emerald-400" />
                      Total Sales
                    </div>
                    <div className="text-base font-bold text-emerald-400 mt-1">
                      ${Math.round(inspected.totalRevenue).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Upgrades & Renovation Tree */}
                <div
                  className={`p-3.5 rounded-xl border space-y-2.5 ${
                    isLight
                      ? 'bg-white border-slate-200'
                      : 'bg-slate-900/80 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 tracking-wider">
                      STORE UPGRADE PATH (TIER {inspected.level}/3)
                    </span>
                  </div>

                  {nextUpgradeTier ? (
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-slate-200">
                        Next: {nextUpgradeTier.name}
                      </div>
                      <div className="space-y-1">
                        {nextUpgradeTier.features.map((f, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-400">
                            <CheckCircle2 className="w-3 h-3 text-cyan-400 shrink-0" />
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={handleUpgrade}
                        className="w-full mt-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer"
                      >
                        <ArrowUpCircle className="w-4 h-4" />
                        Upgrade to Tier {nextUpgradeTier.tier} (${nextUpgradeTier.cost.toLocaleString()})
                      </button>
                    </div>
                  ) : (
                    <div className="py-2.5 text-center text-xs font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 rounded-xl">
                      ✓ Maximum Tier 3 Flagship Storefront
                    </div>
                  )}
                </div>

                {/* Evict Action */}
                <button
                  onClick={handleEvict}
                  className="w-full py-2 px-3 rounded-xl bg-rose-950/20 hover:bg-rose-950/40 text-rose-300 border border-rose-900/40 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Evict Storefront (Release Lot Lease)
                </button>
              </div>
            ) : inspectedUnit && !engine.stores.some((s) => s.unit === inspectedUnit) ? (
              /* CUSTOMIZE VACANT LOT */
              <div className="space-y-3.5">
                <div
                  className={`p-3.5 rounded-xl border space-y-3 ${
                    isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/80 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Grid className="w-4 h-4" /> Vacant Commercial Lot
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {inspectedUnit[3]}×{inspectedUnit[4]} tiles
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-100">{inspectedUnit[0]}</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      This lot is available for lease or custom dimensional remodeling.
                    </p>
                  </div>

                  <div className="space-y-2 pt-1">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Lot Name:</label>
                      <input
                        type="text"
                        defaultValue={inspectedUnit[0]}
                        onChange={(e) => setEditLotName(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Width ({inspectedUnit[3]}):</label>
                        <input
                          type="number"
                          min={4}
                          max={16}
                          defaultValue={inspectedUnit[3]}
                          onChange={(e) => setEditLotW(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Depth ({inspectedUnit[4]}):</label>
                        <input
                          type="number"
                          min={4}
                          max={12}
                          defaultValue={inspectedUnit[4]}
                          onChange={(e) => setEditLotH(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1 flex items-center gap-1">
                        <Compass className="w-3 h-3" /> Doorway Concourse Direction:
                      </label>
                      <div className="grid grid-cols-4 gap-1">
                        {(['south', 'north', 'east', 'west'] as const).map((dir) => (
                          <button
                            key={dir}
                            onClick={() => setEditDoorDir(dir)}
                            className={`py-1 rounded text-[11px] font-semibold uppercase cursor-pointer ${
                              editDoorDir === dir
                                ? 'bg-cyan-600 text-white'
                                : 'bg-slate-950 text-slate-400 border border-slate-800'
                            }`}
                          >
                            {dir}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      engine.customizeUnit(
                        inspectedUnit,
                        editLotName || inspectedUnit[0],
                        editLotW || inspectedUnit[3],
                        editLotH || inspectedUnit[4],
                        editDoorDir
                      );
                      onUpdate();
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold text-xs cursor-pointer shadow-sm"
                  >
                    Apply Lot Dimensions & Doorway
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('directory');
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs cursor-pointer shadow-sm"
                  >
                    Browse Directory to Lease Tenant
                  </button>

                  <button
                    onClick={() => {
                      engine.demolishAt(inspectedUnit[1] * 32 + 10, inspectedUnit[2] * 32 + 10);
                      onUpdate();
                    }}
                    className="w-full py-1.5 px-3 rounded-lg bg-rose-950/40 text-rose-300 border border-rose-800 text-xs font-semibold hover:bg-rose-900/60 cursor-pointer"
                  >
                    Demolish Lot (Reclaim Space)
                  </button>
                </div>
              </div>
            ) : (
              <div
                className={`p-8 text-center rounded-xl border space-y-2.5 ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-600'
                    : 'bg-slate-900/40 border-slate-800 text-slate-400'
                }`}
              >
                <Store className="w-8 h-8 mx-auto text-slate-500" />
                <h3 className="text-sm font-bold">No Store or Lot Selected</h3>
                <p className="text-xs">
                  Click any store, cinema, concourse amenity, or vacant lot on the map to inspect live operations, movie showtimes, or customize lot footprints.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ================= HEALTH & OPERATIONS TAB ================= */}
        {activeTab === 'health' && (
          <div className="space-y-3.5">
            <div
              className={`p-3.5 rounded-xl border space-y-3 ${
                isLight
                  ? 'bg-white border-slate-200'
                  : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Operational Quality Ratings
              </h3>

              <div className="space-y-2.5">
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1 font-medium">
                    <span>REPUTATION & DRAW</span>
                    <span className="text-cyan-400 font-bold">{Math.round(engine.stats.reputation)}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-cyan-400 transition-all duration-300"
                      style={{ width: `${engine.stats.reputation}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1 font-medium">
                    <span>CONCOURSE CLEANLINESS</span>
                    <span className="text-emerald-400 font-bold">{Math.round(engine.stats.cleanliness)}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 transition-all duration-300"
                      style={{ width: `${engine.stats.cleanliness}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1 font-medium">
                    <span>SECURITY & SAFETY</span>
                    <span className="text-amber-400 font-bold">{Math.round(engine.stats.security)}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-amber-400 transition-all duration-300"
                      style={{ width: `${engine.stats.security}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Operations Boosters */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Galleria Management Actions
              </h3>

              <button
                onClick={handleCleanMall}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  isLight
                    ? 'bg-white border-slate-200 hover:bg-slate-50 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 hover:bg-slate-850 hover:border-slate-700'
                }`}
              >
                <div>
                  <h4 className="text-xs font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    Dispatch Sanitation Crew
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Deep floor buffing across all wings (+25% Cleanliness)
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-rose-400">-$250</span>
              </button>

              <button
                onClick={handleSecurityMall}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  isLight
                    ? 'bg-white border-slate-200 hover:bg-slate-50 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 hover:bg-slate-850 hover:border-slate-700'
                }`}
              >
                <div>
                  <h4 className="text-xs font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    Deploy Concourse Security
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Patrol corridors & outdoor promenade (+20% Security)
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-rose-400">-$350</span>
              </button>

              <button
                onClick={handleLaunchMarketing}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  isLight
                    ? 'bg-white border-slate-200 hover:bg-slate-50 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 hover:bg-slate-850 hover:border-slate-700'
                }`}
              >
                <div>
                  <h4 className="text-xs font-bold flex items-center gap-1.5">
                    <Sparkle className="w-3.5 h-3.5 text-cyan-400" />
                    Launch Regional Ad Blitz
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Billboards & social media surge (+8% Rep, +14 Shoppers)
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-rose-400">-$600</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= EVENTS & AUDIT LOG TAB ================= */}
        {activeTab === 'events' && (
          <div className="space-y-2">
            {engine.events.map((ev) => (
              <div
                key={ev.id}
                className={`p-3 rounded-xl border text-xs space-y-1 ${
                  ev.type === 'finance'
                    ? isLight
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
                    : ev.type === 'warning'
                    ? isLight
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : 'bg-rose-950/30 border-rose-800/60 text-rose-200'
                    : ev.type === 'success'
                    ? isLight
                      ? 'bg-cyan-50 border-cyan-200 text-cyan-900'
                      : 'bg-cyan-950/30 border-cyan-800/60 text-cyan-200'
                    : isLight
                    ? 'bg-white border-slate-200'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span>{ev.title}</span>
                  <span className="text-[10px] font-mono opacity-60">{ev.timeStr}</span>
                </div>
                <p className="text-[11px] opacity-80 leading-relaxed">{ev.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};
