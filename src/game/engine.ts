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
  HallwayStyle
} from './types';
import { TICKS_PER_DAY, UNITS_LIST, TENANTS_CATALOG, TILE_SIZE, AMENITIES_CATALOG, CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';
import { createStoreInstance, generateStoreInterior } from './store';
import { createShopperAgent, updateShopperAgent } from './shopper';
import { playPlaceSound, playUpgradeSound, playDoorBell, playErrorSound, playCashSound } from './sound';
import { rebuildNavGraph } from './pathfinding';

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
  public shoppers: ShopperAgent[] = [];
  public floatingFx: FloatingEffect[] = [];
  public stats: MallStats;
  public events: MallEvent[] = [];

  // Architect Tooling & Selection State
  public architectMode: ArchitectToolMode = 'select';
  public activeHallwayStyle: HallwayStyle = 'marble_carrara';
  public activeWallType: 'glass_railing' | 'planter_wall' | 'pillar' = 'glass_railing';
  public activeEscalatorType: 'escalator_glass' | 'elevator_panoramic' = 'escalator_glass';
  public selectedTenant: TenantDefinition | null = null;
  public selectedAmenity: AmenityDefinition | null = null;
  public customLotConfig = { w: 6, h: 5, name: 'Custom Commercial Lot', cost: 550 };
  public hoveredUnit: MallUnit | null = null;
  public hoveredTile: { x: number; y: number } | null = null;
  public inspectedStore: StoreInstance | null = null;
  public inspectedAmenity: MallAmenityInstance | null = null;

  public simSpeed = 1;
  public isPaused = false;

  private onStateChange?: () => void;

  constructor(onStateChange?: () => void) {
    this.onStateChange = onStateChange;
    this.stats = {
      cash: 18500,
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

    // Initialize units with authentic Westfield Valley Fair layout
    this.units = UNITS_LIST.map((u, i) => [u[0], u[1], u[2], u[3], u[4], { ...u[5] }, `u_${i}`]);

    // 1. Seed ShowPlace ICON Cinema & Lounge (Unit 21 in Outdoor Dining Promenade)
    const cinemaTenant = TENANTS_CATALOG.find((t) => t.id === 'cinema')!;
    const cinemaUnit = this.units[21];
    if (cinemaUnit) {
      this.stores.push(createStoreInstance(cinemaTenant, cinemaUnit));
    }

    // 2. Seed Din Tai Fung Dumpling House (Unit 20 in Outdoor Dining Promenade)
    const dumplingTenant = TENANTS_CATALOG.find((t) => t.id === 'dumpling_house')!;
    const dumplingUnit = this.units[20];
    if (dumplingUnit) {
      this.stores.push(createStoreInstance(dumplingTenant, dumplingUnit));
    }

    // 3. Seed Maison De L'Étoile Haute Couture (Unit 5 in North Luxury Collection)
    const luxuryTenant = TENANTS_CATALOG.find((t) => t.id === 'luxury_maison')!;
    const luxuryUnit = this.units[5];
    if (luxuryUnit) {
      this.stores.push(createStoreInstance(luxuryTenant, luxuryUnit));
    }

    // 4. Seed Horizon Quantum Tech Flagship (Unit 10 in West Innovation Galleria)
    const techTenant = TENANTS_CATALOG.find((t) => t.id === 'tech_apple')!;
    const techUnit = this.units[10];
    if (techUnit) {
      this.stores.push(createStoreInstance(techTenant, techUnit));
    }

    // 5. Seed Juniper Coffee & Bakery Roastery (Unit 0 in Center Court Rotunda)
    const coffeeTenant = TENANTS_CATALOG.find((t) => t.id === 'cafe_roastery')!;
    const coffeeUnit = this.units[0];
    if (coffeeUnit) {
      this.stores.push(createStoreInstance(coffeeTenant, coffeeUnit));
    }

    // 6. Seed Round 1 Cyber VR & Arcade Arena (Unit 25 in South Entertainment Wing)
    const arcadeTenant = TENANTS_CATALOG.find((t) => t.id === 'arcade_neon')!;
    const arcadeUnit = this.units[25];
    if (arcadeUnit) {
      this.stores.push(createStoreInstance(arcadeTenant, arcadeUnit));
    }

    // 7. Seed Bloomingdale's 3-Level Anchor (Unit 4 in North Wing)
    const bloomTenant = TENANTS_CATALOG.find((t) => t.id === 'department_bloom')!;
    const bloomUnit = this.units[4];
    if (bloomUnit) {
      this.stores.push(createStoreInstance(bloomTenant, bloomUnit));
    }

    // Seed Initial Concourse Amenities (Fountain, Coffee kiosk, Boba kiosk, Planters)
    this.amenities.push({
      id: 'amen_fountain_1',
      type: 'fountain_tier',
      name: 'Rotunda Dancing Water Fountain',
      icon: '⛲',
      x: 39 * TILE_SIZE,
      y: 23 * TILE_SIZE,
      w: 2 * TILE_SIZE,
      h: 2 * TILE_SIZE,
      placedAtWeek: 1,
      useCount: 165,
      earnings: 0
    });

    this.amenities.push({
      id: 'amen_espresso_1',
      type: 'coffee_cart',
      name: 'West Nordstrom Promenade Espresso',
      icon: '☕',
      x: 20 * TILE_SIZE,
      y: 23.5 * TILE_SIZE,
      w: 2 * TILE_SIZE,
      h: 1 * TILE_SIZE,
      placedAtWeek: 1,
      useCount: 112,
      earnings: 560
    });

    this.amenities.push({
      id: 'amen_boba_1',
      type: 'boba_pop_up',
      name: 'Outdoor Promenade Tiger Boba',
      icon: '🧋',
      x: 58 * TILE_SIZE,
      y: 10 * TILE_SIZE,
      w: 2 * TILE_SIZE,
      h: 1 * TILE_SIZE,
      placedAtWeek: 1,
      useCount: 128,
      earnings: 720
    });

    // Seed signature escalators
    this.escalators.push({
      id: 'esc_rotunda_main',
      type: 'escalator_glass',
      x: 39,
      y: 26,
      w: 2,
      h: 3,
      direction: 'dual'
    });

    // Rebuild initial navigation graph based on all placed units, amenities, and custom hallways
    rebuildNavGraph(this.units, this.amenities, this.customHallways);

    // Spawn opening crowd of shoppers
    for (let i = 0; i < 42; i++) {
      this.shoppers.push(createShopperAgent(this.stores));
    }

    this.addEvent(
      'Westfield Valley Fair Grand Masterplan',
      'Authentic Valley Fair floorplan active! Center Rotunda, North Luxury, West Nordstrom, East Macy’s, and Outdoor Dining Promenade are open.',
      'info'
    );
  }

  public setCallback(cb: () => void) {
    this.onStateChange = cb;
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

  public demolishAt(canvasX: number, canvasY: number): { success: boolean; message: string } {
    const tileX = Math.floor(canvasX / TILE_SIZE);
    const tileY = Math.floor(canvasY / TILE_SIZE);

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
        this.shoppers.push(createShopperAgent(this.stores));
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
    const totalDraw = this.stores.reduce((sum, s) => sum + s.tenant.draw * (1 + (s.level - 1) * 0.5), 0) + this.amenities.length * 3;
    const targetShopperCount = Math.min(110, Math.round(28 + totalDraw * 1.35 + (this.stats.reputation * 0.38)));

    if (this.shoppers.length < targetShopperCount && Math.random() < 0.38 * speed) {
      this.shoppers.push(createShopperAgent(this.stores));
    }

    // 4. Update Shopper State Machines
    for (let i = this.shoppers.length - 1; i >= 0; i--) {
      const s = this.shoppers[i];
      updateShopperAgent(s, this.stores, this.floatingFx, speed, (amount) => {
        this.stats.cash += amount;
        this.stats.totalSales += amount;
      });

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
    const maintenanceCost = Math.round(this.stores.length * 45 + this.units.length * 15 + (100 - this.stats.cleanliness) * 4);
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
          for (let i = 0; i < 10; i++) this.shoppers.push(createShopperAgent(this.stores));
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
          for (let i = 0; i < 14; i++) this.shoppers.push(createShopperAgent(this.stores));
        }
      }
    ];

    const ev = events[Math.floor(Math.random() * events.length)];
    ev.action();
    this.addEvent(ev.title, ev.desc, 'info');
  }
}
