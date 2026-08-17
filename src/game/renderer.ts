import {
  StoreInstance,
  ShopperAgent,
  FloatingEffect,
  MallUnit,
  TenantDefinition,
  MallAmenityInstance,
  AmenityDefinition,
  ArchitectToolMode,
  CustomHallwayTile,
  CustomWallTile,
  EscalatorInstance,
  HallwayStyle,
  MallEntrance
} from './types';
import { TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT, ENTRANCES } from './constants';

export class MallRenderer {
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  public render(
    units: MallUnit[],
    stores: StoreInstance[],
    amenities: MallAmenityInstance[],
    customHallways: CustomHallwayTile[],
    customWalls: CustomWallTile[],
    escalators: EscalatorInstance[],
    entrances: MallEntrance[],
    shoppers: ShopperAgent[],
    floatingFx: FloatingEffect[],
    selectedTenant: TenantDefinition | null,
    selectedAmenity: AmenityDefinition | null,
    architectMode: ArchitectToolMode,
    activeHallwayStyle: HallwayStyle,
    activeWallType: 'glass_railing' | 'planter_wall' | 'pillar',
    customLotConfig: { w: number; h: number; cost: number; name: string },
    hoveredUnit: MallUnit | null,
    hoveredTile: { x: number; y: number } | null,
    inspectedStore: StoreInstance | null,
    inspectedAmenity: MallAmenityInstance | null,
    blueprintMode: boolean,
    templateId: string
  ) {
    renderMallCanvas(
      this.ctx,
      units,
      stores,
      amenities,
      customHallways,
      customWalls,
      escalators,
      entrances,
      shoppers,
      floatingFx,
      hoveredUnit,
      hoveredTile,
      selectedTenant,
      selectedAmenity,
      architectMode,
      activeHallwayStyle,
      activeWallType,
      customLotConfig,
      inspectedStore,
      inspectedAmenity,
      blueprintMode,
      templateId
    );
  }
}

export function renderMallCanvas(
  ctx: CanvasRenderingContext2D,
  units: MallUnit[],
  stores: StoreInstance[],
  amenities: MallAmenityInstance[],
  customHallways: CustomHallwayTile[],
  customWalls: CustomWallTile[],
  escalators: EscalatorInstance[],
  entrances: MallEntrance[],
  shoppers: ShopperAgent[],
  floatingFx: FloatingEffect[],
  hoveredUnit: MallUnit | null,
  hoveredTile: { x: number; y: number } | null,
  selectedTenant: TenantDefinition | null,
  selectedAmenity: AmenityDefinition | null,
  architectMode: ArchitectToolMode,
  activeHallwayStyle: HallwayStyle,
  activeWallType: 'glass_railing' | 'planter_wall' | 'pillar',
  customLotConfig: { w: number; h: number; cost: number; name: string },
  inspectedStore: StoreInstance | null,
  inspectedAmenity: MallAmenityInstance | null,
  blueprintMode: boolean,
  templateId: string
) {
  const T = TILE_SIZE;
  const time = performance.now() * 0.002;

  // 1. Exterior Landscaped Perimeter & Valet Courts
  drawExteriorPerimeter(ctx, T, time);

  if (blueprintMode) drawBlueprintGrid(ctx, T);

  // Every mall, including the showcase, is rendered from authored spaces and corridors.
  drawGeneratedMallShell(ctx, T, units, customHallways);

  // 3. Custom Player-Painted Concourse Hallways
  drawCustomHallways(ctx, T, customHallways);

  // 4. Grand Center Court Rotunda, Dancing Fountain & Skylight

  // 5. Placed Escalators & Panoramic Glass Elevators
  drawEscalatorsAndElevators(ctx, T, escalators, time);

  // 6. Placed Concourse Amenities (Fountains, Carts, Planters, Restrooms)
  for (const amen of amenities) {
    drawAmenityInstance(ctx, amen, inspectedAmenity?.id === amen.id, time);
  }

  // 7. Architectural Walls, Glass Railings, & Planter Partitions
  drawCustomWalls(ctx, T, customWalls);

  // Purpose-built visitor portals anchor the shopper lifecycle to the authored mall.
  for (const entrance of entrances) drawMallEntrance(ctx, entrance, time);

  // 8. Vacant Storefront Lots & Placement Previews
  drawUnitOutlines(ctx, T, units, stores, hoveredUnit, selectedTenant, architectMode);

  // 9. Active Store Interiors (Counters, Velvet Ropes, Stanchions, Cinema Screens, Projector Beams, Tables, Fixtures)
  for (const store of stores) {
    drawStoreInterior(ctx, store, inspectedStore?.id === store.id, time);
  }

  // 10. Architect Tool Mode Active Previews (Zoning Box, Hallway Brush, Amenity Ghost, Demolish Hazard)
  if (hoveredTile) {
    drawArchitectModePreview(
      ctx,
      T,
      architectMode,
      hoveredTile,
      customLotConfig,
      selectedAmenity,
      activeHallwayStyle,
      activeWallType,
      units,
      stores,
      amenities,
      customHallways,
      customWalls
    );
  }

  // 11. Shopper Agents (Avatars, Bags, Popcorn, Queueing, Speech Bubbles)
  for (const shopper of shoppers) {
    drawShopper(ctx, shopper);
  }

  // 12. Floating Cash & Particle FX
  for (const fx of floatingFx) {
    drawFloatingEffect(ctx, fx);
  }

  // 13. Grand Portals & Architectural Entrances
}

function drawBlueprintGrid(ctx: CanvasRenderingContext2D, T: number) {
  ctx.save();
  ctx.strokeStyle = 'rgba(125,211,252,.13)';
  ctx.lineWidth = 1;
  for (let x = T; x < CANVAS_WIDTH; x += T) {
    ctx.beginPath(); ctx.moveTo(x, T); ctx.lineTo(x, CANVAS_HEIGHT - T); ctx.stroke();
  }
  for (let y = T; y < CANVAS_HEIGHT; y += T) {
    ctx.beginPath(); ctx.moveTo(T, y); ctx.lineTo(CANVAS_WIDTH - T, y); ctx.stroke();
  }
  ctx.restore();
}

