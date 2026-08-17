import { ShopperAgent, StoreInstance, FloatingEffect } from './types';
import { ENTRANCES, UNITS_LIST } from './constants';
import { findHallwayPath } from './pathfinding';
import { playCashSound, playArcadeSound } from './sound';

const SHIRT_COLORS = [
  '#e06d76', '#59cbbd', '#e5b94f', '#6959a8', '#3d89ac',
  '#e28448', '#86c232', '#d45d79', '#4aa96c', '#f08a5d', '#b83b5e'
];
const SKIN_COLORS = ['#ffdfc4', '#f0c8a0', '#dfaa7c', '#bb8054', '#8d5524'];
const HAIR_COLORS = ['#2c1810', '#1c1c1c', '#7d4427', '#c9933b', '#6d6875', '#e6c280'];

export function createShopperAgent(stores: StoreInstance[]): ShopperAgent {
  const entrance = ENTRANCES[Math.floor(Math.random() * ENTRANCES.length)];
  const id = `shopper_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

  const shopper: ShopperAgent = {
    id,
    x: entrance.x + (Math.random() * 8 - 4),
    y: entrance.y + (Math.random() * 8 - 4),
    targetX: entrance.x,
    targetY: entrance.y,
    currentPath: [],
    pathIndex: 0,
    state: 'spawning',
    speed: 1.15 + Math.random() * 0.35,
    size: 5.5 + Math.random() * 1.0,
    shirtColor: SHIRT_COLORS[Math.floor(Math.random() * SHIRT_COLORS.length)],
    skinColor: SKIN_COLORS[Math.floor(Math.random() * SKIN_COLORS.length)],
    hairColor: HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)],
    hasBag: false,
    hasDrink: false,
    hasPopcorn: false,
    walkCycle: Math.random() * 100,
    targetStoreId: null,
    targetAmenityId: null,
    assignedTableId: null,
    assignedSeatId: null,
    timer: 0,
    bubble: null,
    bubbleTimer: 0,
    visitedCount: 0,
    dead: false
  };

  decideNextShopperDestination(shopper, stores);
  return shopper;
}

export function decideNextShopperDestination(shopper: ShopperAgent, stores: StoreInstance[]) {
  // Clean up any previously occupied seats or queue references
  if (shopper.targetStoreId) {
    const prevStore = stores.find(s => s.id === shopper.targetStoreId);
    if (prevStore) {
      prevStore.currentQueue = prevStore.currentQueue.filter(id => id !== shopper.id);
      if (shopper.assignedSeatId) {
        for (const tbl of prevStore.interior.tables) {
          for (const st of tbl.seats) {
            if (st.occupiedBy === shopper.id) {
              st.occupiedBy = null;
              tbl.hasMeal = false;
            }
          }
        }
      }
    }
    shopper.assignedSeatId = null;
    shopper.assignedTableId = null;
  }

  // 1. If stores exist, choose a destination store weighted by popularity/draw
  if (stores.length > 0 && Math.random() < 0.88 && shopper.visitedCount < 6) {
    const candidateStores: StoreInstance[] = [];
    stores.forEach(st => {
      let weight = Math.max(1, Math.round(st.tenant.draw * (st.level * 0.9)));

      // If Cinema is currently selling tickets for showtime, draw is boosted!
      if (st.cinemaState && st.cinemaState.phase === 'box_office_open') {
        weight *= 2;
      }
      for (let i = 0; i < weight; i++) {
        candidateStores.push(st);
      }
    });

    const chosenStore = candidateStores[Math.floor(Math.random() * candidateStores.length)] || stores[0];
    shopper.targetStoreId = chosenStore.id;

    // Navigate to store doorway via concourse corridors
    const doorway = chosenStore.interior.doorway;
    shopper.currentPath = findHallwayPath(shopper.x, shopper.y, doorway.x, doorway.y);
    shopper.pathIndex = 0;
    shopper.state = 'navigating_hallway';
    return;
  }

  // 2. If finished shopping, navigate to an entrance/exit
  if (shopper.visitedCount > 0 && Math.random() < 0.75) {
    const exit = ENTRANCES[Math.floor(Math.random() * ENTRANCES.length)];
    shopper.currentPath = findHallwayPath(shopper.x, shopper.y, exit.x, exit.y);
    shopper.pathIndex = 0;
    shopper.state = 'exiting_mall';
    shopper.targetStoreId = null;
    return;
  }

  // 3. Otherwise wander along concourse / outdoor promenade
  const randomEntrance = ENTRANCES[Math.floor(Math.random() * ENTRANCES.length)];
  shopper.currentPath = findHallwayPath(shopper.x, shopper.y, randomEntrance.x, randomEntrance.y);
  shopper.pathIndex = 0;
  shopper.state = 'navigating_hallway';
  shopper.targetStoreId = null;
}

export function updateShopperAgent(
  shopper: ShopperAgent,
  stores: StoreInstance[],
  floatingFx: FloatingEffect[],
  speedMultiplier: number,
  onSale: (amount: number) => void
) {
  shopper.walkCycle += 0.28 * speedMultiplier;

  // Manage Emotion/Speech Bubble
  if (shopper.bubbleTimer > 0) {
    shopper.bubbleTimer -= speedMultiplier;
    if (shopper.bubbleTimer <= 0) shopper.bubble = null;
  }

  // -------------------------------------------------------------
  // STATE 1: NAVIGATING CONCOURSE HALLWAYS & CORRIDORS
  // -------------------------------------------------------------
  if (shopper.state === 'navigating_hallway' || shopper.state === 'exiting_mall') {
    const targetStore = shopper.targetStoreId ? stores.find(s => s.id === shopper.targetStoreId) : undefined;
    const isLastWaypoint = shopper.pathIndex >= shopper.currentPath.length - 1;

    if (shopper.currentPath.length === 0 || shopper.pathIndex >= shopper.currentPath.length) {
      if (shopper.state === 'exiting_mall') {
        shopper.dead = true;
      } else if (targetStore) {
        // Arrived at store doorway -> Enter store
        shopper.state = 'entering_store';
        const queueSlot = targetStore.interior.queueSlots[Math.min(targetStore.interior.queueSlots.length - 1, targetStore.currentQueue.length)];
        shopper.targetX = queueSlot ? queueSlot.x : targetStore.interior.counter.registerX;
        shopper.targetY = queueSlot ? queueSlot.y : targetStore.interior.counter.registerY + 14;
      } else {
        decideNextShopperDestination(shopper, stores);
      }
      return;
    }

    const currentWaypoint = shopper.currentPath[shopper.pathIndex];
    const dx = currentWaypoint.x - shopper.x;
    const dy = currentWaypoint.y - shopper.y;
    const dist = Math.hypot(dx, dy);

    // Smooth arrival check
    if (dist < (isLastWaypoint ? 10 : 7)) {
      if (isLastWaypoint && targetStore) {
        shopper.state = 'entering_store';
        const queueSlot = targetStore.interior.queueSlots[Math.min(targetStore.interior.queueSlots.length - 1, targetStore.currentQueue.length)];
        shopper.targetX = queueSlot ? queueSlot.x : targetStore.interior.counter.registerX;
        shopper.targetY = queueSlot ? queueSlot.y : targetStore.interior.counter.registerY + 14;
        return;
      }
      shopper.pathIndex++;
    } else {
      const step = shopper.speed * speedMultiplier;
      shopper.x += (dx / dist) * step;
      shopper.y += (dy / dist) * step;
    }
    return;
  }

  // -------------------------------------------------------------
  // STATE 2: ENTERING STORE & JOINING SERVICE QUEUE
  // -------------------------------------------------------------
  if (shopper.state === 'entering_store') {
    const store = stores.find(s => s.id === shopper.targetStoreId);
    if (!store) {
      decideNextShopperDestination(shopper, stores);
      return;
    }

    // Target queue position
    const qSlot = store.interior.queueSlots[Math.min(store.interior.queueSlots.length - 1, store.currentQueue.length)];
    if (qSlot) {
      shopper.targetX = qSlot.x;
      shopper.targetY = qSlot.y;
    }

    const dist = Math.hypot(shopper.targetX - shopper.x, shopper.targetY - shopper.y);
    if (dist < 7) {
      if (!store.currentQueue.includes(shopper.id)) {
        store.currentQueue.push(shopper.id);
      }
      shopper.state = 'in_queue';
    } else {
      const step = shopper.speed * speedMultiplier;
      shopper.x += ((shopper.targetX - shopper.x) / dist) * step;
      shopper.y += ((shopper.targetY - shopper.y) / dist) * step;
    }
    return;
  }

  // -------------------------------------------------------------
  // STATE 3: IN QUEUE AT SERVICE COUNTER / BOX OFFICE
  // -------------------------------------------------------------
  if (shopper.state === 'in_queue') {
    const store = stores.find(s => s.id === shopper.targetStoreId);
    if (!store) {
      decideNextShopperDestination(shopper, stores);
      return;
    }

    const qIdx = store.currentQueue.indexOf(shopper.id);
    if (qIdx === -1) {
      decideNextShopperDestination(shopper, stores);
      return;
    }

    // Physical queue slot smooth positioning
    const slot = store.interior.queueSlots[Math.min(store.interior.queueSlots.length - 1, qIdx)];
    if (slot) {
      shopper.x += (slot.x - shopper.x) * 0.25;
      shopper.y += (slot.y - shopper.y) * 0.25;
    }

    // Front of line -> Begin Ordering or Ticket Purchase
    if (qIdx === 0) {
      shopper.state = 'ordering_at_counter';
      shopper.timer = 40 / Math.max(1, store.staffCount);

      if (store.tenant.id === 'cinema') {
        shopper.bubble = { icon: '🍿', text: 'Movie Ticket' };
      } else if (store.tenant.id === 'dumpling_house') {
        shopper.bubble = { icon: '🥟', text: 'Xiao Long Bao' };
      } else if (store.tenant.id === 'ramen_bar') {
        shopper.bubble = { icon: '🍜', text: 'Tonkotsu Ramen' };
      } else if (store.tenant.id === 'boba_lounge') {
        shopper.bubble = { icon: '🧋', text: 'Matcha Boba' };
      } else if (store.tenant.id === 'tech_apple' || store.tenant.id === 'tech') {
        shopper.bubble = { icon: '◈', text: 'Spatial Demo' };
      } else if (store.tenant.id === 'trattoria' || store.tenant.id === 'restaurant') {
        shopper.bubble = { icon: '🍕', text: 'Truffle Pizza' };
      } else if (store.tenant.id === 'cafe_roastery' || store.tenant.id === 'cafe') {
        shopper.bubble = { icon: '☕', text: 'Artisan Latte' };
      } else if (store.tenant.id === 'luxury_maison' || store.tenant.id === 'swiss_watches') {
        shopper.bubble = { icon: '✦', text: 'Haute Collection' };
      } else {
        shopper.bubble = { icon: store.tenant.icon, text: store.tenant.name.split(' ')[0] };
      }
      shopper.bubbleTimer = shopper.timer;
    }
    return;
  }

  // -------------------------------------------------------------
  // STATE 4: ORDERING AT REGISTER / BOX OFFICE
  // -------------------------------------------------------------
  if (shopper.state === 'ordering_at_counter') {
    const store = stores.find(s => s.id === shopper.targetStoreId);
    if (!store) {
      decideNextShopperDestination(shopper, stores);
      return;
    }

    shopper.timer -= speedMultiplier;
    if (shopper.timer <= 0) {
      // Order completed! Remove from queue
      store.currentQueue = store.currentQueue.filter(id => id !== shopper.id);

      // DEEP SIMULATION: CINEMA SHOWTIME HANDLING
      if (store.tenant.id === 'cinema' && store.cinemaState) {
        store.cinemaState.ticketsSold += 1;
        shopper.hasPopcorn = true;

        // Find available theater seat
        let theaterSeat = null;
        let theaterRow = null;
        for (const tbl of store.interior.tables) {
          for (const st of tbl.seats) {
            if (st.occupiedBy === null) {
              theaterSeat = st;
              theaterRow = tbl;
              break;
            }
          }
          if (theaterSeat) break;
        }

        if (theaterSeat && theaterRow) {
          theaterSeat.occupiedBy = shopper.id;
          shopper.assignedSeatId = theaterSeat.id;
          shopper.assignedTableId = theaterRow.id;
          shopper.targetX = theaterSeat.x;
          shopper.targetY = theaterSeat.y;

          // If screening in progress, walk straight to seat
          if (store.cinemaState.phase === 'screening_in_progress' || store.cinemaState.phase === 'doors_opening') {
            shopper.state = 'walking_to_seat';
          } else {
            // Wait for doors to open
            shopper.state = 'waiting_for_showtime';
          }
          return;
        } else {
          // Sold out showtime -> Quick concession purchase and exit
          completeStoreTransaction(shopper, store, floatingFx, onSale);
          exitStoreThroughDoorway(shopper, store);
          return;
        }
      }

      // STANDARD STORE SEAT ASSIGNMENT (Restaurant, Cafe, Tech Demo, Arcade, Reading)
      let assignedSeat = null;
      let assignedTable = null;

      for (const tbl of store.interior.tables) {
        for (const st of tbl.seats) {
          if (st.occupiedBy === null) {
            assignedSeat = st;
            assignedTable = tbl;
            break;
          }
        }
        if (assignedSeat) break;
      }

      if (assignedSeat && assignedTable) {
        assignedSeat.occupiedBy = shopper.id;
        assignedTable.hasMeal = store.tenant.cat === 'Food';
        shopper.assignedSeatId = assignedSeat.id;
        shopper.assignedTableId = assignedTable.id;
        shopper.targetX = assignedSeat.x;
        shopper.targetY = assignedSeat.y;
        shopper.state = 'walking_to_seat';
      } else {
        completeStoreTransaction(shopper, store, floatingFx, onSale);
        exitStoreThroughDoorway(shopper, store);
      }
    }
    return;
  }

  // -------------------------------------------------------------
  // STATE 5: WAITING IN LOBBY FOR CINEMA DOORS TO OPEN
  // -------------------------------------------------------------
  if (shopper.state === 'waiting_for_showtime') {
    const store = stores.find(s => s.id === shopper.targetStoreId);
    if (!store || !store.cinemaState) {
      decideNextShopperDestination(shopper, stores);
      return;
    }

    // When cinema doors open or screening starts, walk into auditorium!
    if (store.cinemaState.phase === 'doors_opening' || store.cinemaState.phase === 'screening_in_progress') {
      shopper.state = 'walking_to_seat';
    }
    return;
  }

  // -------------------------------------------------------------
  // STATE 6: WALKING TO ASSIGNED TABLE / THEATER SEAT
  // -------------------------------------------------------------
  if (shopper.state === 'walking_to_seat') {
    const dist = Math.hypot(shopper.targetX - shopper.x, shopper.targetY - shopper.y);
    if (dist < 6) {
      const store = stores.find(s => s.id === shopper.targetStoreId);
      if (store?.tenant.id === 'cinema') {
        shopper.state = 'watching_movie';
      } else {
        shopper.state = 'dining_or_browsing';
        shopper.timer = 90 + Math.random() * 50;
      }
    } else {
      const step = shopper.speed * speedMultiplier;
      shopper.x += ((shopper.targetX - shopper.x) / dist) * step;
      shopper.y += ((shopper.targetY - shopper.y) / dist) * step;
    }
    return;
  }

  // -------------------------------------------------------------
  // STATE 7: WATCHING MOVIE IN CINEMA AUDITORIUM
  // -------------------------------------------------------------
  if (shopper.state === 'watching_movie') {
    const store = stores.find(s => s.id === shopper.targetStoreId);
    if (!store || !store.cinemaState) {
      decideNextShopperDestination(shopper, stores);
      return;
    }

    // When credits roll, movie finishes!
    if (store.cinemaState.phase === 'credits_rolling') {
      completeStoreTransaction(shopper, store, floatingFx, onSale);
      exitStoreThroughDoorway(shopper, store);
    }
    return;
  }

  // -------------------------------------------------------------
  // STATE 8: DINING AT TABLE / TESTING GADGETS / ARCADE GAMING
  // -------------------------------------------------------------
  if (shopper.state === 'dining_or_browsing') {
    const store = stores.find(s => s.id === shopper.targetStoreId);
    shopper.timer -= speedMultiplier;

    if (Math.random() < 0.004 && store?.tenant.id === 'arcade') {
      playArcadeSound();
    }

    if (shopper.timer <= 0) {
      if (store) {
        completeStoreTransaction(shopper, store, floatingFx, onSale);
      }
      exitStoreThroughDoorway(shopper, store);
    }
    return;
  }

  // -------------------------------------------------------------
  // STATE 9: LEAVING STORE THROUGH PHYSICAL DOORWAY
  // -------------------------------------------------------------
  if (shopper.state === 'leaving_store') {
    const dist = Math.hypot(shopper.targetX - shopper.x, shopper.targetY - shopper.y);
    if (dist < 6) {
      decideNextShopperDestination(shopper, stores);
    } else {
      const step = shopper.speed * speedMultiplier;
      shopper.x += ((shopper.targetX - shopper.x) / dist) * step;
      shopper.y += ((shopper.targetY - shopper.y) / dist) * step;
    }
  }
}

function exitStoreThroughDoorway(shopper: ShopperAgent, store: StoreInstance | undefined) {
  if (store) {
    shopper.targetX = store.interior.doorway.x;
    shopper.targetY = store.interior.doorway.y;
    shopper.state = 'leaving_store';
  } else {
    shopper.state = 'navigating_hallway';
  }
}

function completeStoreTransaction(
  shopper: ShopperAgent,
  store: StoreInstance,
  floatingFx: FloatingEffect[],
  onSale: (amount: number) => void
) {
  const tierData = store.tenant.upgrades.find(u => u.tier === store.level);
  const revMultiplier = tierData ? tierData.revenueMultiplier : (1 + (store.level - 1) * 0.45);
  let totalSale = Math.round((store.tenant.baseIncome * revMultiplier) + Math.random() * 16);

  if (store.tenant.id === 'cinema' && store.cinemaState) {
    totalSale = store.cinemaState.ticketPrice + 12; // Ticket + popcorn combo
  }

  const mallCut = Math.round(totalSale * 0.24); // 24% concession share

  store.totalRevenue += totalSale;
  store.shoppersServed += 1;
  shopper.visitedCount += 1;
  shopper.hasBag = true;

  onSale(mallCut);

  floatingFx.push({
    x: shopper.x,
    y: shopper.y - 14,
    text: `+$${mallCut}`,
    color: '#59cbbd',
    alpha: 1.3,
    vy: -0.65
  });

  shopper.bubble = { icon: '❤️', text: '' };
  shopper.bubbleTimer = 40;

  playCashSound();
}
