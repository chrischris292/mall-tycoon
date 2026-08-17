import { CustomWallTile, EscalatorInstance, HallwayStyle, MallAmenityInstance, MallEntrance, MallUnit } from './types';
import { TILE_SIZE } from './constants';

export type MallTemplateId = 'showcase' | 'blank' | 'small' | 'medium' | 'large';
export interface MallFloorDocument { id: string; name: string; level: number; elevation: number; }
export interface MallDesignDocument {
  version: 1; id: string; name: string; templateId: MallTemplateId; activeFloorId: string;
  floors: MallFloorDocument[]; units: MallUnit[];
  hallways: Array<{ x: number; y: number; style: HallwayStyle; floorId: string }>;
  walls: CustomWallTile[]; escalators: EscalatorInstance[]; amenities: MallAmenityInstance[]; entrances: MallEntrance[]; savedAt: number;
}
export interface MallTemplateDefinition { id: MallTemplateId; name: string; subtitle: string; icon: string; startingCash: number; scale: string; }

export const MALL_TEMPLATES: MallTemplateDefinition[] = [
  { id: 'showcase', name: 'Aurora Grand', subtitle: 'A fully operating flagship mall to explore', icon: 'A', startingCash: 28000, scale: 'SHOWCASE' },
  { id: 'small', name: 'Cedar Grove', subtitle: 'Intimate neighborhood mall with two anchors', icon: 'S', startingCash: 26000, scale: 'SMALL' },
  { id: 'medium', name: 'Lakeside Galleria', subtitle: 'Two courts, a loop concourse, and 18 spaces', icon: 'M', startingCash: 36000, scale: 'MEDIUM' },
  { id: 'large', name: 'Metropolitan Centre', subtitle: 'Four wings, four anchors, and expansion room', icon: 'L', startingCash: 52000, scale: 'LARGE' },
  { id: 'blank', name: 'Empty Development Site', subtitle: 'Build an original mall from the ground up', icon: '✦', startingCash: 40000, scale: 'CUSTOM' }
];

const floorId = 'floor_1';
const base = () => ({ version: 1 as const, id: `mall_${Date.now()}`, activeFloorId: floorId, floors: [{ id: floorId, name: 'Level 1', level: 1, elevation: 0 }], savedAt: Date.now() });
const unit = (name: string, x: number, y: number, w: number, h: number, door: 'north' | 'south' | 'east' | 'west'): MallUnit => {
  const doorway = door === 'north' ? { x: (x + w / 2) * TILE_SIZE, y: y * TILE_SIZE }
    : door === 'south' ? { x: (x + w / 2) * TILE_SIZE, y: (y + h) * TILE_SIZE }
    : door === 'east' ? { x: (x + w) * TILE_SIZE, y: (y + h / 2) * TILE_SIZE }
    : { x: x * TILE_SIZE, y: (y + h / 2) * TILE_SIZE };
  return [name, x, y, w, h, doorway, `space_${Math.random().toString(36).slice(2, 9)}`];
};
const hall = (x1: number, x2: number, y1: number, y2: number, style: HallwayStyle = 'terrazzo_mosaic') => {
  const tiles: MallDesignDocument['hallways'] = [];
  for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) tiles.push({ x, y, style, floorId });
  return tiles;
};
const amenity = (id: string, type: MallAmenityInstance['type'], name: string, icon: string, x: number, y: number, w = 1, h = 1): MallAmenityInstance => ({
  id, type, name, icon, x: x * TILE_SIZE, y: y * TILE_SIZE, w: w * TILE_SIZE, h: h * TILE_SIZE, placedAtWeek: 1, useCount: 0, earnings: 0
});
const entrance = (id: string, name: string, x: number, y: number, side: MallEntrance['side']): MallEntrance => ({
  id, name, x, y, side, mode: 'both', visitorsEntered: 0, visitorsExited: 0
});