function drawGeneratedMallShell(ctx: CanvasRenderingContext2D, T: number, units: MallUnit[], hallways: CustomHallwayTile[]) {
  if (!units.length && !hallways.length) {
    ctx.fillStyle = 'rgba(15,23,42,.78)';
    ctx.fillRect(7 * T, 6 * T, 66 * T, 36 * T);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    ctx.strokeRect(7 * T, 6 * T, 66 * T, 36 * T);
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EMPTY DEVELOPMENT SITE · OPEN BLUEPRINT TO BEGIN', 40 * T, 24 * T);
    return;
  }

  // Build the shell as a union of actual spaces and circulation instead of one
  // bounding rectangle. Wings, courts, and expansion edges therefore read naturally.
  ctx.save();
  ctx.fillStyle = '#182233';
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  for (const u of units) {
    const pad = 7;
    ctx.fillRect(u[1] * T - pad, u[2] * T - pad, u[3] * T + pad * 2, u[4] * T + pad * 2);
    ctx.strokeRect(u[1] * T - pad, u[2] * T - pad, u[3] * T + pad * 2, u[4] * T + pad * 2);
  }
  for (const h of hallways) ctx.fillRect(h.x * T - 4, h.y * T - 4, T + 8, T + 8);

  // Brass threshold markers make open concourse ends read as intentional entrances.
  const occupied = new Set(hallways.map((h) => `${h.x},${h.y}`));
  ctx.fillStyle = '#d6a756';
  for (const h of hallways) {
    const neighbors = [[1,0],[-1,0],[0,1],[0,-1]].filter(([dx,dy]) => occupied.has(`${h.x + dx},${h.y + dy}`)).length;
    if (neighbors <= 1) ctx.fillRect(h.x * T + 5, h.y * T + 5, T - 10, T - 10);
  }
  ctx.restore();
}

