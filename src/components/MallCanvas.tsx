import React, { useRef, useEffect, useState } from 'react';
import { MallSimulationEngine } from '../game/engine';
import { MallRenderer } from '../game/renderer';
import { CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE } from '../game/constants';
import { initAudio, playErrorSound, playBeep } from '../game/sound';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Move,
  MousePointer,
  Grid,
  Sparkles,
  Trash2,
  Paintbrush,
  Layers,
  ArrowUpDown,
  PencilRuler,
  DoorOpen
} from 'lucide-react';
import { ArchitectToolMode } from '../game/types';
import { BlueprintDock } from './BlueprintDock';

interface MallCanvasProps {
  engine: MallSimulationEngine;
  onStoreSelected: () => void;
}

export const MallCanvas: React.FC<MallCanvasProps> = ({ engine, onStoreSelected }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const minimapCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<MallRenderer | null>(null);

  // Viewport transformation: zoom and pan offsets (in canvas world coordinates)
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const hasDraggedRef = useRef(false);
  const [buildDrag, setBuildDrag] = useState<null | {
    startTileX: number; startTileY: number; endTileX: number; endTileY: number;
    startClientX: number; startClientY: number; endClientX: number; endClientY: number;
  }>(null);
  const [showBuildTools, setShowBuildTools] = useState(false);

  // Keep refs in sync for animation loop
  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  useEffect(() => {
    zoomRef.current = zoom;
    panRef.current = pan;
  }, [zoom, pan]);

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Retina / High-DPI scaling
    const dpr = Math.max(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(CANVAS_WIDTH * dpr);
    canvas.height = Math.round(CANVAS_HEIGHT * dpr);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    rendererRef.current = new MallRenderer(ctx);

    let animationFrameId: number;

    const renderLoop = () => {
      engine.tick();
      if (rendererRef.current) {
        rendererRef.current.render(
          engine.units,
          engine.stores,
          engine.amenities,
          engine.customHallways,
          engine.customWalls,
          engine.escalators,
          engine.entrances,
          engine.shoppers,
          engine.floatingFx,
          engine.selectedTenant,
          engine.selectedAmenity,
          engine.architectMode,
          engine.activeHallwayStyle,
          engine.activeWallType,
          engine.customLotConfig,
          engine.hoveredUnit,
          engine.hoveredTile,
          engine.inspectedStore,
          engine.inspectedAmenity,
          engine.blueprintMode,
          engine.design?.templateId ?? 'showcase'
        );
      }

      // Render Minimap Radar
      const miniCanvas = minimapCanvasRef.current;
      if (miniCanvas) {
        const mctx = miniCanvas.getContext('2d');
        if (mctx) {
          drawMinimap(mctx, engine, zoomRef.current, panRef.current);
        }
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [engine]);

  // Quick Zone Jumps (centers specified world coordinate)
  const jumpToZone = (targetWorldX: number, targetWorldY: number, targetZoom = 1.35) => {
    const container = containerRef.current;
    if (!container) return;
    const cw = container.clientWidth;
    const ch = container.clientHeight;

    const scale = (cw / CANVAS_WIDTH) * targetZoom;
    const px = -(targetWorldX * scale - cw / 2);
    const py = -(targetWorldY * scale - ch / 2);

    setZoom(targetZoom);
    setPan({ x: px, y: py });
  };

  const resetFitAll = () => {
    setZoom(0.85);
    setPan({ x: 0, y: 0 });
  };

  // Convert screen / client mouse event coordinates to Canvas World Coordinates
  const getCanvasWorldCoords = (clientX: number, clientY: number) => {
    const container = containerRef.current;
    if (!container) return { x: 0, y: 0 };
    const rect = container.getBoundingClientRect();

    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    const baseScale = container.clientWidth / CANVAS_WIDTH;
    const currentScale = baseScale * zoom;

    const worldX = (mouseX - pan.x) / currentScale;
    const worldY = (mouseY - pan.y) / currentScale;

    return { x: worldX, y: worldY };
  };

  // Mouse wheel zoom (centered at cursor)
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const newZoom = Math.min(2.4, Math.max(0.55, zoom * zoomFactor));

    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
    const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  // Mouse drag to pan
  const handleMouseDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.button !== 1) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    if (engine.blueprintMode && e.button === 0 && (engine.architectMode === 'paint_hallway' || engine.architectMode === 'zone')) {
      const world = getCanvasWorldCoords(e.clientX, e.clientY);
      const tileX = Math.floor(world.x / TILE_SIZE);
      const tileY = Math.floor(world.y / TILE_SIZE);
      hasDraggedRef.current = true;
      setBuildDrag({ startTileX: tileX, startTileY: tileY, endTileX: tileX, endTileY: tileY, startClientX: e.clientX, startClientY: e.clientY, endClientX: e.clientX, endClientY: e.clientY });
      return;
    }
    setIsDragging(true);
    hasDraggedRef.current = false;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y
    };
  };

  const handleMouseMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (buildDrag) {
      const world = getCanvasWorldCoords(e.clientX, e.clientY);
      setBuildDrag((drag) => drag ? { ...drag, endTileX: Math.floor(world.x / TILE_SIZE), endTileY: Math.floor(world.y / TILE_SIZE), endClientX: e.clientX, endClientY: e.clientY } : null);
    }
    if (isDragging && dragStartRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      if (Math.hypot(dx, dy) > 4) {
        hasDraggedRef.current = true;
      }
      setPan({
        x: dragStartRef.current.panX + dx,
        y: dragStartRef.current.panY + dy
      });
    }

    const { x: mx, y: my } = getCanvasWorldCoords(e.clientX, e.clientY);
    const unit = engine.getUnitAt(mx, my);
    engine.hoveredUnit = unit;

    const tileX = Math.floor(mx / TILE_SIZE);
    const tileY = Math.floor(my / TILE_SIZE);
    engine.hoveredTile = { x: tileX, y: tileY };
  };

  const handleMouseUp = () => {
    if (buildDrag) {
      if (engine.architectMode === 'paint_hallway') {
        engine.paintHallwayRect(buildDrag.startTileX, buildDrag.startTileY, buildDrag.endTileX, buildDrag.endTileY, engine.activeHallwayStyle);
      } else if (engine.architectMode === 'zone') {
        engine.createLotFromRect(buildDrag.startTileX, buildDrag.startTileY, buildDrag.endTileX, buildDrag.endTileY);
      }
      setBuildDrag(null);
      onStoreSelected();
      return;
    }
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    dragStartRef.current = null;
    setBuildDrag(null);
    engine.hoveredUnit = null;
    engine.hoveredTile = null;
  };

  // Click handler based on active Architect Tool Mode
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (hasDraggedRef.current) return;
    initAudio();

    const { x: mx, y: my } = getCanvasWorldCoords(e.clientX, e.clientY);
    const tileX = Math.floor(mx / TILE_SIZE);
    const tileY = Math.floor(my / TILE_SIZE);

    // Mode 1: PAINT HALLWAY
    if (engine.architectMode === 'paint_hallway') {
      engine.paintHallwayAt(tileX, tileY, engine.activeHallwayStyle);
      onStoreSelected();
      return;
    }

    // Mode 2: BUILD WALL / BARRIER
    if (engine.architectMode === 'build_wall') {
      engine.buildWallAt(tileX, tileY, engine.activeWallType);
      onStoreSelected();
      return;
    }

    // Mode 3: PLACE ESCALATOR / ELEVATOR
    if (engine.architectMode === 'place_escalator') {
      engine.placeEscalatorAt(tileX, tileY, engine.activeEscalatorType);
      onStoreSelected();
      return;
    }

    // Mode 4: ZONE CUSTOM LOT
    if (engine.architectMode === 'zone') {
      engine.createCustomLot(tileX, tileY, engine.customLotConfig.w, engine.customLotConfig.h, engine.customLotConfig.name);
      onStoreSelected();
      return;
    }

    if (engine.architectMode === 'place_entrance') {
      engine.placeEntranceAt(tileX, tileY);
      onStoreSelected();
      return;
    }

    // Mode 5: PLACE CONCOURSE AMENITY
    if (engine.architectMode === 'place_amenity' && engine.selectedAmenity) {
      engine.placeAmenityAt(engine.selectedAmenity, tileX, tileY);
      onStoreSelected();
      return;
    }

    // Mode 6: DEMOLISH / RECLAIM SPACE
    if (engine.architectMode === 'demolish') {
      engine.demolishAt(mx, my);
      onStoreSelected();
      return;
    }

    // Mode 7: SELECT / PLACE TENANT (Default)
    const clickedAmenity = engine.getAmenityAt(mx, my);
    if (clickedAmenity) {
      engine.inspectedAmenity = clickedAmenity;
      engine.inspectedStore = null;
      playBeep(560, 'sine', 0.06, 0.05);
      onStoreSelected();
      return;
    }

    const clickedUnit = engine.getUnitAt(mx, my);
    if (clickedUnit) {
      const existingStore = engine.stores.find((s) => s.unit === clickedUnit);

      if (engine.selectedTenant) {
        if (engine.canFitTenant(engine.selectedTenant, clickedUnit)) {
          engine.placeTenant(engine.selectedTenant, clickedUnit);
          onStoreSelected();
        } else if (existingStore) {
          playErrorSound();
          engine.addEvent('Unit Occupied', `${clickedUnit[0]} is already leased to ${existingStore.tenant.name}.`, 'warning');
        } else {
          playErrorSound();
          engine.addEvent(
            'Size Mismatch',
            `${engine.selectedTenant.name} (${engine.selectedTenant.w}×${engine.selectedTenant.h}) cannot fit in ${clickedUnit[0]} (${clickedUnit[3]}×${clickedUnit[4]}).`,
            'warning'
          );
        }
      } else if (existingStore) {
        engine.selectedUnit = clickedUnit;
        engine.inspectedStore = existingStore;
        engine.inspectedAmenity = null;
        playBeep(640, 'sine', 0.08, 0.06);
        onStoreSelected();
      } else {
        engine.selectedUnit = clickedUnit;
        engine.inspectedStore = null;
        engine.inspectedAmenity = null;
        playBeep(480, 'sine', 0.05, 0.04);
        engine.addEvent(
          'Vacant Unit Selected',
          `${clickedUnit[0]} (${clickedUnit[3]}×${clickedUnit[4]}) is available. Select a tenant from directory to lease, or customize in Inspector.`,
          'info'
        );
        onStoreSelected();
      }
    } else {
      if (engine.inspectedStore || engine.inspectedAmenity) {
        engine.selectedUnit = null;
        engine.inspectedStore = null;
        engine.inspectedAmenity = null;
        onStoreSelected();
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const step = 55;
      if (e.key === 'ArrowLeft' || e.key === 'a') setPan((p) => ({ ...p, x: p.x + step }));
      if (e.key === 'ArrowRight' || e.key === 'd') setPan((p) => ({ ...p, x: p.x - step }));
      if (e.key === 'ArrowUp' || e.key === 'w') setPan((p) => ({ ...p, y: p.y + step }));
      if (e.key === 'ArrowDown' || e.key === 's') setPan((p) => ({ ...p, y: p.y - step }));
      if (e.key === '+' || e.key === '=') setZoom((z) => Math.min(2.4, z * 1.15));
      if (e.key === '-' || e.key === '_') setZoom((z) => Math.max(0.55, z * 0.87));
      if (e.key === '0') resetFitAll();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const setToolMode = (mode: ArchitectToolMode) => {
    engine.architectMode = mode;
    onStoreSelected();
  };

  return (
    <div className="flex flex-col items-center w-full p-2 sm:p-3 lg:p-4">
      {engine.blueprintMode && <BlueprintDock engine={engine} onUpdate={onStoreSelected} />}
      {/* Architect Mode Quick Switcher & Wing Jumps */}
      <div className={`w-full flex flex-wrap items-center justify-between gap-2 mb-2.5 text-xs ${engine.blueprintMode ? 'hidden' : ''}`}>
        {/* Architect Modes */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 shadow-sm overflow-x-auto">
          <button
            onClick={() => { engine.setBlueprintMode(true); onStoreSelected(); }}
            className="min-h-9 px-3 rounded-lg flex items-center gap-1.5 font-bold bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 whitespace-nowrap"
          >
            <PencilRuler className="w-4 h-4" /> Edit Mall
          </button>
          <button
            onClick={() => setToolMode('select')}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 font-medium transition-all cursor-pointer whitespace-nowrap ${
              engine.architectMode === 'select'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <MousePointer className="w-3.5 h-3.5" /> Inspect / Lease
          </button>
          <button
            onClick={() => setShowBuildTools((open) => !open)}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 font-semibold transition-all whitespace-nowrap ${showBuildTools ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <Grid className="w-3.5 h-3.5" /> Build & Decor
          </button>
          {showBuildTools && <>
          <button
            onClick={() => setToolMode('paint_hallway')}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 font-medium transition-all cursor-pointer whitespace-nowrap ${
              engine.architectMode === 'paint_hallway'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Paintbrush className="w-3.5 h-3.5" /> Paint Hallway
          </button>
          <button
            onClick={() => setToolMode('build_wall')}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 font-medium transition-all cursor-pointer whitespace-nowrap ${
              engine.architectMode === 'build_wall'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Walls & Railings
          </button>
          <button
            onClick={() => setToolMode('place_escalator')}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 font-medium transition-all cursor-pointer whitespace-nowrap ${
              engine.architectMode === 'place_escalator'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" /> Escalator
          </button>
          <button
            onClick={() => setToolMode('place_entrance')}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 font-medium transition-all cursor-pointer whitespace-nowrap ${
              engine.architectMode === 'place_entrance'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <DoorOpen className="w-3.5 h-3.5" /> Entrance
          </button>
          <button
            onClick={() => setToolMode('zone')}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 font-medium transition-all cursor-pointer whitespace-nowrap ${
              engine.architectMode === 'zone'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Grid className="w-3.5 h-3.5" /> Zone Lot
          </button>
          <button
            onClick={() => setToolMode('place_amenity')}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 font-medium transition-all cursor-pointer whitespace-nowrap ${
              engine.architectMode === 'place_amenity'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Amenities
          </button>
          <button
            onClick={() => setToolMode('demolish')}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 font-medium transition-all cursor-pointer whitespace-nowrap ${
              engine.architectMode === 'demolish'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" /> Demolish
          </button>
          </>}
        </div>

        {/* Authentic Valley Fair Wing Jumps */}
        <div className="hidden items-center gap-1.5 overflow-x-auto pb-0.5">
          <button
            onClick={() => jumpToZone(38 * TILE_SIZE, 24 * TILE_SIZE, 1.4)}
            className="px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-medium transition-all whitespace-nowrap cursor-pointer"
          >
            🏛️ Center Court
          </button>
          <button
            onClick={() => jumpToZone(55 * TILE_SIZE, 14 * TILE_SIZE, 1.45)}
            className="px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-medium transition-all whitespace-nowrap cursor-pointer"
          >
            💎 Luxury Collection
          </button>
          <button
            onClick={() => jumpToZone(65 * TILE_SIZE, 35 * TILE_SIZE, 1.45)}
            className="px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-medium transition-all whitespace-nowrap cursor-pointer"
          >
            🎬 Alamo Cinema
          </button>
          <button
            onClick={() => jumpToZone(10 * TILE_SIZE, 15 * TILE_SIZE, 1.4)}
            className="px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-medium transition-all whitespace-nowrap cursor-pointer"
          >
            🏬 Nordstrom
          </button>
          <button
            onClick={() => jumpToZone(72 * TILE_SIZE, 23 * TILE_SIZE, 1.4)}
            className="px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-medium transition-all whitespace-nowrap cursor-pointer"
          >
            🛍️ Macy's Women's
          </button>
          <button
            onClick={() => jumpToZone(25 * TILE_SIZE, 37 * TILE_SIZE, 1.4)}
            className="px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-medium transition-all whitespace-nowrap cursor-pointer"
          >
            🏠 Macy's Men's & Home
          </button>
          <button
            onClick={resetFitAll}
            className="px-2.5 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/60 text-[11px] font-semibold flex items-center gap-1 transition-all whitespace-nowrap cursor-pointer"
          >
            <Maximize2 className="w-3 h-3" /> Fit
          </button>
        </div>
      </div>

      {/* Main Interactive Pan/Zoom Viewport Container */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onPointerDown={handleMouseDown}
        onPointerMove={handleMouseMove}
        onPointerUp={handleMouseUp}
        onPointerCancel={handleMouseLeave}
        onPointerLeave={handleMouseLeave}
        onClick={handleClick}
        className={`mall-viewport relative w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-[#0a0f1d] select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-crosshair'
        }`}
        style={{ touchAction: 'none' }}
      >
        {/* Transformed World Canvas */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            transition: isDragging ? 'none' : 'transform 0.08s ease-out',
            width: '100%',
            height: '100%'
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: 'auto',
              aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}`,
              display: 'block'
            }}
          />
        </div>

        {buildDrag && (() => {
          const rect = containerRef.current?.getBoundingClientRect();
          const left = Math.min(buildDrag.startClientX, buildDrag.endClientX) - (rect?.left || 0);
          const top = Math.min(buildDrag.startClientY, buildDrag.endClientY) - (rect?.top || 0);
          const width = Math.max(12, Math.abs(buildDrag.endClientX - buildDrag.startClientX));
          const height = Math.max(12, Math.abs(buildDrag.endClientY - buildDrag.startClientY));
          return <div className={`absolute pointer-events-none rounded-lg border-2 ${engine.architectMode === 'zone' ? 'border-teal-300 bg-teal-400/25' : 'border-amber-300 bg-amber-400/30'}`} style={{ left, top, width, height }}>
            <span className="absolute -top-7 left-0 px-2 py-1 rounded-md bg-slate-950 text-[10px] font-bold text-white whitespace-nowrap">
              {Math.abs(buildDrag.endTileX - buildDrag.startTileX) + 1} × {Math.abs(buildDrag.endTileY - buildDrag.startTileY) + 1} tiles
            </span>
          </div>;
        })()}

        {/* Top-Left Live Status Badge */}
        <div className="absolute top-3 left-3 pointer-events-none flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/85 backdrop-blur-md border border-white/10 text-xs font-mono text-slate-200 shadow-xl">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold">{engine.design?.name ?? 'My Mall'}</span>
          <span className="text-slate-500">|</span>
          <span className="text-cyan-400 font-bold">{Math.round(zoom * 100)}%</span>
        </div>

        {/* Floating Viewport Controls (Top-Right) */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/85 backdrop-blur-md border border-white/10 shadow-xl">
          <button
            onClick={() => setZoom((z) => Math.min(2.4, z * 1.2))}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.55, z * 0.83))}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={resetFitAll}
            className="px-2 py-1 rounded-lg text-[11px] font-mono text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            title="Reset View"
          >
            Fit
          </button>
        </div>

        {/* Interactive Minimap Radar (Bottom-Right) */}
        <div className="hidden sm:block absolute bottom-3 right-3 w-52 h-32 rounded-xl overflow-hidden border border-cyan-500/30 bg-slate-950/90 backdrop-blur-md shadow-2xl pointer-events-none">
          <canvas
            ref={minimapCanvasRef}
            width={208}
            height={128}
            className="w-full h-full block"
          />
          <div className="absolute bottom-1 left-2 text-[9px] font-mono text-cyan-400/80 font-bold">
            MALL OVERVIEW
          </div>
        </div>

        {/* Drag Helper Tooltip */}
        <div className="hidden sm:flex absolute bottom-3 left-3 pointer-events-none items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/75 backdrop-blur-md border border-white/10 text-[10px] font-mono text-slate-400">
          <Move className="w-3 h-3 text-cyan-400" />
          <span>Click & Drag to Pan · Scroll to Zoom · Click Map to Build</span>
        </div>
      </div>

      {/* Context info bar below canvas */}
      <div className={`w-full mt-2.5 px-4 py-2.5 rounded-xl bg-slate-900/90 backdrop-blur-sm border border-slate-800 text-xs text-slate-300 flex-wrap items-center justify-between gap-2 shadow-sm ${engine.blueprintMode ? 'hidden' : 'flex'}`}>
        <div className="flex items-center gap-2">
          {engine.architectMode === 'paint_hallway' ? (
            <span className="flex items-center gap-1.5 text-amber-300 font-medium">
              <Paintbrush className="w-4 h-4 text-amber-400 animate-pulse" />
              <strong>Hallway Painter Active:</strong> Click tiles to pave {engine.activeHallwayStyle.replace('_', ' ')} concourse. Shoppers will dynamically pathfind through your new hallways!
            </span>
          ) : engine.architectMode === 'build_wall' ? (
            <span className="flex items-center gap-1.5 text-emerald-300 font-medium">
              <Layers className="w-4 h-4 text-emerald-400 animate-pulse" />
              <strong>Architect Barrier Active:</strong> Click tiles to place {engine.activeWallType.replace('_', ' ')}.
            </span>
          ) : engine.architectMode === 'place_escalator' ? (
            <span className="flex items-center gap-1.5 text-blue-300 font-medium">
              <ArrowUpDown className="w-4 h-4 text-blue-400 animate-pulse" />
              <strong>Vertical Transit Active:</strong> Click map to construct a glass escalator / panoramic elevator bank.
            </span>
          ) : engine.architectMode === 'zone' ? (
            <span className="flex items-center gap-1.5 text-teal-300 font-medium">
              <Grid className="w-4 h-4 text-teal-400 animate-pulse" />
              <strong>Zoning Tool Active:</strong> Hover over open space and click to construct a custom {engine.customLotConfig.w}×{engine.customLotConfig.h} commercial lot (${engine.customLotConfig.cost}).
            </span>
          ) : engine.architectMode === 'place_amenity' ? (
            <span className="flex items-center gap-1.5 text-indigo-300 font-medium">
              <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
              <strong>Amenity Placement:</strong> {engine.selectedAmenity ? `Click concourse to place ${engine.selectedAmenity.name} ($${engine.selectedAmenity.cost})` : 'Select an amenity from the Architect Tab in the sidebar.'}
            </span>
          ) : engine.architectMode === 'demolish' ? (
            <span className="flex items-center gap-1.5 text-rose-300 font-medium">
              <Trash2 className="w-4 h-4 text-rose-400 animate-pulse" />
              <strong>Demolition Tool Active:</strong> Click any vacant lot, custom hallway, barrier, or amenity to reclaim floor space.
            </span>
          ) : engine.selectedTenant ? (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <strong className="text-cyan-300 font-semibold">Lease Mode: {engine.selectedTenant.name}</strong> ({engine.selectedTenant.w}×{engine.selectedTenant.h}) — Click any green highlighted lot to build.
            </span>
          ) : engine.inspectedStore ? (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <strong className="text-amber-300 font-semibold">Inspecting: {engine.inspectedStore.tenant.name} (Tier {engine.inspectedStore.level})</strong> in {engine.inspectedStore.unit[0]}. Served {engine.inspectedStore.shoppersServed} shoppers.
            </span>
          ) : (
            <span className="text-slate-400">
              Select a tenant from the directory to sign a lease, or switch to Architect Tools to paint hallways and customize lots.
            </span>
          )}
        </div>
        <div className="font-mono text-[11px] text-cyan-300 bg-slate-950 px-2.5 py-0.5 rounded-md border border-cyan-900/50">
          {engine.units.length} Lots · {engine.stores.length} Leased · {engine.customHallways.length} Painted Tiles · {engine.amenities.length} Amenities
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// MINIMAP RADAR DRAWER
// -------------------------------------------------------------
function drawMinimap(
  mctx: CanvasRenderingContext2D,
  engine: MallSimulationEngine,
  currentZoom: number,
  currentPan: { x: number; y: number }
) {
  const mw = 208;
  const mh = 128;
  const scaleX = mw / CANVAS_WIDTH;
  const scaleY = mh / CANVAS_HEIGHT;

  mctx.clearRect(0, 0, mw, mh);

  // Background
  mctx.fillStyle = '#0b1120';
  mctx.fillRect(0, 0, mw, mh);

  // Master building footprint silhouette on 80x48
  mctx.fillStyle = '#1e293b';
  mctx.beginPath();
  [[3,8],[16,8],[16,14],[31,14],[31,4],[48,4],[48,2],[70,2],[70,13],[78,16],[78,30],[72,30],[72,42],[44,42],[44,40],[31,40],[31,44],[18,44],[18,31],[14,31],[14,29],[3,29]].forEach(([x,y], i) => {
    const px = x * TILE_SIZE * scaleX;
    const py = y * TILE_SIZE * scaleY;
    if (i === 0) mctx.moveTo(px, py); else mctx.lineTo(px, py);
  });
  mctx.closePath();
  mctx.fill();

  // Center Court Fountain Dot
  mctx.fillStyle = '#0284c7';
  mctx.beginPath();
  mctx.arc(38.5 * TILE_SIZE * scaleX, 24.0 * TILE_SIZE * scaleY, 4, 0, Math.PI * 2);
  mctx.fill();

  // Draw custom hallways
  mctx.fillStyle = '#fbbf24';
  for (const h of engine.customHallways) {
    mctx.fillRect(h.x * TILE_SIZE * scaleX, h.y * TILE_SIZE * scaleY, TILE_SIZE * scaleX, TILE_SIZE * scaleY);
  }

  // Draw active stores
  for (const st of engine.stores) {
    const [, gx, gy, gw, gh] = st.unit;
    mctx.fillStyle = st.tenant.color;
    mctx.fillRect(gx * TILE_SIZE * scaleX, gy * TILE_SIZE * scaleY, gw * TILE_SIZE * scaleX, gh * TILE_SIZE * scaleY);
  }

  // Draw all units
  mctx.strokeStyle = '#475569';
  mctx.lineWidth = 0.5;
  for (const u of engine.units) {
    const isOccupied = engine.stores.some((s) => s.unit === u);
    if (!isOccupied) {
      mctx.strokeRect(u[1] * TILE_SIZE * scaleX, u[2] * TILE_SIZE * scaleY, u[3] * TILE_SIZE * scaleX, u[4] * TILE_SIZE * scaleY);
    }
  }

  // Draw live shoppers
  mctx.fillStyle = '#facc15';
  for (const sh of engine.shoppers) {
    mctx.fillRect(sh.x * scaleX - 0.75, sh.y * scaleY - 0.75, 1.5, 1.5);
  }

  // Draw Viewport Camera Box
  const visibleW = (CANVAS_WIDTH / currentZoom) * scaleX;
  const visibleH = (CANVAS_HEIGHT / currentZoom) * scaleY;
  const camX = (-currentPan.x / (currentZoom * (mw / CANVAS_WIDTH))) * scaleX;
  const camY = (-currentPan.y / (currentZoom * (mh / CANVAS_HEIGHT))) * scaleY;

  mctx.strokeStyle = '#22d3ee';
  mctx.lineWidth = 1.5;
  mctx.strokeRect(
    Math.max(0, Math.min(mw - 4, camX)),
    Math.max(0, Math.min(mh - 4, camY)),
    Math.min(mw, visibleW),
    Math.min(mh, visibleH)
  );
}