const smallMall = (): MallDesignDocument => ({
  ...base(), name: 'Cedar Grove Mall', templateId: 'small',
  units: [
    unit('Cedar Market Anchor', 9, 16, 11, 16, 'east'), unit('Community Department Store', 60, 16, 11, 16, 'west'),
    unit('North Shop 101', 21, 16, 6, 6, 'south'), unit('North Shop 102', 28, 16, 6, 6, 'south'),
    unit('North Shop 103', 35, 16, 6, 6, 'south'), unit('North Shop 104', 42, 16, 7, 6, 'south'),
    unit('North Café Court', 50, 16, 9, 6, 'south'), unit('South Shop 105', 21, 27, 6, 6, 'north'),
    unit('South Shop 106', 28, 27, 6, 6, 'north'), unit('South Shop 107', 35, 27, 6, 6, 'north'),
    unit('South Shop 108', 42, 27, 7, 6, 'north'), unit('Family Restaurant', 50, 27, 9, 6, 'north')
  ],
  hallways: [...hall(19, 60, 22, 26), ...hall(37, 41, 27, 38)], walls: [], escalators: [],
  entrances: [entrance('cedar_west', 'West Main Entrance', 19, 24, 'west'), entrance('cedar_south', 'Garden Entrance', 39, 38, 'south')],
  amenities: [amenity('cedar_fountain', 'fountain_tier', 'Cedar Court Fountain', '⛲', 38.5, 23, 2, 2), amenity('cedar_bench', 'rest_bench', 'Community Court Seating', '🪑', 32, 24, 2, 1)]
});

const mediumMall = (): MallDesignDocument => ({
  ...base(), name: 'Lakeside Galleria', templateId: 'medium',
  units: [
    unit('West Fashion Anchor', 4, 14, 12, 20, 'east'), unit('East Department Anchor', 64, 14, 12, 20, 'west'),
    unit('Northwest 201', 17, 14, 6, 6, 'south'), unit('Northwest 202', 24, 14, 6, 6, 'south'),
    unit('North Court Dining', 31, 8, 8, 11, 'south'), unit('North Court Entertainment', 41, 8, 8, 11, 'south'),
    unit('Northeast 203', 50, 14, 6, 6, 'south'), unit('Northeast 204', 57, 14, 6, 6, 'south'),
    unit('Southwest 205', 17, 28, 6, 6, 'north'), unit('Southwest 206', 24, 28, 6, 6, 'north'),
    unit('South Court 207', 31, 30, 8, 7, 'north'), unit('South Court 208', 41, 30, 8, 7, 'north'),
    unit('Southeast 209', 50, 28, 6, 6, 'north'), unit('Southeast 210', 57, 28, 6, 6, 'north'),
    unit('Upper Loop 211', 24, 7, 6, 6, 'south'), unit('Upper Loop 212', 50, 7, 6, 6, 'south'),
    unit('Garden Restaurant', 31, 3, 8, 5, 'south'), unit('Cinema & Games', 41, 3, 8, 5, 'south')
  ],
  hallways: [
    ...hall(15, 64, 20, 27, 'marble_carrara'), ...hall(30, 50, 19, 22, 'glass_atrium'), ...hall(30, 50, 27, 29, 'glass_atrium'),
    ...hall(30, 34, 8, 20, 'marble_carrara'), ...hall(46, 50, 8, 20, 'marble_carrara'), ...hall(34, 46, 8, 12, 'marble_carrara'),
    ...hall(37, 43, 34, 42, 'outdoor_stone')
  ], walls: [],
  entrances: [entrance('lake_west', 'West Galleria Entrance', 15, 24, 'west'), entrance('lake_east', 'East Galleria Entrance', 64, 24, 'east'), entrance('lake_south', 'Garden Entrance', 40, 42, 'south')],
  escalators: [{ id: 'lake_escalator', type: 'escalator_glass', x: 39, y: 22, w: 2, h: 4, direction: 'dual' }],
  amenities: [amenity('lake_fountain_w', 'fountain_tier', 'West Court Fountain', '⛲', 24, 23, 2, 2), amenity('lake_fountain_e', 'fountain_tier', 'East Court Fountain', '⛲', 54, 23, 2, 2), amenity('lake_concierge', 'concierge_info', 'Lakeside Concierge', 'ℹ️', 36, 24)]
});