// -------------------------------------------------------------
// 1. EXTERIOR PERIMETER & LANDSCAPING
// -------------------------------------------------------------
function drawExteriorPerimeter(ctx: CanvasRenderingContext2D, T: number, time: number) {
  // Lush Green Grounds
  ctx.fillStyle = '#14281d';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Striped turf lawn detailing
  ctx.fillStyle = '#193325';
  for (let y = 0; y < CANVAS_HEIGHT; y += 32) {
    if ((y / 32) % 2 === 0) {
      ctx.fillRect(0, y, CANVAS_WIDTH, 16);
    }
  }

  // Valet Drop-off Courts & Driveways (North, South, Stevens Creek West, Winchester East, Outdoor Dining Plaza)
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(36.0 * T, 0, 8.0 * T, 2.0 * T); // North Luxury Valet
  ctx.fillRect(36.0 * T, 46.0 * T, 8.0 * T, 2.0 * T); // South Winchester Valet & Garage Deck
  ctx.fillRect(0, 21.0 * T, 2.0 * T, 6.0 * T); // West Stevens Creek Grand Portal Valet
  ctx.fillRect(78.0 * T, 21.0 * T, 2.0 * T, 6.0 * T); // East Winchester Grand Portal
  ctx.fillRect(77.5 * T, 7.5 * T, 2.5 * T, 6.0 * T); // Outdoor Dining Promenade Portal

  // Asphalt Perimeter Access Roads
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 14;
  ctx.strokeRect(10, 10, CANVAS_WIDTH - 20, CANVAS_HEIGHT - 20);

  // Road Lane Dividers
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([8, 8]);
  ctx.strokeRect(10, 10, CANVAS_WIDTH - 20, CANVAS_HEIGHT - 20);
  ctx.setLineDash([]);

  // Landscaping Trees & Palms along exterior
  const trees = [
    [2.0, 4.0], [2.0, 10.0], [2.0, 15.0], [2.0, 32.0], [2.0, 38.0], [2.0, 44.0],
    [10.0, 3.0], [18.0, 3.0], [26.0, 3.0], [32.0, 2.0], [48.0, 2.0],
    [78.0, 3.0], [78.0, 16.0], [78.0, 32.0], [78.0, 38.0], [78.0, 44.0],
    [10.0, 45.0], [18.0, 45.0], [26.0, 45.0], [32.0, 46.0], [48.0, 46.0], [56.0, 45.0], [64.0, 45.0], [72.0, 45.0]
  ];

  for (const [tx, ty] of trees) {
    const px = tx * T;
    const py = ty * T;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(px + 4, py + 6, 14, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.arc(px, py - 3, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(px - 3, py - 6, 7, 0, Math.PI * 2);
    ctx.fill();
  }
}

// -------------------------------------------------------------
// 2. WESTFIELD VALLEY FAIR BUILDING FOOTPRINT & MASTER WINGS
// -------------------------------------------------------------
function drawValleyFairBuildingFootprint(ctx: CanvasRenderingContext2D, T: number, time: number) {
  drawDirectoryInspiredValleyFair(ctx, T, time);
  return;
  // Heavy Building Foundation Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.fillRect(32.5 * T + 10, 2.0 * T + 10, 15.0 * T, 16.5 * T); // North Luxury
  ctx.fillRect(2.0 * T + 10, 18.0 * T + 10, 30.5 * T, 12.0 * T); // West Nordstrom
  ctx.fillRect(47.5 * T + 10, 18.0 * T + 10, 30.5 * T, 12.0 * T); // East Macy's
  ctx.fillRect(48.0 * T + 10, 2.0 * T + 10, 30.0 * T, 16.5 * T); // Outdoor Dining Promenade & Cinema
  ctx.fillRect(31.0 * T + 10, 29.5 * T + 10, 18.0 * T, 17.0 * T); // South Entertainment
  ctx.beginPath();
  ctx.arc(40.0 * T + 10, 24.0 * T + 10, 9.0 * T, 0, Math.PI * 2);
  ctx.fill();

  // Outer Architectural Facade Walls (Dark Slate & Limestone)
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(32.5 * T, 2.0 * T, 15.0 * T, 16.5 * T); // North Luxury
  ctx.fillRect(2.0 * T, 18.0 * T, 30.5 * T, 12.0 * T); // West Nordstrom
  ctx.fillRect(47.5 * T, 18.0 * T, 30.5 * T, 12.0 * T); // East Macy's
  ctx.fillRect(48.0 * T, 2.0 * T, 30.0 * T, 16.5 * T); // Outdoor Dining Promenade & Cinema
  ctx.fillRect(31.0 * T, 29.5 * T, 18.0 * T, 17.0 * T); // South Entertainment
  ctx.beginPath();
  ctx.arc(40.0 * T, 24.0 * T, 9.0 * T, 0, Math.PI * 2);
  ctx.fill();

  // -------------------------------------------------------------
  // Wing Flooring Treatments:
  // -------------------------------------------------------------

  // 1. North Luxury Collection: Nero Marquina & Gold Trim
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(33.0 * T, 2.5 * T, 14.0 * T, 15.5 * T);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(38.5 * T, 2.5 * T, 3.0 * T, 15.5 * T); // Luxury Concourse Spine
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 2;
  ctx.strokeRect(38.8 * T, 2.5 * T, 2.4 * T, 15.5 * T);

  // Bloomingdale's Anchor Footprint (Top North)
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(34.0 * T, 2.5 * T, 12.0 * T, 6.0 * T);
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(34.0 * T, 2.5 * T, 12.0 * T, 6.0 * T);

  // 2. West Wing: Carrara White Marble (Nordstrom & Tech Innovation)
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(2.5 * T, 18.5 * T, 29.5 * T, 11.0 * T);
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(2.5 * T, 22.5 * T, 29.5 * T, 3.0 * T); // West Concourse Spine

  // Nordstrom Anchor Footprint (Far West)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(2.5 * T, 18.5 * T, 11.5 * T, 11.0 * T);
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(2.5 * T, 18.5 * T, 11.5 * T, 11.0 * T);

  // 3. East Wing: Macy's & Fashion Galleria
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(48.0 * T, 18.5 * T, 29.5 * T, 11.0 * T);
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(48.0 * T, 22.5 * T, 29.5 * T, 3.0 * T); // East Concourse Spine

  // Macy's Anchor Footprint (Far East)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(66.5 * T, 18.5 * T, 11.0 * T, 11.0 * T);
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(66.5 * T, 18.5 * T, 11.0 * T, 11.0 * T);

  // 4. Outdoor Dining Promenade & ShowPlace ICON Cinema (Valley Fair 2020 Expansion)
  // Outdoor Pavers & Terracotta Plaza
  ctx.fillStyle = '#fef3c7';
  ctx.fillRect(48.5 * T, 2.5 * T, 29.0 * T, 15.5 * T);
  
  // Outdoor Dining Pedestrian Promenade Concourse (Warm Sandstone Pavers)
  ctx.fillStyle = '#fed7aa';
  ctx.fillRect(48.5 * T, 8.5 * T, 20.0 * T, 4.0 * T);
  ctx.fillRect(66.0 * T, 8.5 * T, 11.5 * T, 4.0 * T);

  // ShowPlace ICON Cinema Multiplex Footprint (North-East Corner of Promenade)
  ctx.fillStyle = '#1e1b4b'; // Midnight Velvet Carpet
  ctx.fillRect(67.0 * T, 2.5 * T, 10.5 * T, 8.5 * T);
  ctx.strokeStyle = '#818cf8';
  ctx.lineWidth = 2;
  ctx.strokeRect(67.0 * T, 2.5 * T, 10.5 * T, 8.5 * T);

  // Cinema Grand Marquee Canopy
  ctx.fillStyle = '#312e81';
  ctx.fillRect(67.0 * T, 10.0 * T, 10.5 * T, 1.5 * T);
  ctx.fillStyle = '#facc15';
  ctx.font = 'bold 8px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('★ SHOWPLACE ICON CINEMAS & LOUNGE ★', 72.25 * T, 11.1 * T);

  // Outdoor String Bistro Lights over Dining Promenade
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.65)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(49.0 * T, 8.5 * T);
  ctx.quadraticCurveTo(58.0 * T, 9.5 * T, 67.0 * T, 8.5 * T);
  ctx.stroke();

  for (let lx = 50.0 * T; lx <= 66.0 * T; lx += 20) {
    const ly = 8.5 * T + Math.sin((lx - 50.0 * T) * 0.05) * 6;
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(lx, ly, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 5. South Wing: Entertainment, Round 1 Arcade & Botanical
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(31.5 * T, 30.0 * T, 17.0 * T, 16.0 * T);
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(38.5 * T, 30.0 * T, 3.0 * T, 16.0 * T); // South Concourse Spine

  // Round 1 Arcade Floor (Neon Purple & Cyan)
  ctx.fillStyle = '#2e1065';
  ctx.fillRect(31.5 * T, 31.0 * T, 7.0 * T, 6.5 * T);
  ctx.strokeStyle = '#a855f7';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(31.5 * T, 31.0 * T, 7.0 * T, 6.5 * T);

  // Ceiling Skylight Trusses across Corridors
  ctx.strokeStyle = 'rgba(203, 213, 225, 0.45)';
  ctx.lineWidth = 2;
  // North Skylight
  for (let y = 3.0 * T; y <= 17.0 * T; y += 28) {
    ctx.beginPath();
    ctx.moveTo(38.5 * T, y);
    ctx.lineTo(41.5 * T, y);
    ctx.stroke();
  }
  // South Skylight
  for (let y = 30.5 * T; y <= 45.0 * T; y += 28) {
    ctx.beginPath();
    ctx.moveTo(38.5 * T, y);
    ctx.lineTo(41.5 * T, y);
    ctx.stroke();
  }
  // West Skylight
  for (let x = 3.5 * T; x <= 31.0 * T; x += 28) {
    ctx.beginPath();
    ctx.moveTo(x, 22.5 * T);
    ctx.lineTo(x, 25.5 * T);
    ctx.stroke();
  }
  // East Skylight
  for (let x = 48.5 * T; x <= 76.5 * T; x += 28) {
    ctx.beginPath();
    ctx.moveTo(x, 22.5 * T);
    ctx.lineTo(x, 25.5 * T);
    ctx.stroke();
  }
}

// Current-directory-inspired footprint: the real center reads as a long, bent
// east/west gallery with offset anchor courts and additions, not a plus sign.
function drawDirectoryInspiredValleyFair(ctx: CanvasRenderingContext2D, T: number, time: number) {
  const traceShell = () => {
    ctx.beginPath();
    ctx.moveTo(3 * T, 8 * T);
    ctx.lineTo(16 * T, 8 * T);
    ctx.lineTo(16 * T, 14 * T);
    ctx.lineTo(31 * T, 14 * T);
    ctx.lineTo(31 * T, 4 * T);
    ctx.lineTo(48 * T, 4 * T);
    ctx.lineTo(48 * T, 2 * T);
    ctx.lineTo(70 * T, 2 * T);
    ctx.lineTo(70 * T, 13 * T);
    ctx.lineTo(78 * T, 16 * T);
    ctx.lineTo(78 * T, 30 * T);
    ctx.lineTo(72 * T, 30 * T);
    ctx.lineTo(72 * T, 42 * T);
    ctx.lineTo(44 * T, 42 * T);
    ctx.lineTo(44 * T, 40 * T);
    ctx.lineTo(31 * T, 40 * T);
    ctx.lineTo(31 * T, 44 * T);
    ctx.lineTo(18 * T, 44 * T);
    ctx.lineTo(18 * T, 31 * T);
    ctx.lineTo(14 * T, 31 * T);
    ctx.lineTo(14 * T, 29 * T);
    ctx.lineTo(3 * T, 29 * T);
    ctx.closePath();
  };

  ctx.save();
  ctx.translate(10, 10);
  traceShell();
  ctx.fillStyle = 'rgba(0,0,0,.55)';
  ctx.fill();
  ctx.restore();

  traceShell();
  ctx.fillStyle = '#1e293b';
  ctx.fill();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Main gallery bends upward through Center Court into the luxury expansion.
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 7 * T;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(14 * T, 23 * T);
  ctx.bezierCurveTo(25 * T, 23 * T, 29 * T, 24 * T, 38 * T, 24 * T);
  ctx.bezierCurveTo(48 * T, 24 * T, 52 * T, 20 * T, 57 * T, 20 * T);
  ctx.lineTo(68 * T, 23 * T);
  ctx.stroke();

  // Restaurant/luxury loop and south-west Macy's Men's spur.
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 5 * T;
  ctx.beginPath();
  ctx.moveTo(35 * T, 20 * T);
  ctx.bezierCurveTo(34 * T, 14 * T, 40 * T, 9 * T, 49 * T, 10 * T);
  ctx.bezierCurveTo(57 * T, 11 * T, 61 * T, 14 * T, 61 * T, 18 * T);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(34 * T, 27 * T);
  ctx.bezierCurveTo(33 * T, 32 * T, 29 * T, 34 * T, 25 * T, 34 * T);
  ctx.stroke();

  // South-east entertainment / cinema branch integrated into the building.
  ctx.strokeStyle = '#dbeafe';
  ctx.lineWidth = 4 * T;
  ctx.beginPath();
  ctx.moveTo(55 * T, 25 * T);
  ctx.quadraticCurveTo(55 * T, 32 * T, 60 * T, 34 * T);
  ctx.stroke();

  // Center Court oval and skylight, a junction in the long gallery rather than a cross hub.
  ctx.fillStyle = '#f1f5f9';
  ctx.beginPath();
  ctx.ellipse(38.5 * T, 24 * T, 8 * T, 6 * T, -0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(56,189,248,.45)';
  ctx.lineWidth = 2;
  ctx.stroke();
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
    ctx.beginPath();
    ctx.moveTo(38.5 * T, 24 * T);
    ctx.lineTo(38.5 * T + Math.cos(a) * 7.5 * T, 24 * T + Math.sin(a) * 5.5 * T);
    ctx.stroke();
  }

  // Cinema is a coherent ten-screen anchor with a single lobby edge—not a floating marquee block.
  ctx.fillStyle = '#171331';
  ctx.fillRect(57.5 * T, 30.5 * T, 15 * T, 11 * T);
  ctx.strokeStyle = '#818cf8';
  ctx.lineWidth = 2;
  ctx.strokeRect(57.5 * T, 30.5 * T, 15 * T, 11 * T);
  ctx.fillStyle = '#312e81';
  ctx.fillRect(57.5 * T, 30.5 * T, 15 * T, 1.2 * T);
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ALAMO DRAFTHOUSE · 10 SCREENS', 65 * T, 31.3 * T);

  // Warm outdoor restaurant paving along the northern collection.
  ctx.strokeStyle = '#fed7aa';
  ctx.lineWidth = 2.6 * T;
  ctx.beginPath();
  ctx.moveTo(31 * T, 12 * T);
  ctx.bezierCurveTo(38 * T, 8 * T, 45 * T, 9 * T, 51 * T, 13 * T);
  ctx.stroke();

  ctx.fillStyle = 'rgba(15,23,42,.7)';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('NORDSTROM', 6 * T, 10 * T);
  ctx.fillText('BLOOMINGDALE’S', 57.5 * T, 5 * T);
  ctx.fillText('MACY’S WOMEN’S', 67 * T, 19 * T);
  ctx.fillText('MACY’S MEN’S & HOME', 19 * T, 34 * T);
}

// -------------------------------------------------------------
// 3. CUSTOM PLAYER-PAINTED HALLWAYS
// -------------------------------------------------------------
function drawCustomHallways(ctx: CanvasRenderingContext2D, T: number, hallways: CustomHallwayTile[]) {
  if (!hallways || hallways.length === 0) return;

  for (const h of hallways) {
    const px = h.x * T;
    const py = h.y * T;

    if (h.style === 'marble_carrara') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px, py, T, T);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 1, py + 1, T - 2, T - 2);
    } else if (h.style === 'terrazzo_mosaic') {
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(px, py, T, T);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(px + 4, py + 4, 3, 3);
      ctx.fillRect(px + 18, py + 12, 4, 3);
      ctx.fillRect(px + 10, py + 22, 3, 4);
    } else if (h.style === 'granite_dark') {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(px, py, T, T);
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 2, py + 2, T - 4, T - 4);
    } else if (h.style === 'chevron_wood') {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(px, py, T, T);
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + T / 2, py + T / 2);
      ctx.lineTo(px + T, py);
      ctx.stroke();
    } else if (h.style === 'outdoor_stone') {
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(px, py, T, T);
      ctx.strokeStyle = '#fb923c';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 1, py + 1, T - 2, T - 2);
    } else if (h.style === 'glass_atrium') {
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(px, py, T, T);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(px + 2, py + 2, T - 4, T - 4);
    }
  }
}

