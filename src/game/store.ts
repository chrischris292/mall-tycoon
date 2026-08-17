import { TenantDefinition, MallUnit, StoreInstance, StoreInterior, StoreTable, StoreStaff, CinemaShowtimeState, StoreSimulationEvent } from './types';
import { TILE_SIZE } from './constants';

const MOVIES_ROTATION = [
  { title: 'Interstellar Echoes 4DX', genre: 'Sci-Fi Epic', price: 24, glow: '#38bdf8' },
  { title: 'Neon Samurai: Tokyo 2099', genre: 'Action Cyberpunk', price: 26, glow: '#f43f5e' },
  { title: 'The Starlight Symphony', genre: 'Family Animation', price: 20, glow: '#eab308' },
  { title: 'Quantum Horizon: Laser IMAX', genre: 'Mystery Thriller', price: 28, glow: '#8b5cf6' }
];

export function createStoreInstance(tenant: TenantDefinition, unit: MallUnit): StoreInstance {
  const storeId = `store_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const interior = generateStoreInterior(tenant, unit, 1);

  // Initialize Cinema Simulation State
  let cinemaState: CinemaShowtimeState | undefined = undefined;
  if (tenant.id === 'cinema') {
    const movie = MOVIES_ROTATION[Math.floor(Math.random() * MOVIES_ROTATION.length)];
    let totalSeats = 0;
    interior.tables.forEach(t => {
      totalSeats += t.seats.length;
    });

    cinemaState = {
      currentMovie: movie.title,
      genre: movie.genre,
      phase: 'box_office_open',
      phaseTimer: 180, // 180 ticks of ticket sales
      ticketsSold: 0,
      auditoriumCapacity: Math.max(8, totalSeats),
      ticketPrice: movie.price,
      screenGlowColor: movie.glow
    };
  }

  // Initialize Special Event State for other deep tenant mechanics
  let specialEvent: StoreSimulationEvent | undefined = undefined;
  if (tenant.id === 'dumpling_house') {
    specialEvent = {
      title: '18-Fold Xiao Long Bao Batch',
      subtitle: 'Master Dumpling Chefs Steaming',
      progressPercent: 45,
      isActive: true,
      statusBadge: 'Bamboo Steamers Active'
    };
  } else if (tenant.id === 'ramen_bar') {
    specialEvent = {
      title: '24hr Tonkotsu Broth Simmer',
      subtitle: 'Black Garlic Chashu Prep',
      progressPercent: 70,
      isActive: true,
      statusBadge: 'Boiling Hot'
    };
  } else if (tenant.id === 'cafe_roastery' || tenant.id === 'cafe') {
    specialEvent = {
      title: 'Artisan Oven Batch',
      subtitle: 'Baking Butter Croissants',
      progressPercent: 35,
      isActive: true,
      statusBadge: 'Oven Active'
    };
  } else if (tenant.id === 'trattoria' || tenant.id === 'restaurant') {
    specialEvent = {
      title: 'Woodfired Brick Oven',
      subtitle: 'Truffle Burrata Pizza in Flame',
      progressPercent: 60,
      isActive: true,
      statusBadge: 'Chef Baking'
    };
  } else if (tenant.id === 'tech_apple') {
    specialEvent = {
      title: 'Spatial Keynote Live Demo',
      subtitle: 'Neural Hologram Showcase',
      progressPercent: 20,
      isActive: true,
      statusBadge: 'Keynote Live'
    };
  } else if (tenant.id === 'arcade_bowlero') {
    specialEvent = {
      title: 'Gold Jackpot Frenzy',
      subtitle: 'Double Ticket Drop Active',
      progressPercent: 50,
      isActive: false,
      statusBadge: 'Jackpot Ready'
    };
  }

  return {
    id: storeId,
    tenant,
    unit,
    level: 1,
    staffCount: tenant.baseStaff,
    totalRevenue: 0,
    shoppersServed: 0,
    customerSatisfaction: 95,
    currentQueue: [],
    interior,
    placedAtWeek: 1,
    customStaffHired: 0,
    cinemaState,
    specialEvent
  };
}

export function generateStoreInterior(tenant: TenantDefinition, unit: MallUnit, level: number): StoreInterior {
  const [ wing, gx, gy, gw, gh, doorway ] = unit;
  const px = gx * TILE_SIZE;
  const py = gy * TILE_SIZE;
  const pw = gw * TILE_SIZE;
  const ph = gh * TILE_SIZE;

  // Flooring style based on tenant category & level
  let flooringType: StoreInterior['flooringType'] = 'hardwood';
  if (tenant.cat === 'Luxury') {
    flooringType = 'marble_dark';
  } else if (tenant.cat === 'Food') {
    flooringType = level === 3 ? 'marble_dark' : (tenant.mechanicType === 'dining_restaurant' || tenant.mechanicType === 'dining_asian_dumpling' ? 'tile_checker' : 'hardwood');
  } else if (tenant.cat === 'Fashion') {
    flooringType = level >= 2 ? 'marble_dark' : 'plank_oak';
  } else if (tenant.cat === 'Entertainment') {
    flooringType = 'carpet_retro';
  } else {
    flooringType = 'plank_oak';
  }

  // Intelligently position service counter & registers with generous space
  const isCinema = tenant.mechanicType === 'cinema_theater';
  const counterW = isCinema ? Math.min(80, pw * 0.45) : Math.min(56, Math.max(32, pw * 0.32));
  const counterH = 12;
  
  // Position counter offset cleanly from doorway
  const isDoorSouth = doorway.y >= py + ph - 8;
  const isDoorNorth = doorway.y <= py + 8;
  const isDoorEast = doorway.x >= px + pw - 8;
  const isDoorWest = doorway.x <= px + 8;

  let counterX = px + 12;
  let counterY = isDoorSouth ? py + ph - 38 : py + 14;

  if (isDoorEast) {
    counterX = px + pw - counterW - 16;
    counterY = py + 16;
  } else if (isDoorWest) {
    counterX = px + 16;
    counterY = py + 16;
  }

  const regX = counterX + counterW - 10;
  const regY = counterY + 6;

  // Queue slots and velvet-rope stanchions
  const queueSlots: Array<{ x: number; y: number }> = [];
  const stanchions: Array<{ x: number; y: number }> = [];
  const qLen = isCinema ? 6 : 4;

  if (isCinema) {
    // Elegant L-shaped / straight velvet-rope stanchion queue line
    const qStartY = isDoorSouth ? regY - 14 : regY + 16;
    const yDir = isDoorSouth ? -1 : 1;

    for (let q = 0; q < qLen; q++) {
      const qx = regX - 4;
      const qy = qStartY + q * 14 * yDir;
      queueSlots.push({ x: qx, y: qy });

      // Stanchion posts on both sides of the velvet line
      stanchions.push({ x: qx - 8, y: qy });
      stanchions.push({ x: qx + 8, y: qy });
    }
  } else {
    // Clean, spaced customer queue
    const qStartY = isDoorSouth ? regY - 14 : regY + 14;
    const yDir = isDoorSouth ? -1 : 1;
    for (let q = 0; q < qLen; q++) {
      queueSlots.push({
        x: regX - 2,
        y: qStartY + q * 13 * yDir
      });
    }
  }

  const tables: StoreTable[] = [];
  const fixtures: StoreInterior['fixtures'] = [];

  switch (tenant.mechanicType) {
    case 'cinema_theater': {
      // 1. Box Office & Concession Popcorn Counter
      fixtures.push({
        x: counterX + 4,
        y: counterY - 6,
        w: 24,
        h: 6,
        type: 'popcorn_popper',
        color: '#fbbf24',
        label: 'HOT POPCORN & SODAS'
      });

      fixtures.push({
        x: counterX + 32,
        y: counterY - 6,
        w: 28,
        h: 6,
        type: 'ticket_kiosk',
        color: '#38bdf8',
        label: 'BOX OFFICE TICKETS'
      });

      // 2. Monumental Curved Laser IMAX Screen on the opposite wall
      const screenW = Math.min(pw - 36, 180);
      const screenX = px + (pw - screenW) / 2;
      const screenY = isDoorSouth ? py + 8 : py + 8;

      fixtures.push({
        x: screenX,
        y: screenY,
        w: screenW,
        h: 12,
        type: 'cinema_screen',
        color: '#ffffff',
        label: '4K DUAL LASER IMAX SOUNDSTAGE'
      });

      // 3. Projector Booth at rear
      fixtures.push({
        x: px + pw / 2 - 12,
        y: py + ph - 12,
        w: 24,
        h: 8,
        type: 'projector_booth',
        color: '#38bdf8',
        label: 'LASER PROJECTION'
      });

      // 4. Stadium Velvet Recliner Rows (with spacious center red-carpet aisle!)
      const audStartY = screenY + 24;
      const audAvailableH = ph - (isDoorSouth ? 64 : 48);
      const rows = Math.max(3, Math.min(6, Math.floor(audAvailableH / 22)));
      const seatsPerSide = Math.max(2, Math.min(5, Math.floor((pw - 70) / 36)));
      const aisleCenterX = px + pw / 2;

      for (let r = 0; r < rows; r++) {
        const rowY = audStartY + r * 20;

        // Left stadium block
        for (let s = 0; s < seatsPerSide; s++) {
          const sx = aisleCenterX - 22 - (seatsPerSide - s) * 16;
          if (sx >= px + 8) {
            const tableId = `cine_l_${r}_${s}`;
            tables.push({
              id: tableId,
              x: sx,
              y: rowY,
              w: 14,
              h: 13,
              type: 'cinema_row',
              hasMeal: false,
              seats: [{ id: `${tableId}_s`, x: sx + 7, y: rowY + 6, occupiedBy: null }]
            });
          }
        }

        // Right stadium block
        for (let s = 0; s < seatsPerSide; s++) {
          const sx = aisleCenterX + 22 + s * 16;
          if (sx + 14 <= px + pw - 8) {
            const tableId = `cine_r_${r}_${s}`;
            tables.push({
              id: tableId,
              x: sx,
              y: rowY,
              w: 14,
              h: 13,
              type: 'cinema_row',
              hasMeal: false,
              seats: [{ id: `${tableId}_s`, x: sx + 7, y: rowY + 6, occupiedBy: null }]
            });
          }
        }
      }
      break;
    }

    case 'dining_asian_dumpling':
    case 'dining_ramen':
    case 'dining_restaurant':
    case 'dining_cafe':
    case 'dining_boba': {
      // Specialized Kitchen & Culinary Fixtures
      fixtures.push({
        x: counterX + 2,
        y: counterY - 6,
        w: 24,
        h: 6,
        type: tenant.id === 'dumpling_house' ? 'dimsum_steamer' : (tenant.id === 'ramen_bar' ? 'noodle_boiler' : (tenant.id === 'boba_lounge' ? 'tea_whisk' : 'espresso_machine')),
        color: tenant.id === 'dumpling_house' ? '#f59e0b' : (tenant.id === 'ramen_bar' ? '#ea580c' : '#b08a60'),
        label: tenant.id === 'dumpling_house' ? 'Bamboo Steamers' : (tenant.id === 'ramen_bar' ? 'Ramen Kitchen' : 'Artisan Bar')
      });

      // Glass Pastry/Dumpling Showcase
      fixtures.push({
        x: counterX + 28,
        y: counterY,
        w: Math.max(12, counterW - 30),
        h: 10,
        type: 'pastry_glass',
        color: '#d4eff2',
        label: 'Showcase'
      });

      // Wide, spacious dining tables & plush booths
      const startX = px + counterW + 28;
      const availableW = pw - (counterW + 36);
      const cols = Math.max(1, Math.min(4, Math.floor(availableW / 36)));
      const rows = Math.max(2, Math.min(4, Math.floor((ph - 24) / 32)));

      let tableIdx = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const tx = startX + c * 34;
          const ty = py + 16 + r * 30;

          if (tx + 20 < px + pw - 6 && ty + 18 < py + ph - 6) {
            const isBooth = (tenant.mechanicType === 'dining_restaurant' || tenant.mechanicType === 'dining_asian_dumpling') && c === 0;
            const tableId = `table_${tenant.id}_${tableIdx++}`;

            tables.push({
              id: tableId,
              x: tx,
              y: ty,
              w: isBooth ? 22 : 16,
              h: 15,
              type: isBooth ? 'wood_booth' : 'round_cafe',
              hasMeal: false,
              seats: [
                { id: `${tableId}_s1`, x: tx - 5, y: ty + 7, occupiedBy: null },
                { id: `${tableId}_s2`, x: tx + (isBooth ? 25 : 19), y: ty + 7, occupiedBy: null }
              ]
            });
          }
        }
      }
      break;
    }

    case 'fashion_luxury':
    case 'fashion_boutique':
    case 'fashion_streetwear': {
      // Runway display racks & mannequins with wide aisles
      fixtures.push({
        x: px + counterW + 24,
        y: py + 12,
        w: Math.min(48, pw - counterW - 36),
        h: 10,
        type: 'clothing_rack',
        color: tenant.cat === 'Luxury' ? '#e2b348' : '#c27ba0',
        label: tenant.cat === 'Luxury' ? 'Haute Runway' : 'Designer Racks'
      });

      fixtures.push({
        x: px + pw - 22,
        y: py + 12,
        w: 14,
        h: 14,
        type: 'mannequin',
        color: '#ffd1dc',
        label: 'Mannequin'
      });

      // Spacious fitting rooms / salon lounge
      const stallCount = Math.max(2, Math.min(5, Math.floor((pw - 30) / 28)));
      for (let i = 0; i < stallCount; i++) {
        const sx = px + 16 + i * 28;
        const sy = py + ph - 24;
        if (sx + 20 < px + pw - 6) {
          const tableId = `stall_${i}`;
          tables.push({
            id: tableId,
            x: sx,
            y: sy,
            w: 20,
            h: 16,
            type: 'fitting_room',
            hasMeal: false,
            seats: [{ id: `${tableId}_s1`, x: sx + 10, y: sy + 8, occupiedBy: null }]
          });
        }
      }
      break;
    }

    case 'tech_demo': {
      // 8K Video Wall
      fixtures.push({
        x: px + counterW + 20,
        y: py + 10,
        w: pw - counterW - 32,
        h: 12,
        type: 'tv_video_wall',
        color: '#0284c7',
        label: '8K OLED TV Showcase'
      });

      // Spatial VR rig
      if (level >= 2 || gw > 3) {
        const vrX = px + pw - 34;
        const vrY = py + 28;
        const vrTableId = `vr_station_${level}`;
        tables.push({
          id: vrTableId,
          x: vrX,
          y: vrY,
          w: 24,
          h: 22,
          type: 'vr_station',
          hasMeal: false,
          seats: [{ id: `${vrTableId}_s`, x: vrX + 12, y: vrY + 11, occupiedBy: null }]
        });
      }

      // Large interactive demo tables
      const tableCount = Math.max(2, Math.min(6, Math.floor(gw * 0.9) + level));
      const startX = px + 16;
      const cols = Math.max(1, Math.min(3, Math.floor((pw - 40) / 36)));

      for (let d = 0; d < tableCount; d++) {
        const col = d % cols;
        const row = Math.floor(d / cols);
        const dx = startX + col * 36;
        const dy = py + 28 + row * 26;

        if (dx + 28 < px + pw - 30 && dy + 18 < py + ph - 8) {
          const tableId = `tech_${d}`;
          tables.push({
            id: tableId,
            x: dx,
            y: dy,
            w: 28,
            h: 16,
            type: 'demo_bench',
            hasMeal: false,
            seats: [
              { id: `${tableId}_s1`, x: dx + 8, y: dy + 18, occupiedBy: null },
              { id: `${tableId}_s2`, x: dx + 20, y: dy + 18, occupiedBy: null }
            ]
          });
        }
      }
      break;
    }

    case 'arcade_gaming': {
      const cols = Math.max(2, Math.min(5, Math.floor((pw - 30) / 26)));
      const rows = Math.max(2, Math.min(4, Math.floor((ph - 30) / 26)));
      let cabIdx = 0;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const ax = px + 16 + c * 26;
          const ay = py + 26 + r * 26;

          if (ax + 18 < px + pw - 8 && ay + 18 < py + ph - 8) {
            const tableId = `arc_${cabIdx++}`;
            tables.push({
              id: tableId,
              x: ax,
              y: ay,
              w: 18,
              h: 16,
              type: 'arcade_unit',
              hasMeal: false,
              seats: [{ id: `${tableId}_p1`, x: ax + 9, y: ay + 9, occupiedBy: null }]
            });
          }
        }
      }
      break;
    }

    case 'toy_playlab': {
      fixtures.push({
        x: px + counterW + 20,
        y: py + 10,
        w: 32,
        h: 12,
        type: 'plush_display',
        color: '#f43f5e',
        label: 'Plush Mountain'
      });

      const cols = Math.max(1, Math.min(3, Math.floor((pw - 30) / 36)));
      const rows = Math.max(1, Math.min(3, Math.floor((ph - 30) / 30)));
      let toyIdx = 0;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const tx = px + 16 + c * 36;
          const ty = py + 28 + r * 28;
          if (tx + 28 < px + pw - 8 && ty + 18 < py + ph - 8) {
            const tableId = `toy_${toyIdx++}`;
            tables.push({
              id: tableId,
              x: tx,
              y: ty,
              w: 28,
              h: 16,
              type: 'toy_table',
              hasMeal: false,
              seats: [
                { id: `${tableId}_s1`, x: tx + 8, y: ty + 18, occupiedBy: null },
                { id: `${tableId}_s2`, x: tx + 20, y: ty + 18, occupiedBy: null }
              ]
            });
          }
        }
      }
      break;
    }

    case 'department_anchor': {
      fixtures.push({
        x: px + 12,
        y: py + 8,
        w: pw - 24,
        h: 10,
        type: 'dept_banner',
        color: '#475569',
        label: 'DESIGNER COSMETICS, FINE HOME & HAUTE COUTURE'
      });

      const cols = Math.max(2, Math.min(4, Math.floor((pw - 40) / 36)));
      const rows = Math.max(2, Math.min(3, Math.floor((ph - 30) / 28)));
      let deptIdx = 0;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const tx = px + 18 + c * 36;
          const ty = py + 26 + r * 28;
          if (tx + 26 < px + pw - 8 && ty + 18 < py + ph - 8) {
            const tableId = `dept_${deptIdx++}`;
            tables.push({
              id: tableId,
              x: tx,
              y: ty,
              w: 26,
              h: 16,
              type: 'demo_bench',
              hasMeal: false,
              seats: [{ id: `${tableId}_s`, x: tx + 13, y: ty + 8, occupiedBy: null }]
            });
          }
        }
      }
      break;
    }

    case 'book_reading':
    default: {
      fixtures.push({
        x: px + 10,
        y: py + 8,
        w: pw - 20,
        h: 8,
        type: 'bookshelf_wall',
        color: '#78350f',
        label: 'Mahogany Bookshelves'
      });

      const cols = Math.max(2, Math.min(4, Math.floor((pw - 30) / 32)));
      const rows = Math.max(1, Math.min(3, Math.floor((ph - 30) / 28)));
      let bookIdx = 0;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cx = px + 16 + c * 32;
          const cy = py + 24 + r * 26;
          if (cx + 18 < px + pw - 8 && cy + 18 < py + ph - 8) {
            const tableId = `reading_${bookIdx++}`;
            tables.push({
              id: tableId,
              x: cx,
              y: cy,
              w: 18,
              h: 16,
              type: 'armchair',
              hasMeal: false,
              seats: [{ id: `${tableId}_s`, x: cx + 9, y: cy + 8, occupiedBy: null }]
            });
          }
        }
      }
      break;
    }
  }

  // Staff positions with ample space behind registers
  const staff: StoreStaff[] = [];
  for (let s = 0; s < tenant.baseStaff; s++) {
    staff.push({
      id: `staff_${tenant.id}_${s}`,
      x: counterX + 8 + s * 16,
      y: counterY - 4,
      role: s === 0 ? 'Lead Cashier' : (tenant.cat === 'Food' ? 'Chef / Barista' : 'Associate'),
      isBusy: false
    });
  }

  return {
    doorway,
    counter: {
      x: counterX,
      y: counterY,
      w: counterW,
      h: counterH,
      registerX: regX,
      registerY: regY
    },
    queueSlots,
    stanchions,
    tables,
    staff,
    fixtures,
    flooringType
  };
}
