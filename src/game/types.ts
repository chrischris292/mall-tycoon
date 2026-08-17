export type TenantCategory = 'Luxury' | 'Food' | 'Fashion' | 'Entertainment' | 'Specialty';

export type MechanicType =
  | 'dining_cafe'
  | 'dining_restaurant'
  | 'dining_asian_dumpling'
  | 'dining_ramen'
  | 'dining_boba'
  | 'fashion_boutique'
  | 'fashion_luxury'
  | 'fashion_streetwear'
  | 'tech_demo'
  | 'book_reading'
  | 'toy_playlab'
  | 'arcade_gaming'
  | 'cinema_theater'
  | 'department_anchor';

export type ArchitectToolMode =
  | 'select'
  | 'zone'
  | 'paint_hallway'
  | 'build_wall'
  | 'place_amenity'
  | 'place_escalator'
  | 'demolish';

export type HallwayStyle =
  | 'marble_carrara'
  | 'terrazzo_mosaic'
  | 'granite_dark'
  | 'chevron_wood'
  | 'outdoor_stone'
  | 'glass_atrium';

export interface CustomHallwayTile {
  x: number; // in tile grid units
  y: number; // in tile grid units
  style: HallwayStyle;
}

export interface CustomWallTile {
  x: number; // in tile grid units
  y: number; // in tile grid units
  type: 'glass_railing' | 'planter_wall' | 'pillar';
}

export interface EscalatorInstance {
  id: string;
  x: number; // grid x
  y: number; // grid y
  w: number; // width in tiles
  h: number; // height in tiles
  direction: 'up' | 'down' | 'dual';
  type: 'escalator_glass' | 'elevator_panoramic';
}

export interface CustomLotConfig {
  w: number;
  h: number;
  cost: number;
  name: string;
  flooring: 'hardwood' | 'tile_checker' | 'marble_dark' | 'carpet_retro' | 'plank_oak' | 'stone_patio';
  doorwayDir: 'north' | 'south' | 'east' | 'west' | 'auto';
  wallColor: string;
}

export type AmenityType =
  | 'fountain_tier'
  | 'palm_planter'
  | 'rest_bench'
  | 'atm_kiosk'
  | 'coffee_cart'
  | 'boba_pop_up'
  | 'bistro_dining_set'
  | 'luxury_restroom'
  | 'concierge_info';

export interface AmenityDefinition {
  type: AmenityType;
  name: string;
  category: 'Decor' | 'Utility' | 'Dining' | 'Comfort';
  icon: string;
  cost: number;
  w: number;
  h: number;
  reputationBonus: number;
  description: string;
  effect: string;
}

export interface MallAmenityInstance {
  id: string;
  type: AmenityType;
  x: number; // in pixels
  y: number; // in pixels
  w: number; // in pixels
  h: number; // in pixels
  name: string;
  icon: string;
  placedAtWeek: number;
  occupantId?: string | null;
  useCount: number;
  earnings: number;
}

export interface StoreUpgradeTier {
  tier: number;
  name: string;
  cost: number;
  seatingBonus: number;
  staffCount: number;
  revenueMultiplier: number;
  drawBonus: number;
  features: string[];
  signatureItem: string;
}

export interface TenantDefinition {
  id: string;
  name: string;
  cat: TenantCategory;
  icon: string;
  color: string;
  cost: number;
  draw: number;
  w: number;
  h: number;
  baseIncome: number;
  itemDescription: string;
  mechanicType: MechanicType;
  baseSeatingPerTile: number;
  baseStaff: number;
  signatureItem: string;
  upgrades: StoreUpgradeTier[];
}

export type MallUnit = [
  wing: string,
  gridX: number,
  gridY: number,
  widthTiles: number,
  heightTiles: number,
  doorway: { x: number; y: number },
  customId?: string
];

export interface StoreTable {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'round_cafe' | 'wood_booth' | 'cinema_row' | 'arcade_unit' | 'demo_bench' | 'armchair' | 'fitting_room' | 'toy_table' | 'vr_station' | 'tv_wall_spot' | 'jewelry_display';
  seats: Array<{
    id: string;
    x: number;
    y: number;
    occupiedBy: string | null;
  }>;
  hasMeal: boolean;
}

export interface StoreStaff {
  id: string;
  x: number;
  y: number;
  role: string;
  isBusy: boolean;
}

export interface CinemaShowtimeState {
  currentMovie: string;
  genre: string;
  phase: 'box_office_open' | 'doors_opening' | 'screening_in_progress' | 'credits_rolling';
  phaseTimer: number; // in game ticks
  ticketsSold: number;
  auditoriumCapacity: number;
  ticketPrice: number;
  screenGlowColor: string;
}

export interface StoreSimulationEvent {
  title: string;
  subtitle: string;
  progressPercent: number;
  isActive: boolean;
  statusBadge: string;
}

export interface StoreInterior {
  doorway: { x: number; y: number };
  counter: {
    x: number;
    y: number;
    w: number;
    h: number;
    registerX: number;
    registerY: number;
  };
  queueSlots: Array<{ x: number; y: number }>;
  stanchions: Array<{ x: number; y: number }>;
  tables: StoreTable[];
  staff: StoreStaff[];
  fixtures: Array<{
    x: number;
    y: number;
    w: number;
    h: number;
    type: string;
    color: string;
    label?: string;
  }>;
  flooringType: 'hardwood' | 'tile_checker' | 'marble_dark' | 'carpet_retro' | 'plank_oak' | 'stone_patio';
}

export interface StoreInstance {
  id: string;
  tenant: TenantDefinition;
  unit: MallUnit;
  level: number; // 1, 2, or 3
  staffCount: number;
  totalRevenue: number;
  shoppersServed: number;
  customerSatisfaction: number;
  currentQueue: string[]; // array of shopper IDs
  interior: StoreInterior;
  placedAtWeek: number;
  customStaffHired: number;
  // Deep Simulation Dynamic State
  cinemaState?: CinemaShowtimeState;
  specialEvent?: StoreSimulationEvent;
}

export type ShopperState =
  | 'spawning'
  | 'navigating_hallway'
  | 'entering_store'
  | 'in_queue'
  | 'ordering_at_counter'
  | 'waiting_for_showtime'
  | 'watching_movie'
  | 'walking_to_seat'
  | 'dining_or_browsing'
  | 'using_amenity'
  | 'leaving_store'
  | 'exiting_mall';

export interface PathNode {
  x: number;
  y: number;
}

export interface ShopperAgent {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  currentPath: PathNode[];
  pathIndex: number;
  state: ShopperState;
  speed: number;
  size: number;
  shirtColor: string;
  skinColor: string;
  hairColor: string;
  hasBag: boolean;
  hasDrink: boolean;
  hasPopcorn: boolean;
  walkCycle: number;
  targetStoreId: string | null;
  targetAmenityId: string | null;
  assignedTableId: string | null;
  assignedSeatId: string | null;
  timer: number;
  bubble: { icon: string; text: string } | null;
  bubbleTimer: number;
  visitedCount: number;
  dead: boolean;
}

export interface FloatingEffect {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
}

export interface MallStats {
  cash: number;
  week: number;
  day: number;
  dayTicks: number;
  reputation: number;
  cleanliness: number;
  security: number;
  totalSales: number;
  activeShoppersCount: number;
  customLotsCount: number;
}

export interface MallEvent {
  id: string;
  title: string;
  description: string;
  timeStr: string;
  type: 'info' | 'success' | 'warning' | 'finance';
}