// -------------------------------------------------------------
// 4. GRAND CENTER COURT ROTUNDA & FOUNTAIN
// -------------------------------------------------------------
function drawGrandCenterCourtFeatures(ctx: CanvasRenderingContext2D, T: number, time: number) {
  const cx = 40.0 * T;
  const cy = 24.0 * T;

  // Circular Grand Marble Rotunda Plaza
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy, 8.5 * T, 0, Math.PI * 2);
  ctx.fill();

  // Radial Brass Starburst Inlay
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 2;
  for (let a = 0; a < 16; a++) {
    const angle = (a * Math.PI) / 8;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * (3.2 * T), cy + Math.sin(angle) * (3.2 * T));
    ctx.lineTo(cx + Math.cos(angle) * (8.0 * T), cy + Math.sin(angle) * (8.0 * T));
    ctx.stroke();
  }

  // Outer Gold Medallion Ring
  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, 8.0 * T, 0, Math.PI * 2);
  ctx.stroke();

  // Rotunda Palm Planters
  const palmAngles = [Math.PI * 0.25, Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75];
  for (const pa of palmAngles) {
    const px = cx + Math.cos(pa) * (6.2 * T);
    const py = cy + Math.sin(pa) * (6.2 * T);

    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(px, py, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.arc(px, py, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Monumental Central Dancing Fountain
  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.arc(cx, cy, 3.0 * T, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.arc(cx, cy, 2.6 * T, 0, Math.PI * 2);
  ctx.fill();

  // Dancing Water Jets
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4 + time * 0.8;
    const dist = 1.8 * T + Math.sin(time * 3 + i) * 6;
    const wx = cx + Math.cos(angle) * dist;
    const wy = cy + Math.sin(angle) * dist;

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(wx, wy, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Center Geyser Fountain
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy, 8 + Math.sin(time * 6) * 3, 0, Math.PI * 2);
  ctx.fill();
}

// -------------------------------------------------------------
// 5. ESCALATORS & PANORAMIC GLASS ELEVATORS
// -------------------------------------------------------------
function drawEscalatorsAndElevators(ctx: CanvasRenderingContext2D, T: number, escalators: EscalatorInstance[], time: number) {
  // Always render the Center Court Rotunda Signature Escalator pair
  const rotEscX = 39.0 * T;
  const rotEscY = 21.5 * T;
  const rotEscW = 2.0 * T;
  const rotEscH = 5.0 * T;

  // Escalator Glass Balustrade
  ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
  ctx.fillRect(rotEscX, rotEscY, rotEscW, rotEscH);
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 2;
  ctx.strokeRect(rotEscX, rotEscY, rotEscW, rotEscH);

  // Moving Escalator Steps
  ctx.fillStyle = '#475569';
  const stepOffset = (time * 25) % 12;
  for (let sy = rotEscY + stepOffset; sy < rotEscY + rotEscH - 6; sy += 12) {
    ctx.fillRect(rotEscX + 4, sy, rotEscW / 2 - 6, 4);
    ctx.fillRect(rotEscX + rotEscW / 2 + 2, rotEscY + rotEscH - (sy - rotEscY), rotEscW / 2 - 6, 4);
  }

  // Handrail
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(rotEscX + 2, rotEscY, 3, rotEscH);
  ctx.fillRect(rotEscX + rotEscW - 5, rotEscY, 3, rotEscH);

  // Custom placed escalators / elevators
  if (escalators && escalators.length > 0) {
    for (const esc of escalators) {
      const px = esc.x * T;
      const py = esc.y * T;
      const pw = esc.w * T;
      const ph = esc.h * T;

      if (esc.type === 'elevator_panoramic') {
        // Panoramic Glass Elevator Tube
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(px, py, pw, ph);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.fillRect(px + 2, py + 2, pw - 4, ph - 4);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 2, py + 2, pw - 4, ph - 4);

        // Animated Elevator Car
        const carY = py + 4 + Math.abs(Math.sin(time * 0.8)) * (ph - 24);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(px + 4, carY, pw - 8, 16);
      } else {
        // Glass Escalator Bank
        ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.fillRect(px, py, pw, ph);
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2;
        ctx.strokeRect(px, py, pw, ph);

        ctx.fillStyle = '#475569';
        const stOffset = (time * 25) % 10;
        for (let sy = py + stOffset; sy < py + ph - 4; sy += 10) {
          ctx.fillRect(px + 4, sy, pw - 8, 3);
        }
      }
    }
  }
}

// -------------------------------------------------------------
// 6. PLACED CONCOURSE AMENITIES
// -------------------------------------------------------------
function drawAmenityInstance(ctx: CanvasRenderingContext2D, amen: MallAmenityInstance, isInspected: boolean, time: number) {
  const { x, y, w, h, type, icon } = amen;

  // Base Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h / 2 + 4, w * 0.48, h * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();

  if (type === 'fountain_tier') {
    // Multi-tier fountain
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, w / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, w / 2 - 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#38bdf8';
    for (let j = 0; j < 6; j++) {
      const angle = (j * Math.PI) / 3 + time * 0.5;
      const dist = w * 0.25 + Math.sin(time * 3 + j) * 4;
      ctx.beginPath();
      ctx.arc(x + w / 2 + Math.cos(angle) * dist, y + h / 2 + Math.sin(angle) * dist, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, 5 + Math.sin(time * 5) * 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'coffee_cart' || type === 'boba_pop_up') {
    ctx.fillStyle = type === 'coffee_cart' ? '#854d0e' : '#4d7c0f';
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 2, w - 4, h - 4, 4);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 6, y + 3, w - 12, 5);

    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(icon, x + w / 2, y + h / 2 + 5);
  } else if (type === 'rest_bench') {
    ctx.fillStyle = '#92400e';
    ctx.fillRect(x + 4, y + 6, w - 8, h - 12);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(x + 6, y + 8, w - 12, 3);
  } else if (type === 'atm_kiosk') {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(x + 7, y + 7, w - 14, 8);
  } else if (type === 'palm_planter') {
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, w / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, w / 2 - 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, 4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 2, w - 4, h - 4, 4);
    ctx.fill();

    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(icon, x + w / 2, y + h / 2 + 5);
  }

  if (isInspected) {
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(x - 2, y - 2, w + 4, h + 4, 6);
    ctx.stroke();
  }
}

// -------------------------------------------------------------
// 7. CUSTOM WALLS & ARCHITECTURAL PARTITIONS
// -------------------------------------------------------------
function drawCustomWalls(ctx: CanvasRenderingContext2D, T: number, walls: CustomWallTile[]) {
  if (!walls || walls.length === 0) return;

  for (const w of walls) {
    const px = w.x * T;
    const py = w.y * T;

    if (w.type === 'glass_railing') {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.fillRect(px + 4, py + 12, T - 8, 8);
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.strokeRect(px + 4, py + 12, T - 8, 8);
    } else if (w.type === 'planter_wall') {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(px + 2, py + 8, T - 4, 16);
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(px + T / 2, py + 12, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(px + T / 2, py + 12, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (w.type === 'pillar') {
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(px + T / 2, py + T / 2, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(px + T / 2, py + T / 2, 8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// -------------------------------------------------------------
// 8. VACANT STOREFRONT LOTS & PLACEMENT PREVIEWS
// -------------------------------------------------------------
function drawUnitOutlines(
  ctx: CanvasRenderingContext2D,
  T: number,
  units: MallUnit[],
  stores: StoreInstance[],
  hoveredUnit: MallUnit | null,
  selectedTenant: TenantDefinition | null,
  architectMode: ArchitectToolMode
) {
  for (let i = 0; i < units.length; i++) {
    const unit = units[i];
    const [wing, gx, gy, gw, gh, doorway, customId] = unit;
    const px = gx * T;
    const py = gy * T;
    const pw = gw * T;
    const ph = gh * T;

    const isOccupied = stores.some((s) => s.unit === unit);
    const isHovered = hoveredUnit === unit;
    const isCustom = !!customId && customId.startsWith('custom_lot_');

    if (!isOccupied) {
      // Clean Vacant Storefront Lot
      ctx.fillStyle = isHovered
        ? 'rgba(56, 189, 248, 0.18)'
        : isCustom
        ? 'rgba(240, 253, 250, 0.95)'
        : 'rgba(255, 255, 255, 0.88)';
      ctx.fillRect(px, py, pw, ph);

      // Storefront Boundary Line
      ctx.strokeStyle = isHovered ? '#0284c7' : isCustom ? '#0d9488' : '#cbd5e1';
      ctx.lineWidth = isHovered ? 2.5 : isCustom ? 2 : 1.5;
      ctx.setLineDash(isHovered ? [4, 2] : [3, 3]);
      ctx.strokeRect(px + 1, py + 1, pw - 2, ph - 2);
      ctx.setLineDash([]);

      // Lot Badge & Dimensions
      ctx.fillStyle = isCustom ? '#0d9488' : isHovered ? '#0284c7' : '#64748b';
      ctx.font = 'bold 8.5px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(isCustom ? `CUSTOM LOT #${i + 1}` : `LOT #${i + 1}`, px + pw / 2, py + ph / 2 - 4);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '7.5px sans-serif';
      ctx.fillText(`${gw}x${gh} (${wing.split(' ')[0]})`, px + pw / 2, py + ph / 2 + 7);

      // Doorway Indicator
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(doorway.x - 4, doorway.y - 2, 8, 4);

      // Placement Preview if tenant selected
      if (selectedTenant && isHovered) {
        const canFit = selectedTenant.w <= gw && selectedTenant.h <= gh;
        ctx.fillStyle = canFit ? 'rgba(34, 197, 94, 0.35)' : 'rgba(239, 68, 68, 0.35)';
        ctx.fillRect(px, py, pw, ph);

        ctx.fillStyle = canFit ? '#15803d' : '#b91c1c';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText(canFit ? `LEASE ${selectedTenant.name}` : 'TOO SMALL', px + pw / 2, py + ph / 2 + 19);
      }
    }
  }
}

function drawMallEntrance(ctx: CanvasRenderingContext2D, entrance: MallEntrance, time: number) {
  const cx = (entrance.x + 0.5) * TILE_SIZE;
  const cy = (entrance.y + 0.5) * TILE_SIZE;
  const horizontalDoor = entrance.side === 'north' || entrance.side === 'south';
  const width = horizontalDoor ? 30 : 12;
  const height = horizontalDoor ? 12 : 30;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.shadowColor = '#22d3ee';
  ctx.shadowBlur = 10 + Math.sin(time * 2) * 2;
  ctx.fillStyle = '#082f49';
  ctx.strokeStyle = '#67e8f9';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-width / 2, -height / 2, width, height, 4);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(165,243,252,.3)';
  ctx.fillRect(horizontalDoor ? -9 : -3, horizontalDoor ? -height / 2 + 2 : -9, horizontalDoor ? 7 : 6, horizontalDoor ? height - 4 : 7);
  ctx.fillRect(horizontalDoor ? 2 : -3, horizontalDoor ? -height / 2 + 2 : 2, horizontalDoor ? 7 : 6, horizontalDoor ? height - 4 : 7);
  ctx.fillStyle = '#ecfeff';
  ctx.font = '900 7px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(entrance.mode === 'both' ? '↔' : entrance.mode === 'entrance' ? '→' : '←', 0, 2.5);
  ctx.fillStyle = '#083344';
  ctx.fillRect(-25, -height / 2 - 13, 50, 10);
  ctx.fillStyle = '#a5f3fc';
  ctx.font = '700 6.5px system-ui, sans-serif';
  ctx.fillText(entrance.name.toUpperCase().slice(0, 17), 0, -height / 2 - 5.5);
  ctx.restore();
}

// -------------------------------------------------------------
// 9. STORE INTERIORS & DEEP QUEUEING / SEATING MECHANICS
// -------------------------------------------------------------
function drawStoreInterior(ctx: CanvasRenderingContext2D, store: StoreInstance, isInspected: boolean, time: number) {
  const T = TILE_SIZE;
  const [wing, gx, gy, gw, gh, doorway] = store.unit;
  const px = gx * T;
  const py = gy * T;
  const pw = gw * T;
  const ph = gh * T;

  // Layered flooring, soft depth, and category-specific atmosphere.
  ctx.save();
  ctx.shadowColor = 'rgba(15,23,42,.32)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;
  const floorGradient = ctx.createLinearGradient(px, py, px + pw, py + ph);
  const floorBase = store.interior.flooringType === 'marble_dark' ? '#111827' : store.interior.flooringType === 'tile_checker' ? '#f8fafc' : store.interior.flooringType === 'carpet_retro' ? '#17143d' : '#f5ead7';
  floorGradient.addColorStop(0, floorBase);
  floorGradient.addColorStop(1, store.facadeStyle === 'neon' ? '#20205b' : store.facadeStyle === 'warm' ? '#ead7bd' : '#dfe7ec');
  ctx.fillStyle = floorGradient;
  ctx.fillRect(px, py, pw, ph);
  ctx.restore();

  // Subtle merchandising grid makes spaces read as designed interiors, not flat boxes.
  ctx.strokeStyle = store.facadeStyle === 'neon' ? 'rgba(96,165,250,.12)' : 'rgba(100,116,139,.10)';
  ctx.lineWidth = 0.6;
  for (let x = px + 16; x < px + pw; x += 18) { ctx.beginPath(); ctx.moveTo(x, py + 12); ctx.lineTo(x, py + ph); ctx.stroke(); }

  // Store Glass Facade / Perimeter Walls
  ctx.strokeStyle = isInspected ? '#38bdf8' : store.tenant.color;
  ctx.lineWidth = isInspected ? 3 : 2;
  ctx.strokeRect(px + 1, py + 1, pw - 2, ph - 2);

  // Store marquee with glass, lighting, and a modern high-contrast wordmark.
  const marquee = ctx.createLinearGradient(px, py, px + pw, py);
  marquee.addColorStop(0, store.facadeStyle === 'gallery' ? '#0f172a' : store.tenant.color);
  marquee.addColorStop(0.55, store.tenant.color);
  marquee.addColorStop(1, store.facadeStyle === 'neon' ? '#312e81' : '#111827');
  ctx.fillStyle = marquee;
  ctx.fillRect(px + 1, py + 1, pw - 2, 15);
  ctx.fillStyle = 'rgba(255,255,255,.22)';
  ctx.fillRect(px + 1, py + 1, pw - 2, 1.5);

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 8.5px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`${store.tenant.icon}  ${store.tenant.name.substring(0, Math.floor(pw / 7))}`, px + 5, py + 11.5);

  // Tier Star Badges
  for (let star = 0; star < store.level; star++) {
    ctx.fillStyle = '#facc15';
    ctx.fillText('◆', px + pw - 8 - star * 7, py + 11.5);
  }

  // 1. Physical Doorway Cutout
  ctx.fillStyle = store.facadeStyle === 'neon' ? '#67e8f9' : '#e2e8f0';
  ctx.shadowColor = store.tenant.color;
  ctx.shadowBlur = 8;
  ctx.fillRect(doorway.x - 8, doorway.y - 2.5, 16, 5);
  ctx.shadowBlur = 0;

  // 2. Service Counter & Register
  const c = store.interior.counter;
  ctx.fillStyle = '#475569';
  ctx.fillRect(c.x, c.y, c.w, c.h);
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(c.registerX - 3, c.registerY - 3, 6, 6);

  // 3. Velvet Rope Queue Stanchions (Cinema / High Draw Queues)
  if (store.interior.stanchions && store.interior.stanchions.length > 0) {
    ctx.strokeStyle = '#b91c1c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < store.interior.stanchions.length; i++) {
      const st = store.interior.stanchions[i];
      if (i === 0) ctx.moveTo(st.x, st.y);
      else ctx.lineTo(st.x, st.y);
    }
    ctx.stroke();

    for (const st of store.interior.stanchions) {
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.arc(st.x, st.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 4. Draw Fixtures (Laser Screens, Ovens, Displays, Racks)
  for (const fix of store.interior.fixtures) {
    if (fix.type === 'cinema_screen') {
      const glowColor = store.cinemaState ? store.cinemaState.screenGlowColor : '#38bdf8';
      ctx.fillStyle = glowColor;
      ctx.fillRect(fix.x, fix.y, fix.w, fix.h);

      // Projector Light Beam when screening in progress
      if (store.cinemaState?.phase === 'screening_in_progress') {
        const grad = ctx.createLinearGradient(fix.x + fix.w / 2, fix.y + fix.h, fix.x + fix.w / 2, py + ph - 8);
        grad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
        grad.addColorStop(1, 'rgba(56, 189, 248, 0.05)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(fix.x, fix.y + fix.h);
        ctx.lineTo(fix.x + fix.w, fix.y + fix.h);
        ctx.lineTo(px + pw / 2 + 8, py + ph - 8);
        ctx.lineTo(px + pw / 2 - 8, py + ph - 8);
        ctx.closePath();
        ctx.fill();
      }
    } else {
      ctx.fillStyle = fix.color;
      ctx.fillRect(fix.x, fix.y, fix.w, fix.h);
    }
  }

  // 5. Draw Seating Tables, Cinema Rows, Booths, & Occupants
  for (const tbl of store.interior.tables) {
    if (tbl.type === 'cinema_row') {
      const isOccupied = tbl.seats[0]?.occupiedBy !== null;
      ctx.fillStyle = isOccupied ? '#b91c1c' : '#475569';
      ctx.fillRect(tbl.x, tbl.y, tbl.w, tbl.h);
    } else if (tbl.type === 'wood_booth') {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(tbl.x, tbl.y, tbl.w, tbl.h);
    } else if (tbl.type === 'arcade_unit') {
      ctx.fillStyle = '#7c3aed';
      ctx.fillRect(tbl.x, tbl.y, tbl.w, tbl.h);
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(tbl.x + 2, tbl.y + 2, tbl.w - 4, 4);
    } else {
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(tbl.x, tbl.y, tbl.w, tbl.h);
    }

    for (const seat of tbl.seats) {
      if (tbl.type !== 'cinema_row') {
        ctx.fillStyle = seat.occupiedBy ? '#f59e0b' : '#94a3b8';
        ctx.beginPath();
        ctx.arc(seat.x, seat.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // 6. Draw Staff Behind Counter
  for (const st of store.interior.staff) {
    ctx.fillStyle = '#059669';
    ctx.beginPath();
    ctx.arc(st.x, st.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Selection Glow if inspected
  if (isInspected) {
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(px - 1, py - 1, pw + 2, ph + 2);
  }
}

// -------------------------------------------------------------
// 10. ARCHITECT TOOL MODE ACTIVE PREVIEWS
// -------------------------------------------------------------
function drawArchitectModePreview(
  ctx: CanvasRenderingContext2D,
  T: number,
  mode: ArchitectToolMode,
  tile: { x: number; y: number },
  customLotConfig: { w: number; h: number; cost: number; name: string },
  selectedAmenity: AmenityDefinition | null,
  activeHallwayStyle: HallwayStyle,
  activeWallType: 'glass_railing' | 'planter_wall' | 'pillar',
  units: MallUnit[],
  stores: StoreInstance[],
  amenities: MallAmenityInstance[],
  customHallways: CustomHallwayTile[],
  customWalls: CustomWallTile[]
) {
  const gx = tile.x;
  const gy = tile.y;
  const px = gx * T;
  const py = gy * T;

  if (mode === 'zone') {
    const pw = customLotConfig.w * T;
    const ph = customLotConfig.h * T;

    let isValid = true;
    if (px < 32 || py < 32 || px + pw > CANVAS_WIDTH - 32 || py + ph > CANVAS_HEIGHT - 32) {
      isValid = false;
    }
    for (const u of units) {
      const ux = u[1] * T;
      const uy = u[2] * T;
      const uw = u[3] * T;
      const uh = u[4] * T;
      if (px < ux + uw && px + pw > ux && py < uy + uh && py + ph > uy) isValid = false;
    }

    ctx.fillStyle = isValid ? 'rgba(13, 148, 136, 0.3)' : 'rgba(239, 68, 68, 0.35)';
    ctx.fillRect(px, py, pw, ph);

    ctx.strokeStyle = isValid ? '#0d9488' : '#ef4444';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 2]);
    ctx.strokeRect(px, py, pw, ph);
    ctx.setLineDash([]);

    ctx.fillStyle = isValid ? '#0f766e' : '#b91c1c';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      isValid ? `ZONE ${customLotConfig.w}×${customLotConfig.h} LOT ($${customLotConfig.cost})` : 'COLLISION / OUT OF BOUNDS',
      px + pw / 2,
      py + ph / 2
    );
  } else if (mode === 'paint_hallway') {
    ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.fillRect(px, py, T, T);
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, T, T);

    ctx.fillStyle = '#0369a1';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(activeHallwayStyle.replace('_', ' ').toUpperCase().substring(0, 10), px + T / 2, py + T / 2 + 3);
  } else if (mode === 'build_wall') {
    ctx.fillStyle = 'rgba(234, 179, 8, 0.4)';
    ctx.fillRect(px, py, T, T);
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, T, T);

    ctx.fillStyle = '#854d0e';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(activeWallType.replace('_', ' ').toUpperCase().substring(0, 8), px + T / 2, py + T / 2 + 3);
  } else if (mode === 'place_amenity' && selectedAmenity) {
    const pw = selectedAmenity.w * T;
    const ph = selectedAmenity.h * T;

    let isValid = true;
    if (px < 32 || py < 32 || px + pw > CANVAS_WIDTH - 32 || py + ph > CANVAS_HEIGHT - 32) isValid = false;
    for (const u of units) {
      const ux = u[1] * T;
      const uy = u[2] * T;
      const uw = u[3] * T;
      const uh = u[4] * T;
      if (px < ux + uw && px + pw > ux && py < uy + uh && py + ph > uy) isValid = false;
    }
    for (const a of amenities) {
      if (px < a.x + a.w && px + pw > a.x && py < a.y + a.h && py + ph > a.y) isValid = false;
    }

    ctx.fillStyle = isValid ? 'rgba(56, 189, 248, 0.35)' : 'rgba(239, 68, 68, 0.35)';
    ctx.fillRect(px, py, pw, ph);

    ctx.strokeStyle = isValid ? '#0284c7' : '#ef4444';
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, pw, ph);

    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(selectedAmenity.icon, px + pw / 2, py + ph / 2 + 5);
  } else if (mode === 'place_escalator') {
    const pw = 2 * T;
    const ph = 4 * T;
    ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, pw, ph);

    ctx.fillStyle = '#0369a1';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PLACE ESCALATOR', px + pw / 2, py + ph / 2 + 3);
  } else if (mode === 'place_entrance') {
    const onHallway = customHallways.some((hallway) => hallway.x === gx && hallway.y === gy);
    ctx.fillStyle = onHallway ? 'rgba(34,211,238,.38)' : 'rgba(239,68,68,.34)';
    ctx.fillRect(px, py, T, T);
    ctx.strokeStyle = onHallway ? '#67e8f9' : '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(px + 2, py + 2, T - 4, T - 4);
    ctx.fillStyle = onHallway ? '#083344' : '#7f1d1d';
    ctx.font = '900 8px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(onHallway ? 'ENTRANCE' : 'NEEDS HALL', px + T / 2, py + T / 2 + 3);
  } else if (mode === 'demolish') {
    for (const u of units) {
      const ux = u[1] * T;
      const uy = u[2] * T;
      const uw = u[3] * T;
      const uh = u[4] * T;
      if (px >= ux && px <= ux + uw && py >= uy && py <= uy + uh) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
        ctx.fillRect(ux, uy, uw, uh);
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 2;
        ctx.strokeRect(ux, uy, uw, uh);

        ctx.fillStyle = '#991b1b';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('DEMOLISH LOT (CLICK TO RECLAIM)', ux + uw / 2, uy + uh / 2);
        return;
      }
    }

    for (const a of amenities) {
      if (px >= a.x && px <= a.x + a.w && py >= a.y && py <= a.y + a.h) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
        ctx.fillRect(a.x, a.y, a.w, a.h);
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 2;
        ctx.strokeRect(a.x, a.y, a.w, a.h);

        ctx.fillStyle = '#991b1b';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('REMOVE AMENITY', a.x + a.w / 2, a.y + a.h / 2);
        return;
      }
    }

    // Check custom hallways or walls
    const isHall = customHallways.some((h) => h.x === gx && h.y === gy);
    const isWall = customWalls.some((w) => w.x === gx && w.y === gy);
    if (isHall || isWall) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
      ctx.fillRect(px, py, T, T);
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 2;
      ctx.strokeRect(px, py, T, T);

      ctx.fillStyle = '#991b1b';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ERASE', px + T / 2, py + T / 2 + 3);
    }
  }
}

// -------------------------------------------------------------
// 11. SHOPPER AGENTS & EMOTION BUBBLES
// -------------------------------------------------------------
function drawShopper(ctx: CanvasRenderingContext2D, s: ShopperAgent) {
  const legOffset = Math.sin(s.walkCycle) * 2.2;

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(s.x, s.y + 3, s.size * 0.9, s.size * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body / Shirt
  ctx.fillStyle = s.shirtColor;
  ctx.beginPath();
  ctx.arc(s.x, s.y - 3, s.size * 0.75, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = s.skinColor;
  ctx.beginPath();
  ctx.arc(s.x, s.y - 7, s.size * 0.5, 0, Math.PI * 2);
  ctx.fill();

  // Hair
  ctx.fillStyle = s.hairColor;
  ctx.beginPath();
  ctx.arc(s.x, s.y - 8.5, s.size * 0.45, Math.PI, Math.PI * 2);
  ctx.fill();

  // Accessories (Shopping Bag / Popcorn / Beverage)
  if (s.hasBag) {
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(s.x + 4, s.y - 3 + legOffset * 0.5, 3.5, 4.5);
  }
  if (s.hasPopcorn) {
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(s.x - 5, s.y - 3, 3, 4);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(s.x - 5, s.y - 4.5, 3, 2);
  }
  if (s.hasDrink) {
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(s.x + 4, s.y - 4, 3, 4.5);
  }

  // Speech / Emotion Bubble
  if (s.bubble) {
    const bx = s.x;
    const by = s.y - 18;

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(bx - 16, by - 8, 32, 14, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${s.bubble.icon} ${s.bubble.text}`, bx, by + 2.5);
  }
}

// -------------------------------------------------------------
// 12. FLOATING TEXT & PARTICLES
// -------------------------------------------------------------
function drawFloatingEffect(ctx: CanvasRenderingContext2D, fx: FloatingEffect) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, fx.alpha));
  ctx.fillStyle = fx.color;
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(fx.text, fx.x, fx.y);
  ctx.restore();
}

// -------------------------------------------------------------
// 13. GRAND PORTALS & ARCHITECTURAL SIGNAGE
// -------------------------------------------------------------
function drawGrandPortalsAndSigns(ctx: CanvasRenderingContext2D, T: number) {
  for (const ent of ENTRANCES) {
    ctx.fillStyle = '#0284c7';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.roundRect(ent.x - 30, ent.y - 8, 60, 16, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 7.5px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(ent.name.toUpperCase().substring(0, 24), ent.x, ent.y + 3);
  }
}