const largeMall = (): MallDesignDocument => ({
  ...base(), name: 'Metropolitan Centre', templateId: 'large',
  units: [
    unit('West Grand Anchor', 2, 16, 12, 17, 'east'), unit('East Grand Anchor', 66, 16, 12, 17, 'west'),
    unit('North Luxury Anchor', 34, 2, 12, 10, 'south'), unit('South Entertainment Anchor', 33, 37, 14, 9, 'north'),
    unit('West 301', 15, 15, 6, 6, 'south'), unit('West 302', 22, 15, 6, 6, 'south'), unit('Center NW 303', 29, 15, 6, 6, 'south'),
    unit('Center NE 304', 45, 15, 6, 6, 'south'), unit('East 305', 52, 15, 6, 6, 'south'), unit('East 306', 59, 15, 6, 6, 'south'),
    unit('West 307', 15, 28, 6, 6, 'north'), unit('West 308', 22, 28, 6, 6, 'north'), unit('Center SW 309', 29, 28, 6, 6, 'north'),
    unit('Center SE 310', 45, 28, 6, 6, 'north'), unit('East 311', 52, 28, 6, 6, 'north'), unit('East 312', 59, 28, 6, 6, 'north'),
    unit('Luxury West 313', 27, 8, 6, 6, 'east'), unit('Luxury East 314', 47, 8, 6, 6, 'west'),
    unit('Dining Terrace West', 25, 35, 7, 7, 'east'), unit('Dining Terrace East', 48, 35, 7, 7, 'west'),
    unit('Restaurant Collection A', 55, 35, 7, 6, 'north'), unit('Restaurant Collection B', 62, 35, 7, 6, 'north')
  ],
  hallways: [
    ...hall(13, 67, 21, 27, 'marble_carrara'), ...hall(35, 45, 12, 21, 'granite_dark'), ...hall(35, 45, 27, 37, 'glass_atrium'),
    ...hall(28, 52, 22, 26, 'glass_atrium'), ...hall(32, 48, 12, 15, 'granite_dark'), ...hall(32, 48, 34, 37, 'outdoor_stone'),
    ...hall(54, 70, 32, 34, 'outdoor_stone')
  ], walls: [],
  entrances: [entrance('metro_west', 'West Grand Entrance', 13, 24, 'west'), entrance('metro_east', 'East Grand Entrance', 67, 24, 'east'), entrance('metro_north', 'North Collection Entrance', 40, 12, 'north'), entrance('metro_south', 'Dining Terrace Entrance', 40, 37, 'south')],
  escalators: [
    { id: 'metro_escalator_n', type: 'escalator_glass', x: 38, y: 17, w: 2, h: 4, direction: 'dual' },
    { id: 'metro_escalator_s', type: 'escalator_glass', x: 41, y: 28, w: 2, h: 4, direction: 'dual' }
  ],
  amenities: [amenity('metro_center_fountain', 'fountain_tier', 'Metropolitan Grand Fountain', '⛲', 39, 23, 2, 2), amenity('metro_w_bench', 'rest_bench', 'West Court Seating', '🪑', 22, 24, 2, 1), amenity('metro_e_bench', 'rest_bench', 'East Court Seating', '🪑', 56, 24, 2, 1), amenity('metro_info', 'concierge_info', 'Grand Court Concierge', 'ℹ️', 36, 24)]
});

const showcaseMall = (): MallDesignDocument => {
  const mall = largeMall();
  return {
    ...mall,
    id: `mall_${Date.now()}`,
    name: 'Aurora Grand',
    templateId: 'showcase',
    units: mall.units.map((space, index) => [
      [
        'Aurora West Hall', 'Aurora East Hall', 'North Collection Flagship', 'Starlight Cinema & Social Club',
        'West Gallery 101', 'West Gallery 102', 'Innovation Court', 'Luxury Court', 'East Gallery 105', 'East Gallery 106',
        'West Gallery 107', 'West Gallery 108', 'Garden Court Café', 'Garden Court 110', 'East Gallery 111', 'East Gallery 112',
        'Maison Row West', 'Maison Row East', 'Dining Terrace West', 'Dining Terrace East', 'Restaurant Collection', 'Market Hall'
      ][index] || space[0],
      space[1], space[2], space[3], space[4], { ...space[5] }, `showcase_${index}`
    ]),
    amenities: [
      ...mall.amenities,
      amenity('aurora_coffee', 'coffee_cart', 'Aurora Espresso Bar', '☕', 30, 24, 2, 1),
      amenity('aurora_palms', 'palm_planter', 'Grand Court Palms', '🌴', 49, 24),
      amenity('aurora_restroom', 'luxury_restroom', 'Grand Court Restrooms', '🚻', 44, 31, 2, 2)
    ]
  };
};

export function createTemplateDocument(templateId: MallTemplateId): MallDesignDocument {
  if (templateId === 'showcase') return showcaseMall();
  if (templateId === 'small') return smallMall();
  if (templateId === 'medium') return mediumMall();
  if (templateId === 'large') return largeMall();
  if (templateId === 'blank') return { ...base(), name: 'My New Mall', templateId, units: [], hallways: [], walls: [], escalators: [], amenities: [], entrances: [] };
  return showcaseMall();
}
