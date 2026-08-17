import {
  StoreInstance,
  ShopperAgent,
  FloatingEffect,
  MallStats,
  MallEvent,
  TenantDefinition,
  MallUnit,
  MallAmenityInstance,
  AmenityDefinition,
  ArchitectToolMode,
  CustomHallwayTile,
  CustomWallTile,
  EscalatorInstance,
  HallwayStyle,
  MallEntrance
} from './types';
import { TICKS_PER_DAY, UNITS_LIST, TENANTS_CATALOG, TILE_SIZE, AMENITIES_CATALOG, CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';
import { createStoreInstance, generateStoreInterior } from './store';
import { createShopperAgent, updateShopperAgent } from './shopper';
import { playPlaceSound, playUpgradeSound, playDoorBell, playErrorSound, playCashSound } from './sound';
import { rebuildNavGraph } from './pathfinding';
import { createTemplateDocument, MallDesignDocument, MallTemplateId } from './blueprint';

interface BlueprintSnapshot {
  design: MallDesignDocument;
  cash: number;
}

const CINEMA_MOVIES_LIST = [
  { title: 'Interstellar Echoes 4DX', genre: 'Sci-Fi Epic', price: 24, glow: '#38bdf8' },
  { title: 'Neon Samurai: Tokyo 2099', genre: 'Action Cyberpunk', price: 26, glow: '#f43f5e' },
  { title: 'The Starlight Symphony', genre: 'Family Animation', price: 20, glow: '#eab308' },
  { title: 'Quantum Horizon: Laser IMAX', genre: 'Mystery Thriller', price: 28, glow: '#8b5cf6' }
];

export class MallSimulationEngine {
  public units: MallUnit[] = [];
  public stores: StoreInstance[] = [];
  public amenities: MallAmenityInstance[] = [];
  public customHallways: CustomHallwayTile[] = [];
  public customWalls: CustomWallTile[] = [];
  public escalators: EscalatorInstance[] = [];
  public entrances: MallEntrance[] = [];
  public shoppers: ShopperAgent[] = [];
  public floatingFx: FloatingEffect[] = [];
  public stats: MallStats;
  public events: MallEvent[] = [];
  public design: MallDesignDocument = createTemplateDocument('showcase');
  public blueprintMode = false;
  public blueprintHistory: BlueprintSnapshot[] = [];
  public blueprintFuture: BlueprintSnapshot[] = [];

  // Architect Tooling & Selection State
  public architectMode: ArchitectToolMode = 'select';
  public activeHallwayStyle: HallwayStyle = 'marble_carrara';
  public activeWallType: 'glass_railing' | 'planter_wall' | 'pillar' = 'glass_railing';
  public activeEscalatorType: 'escalator_glass' | 'elevator_panoramic' = 'escalator_glass';
  public selectedTenant: TenantDefinition | null = null;
  public selectedAmenity: AmenityDefinition | null = null;
  public customLotConfig = { w: 6, h: 5, name: 'Custom Commercial Lot', cost: 550 };
  public hoveredUnit: MallUnit | null = null;
  public selectedUnit: MallUnit | null = null;
  public hoveredTile: { x: number; y: number } | null = null;
  public inspectedStore: StoreInstance | null = null;
  public inspectedAmenity: MallAmenityInstance | null = null;

  public simSpeed = 1;
  public isPaused = false;

  private onStateChange?: () => void;

  constructor(onStateChange?: () => void) {
    this.onStateChange = onStateChange;
    this.stats = {
      cash: 28000,
      week: 1,
      day: 1,
      dayTicks: 0,
      reputation: 76,
      cleanliness: 95,
      security: 90,
      totalSales: 0,
      activeShoppersCount: 0,
      customLotsCount: 0
    };

    // The operating showcase uses the same serializable document boundary as every
    // starter mall. There is no special fixed-map renderer or index-only mall model.
    this.units = this.design.units.map((u) => [u[0], u[1], u[2], u[3], u[4], { ...u[5] }, u[6]]);
    this.customHallways = this.design.hallways.map(({ x, y, style }) => ({ x, y, style }));
    this.customWalls = this.design.walls.map((wall) => ({ ...wall }));
    this.escalators = this.design.escalators.map((escalator) => ({ ...escalator }));
    this.amenities = this.design.amenities.map((amenity) => ({ ...amenity }));
    this.entrances = this.design.entrances.map((entrance) => ({ ...entrance }));
    this.seedShowcaseTenants();

    // Rebuild initial navigation graph based on all placed units, amenities, and custom hallways
    rebuildNavGraph(this.units, this.amenities, this.customHallways, this.entrances);

    // Spawn opening crowd of shoppers
    for (let i = 0; i < 42; i++) {
      this.spawnShopper();
    }

    this.addEvent('Welcome to Aurora Grand', 'Explore the operating showcase, renovate its wings, or choose a starter mall and build your own.', 'info');
  }

  private seedShowcaseTenants() {
    const placements: Array<[string, number]> = [
      ['cinema', 3], ['dumpling_house', 20], ['luxury_maison', 16], ['swiss_watches', 17],
      ['tech_apple', 6], ['cafe_roastery', 12], ['arcade_bowlero', 18], ['book_nook', 13]
    ];
    for (const [tenantId, unitIndex] of placements) {
      const tenant = TENANTS_CATALOG.find((candidate) => candidate.id === tenantId);
      const unit = this.units[unitIndex];
      if (tenant && unit) this.stores.push(createStoreInstance(tenant, unit));
    }
  }

  private spawnShopper() {
    const shopper = createShopperAgent(this.stores, this.entrances);
    if (shopper) this.shoppers.push(shopper);
  }

  public setCallback(cb: () => void) {
    this.onStateChange = cb;
  }

  private cloneDesign(): MallDesignDocument {
    this.syncDesignFromRuntime();
    return JSON.parse(JSON.stringify(this.design)) as MallDesignDocument;
  }

  private syncDesignFromRuntime() {
    this.design.units = this.units.map((u) => [u[0], u[1], u[2], u[3], u[4], { ...u[5] }, u[6]]);
    this.design.hallways = this.customHallways.map((h) => ({ ...h, floorId: this.design.activeFloorId }));
    this.design.walls = this.customWalls.map((wall) => ({ ...wall }));
    this.design.escalators = this.escalators.map((escalator) => ({ ...escalator }));
    this.design.amenities = this.amenities.map((amenity) => ({ ...amenity }));
    this.design.entrances = this.entrances.map((entrance) => ({ ...entrance }));
    this.design.savedAt = Date.now();
  }

  private captureBlueprintSnapshot() {
    this.blueprintHistory.push({ design: this.cloneDesign(), cash: this.stats.cash });
    if (this.blueprintHistory.length > 40) this.blueprintHistory.shift();
    this.blueprintFuture = [];
  }

  private restoreBlueprintSnapshot(snapshot: BlueprintSnapshot) {
    const unitById = new Map(snapshot.design.units.map((u) => [u[6], u]));
    this.design = JSON.parse(JSON.stringify(snapshot.design)) as MallDesignDocument;
    this.units = this.design.units.map((u) => [u[0], u[1], u[2], u[3], u[4], { ...u[5] }, u[6]]);
    const runtimeById = new Map(this.units.map((u) => [u[6], u]));
    this.stores = this.stores
      .filter((store) => unitById.has(store.unit[6]))
      .map((store) => {
        const nextUnit = runtimeById.get(store.unit[6])!;
        return { ...store, unit: nextUnit, interior: generateStoreInterior(store.tenant, nextUnit, store.level) };
      });
    this.customHallways = this.design.hallways.map(({ x, y, style }) => ({ x, y, style }));
    this.customWalls = (this.design.walls || []).map((wall) => ({ ...wall }));
    this.escalators = (this.design.escalators || []).map((escalator) => ({ ...escalator }));
    this.amenities = (this.design.amenities || []).map((amenity) => ({ ...amenity }));
    this.entrances = (this.design.entrances || []).map((entrance) => ({ ...entrance }));
    this.stats.cash = snapshot.cash;
    this.selectedUnit = null;
    this.inspectedStore = null;
    rebuildNavGraph(this.units, this.amenities, this.customHallways, this.entrances);
    this.notify();
  }

  public undoBlueprint(): boolean {
    const previous = this.blueprintHistory.pop();
    if (!previous) return false;
    this.blueprintFuture.push({ design: this.cloneDesign(), cash: this.stats.cash });
    this.restoreBlueprintSnapshot(previous);
    return true;
  }

  public redoBlueprint(): boolean {
    const next = this.blueprintFuture.pop();
    if (!next) return false;
    this.blueprintHistory.push({ design: this.cloneDesign(), cash: this.stats.cash });
    this.restoreBlueprintSnapshot(next);
    return true;
  }

  public setBlueprintMode(enabled: boolean) {
    this.blueprintMode = enabled;
    this.isPaused = enabled;
    this.selectedTenant = null;
    this.selectedAmenity = null;
    if (enabled) this.architectMode = 'select';
    this.notify();
  }

  public applyTemplate(templateId: MallTemplateId) {
    this.captureBlueprintSnapshot();
    this.design = createTemplateDocument(templateId);
    this.units = this.design.units.map((u) => [u[0], u[1], u[2], u[3], u[4], { ...u[5] }, u[6]]);
    this.customHallways = this.design.hallways.map(({ x, y, style }) => ({ x, y, style }));
    this.customWalls = this.design.walls.map((wall) => ({ ...wall }));
    this.escalators = this.design.escalators.map((escalator) => ({ ...escalator }));
    this.amenities = this.design.amenities.map((amenity) => ({ ...amenity }));
    this.entrances = this.design.entrances.map((entrance) => ({ ...entrance }));
    this.stores = [];
    this.shoppers = [];
    this.selectedUnit = null;
    this.inspectedStore = null;
    this.stats.cash = templateId === 'showcase' ? 28000 : templateId === 'blank' ? 40000 : templateId === 'small' ? 26000 : templateId === 'medium' ? 36000 : 52000;
    this.stats.week = 1;
    this.stats.day = 1;
    this.stats.dayTicks = 0;
    this.stats.totalSales = 0;
    this.stats.activeShoppersCount = 0;
    this.stats.customLotsCount = this.units.length;
    if (templateId === 'showcase') this.seedShowcaseTenants();
    rebuildNavGraph(this.units, this.amenities, this.customHallways, this.entrances);
    for (let i = 0; i < (templateId === 'showcase' ? 42 : 24); i++) this.spawnShopper();
    this.addEvent('Mall Blueprint Loaded', `${this.design.name} is ready to design, expand, and operate.`, 'info');
    this.notify();
  }

  public renameMall(name: string) {
    this.design.name = name.trim() || 'My Mall';
    this.syncDesignFromRuntime();
    this.notify();
  }

  public saveDesignToDevice() {
    this.syncDesignFromRuntime();
    localStorage.setItem('mall-tycoon-design-v1', JSON.stringify(this.design));
    this.addEvent('Blueprint Saved', `${this.design.name} was saved on this device.`, 'success');
  }

  public loadDesignFromDevice(): boolean {
    const raw = localStorage.getItem('mall-tycoon-design-v1');
    if (!raw) return false;
    const parsed = JSON.parse(raw) as MallDesignDocument;
    if (parsed.version !== 1 || !Array.isArray(parsed.units)) return false;
    this.captureBlueprintSnapshot();
    this.design = parsed;
    this.units = parsed.units.map((u) => [u[0], u[1], u[2], u[3], u[4], { ...u[5] }, u[6]]);
    this.customHallways = parsed.hallways.map(({ x, y, style }) => ({ x, y, style }));
    this.customWalls = (parsed.walls || []).map((wall) => ({ ...wall }));
    this.escalators = (parsed.escalators || []).map((escalator) => ({ ...escalator }));
    this.amenities = (parsed.amenities || []).map((amenity) => ({ ...amenity }));
    this.entrances = (parsed.entrances || []).map((entrance) => ({ ...entrance }));
    this.stores = [];
    this.selectedUnit = null;
    rebuildNavGraph(this.units, this.amenities, this.customHallways, this.entrances);
    this.notify();
    return true;
  }

  public paintHallwayRect(startX: number, startY: number, endX: number, endY: number, style: HallwayStyle) {
    const minX = Math.max(1, Math.min(startX, endX));
    const maxX = Math.min(Math.floor(CANVAS_WIDTH / TILE_SIZE) - 2, Math.max(startX, endX));
    const minY = Math.max(1, Math.min(startY, endY));
    const maxY = Math.min(Math.floor(CANVAS_HEIGHT / TILE_SIZE) - 2, Math.max(startY, endY));
    const cells: Array<{ x: number; y: number }> = [];
    for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) cells.push({ x, y });
    const buildableCells = cells.filter((cell) => !this.units.some((unit) => cell.x >= unit[1] && cell.x < unit[1] + unit[3] && cell.y >= unit[2] && cell.y < unit[2] + unit[4]));
    const cost = buildableCells.length * 10;
    if (!buildableCells.length || this.stats.cash < cost) return false;
    this.captureBlueprintSnapshot();
    for (const cell of buildableCells) {
      const found = this.customHallways.find((h) => h.x === cell.x && h.y === cell.y);
      if (found) found.style = style; else this.customHallways.push({ ...cell, style });
    }
    this.stats.cash -= cost;
    this.syncDesignFromRuntime();
    rebuildNavGraph(this.units, this.amenities, this.customHallways);
    playPlaceSound();
    this.notify();
    return true;
  }

  public createLotFromRect(startX: number, startY: number, endX: number, endY: number) {
    const x = Math.min(startX, endX);
    const y = Math.min(startY, endY);
    const w = Math.max(3, Math.abs(endX - startX) + 1);
    const h = Math.max(3, Math.abs(endY - startY) + 1);
    this.captureBlueprintSnapshot();
    const result = this.createCustomLot(x, y, w, h, 'Custom Mall Space');
    if (!result.success) this.blueprintHistory.pop();
    else this.syncDesignFromRuntime();
    return result.success;
  }

  public moveVacantUnit(unit: MallUnit, newX: number, newY: number): boolean {
    if (this.stores.some((store) => store.unit === unit)) return false;
    const oldX = unit[1];
    const oldY = unit[2];
    const others = this.units.filter((candidate) => candidate !== unit);
    const collides = others.some((other) => newX < other[1] + other[3] && newX + unit[3] > other[1] && newY < other[2] + other[4] && newY + unit[4] > other[2]);
    if (collides || newX < 1 || newY < 1 || newX + unit[3] > 79 || newY + unit[4] > 47) return false;
    this.captureBlueprintSnapshot();
    unit[1] = Math.round(newX);
    unit[2] = Math.round(newY);
    unit[5] = { x: Math.round((unit[1] + unit[3] / 2) * TILE_SIZE), y: Math.round((unit[2] + unit[4]) * TILE_SIZE) };
    if (!Number.isFinite(unit[1]) || !Number.isFinite(unit[2])) { unit[1] = oldX; unit[2] = oldY; return false; }
    this.syncDesignFromRuntime();
    rebuildNavGraph(this.units, this.amenities, this.customHallways);
    this.notify();
    return true;
  }

  public notify() {
    if (this.onStateChange) this.onStateChange();
  }

  public addEvent(title: string, description: string, type: MallEvent['type'] = 'info') {
    const timeStr = `W${this.stats.week}·D${this.stats.day}`;
    const newEvent: MallEvent = {
      id: `ev_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      title,
      description,
      timeStr,
      type
    };
    this.events.unshift(newEvent);
    if (this.events.length > 32) this.events.pop();
    this.notify();
  }

  public canFitTenant(tenant: TenantDefinition, unit: MallUnit): boolean {
    const isOccupied = this.stores.some((s) => s.unit === unit);
    return !isOccupied && tenant.w <= unit[3] && tenant.h <= unit[4];
  }

  public placeTenant(tenant: TenantDefinition, unit: MallUnit): { success: boolean; message: string } {
    if (this.stats.cash < tenant.cost) {
      playErrorSound();
      return { success: false, message: `Insufficient funds. Need $${tenant.cost.toLocaleString()} to lease ${tenant.name}.` };
    }

    if (!this.canFitTenant(tenant, unit)) {
      playErrorSound();
      return { success: false, message: 'This unit lot is occupied or does not meet dimensional requirements.' };
    }

    const newStore = createStoreInstance(tenant, unit);
    newStore.placedAtWeek = this.stats.week;
    this.stores.push(newStore);

    this.stats.cash -= tenant.cost;
    this.stats.reputation = Math.min(100, this.stats.reputation + 6);
    this.stats.cleanliness = Math.max(20, this.stats.cleanliness - 2);

    rebuildNavGraph(this.units, this.amenities, this.customHallways);
    playPlaceSound();
    this.addEvent('New Storefront Leased', `${tenant.name} (${tenant.cat}) signed lease in ${unit[0]}. Visitors arriving!`, 'success');

    this.selectedTenant = null;
    this.selectedUnit = unit;
    this.inspectedStore = newStore;
    this.notify();

    return { success: true, message: `Leased ${tenant.name} in ${unit[0]}!` };
  }

  // =========================================================================
  // ARCHITECT & MALL CUSTOMIZATION TOOLS: HALLWAYS, WALLS, ESCALATORS, LOTS
  // =========================================================================

  public paintHallwayAt(gridX: number, gridY: number, style: HallwayStyle): { success: boolean; message: string } {
    const costMap: Record<HallwayStyle, number> = {
      marble_carrara: 15,
      terrazzo_mosaic: 20,
      granite_dark: 25,
      chevron_wood: 22,
      outdoor_stone: 18,
      glass_atrium: 35
    };
    const cost = costMap[style] || 20;

    if (this.stats.cash < cost) {
      playErrorSound();
      return { success: false, message: `Insufficient funds ($${cost}) to lay hallway tile.` };
    }

    const existingIdx = this.customHallways.findIndex((h) => h.x === gridX && h.y === gridY);
    if (existingIdx >= 0) {
      this.customHallways[existingIdx].style = style;
    } else {
      this.customHallways.push({ x: gridX, y: gridY, style });
    }

    this.stats.cash -= cost;
    rebuildNavGraph(this.units, this.amenities, this.customHallways);
    playPlaceSound();
    this.notify();
    return { success: true, message: `Paved ${style} hallway tile!` };
  }

  public eraseHallwayAt(gridX: number, gridY: number): { success: boolean; message: string } {
    const prevCount = this.customHallways.length;
    this.customHallways = this.customHallways.filter((h) => !(h.x === gridX && h.y === gridY));
    this.customWalls = this.customWalls.filter((w) => !(w.x === gridX && w.y === gridY));

    if (this.customHallways.length !== prevCount) {
      rebuildNavGraph(this.units, this.amenities, this.customHallways);
      this.notify();
      return { success: true, message: 'Erased custom hallway tile.' };
    }
    return { success: false, message: 'No custom hallway at this tile.' };
  }

  public buildWallAt(gridX: number, gridY: number, type: 'glass_railing' | 'planter_wall' | 'pillar'): { success: boolean; message: string } {
    const costMap = { glass_railing: 30, planter_wall: 45, pillar: 60 };
    const cost = costMap[type] || 35;

    if (this.stats.cash < cost) {
      playErrorSound();
      return { success: false, message: `Insufficient funds ($${cost}) to construct barrier.` };
    }

    const existingIdx = this.customWalls.findIndex((w) => w.x === gridX && w.y === gridY);
    if (existingIdx >= 0) {
      this.customWalls[existingIdx].type = type;
    } else {
      this.customWalls.push({ x: gridX, y: gridY, type });
    }

    this.stats.cash -= cost;
    this.stats.reputation = Math.min(100, this.stats.reputation + 1);
    playPlaceSound();
    this.notify();
    return { success: true, message: `Constructed ${type.replace('_', ' ')}!` };
  }

  public placeEscalatorAt(gridX: number, gridY: number, type: 'escalator_glass' | 'elevator_panoramic'): { success: boolean; message: string } {
    const cost = type === 'elevator_panoramic' ? 1400 : 850;
    if (this.stats.cash < cost) {
      playErrorSound();
      return { success: false, message: `Insufficient funds. Need $${cost.toLocaleString()} for vertical transit.` };
    }

    this.escalators.push({
      id: `esc_${Date.now()}`,
      type,
      x: gridX,
      y: gridY,
      w: 2,
      h: 4,
      direction: 'dual'
    });

    this.stats.cash -= cost;
    this.stats.reputation = Math.min(100, this.stats.reputation + 5);
    playPlaceSound();
    this.addEvent('Transit System Installed', `Installed ${type === 'elevator_panoramic' ? 'Panoramic Glass Elevator' : 'Glass Escalator Bank'}! +5 Rep.`, 'success');
    this.notify();
    return { success: true, message: 'Installed vertical transit system!' };
  }

  public canPlaceLotAt(gridX: number, gridY: number, widthTiles: number, heightTiles: number): boolean {
    const T = TILE_SIZE;
    const px = gridX * T;
    const py = gridY * T;
    const pw = widthTiles * T;
    const ph = heightTiles * T;

    if (px < 32 || py < 32 || px + pw > CANVAS_WIDTH - 32 || py + ph > CANVAS_HEIGHT - 32) {
      return false;
    }

    for (const u of this.units) {
      const ux = u[1] * T;
      const uy = u[2] * T;
      const uw = u[3] * T;
      const uh = u[4] * T;
      if (px < ux + uw && px + pw > ux && py < uy + uh && py + ph > uy) {
        return false;
      }
    }

    for (const a of this.amenities) {
      if (px < a.x + a.w && px + pw > a.x && py < a.y + a.h && py + ph > a.y) {
        return false;
      }
    }

    return true;
  }

  public createCustomLot(
    gridX: number,
    gridY: number,
    widthTiles: number,
    heightTiles: number,
    wingName = 'CUSTOM COMMERCIAL PLAZA'
  ): { success: boolean; message: string } {
    const cost = Math.round(widthTiles * heightTiles * 30);
    if (this.stats.cash < cost) {
      playErrorSound();
      return { success: false, message: `Insufficient funds. Need $${cost.toLocaleString()} to zone this lot.` };
    }

    if (!this.canPlaceLotAt(gridX, gridY, widthTiles, heightTiles)) {
      playErrorSound();
      return { success: false, message: 'Cannot place lot here: overlaps with existing store, concourse, or wall.' };
    }

    const T = TILE_SIZE;
    const doorway = {
      x: Math.round((gridX + widthTiles / 2) * T),
      y: Math.round((gridY + heightTiles) * T)
    };

    const customId = `custom_lot_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newUnit: MallUnit = [
      `${wingName} #${this.units.length + 1}`,
      gridX,
      gridY,
      widthTiles,
      heightTiles,
      doorway,
      customId
    ];

    this.units.push(newUnit);
    this.stats.cash -= cost;
    this.stats.customLotsCount += 1;
    this.stats.reputation = Math.min(100, this.stats.reputation + 2);

    rebuildNavGraph(this.units, this.amenities, this.customHallways);
    playPlaceSound();
    this.addEvent(
      'New Commercial Lot Zoned',
      `Zoned custom ${widthTiles}×${heightTiles} lot in ${wingName}. Cost: $${cost.toLocaleString()}.`,
      'success'
    );
    this.notify();

    return { success: true, message: `Zoned ${widthTiles}×${heightTiles} commercial lot!` };
  }

  public customizeUnit(
    unit: MallUnit,
    newName: string,
    newW: number,
    newH: number,
    doorwayDir: 'north' | 'south' | 'east' | 'west'
  ): { success: boolean; message: string } {
    const store = this.stores.find((s) => s.unit === unit);
    if (store) {
      return { success: false, message: 'Cannot reconfigure dimensions of a lot with an active leased tenant.' };
    }

    if (this.blueprintMode) this.captureBlueprintSnapshot();

    unit[0] = newName || unit[0];
    unit[3] = Math.max(4, Math.min(16, newW));
    unit[4] = Math.max(4, Math.min(12, newH));

    const T = TILE_SIZE;
    const gx = unit[1];
    const gy = unit[2];
    const gw = unit[3];
    const gh = unit[4];

    if (doorwayDir === 'north') {
      unit[5] = { x: Math.round((gx + gw / 2) * T), y: Math.round(gy * T) };
    } else if (doorwayDir === 'east') {
      unit[5] = { x: Math.round((gx + gw) * T), y: Math.round((gy + gh / 2) * T) };
    } else if (doorwayDir === 'west') {
      unit[5] = { x: Math.round(gx * T), y: Math.round((gy + gh / 2) * T) };
    } else {
      unit[5] = { x: Math.round((gx + gw / 2) * T), y: Math.round((gy + gh) * T) };
    }

    rebuildNavGraph(this.units, this.amenities, this.customHallways);
    this.syncDesignFromRuntime();
    this.notify();
    return { success: true, message: `Updated lot configuration for ${unit[0]}!` };
  }

  public placeAmenityAt(amenityDef: AmenityDefinition, gridX: number, gridY: number): { success: boolean; message: string } {
    if (this.stats.cash < amenityDef.cost) {
      playErrorSound();
      return { success: false, message: `Insufficient funds. Need $${amenityDef.cost.toLocaleString()} to place ${amenityDef.name}.` };
    }

    const T = TILE_SIZE;
    const ax = gridX * T;
    const ay = gridY * T;
    const aw = amenityDef.w * T;
    const ah = amenityDef.h * T;

    if (ax < 32 || ay < 32 || ax + aw > CANVAS_WIDTH - 32 || ay + ah > CANVAS_HEIGHT - 32) {
      playErrorSound();
      return { success: false, message: 'Outside mall perimeter boundaries.' };
    }

    for (const u of this.units) {
      const ux = u[1] * T;
      const uy = u[2] * T;
      const uw = u[3] * T;
      const uh = u[4] * T;
      if (ax < ux + uw && ax + aw > ux && ay < uy + uh && ay + ah > uy) {
        playErrorSound();
        return { success: false, message: 'Collides with storefront unit.' };
      }
    }

    for (const a of this.amenities) {
      if (ax < a.x + a.w && ax + aw > a.x && ay < a.y + a.h && ay + ah > a.y) {
        playErrorSound();
        return { success: false, message: 'Collides with another concourse amenity.' };
      }
    }

    const newAmenity: MallAmenityInstance = {
      id: `amen_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type: amenityDef.type,
      name: amenityDef.name,
      icon: amenityDef.icon,
      x: ax,
      y: ay,
      w: aw,
      h: ah,
      placedAtWeek: this.stats.week,
      useCount: 0,
      earnings: 0
    };

    this.amenities.push(newAmenity);
    this.stats.cash -= amenityDef.cost;
    this.stats.reputation = Math.min(100, this.stats.reputation + amenityDef.reputationBonus);
    if (amenityDef.category === 'Decor') {
      this.stats.cleanliness = Math.min(100, this.stats.cleanliness + 4);
    }

    rebuildNavGraph(this.units, this.amenities, this.customHallways);
    playPlaceSound();
    this.addEvent(
      'Concourse Amenity Installed',
      `Installed ${amenityDef.name} (${amenityDef.effect}). +${amenityDef.reputationBonus} Rep!`,
      'success'
    );
    this.notify();

    return { success: true, message: `Placed ${amenityDef.name}!` };
  }

  public placeEntranceAt(gridX: number, gridY: number): { success: boolean; message: string } {
    if (!this.customHallways.some((hallway) => hallway.x === gridX && hallway.y === gridY)) {
      return { success: false, message: 'Entrances must connect directly to a corridor tile.' };
    }
    if (this.entrances.some((entry) => entry.x === gridX && entry.y === gridY)) {
      return { success: false, message: 'There is already an entrance at this threshold.' };
    }
    const cost = 350;
    if (this.stats.cash < cost) return { success: false, message: 'Insufficient funds to build an entrance portal.' };
    const centerX = CANVAS_WIDTH / TILE_SIZE / 2;
    const centerY = CANVAS_HEIGHT / TILE_SIZE / 2;
    const horizontal = Math.abs(gridX - centerX) > Math.abs(gridY - centerY);
    const side: MallEntrance['side'] = horizontal ? (gridX < centerX ? 'west' : 'east') : (gridY < centerY ? 'north' : 'south');
    this.captureBlueprintSnapshot();
    const entrance: MallEntrance = {
      id: `entrance_${Date.now()}`,
      name: `${side[0].toUpperCase()}${side.slice(1)} Entrance ${this.entrances.length + 1}`,
      x: gridX, y: gridY, side, mode: 'both', visitorsEntered: 0, visitorsExited: 0
    };
    this.entrances.push(entrance);
    this.stats.cash -= cost;
    this.syncDesignFromRuntime();
    rebuildNavGraph(this.units, this.amenities, this.customHallways, this.entrances);
    this.addEvent('Entrance Opened', `${entrance.name} now handles arriving and departing visitors.`, 'success');
    this.notify();
    return { success: true, message: `Built ${entrance.name}.` };
  }

  public demolishAt(canvasX: number, canvasY: number): { success: boolean; message: string } {
    if (this.blueprintMode) this.captureBlueprintSnapshot();
    const tileX = Math.floor(canvasX / TILE_SIZE);
    const tileY = Math.floor(canvasY / TILE_SIZE);

    const entrance = this.entrances.find((entry) => entry.x === tileX && entry.y === tileY);
    if (entrance) {
      if (this.entrances.length <= 1 && !this.blueprintMode) return { success: false, message: 'An operating mall needs at least one entrance.' };
      this.entrances = this.entrances.filter((entry) => entry.id !== entrance.id);
      this.stats.cash += 175;
      this.syncDesignFromRuntime();
      rebuildNavGraph(this.units, this.amenities, this.customHallways, this.entrances);
      this.addEvent('Entrance Removed', `${entrance.name} was closed.`, 'warning');
      this.notify();
      return { success: true, message: 'Entrance removed (+$175).' };
    }

    // 1. Check custom hallway or wall
    const isHall = this.customHallways.some((h) => h.x === tileX && h.y === tileY);
    const isWall = this.customWalls.some((w) => w.x === tileX && w.y === tileY);
    if (isHall || isWall) {
      this.customHallways = this.customHallways.filter((h) => !(h.x === tileX && h.y === tileY));
      this.customWalls = this.customWalls.filter((w) => !(w.x === tileX && w.y === tileY));
      rebuildNavGraph(this.units, this.amenities, this.customHallways);
      playDoorBell();
      this.notify();
      return { success: true, message: 'Reclaimed hallway / barrier space.' };
    }

    // 2. Check if clicking an amenity
    const amenity = this.getAmenityAt(canvasX, canvasY);
    if (amenity) {
      const amenDef = AMENITIES_CATALOG.find((a) => a.type === amenity.type);
      const refund = Math.round((amenDef?.cost || 300) * 0.65);
      this.amenities = this.amenities.filter((a) => a.id !== amenity.id);
      this.stats.cash += refund;
      this.inspectedAmenity = null;
      rebuildNavGraph(this.units, this.amenities, this.customHallways);
      playDoorBell();
      this.addEvent('Amenity Removed', `Demolished ${amenity.name}. Refunded $${refund.toLocaleString()}.`, 'warning');
      this.notify();
      return { success: true, message: `Demolished ${amenity.name} (+$${refund})` };
    }

    // 3. Check if clicking a vacant unit
    const unit = this.getUnitAt(canvasX, canvasY);
    if (unit) {
      const store = this.stores.find((s) => s.unit === unit);
      if (store) {
        playErrorSound();
        return { success: false, message: `Cannot demolish active store ${store.tenant.name}. Evict the tenant first in the Inspector.` };
      }

      const refund = Math.round(unit[3] * unit[4] * 20);
      this.units = this.units.filter((u) => u !== unit);
      this.stats.cash += refund;
      this.stats.customLotsCount = Math.max(0, this.stats.customLotsCount - 1);
      rebuildNavGraph(this.units, this.amenities, this.customHallways);
      playDoorBell();
      this.addEvent('Lot Demolished', `Demolished vacant lot ${unit[0]}. Space reclaimed. (+$${refund})`, 'warning');
      this.notify();
      return { success: true, message: `Demolished lot (+$${refund})` };
    }

    return { success: false, message: 'Nothing found to demolish at this location.' };
  }

  public getAmenityAt(canvasX: number, canvasY: number): MallAmenityInstance | null {
    for (const a of this.amenities) {
      if (canvasX >= a.x && canvasX <= a.x + a.w && canvasY >= a.y && canvasY <= a.y + a.h) {
        return a;
      }
    }
    return null;
  }

  public getUnitAt(canvasX: number, canvasY: number): MallUnit | null {
    const T = TILE_SIZE;
    for (const u of this.units) {
      const ux = u[1] * T;
      const uy = u[2] * T;
      const uw = u[3] * T;
      const uh = u[4] * T;
      if (canvasX >= ux && canvasX <= ux + uw && canvasY >= uy && canvasY <= uy + uh) {
        return u;
      }
    }
    return null;
  }

  public upgradeInspectedStore(): { success: boolean; message: string } {
    if (!this.inspectedStore) return { success: false, message: 'No store selected.' };

    const nextTierData = this.inspectedStore.tenant.upgrades.find((u) => u.tier === this.inspectedStore!.level + 1);
    const cost = nextTierData ? nextTierData.cost : Math.round(this.inspectedStore.tenant.cost * 1.2);

    if (this.stats.cash < cost) {
      return { success: false, message: `Insufficient funds. Need $${cost.toLocaleString()} to upgrade ${this.inspectedStore.tenant.name}.` };
    }

    const store = this.inspectedStore;
    store.level += 1;
    store.staffCount += 1;
    store.customerSatisfaction = Math.min(100, store.customerSatisfaction + 8);
    store.interior = generateStoreInterior(store.tenant, store.unit, store.level);

    this.stats.cash -= cost;
    this.stats.reputation = Math.min(100, this.stats.reputation + 5);

    playUpgradeSound();
    this.addEvent(
      'Store Expanded & Upgraded',
      `${store.tenant.name} upgraded to Tier ${store.level}: ${nextTierData?.name || 'Expanded Flagship'}!`,
      'success'
    );
    this.notify();

    return { success: true, message: `Upgraded ${store.tenant.name} to Tier ${store.level}!` };
  }

  public setStorePricing(strategy: StoreInstance['priceStrategy']) {
    if (!this.inspectedStore) return;
    this.inspectedStore.priceStrategy = strategy;
    this.addEvent('Pricing Updated', `${this.inspectedStore.tenant.name} switched to ${strategy} pricing.`, 'info');
    this.notify();
  }

  public adjustStoreStaff(delta: -1 | 1): { success: boolean; message: string } {
    const store = this.inspectedStore;
    if (!store) return { success: false, message: 'No store selected.' };
    if (delta < 0 && store.staffCount <= 1) return { success: false, message: 'Every store needs at least one employee.' };
    if (delta > 0 && this.stats.cash < 300) return { success: false, message: 'Need $300 to recruit and train an employee.' };
    store.staffCount += delta;
    store.customStaffHired += delta;
    this.stats.cash += delta > 0 ? -300 : 100;
    store.customerSatisfaction = Math.max(40, Math.min(100, store.customerSatisfaction + delta * 2));
    this.addEvent(delta > 0 ? 'Staff Hired' : 'Staffing Reduced', `${store.tenant.name} now schedules ${store.staffCount} employees.`, 'info');
    this.notify();
    return { success: true, message: 'Staffing updated.' };
  }

  public restockInspectedStore(): { success: boolean; message: string } {
    const store = this.inspectedStore;
    if (!store) return { success: false, message: 'No store selected.' };
    const cost = 240;
    if (this.stats.cash < cost) return { success: false, message: 'Need $240 for a replenishment delivery.' };
    this.stats.cash -= cost;
    store.inventoryLevel = 100;
    this.addEvent('Inventory Delivered', `${store.tenant.name} is fully stocked for the next rush.`, 'success');
    this.notify();
    return { success: true, message: 'Inventory restored.' };
  }

  public promoteInspectedStore(): { success: boolean; message: string } {
    const store = this.inspectedStore;
    if (!store) return { success: false, message: 'No store selected.' };
    const cost = 450;
    if (this.stats.cash < cost) return { success: false, message: 'Need $450 to launch a local campaign.' };
    this.stats.cash -= cost;
    store.promotionTicks = 1800;
    this.addEvent('Store Campaign Live', `${store.tenant.name} is trending locally; shopper demand is boosted.`, 'success');
    this.notify();
    return { success: true, message: 'Promotion launched.' };
  }

  public renovateStoreFacade(style: StoreInstance['facadeStyle']): { success: boolean; message: string } {
    const store = this.inspectedStore;
    if (!store) return { success: false, message: 'No store selected.' };
    if (store.facadeStyle === style) return { success: true, message: 'Facade already selected.' };
    const cost = 325;
    if (this.stats.cash < cost) return { success: false, message: 'Need $325 for a storefront renovation.' };
    this.stats.cash -= cost;
    store.facadeStyle = style;
    store.customerSatisfaction = Math.min(100, store.customerSatisfaction + 2);
    this.addEvent('Storefront Renovated', `${store.tenant.name} debuted its new ${style} facade.`, 'success');
    this.notify();
    return { success: true, message: 'Storefront renovated.' };
  }

  public evictInspectedStore(): { success: boolean; message: string } {
    if (!this.inspectedStore) return { success: false, message: 'No store selected.' };

    const name = this.inspectedStore.tenant.name;
    this.stores = this.stores.filter((s) => s.id !== this.inspectedStore!.id);
    this.inspectedStore = null;

    this.addEvent('Storefront Vacated', `${name} vacated their unit lot. Available for new lease.`, 'warning');
    this.notify();
    return { success: true, message: `${name} evicted.` };
  }

  public performMallAction(action: 'clean' | 'security' | 'campaign'): { success: boolean; message: string } {
    if (action === 'clean') {
      const cost = 250;
      if (this.stats.cash < cost) return { success: false, message: 'Insufficient funds for sanitation crew.' };
      this.stats.cash -= cost;
      this.stats.cleanliness = Math.min(100, this.stats.cleanliness + 25);
      this.addEvent('Sanitation & Floor Buffing Crew', 'All concourses buffed to a sparkling shine. Cleanliness +25%', 'success');
      this.notify();
      return { success: true, message: 'Mall concourses sanitized.' };
    }

    if (action === 'security') {
      const cost = 350;
      if (this.stats.cash < cost) return { success: false, message: 'Insufficient funds for security patrols.' };
      this.stats.cash -= cost;
      this.stats.security = Math.min(100, this.stats.security + 20);
      this.addEvent('Concourse Patrols Reinforced', 'Security presence increased across all wings. Security +20%', 'success');
      this.notify();
      return { success: true, message: 'Security guards deployed.' };
    }

    if (action === 'campaign') {
      const cost = 600;
      if (this.stats.cash < cost) return { success: false, message: 'Insufficient funds for regional ad blitz.' };
      this.stats.cash -= cost;
      this.stats.reputation = Math.min(100, this.stats.reputation + 8);
      for (let i = 0; i < 16; i++) {
        this.spawnShopper();
      }
      this.addEvent('Regional Media Campaign', 'Mall billboards and social campaigns live. Wave of shoppers arriving!', 'success');
      this.notify();
      return { success: true, message: 'Ad campaign launched.' };
    }

    return { success: false, message: 'Unknown action.' };
  }

  public tick() {
    if (this.isPaused) return;

    const speed = this.simSpeed;

    // 1. Advance Simulation Time
    this.stats.dayTicks += speed;
    if (this.stats.dayTicks >= TICKS_PER_DAY) {
      this.stats.dayTicks = 0;
      this.stats.day += 1;

      if (this.stats.day > 7) {
        this.stats.day = 1;
        this.stats.week += 1;
        this.processWeeklyAccounting();
      }

      if (Math.random() < 0.25) {
        this.triggerDailyEvent();
      }

      this.notify();
    }

    // 2. Advance Deep Store Simulation State (Cinema Showtimes, Oven Baking, Keynote Stages)
    for (const store of this.stores) {
      store.promotionTicks = Math.max(0, store.promotionTicks - speed);
      // A. CINEMA MULTI-STAGE SHOWTIME SIMULATION
      if (store.tenant.id === 'cinema' && store.cinemaState) {
        const cs = store.cinemaState;
        cs.phaseTimer -= speed;

        if (cs.phaseTimer <= 0) {
          if (cs.phase === 'box_office_open') {
            cs.phase = 'doors_opening';
            cs.phaseTimer = 55;
            this.addEvent('Cinema Showtime Alert', `Auditorium doors opening for "${cs.currentMovie}"! Attendees taking seats.`, 'info');
          } else if (cs.phase === 'doors_opening') {
            cs.phase = 'screening_in_progress';
            cs.phaseTimer = 190;
            this.addEvent('Feature Film Rolling', `IMAX 4K Laser Projector active: "${cs.currentMovie}". Dolby Atmos sound roaring.`, 'info');
          } else if (cs.phase === 'screening_in_progress') {
            cs.phase = 'credits_rolling';
            cs.phaseTimer = 45;
            this.addEvent('Cinema Credits & Applause', `Credits rolling for "${cs.currentMovie}". Crowd thrilled!`, 'success');
          } else if (cs.phase === 'credits_rolling') {
            const currentIdx = CINEMA_MOVIES_LIST.findIndex((m) => m.title === cs.currentMovie);
            const nextMovie = CINEMA_MOVIES_LIST[(currentIdx + 1) % CINEMA_MOVIES_LIST.length];
            cs.currentMovie = nextMovie.title;
            cs.genre = nextMovie.genre;
            cs.ticketPrice = nextMovie.price;
            cs.screenGlowColor = nextMovie.glow;
            cs.ticketsSold = 0;
            cs.phase = 'box_office_open';
            cs.phaseTimer = 200;
            this.addEvent('Now Showing at Cinema', `Box office open for next feature: "${cs.currentMovie}" (${cs.genre}).`, 'info');
          }
        }
      }

      // B. SPECIAL EVENT CYCLES (Bakery, Trattoria, Tech Lab)
      if (store.specialEvent) {
        const ev = store.specialEvent;
        ev.progressPercent = (ev.progressPercent + 0.45 * speed) % 100;
        if (ev.progressPercent >= 98 && Math.random() < 0.05) {
          if (store.tenant.id === 'cafe_roastery' || store.tenant.id === 'cafe') {
            this.addEvent('Bakery Oven Ding', 'Fresh warm almond & butter croissants hot out of the oven at Juniper Roastery!', 'success');
          } else if (store.tenant.id === 'trattoria' || store.tenant.id === 'restaurant') {
            this.addEvent('Woodfired Oven Rush', 'Fresh artisan Truffle Margherita pizzas baking to perfection!', 'success');
          } else if (store.tenant.id === 'tech_apple' || store.tenant.id === 'tech') {
            this.addEvent('Tech Keynote Demonstration', 'Live 8K Hologram & Spatial Keynote on stage at Quantum Flagship!', 'info');
          }
        }
      }
    }

    // 3. Manage Shopper Lifecycle & Crowds
    const totalDraw = this.stores.reduce((sum, s) => sum + s.tenant.draw * (1 + (s.level - 1) * 0.5) * (s.promotionTicks > 0 ? 1.5 : 1) * (s.inventoryLevel < 15 ? 0.5 : 1), 0) + this.amenities.length * 3;
    const targetShopperCount = Math.min(110, Math.round(28 + totalDraw * 1.35 + (this.stats.reputation * 0.38)));

    if (this.shoppers.length < targetShopperCount && Math.random() < 0.38 * speed) {
      this.spawnShopper();
    }

    // 4. Update Shopper State Machines
    for (let i = this.shoppers.length - 1; i >= 0; i--) {
      const s = this.shoppers[i];
      updateShopperAgent(s, this.stores, this.floatingFx, speed, (amount) => {
        this.stats.cash += amount;
        this.stats.totalSales += amount;
      }, this.entrances);

      if (s.dead) {
        this.shoppers.splice(i, 1);
      }
    }

    // 5. Update Floating FX
    for (let i = this.floatingFx.length - 1; i >= 0; i--) {
      const fx = this.floatingFx[i];
      fx.y += fx.vy;
      fx.alpha -= 0.022 * speed;
      if (fx.alpha <= 0) {
        this.floatingFx.splice(i, 1);
      }
    }

    this.stats.activeShoppersCount = this.shoppers.length;
  }

  private processWeeklyAccounting() {
    const rentPerStore = 320;
    const rentRevenue = this.stores.reduce((sum, s) => sum + Math.round(rentPerStore * (1 + (s.level - 1) * 0.6)), 0);
    const amenityRevenue = this.amenities.reduce((sum, a) => sum + (a.earnings > 0 ? 55 : 15), 0);
    const payrollCost = this.stores.reduce((sum, store) => sum + Math.max(0, store.customStaffHired) * 85, 0);
    const maintenanceCost = Math.round(this.stores.length * 45 + this.units.length * 15 + (100 - this.stats.cleanliness) * 4 + payrollCost);
    const netProfit = rentRevenue + amenityRevenue - maintenanceCost;

    this.stats.cash += netProfit;
    this.stats.cleanliness = Math.max(15, Math.min(100, this.stats.cleanliness - (this.stores.length > 4 ? 3 : 2)));
    this.stats.security = Math.max(20, Math.min(100, this.stats.security - (this.shoppers.length > 35 ? 3 : 1)));

    playDoorBell();
    this.addEvent(
      `Week ${this.stats.week} Financial Statement`,
      `Base rent: $${rentRevenue.toLocaleString()} (${this.stores.length} stores) + Amenities: $${amenityRevenue.toLocaleString()}. Maintenance: -$${maintenanceCost.toLocaleString()}. Net: +$${netProfit.toLocaleString()}.`,
      'finance'
    );
  }

  private triggerDailyEvent() {
    const events = [
      {
        title: 'Dining Critic Rave Review',
        desc: 'Food critic praised the culinary offerings across the promenade and trattoria! Reputation +4.',
        action: () => {
          this.stats.reputation = Math.min(100, this.stats.reputation + 4);
          for (let i = 0; i < 10; i++) this.spawnShopper();
        }
      },
      {
        title: 'Municipal Beautification Grant',
        desc: 'Mall landscape & fountain architecture awarded municipal grant! +$500.',
        action: () => {
          this.stats.cleanliness = Math.min(100, this.stats.cleanliness + 10);
          this.stats.cash += 500;
        }
      },
      {
        title: 'Weekend Festival & Farmers Market',
        desc: 'Crowds flock to the Santana Row promenade and outdoor terraces.',
        action: () => {
          this.stats.reputation = Math.min(100, this.stats.reputation + 4);
          for (let i = 0; i < 14; i++) this.spawnShopper();
        }
      }
    ];

    const ev = events[Math.floor(Math.random() * events.length)];
    ev.action();
    this.addEvent(ev.title, ev.desc, 'info');
  }
}
