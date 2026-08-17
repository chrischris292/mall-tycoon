import React, { useEffect, useState } from 'react';
import { Check, ChevronDown, DollarSign, DoorOpen, Grid3X3, MoreHorizontal, MousePointer2, Redo2, Save, Trash2, Undo2, Upload, Waypoints } from 'lucide-react';
import { MallSimulationEngine } from '../game/engine';
import { MALL_TEMPLATES, MallTemplateId } from '../game/blueprint';

interface BlueprintDockProps {
  engine: MallSimulationEngine;
  onUpdate: () => void;
}

export const BlueprintDock: React.FC<BlueprintDockProps> = ({ engine, onUpdate }) => {
  const [showTemplates, setShowTemplates] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [name, setName] = useState(engine.design.name);
  const [spaceName, setSpaceName] = useState('');
  const [spaceW, setSpaceW] = useState(6);
  const [spaceH, setSpaceH] = useState(5);
  const [spaceX, setSpaceX] = useState(10);
  const [spaceY, setSpaceY] = useState(10);
  const [door, setDoor] = useState<'north' | 'south' | 'east' | 'west'>('south');
  const selected = engine.selectedUnit;

  useEffect(() => {
    if (!selected) return;
    setSpaceName(selected[0]);
    setSpaceW(selected[3]);
    setSpaceH(selected[4]);
    setSpaceX(selected[1]);
    setSpaceY(selected[2]);
  }, [selected]);

  const chooseTool = (tool: 'select' | 'paint_hallway' | 'zone' | 'place_entrance') => {
    engine.architectMode = tool;
    engine.selectedTenant = null;
    engine.selectedAmenity = null;
    onUpdate();
  };

  const applyTemplate = (id: MallTemplateId) => {
    engine.applyTemplate(id);
    setName(engine.design.name);
    setShowTemplates(false);
    onUpdate();
  };

  return (
    <div className="relative z-40 w-full mb-2 rounded-2xl border border-cyan-500/30 bg-slate-950/95 shadow-2xl overflow-visible">
      <div className="flex flex-wrap items-center gap-2 p-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2 mr-auto min-w-0">
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-cyan-500 text-slate-950 font-black">B</span>
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-400">Blueprint mode</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => engine.renameMall(name)}
              className="w-44 sm:w-64 bg-transparent text-sm font-bold text-white outline-none border-b border-transparent focus:border-cyan-500"
              aria-label="Mall name"
            />
          </div>
        </div>

        <div className="hidden sm:flex h-10 px-3 rounded-xl bg-slate-900 border border-slate-800 items-center gap-2">
          <DollarSign className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-bold text-amber-300">{Math.round(engine.stats.cash).toLocaleString()}</span>
        </div>

        <div className="relative">
          <button onClick={() => setShowTemplates((v) => !v)} className="min-h-11 px-3 rounded-xl border border-slate-700 bg-slate-900 text-xs font-semibold flex items-center gap-2">
            Choose mall <ChevronDown className="w-4 h-4" />
          </button>
          {showTemplates && (
            <div className="absolute z-50 right-0 top-12 w-72 p-2 rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl">
              {MALL_TEMPLATES.map((template) => (
                <button key={template.id} onClick={() => applyTemplate(template.id)} className="w-full min-h-14 p-2.5 rounded-xl flex items-center gap-3 text-left hover:bg-slate-900">
                  <span className="grid place-items-center w-10 h-10 rounded-xl bg-slate-800 text-cyan-300 text-sm font-black">{template.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-xs font-bold text-white">{template.name}<span className="text-[8px] tracking-wider text-slate-500">{template.scale}</span></span>
                    <span className="block text-[10px] text-slate-400">{template.subtitle}</span>
                  </span>
                  {engine.design.templateId === template.id && <Check className="w-4 h-4 text-emerald-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <button onClick={() => { engine.undoBlueprint(); onUpdate(); }} disabled={!engine.blueprintHistory.length} className="min-w-11 min-h-11 grid place-items-center rounded-xl bg-slate-900 disabled:opacity-30" aria-label="Undo"><Undo2 className="w-4 h-4" /></button>
        <button onClick={() => { engine.redoBlueprint(); onUpdate(); }} disabled={!engine.blueprintFuture.length} className="min-w-11 min-h-11 grid place-items-center rounded-xl bg-slate-900 disabled:opacity-30" aria-label="Redo"><Redo2 className="w-4 h-4" /></button>
        <div className="relative">
          <button onClick={() => setShowMore((open) => !open)} className="min-w-11 min-h-11 grid place-items-center rounded-xl bg-slate-900" aria-label="More blueprint actions"><MoreHorizontal className="w-5 h-5" /></button>
          {showMore && <div className="absolute z-50 right-0 top-12 w-44 p-1.5 rounded-xl bg-slate-950 border border-slate-700 shadow-2xl">
            <button onClick={() => { engine.saveDesignToDevice(); setShowMore(false); }} className="w-full h-10 px-3 rounded-lg flex items-center gap-2 text-xs hover:bg-slate-900"><Save className="w-4 h-4" /> Save mall</button>
            <button onClick={() => { engine.loadDesignFromDevice(); setName(engine.design.name); setShowMore(false); onUpdate(); }} className="w-full h-10 px-3 rounded-lg flex items-center gap-2 text-xs hover:bg-slate-900"><Upload className="w-4 h-4" /> Load saved mall</button>
          </div>}
        </div>
        <button onClick={() => { engine.setBlueprintMode(false); onUpdate(); }} className="min-h-11 px-4 rounded-xl bg-emerald-500 text-slate-950 text-xs font-black flex items-center gap-2"><Check className="w-4 h-4" /> Run mall</button>
      </div>

      <div className="flex gap-2 p-2 overflow-x-auto">
        {[
          { id: 'select' as const, label: 'Edit', hint: 'Select a space', icon: MousePointer2 },
          { id: 'paint_hallway' as const, label: 'Corridor', hint: 'Draw circulation', icon: Waypoints },
          { id: 'zone' as const, label: 'Store space', hint: 'Draw a footprint', icon: Grid3X3 }
          ,{ id: 'place_entrance' as const, label: 'Entrance', hint: 'Place on a corridor edge', icon: DoorOpen }
        ].map((tool) => {
          const Icon = tool.icon;
          const active = engine.architectMode === tool.id;
          return (
            <button key={tool.id} onClick={() => chooseTool(tool.id)} className={`min-w-[142px] min-h-14 px-3 rounded-xl border flex items-center gap-2 text-left ${active ? 'bg-cyan-500 border-cyan-300 text-slate-950' : 'bg-slate-900 border-slate-800 text-slate-200'}`}>
              <Icon className="w-5 h-5 shrink-0" />
              <span><span className="block text-xs font-black">{tool.label}</span><span className={`block text-[10px] ${active ? 'text-slate-800' : 'text-slate-500'}`}>{tool.hint}</span></span>
            </button>
          );
        })}
        <div className="min-w-[150px] min-h-14 px-3 rounded-xl border border-slate-800 bg-slate-900 flex items-center justify-between">
          <div><div className="text-xs font-bold">Level 1</div><div className="text-[10px] text-slate-500">Floor system ready</div></div>
          <span className="px-2 py-1 rounded-md bg-slate-800 text-[10px] text-slate-400">L1</span>
        </div>
      </div>
      {selected && !engine.stores.some((store) => store.unit === selected) && (
        <div className="m-2 mt-0 p-2.5 rounded-xl border border-teal-500/30 bg-teal-950/20 flex flex-wrap items-end gap-2">
          <div className="mr-auto min-w-[180px]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-teal-300">Selected store space</div>
            <input value={spaceName} onChange={(e) => setSpaceName(e.target.value)} className="mt-1 w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-xs font-bold" aria-label="Space name" />
          </div>
          <label className="text-[10px] text-slate-400">X<input type="number" min={1} max={78} value={spaceX} onChange={(e) => setSpaceX(Number(e.target.value))} className="block mt-1 w-16 h-10 px-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white" /></label>
          <label className="text-[10px] text-slate-400">Y<input type="number" min={1} max={46} value={spaceY} onChange={(e) => setSpaceY(Number(e.target.value))} className="block mt-1 w-16 h-10 px-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white" /></label>
          <label className="text-[10px] text-slate-400">Width<input type="number" min={3} max={20} value={spaceW} onChange={(e) => setSpaceW(Number(e.target.value))} className="block mt-1 w-20 h-10 px-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white" /></label>
          <label className="text-[10px] text-slate-400">Depth<input type="number" min={3} max={16} value={spaceH} onChange={(e) => setSpaceH(Number(e.target.value))} className="block mt-1 w-20 h-10 px-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white" /></label>
          <div><div className="text-[10px] text-slate-400 mb-1">Entrance side</div><div className="flex gap-1">{(['north','east','south','west'] as const).map((side) => <button key={side} onClick={() => setDoor(side)} className={`min-w-10 h-10 rounded-lg text-[10px] font-bold uppercase ${door === side ? 'bg-cyan-500 text-slate-950' : 'bg-slate-900 text-slate-400'}`}>{side[0]}</button>)}</div></div>
          <button onClick={() => { engine.moveVacantUnit(selected, spaceX, spaceY); engine.customizeUnit(selected, spaceName, spaceW, spaceH, door); onUpdate(); }} className="h-10 px-4 rounded-lg bg-teal-500 text-slate-950 text-xs font-black">Apply</button>
          <button onClick={() => { engine.demolishAt(selected[1] * 32 + 2, selected[2] * 32 + 2); engine.selectedUnit = null; onUpdate(); }} className="w-10 h-10 grid place-items-center rounded-lg bg-rose-950 text-rose-300 border border-rose-800" aria-label="Delete selected space"><Trash2 className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  );
};
