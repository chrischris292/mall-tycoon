import { PathNode, MallUnit, MallAmenityInstance, CustomHallwayTile } from './types';
import { TILE_SIZE } from './constants';

export interface NavNode {
  id: string;
  x: number;
  y: number;
  neighbors: string[];
}

// Master concourse hallway skeleton junctions (Westfield Valley Fair authentic super-regional spine)
export const BASE_CONCOURSE_GRAPH: Record<string, NavNode> = {
  // ==========================================
  // 1. GRAND ENTRANCE PORTALS
  // ==========================================
  'ent_north': { id: 'ent_north', x: 40.0 * TILE_SIZE, y: 1.5 * TILE_SIZE, neighbors: ['junc_north_0'] },
  'ent_east': { id: 'ent_east', x: 78.5 * TILE_SIZE, y: 24.0 * TILE_SIZE, neighbors: ['junc_east_entry', 'junc_east_macys'] },
  'ent_west': { id: 'ent_west', x: 1.5 * TILE_SIZE, y: 24.0 * TILE_SIZE, neighbors: ['junc_west_entry', 'junc_west_nordstrom'] },
  'ent_south': { id: 'ent_south', x: 40.0 * TILE_SIZE, y: 46.5 * TILE_SIZE, neighbors: ['junc_south_entry'] },
  'ent_promenade': { id: 'ent_promenade', x: 78.0 * TILE_SIZE, y: 10.0 * TILE_SIZE, neighbors: ['junc_cinema_marquee', 'junc_dining_plaza'] },

  // ==========================================
  // 2. NORTH LUXURY COLLECTION CONCOURSE & BLOOMINGDALE'S (x = 40.0)
  // ==========================================
  'junc_north_0': { id: 'junc_north_0', x: 40.0 * TILE_SIZE, y: 3.5 * TILE_SIZE, neighbors: ['ent_north', 'junc_north_1'] },
  'junc_north_1': { id: 'junc_north_1', x: 40.0 * TILE_SIZE, y: 8.5 * TILE_SIZE, neighbors: ['junc_north_0', 'junc_north_2'] },
  'junc_north_2': { id: 'junc_north_2', x: 40.0 * TILE_SIZE, y: 11.2 * TILE_SIZE, neighbors: ['junc_north_1', 'junc_north_3'] },
  'junc_north_3': { id: 'junc_north_3', x: 40.0 * TILE_SIZE, y: 15.8 * TILE_SIZE, neighbors: ['junc_north_2', 'junc_rotunda_n'] },

  // ==========================================
  // 3. GRAND CENTER COURT ROTUNDA (Central Gathering Hub)
  // ==========================================
  'junc_rotunda_n': {
    id: 'junc_rotunda_n',
    x: 40.0 * TILE_SIZE,
    y: 18.5 * TILE_SIZE,
    neighbors: ['junc_north_3', 'junc_rotunda_c', 'junc_rotunda_w', 'junc_rotunda_e', 'junc_rotunda_ne']
  },
  'junc_rotunda_c': {
    id: 'junc_rotunda_c',
    x: 40.0 * TILE_SIZE,
    y: 24.0 * TILE_SIZE,
    neighbors: ['junc_rotunda_n', 'junc_rotunda_s', 'junc_rotunda_w', 'junc_rotunda_e']
  },
  'junc_rotunda_w': {
    id: 'junc_rotunda_w',
    x: 32.0 * TILE_SIZE,
    y: 24.0 * TILE_SIZE,
    neighbors: ['junc_rotunda_c', 'junc_rotunda_n', 'junc_rotunda_s', 'junc_west_cosmetics']
  },
  'junc_rotunda_e': {
    id: 'junc_rotunda_e',
    x: 48.0 * TILE_SIZE,
    y: 24.0 * TILE_SIZE,
    neighbors: ['junc_rotunda_c', 'junc_rotunda_n', 'junc_rotunda_s', 'junc_east_zara']
  },
  'junc_rotunda_s': {
    id: 'junc_rotunda_s',
    x: 40.0 * TILE_SIZE,
    y: 29.5 * TILE_SIZE,
    neighbors: ['junc_rotunda_c', 'junc_rotunda_w', 'junc_rotunda_e', 'junc_south_arcade']
  },
  'junc_rotunda_ne': {
    id: 'junc_rotunda_ne',
    x: 46.0 * TILE_SIZE,
    y: 18.5 * TILE_SIZE,
    neighbors: ['junc_rotunda_n', 'junc_rotunda_e', 'junc_dining_entry']
  },

  // ==========================================
  // 4. OUTDOOR DINING PROMENADE & SHOWPLACE ICON CINEMA (x: 48.0 to 78.0, y: 2.0 to 18.0)
  // ==========================================
  'junc_dining_entry': {
    id: 'junc_dining_entry',
    x: 48.0 * TILE_SIZE,
    y: 14.0 * TILE_SIZE,
    neighbors: ['junc_rotunda_ne', 'junc_dining_plaza', 'junc_dining_eataly']
  },
  'junc_dining_eataly': {
    id: 'junc_dining_eataly',
    x: 53.25 * TILE_SIZE,
    y: 9.0 * TILE_SIZE,
    neighbors: ['junc_dining_entry', 'junc_dining_plaza', 'junc_dining_dumpling']
  },
  'junc_dining_plaza': {
    id: 'junc_dining_plaza',
    x: 56.5 * TILE_SIZE,
    y: 10.5 * TILE_SIZE,
    neighbors: ['junc_dining_entry', 'junc_dining_eataly', 'junc_dining_dumpling', 'junc_dining_shakeshack', 'ent_promenade']
  },
  'junc_dining_dumpling': {
    id: 'junc_dining_dumpling',
    x: 62.25 * TILE_SIZE,
    y: 9.0 * TILE_SIZE,
    neighbors: ['junc_dining_eataly', 'junc_dining_plaza', 'junc_cinema_marquee']
  },
  'junc_dining_shakeshack': {
    id: 'junc_dining_shakeshack',
    x: 66.25 * TILE_SIZE,
    y: 12.0 * TILE_SIZE,
    neighbors: ['junc_dining_plaza', 'junc_cinema_marquee']
  },
  'junc_cinema_marquee': {
    id: 'junc_cinema_marquee',
    x: 72.25 * TILE_SIZE,
    y: 11.0 * TILE_SIZE,
    neighbors: ['junc_dining_dumpling', 'junc_dining_shakeshack', 'ent_promenade', 'junc_cinema_lobby']
  },
  'junc_cinema_lobby': {
    id: 'junc_cinema_lobby',
    x: 72.25 * TILE_SIZE,
    y: 8.0 * TILE_SIZE,
    neighbors: ['junc_cinema_marquee']
  },

  // ==========================================
  // 5. WEST ANCHOR GALLERIA & NORDSTROM (y = 24.0)
  // ==========================================
  'junc_west_cosmetics': {
    id: 'junc_west_cosmetics',
    x: 27.0 * TILE_SIZE,
    y: 24.0 * TILE_SIZE,
    neighbors: ['junc_rotunda_w', 'junc_west_tech']
  },
  'junc_west_tech': {
    id: 'junc_west_tech',
    x: 18.75 * TILE_SIZE,
    y: 24.0 * TILE_SIZE,
    neighbors: ['junc_west_cosmetics', 'junc_west_nordstrom']
  },
  'junc_west_nordstrom': {
    id: 'junc_west_nordstrom',
    x: 14.0 * TILE_SIZE,
    y: 24.0 * TILE_SIZE,
    neighbors: ['junc_west_tech', 'junc_west_entry']
  },
  'junc_west_entry': {
    id: 'junc_west_entry',
    x: 6.0 * TILE_SIZE,
    y: 24.0 * TILE_SIZE,
    neighbors: ['junc_west_nordstrom', 'ent_west']
  },

  // ==========================================
  // 6. EAST ANCHOR GALLERIA & MACY'S (y = 24.0)
  // ==========================================
  'junc_east_zara': {
    id: 'junc_east_zara',
    x: 53.25 * TILE_SIZE,
    y: 24.0 * TILE_SIZE,
    neighbors: ['junc_rotunda_e', 'junc_east_uniqlo']
  },
  'junc_east_uniqlo': {
    id: 'junc_east_uniqlo',
    x: 61.75 * TILE_SIZE,
    y: 24.0 * TILE_SIZE,
    neighbors: ['junc_east_zara', 'junc_east_macys']
  },
  'junc_east_macys': {
    id: 'junc_east_macys',
    x: 66.5 * TILE_SIZE,
    y: 24.0 * TILE_SIZE,
    neighbors: ['junc_east_uniqlo', 'junc_east_entry']
  },
  'junc_east_entry': {
    id: 'junc_east_entry',
    x: 74.0 * TILE_SIZE,
    y: 24.0 * TILE_SIZE,
    neighbors: ['junc_east_macys', 'ent_east']
  },

  // ==========================================
  // 7. SOUTH ENTERTAINMENT & ROUND 1 (x = 40.0)
  // ==========================================
  'junc_south_arcade': {
    id: 'junc_south_arcade',
    x: 40.0 * TILE_SIZE,
    y: 34.25 * TILE_SIZE,
    neighbors: ['junc_rotunda_s', 'junc_south_botanical']
  },
  'junc_south_botanical': {
    id: 'junc_south_botanical',
    x: 40.0 * TILE_SIZE,
    y: 41.5 * TILE_SIZE,
    neighbors: ['junc_south_arcade', 'junc_south_entry']
  },
  'junc_south_entry': {
    id: 'junc_south_entry',
    x: 40.0 * TILE_SIZE,
    y: 44.5 * TILE_SIZE,
    neighbors: ['junc_south_botanical', 'ent_south']
  }
};

// Active Dynamic Nav Graph (rebuilt when lots or amenities change)
export let NAV_GRAPH: Record<string, NavNode> = { ...BASE_CONCOURSE_GRAPH };

export function rebuildNavGraph(
  units: MallUnit[],
  amenities?: MallAmenityInstance[],
  customHallways?: CustomHallwayTile[]
) {
  const graph: Record<string, NavNode> = {};

  // Clone base concourse junctions
  for (const [id, node] of Object.entries(BASE_CONCOURSE_GRAPH)) {
    graph[id] = {
      id: node.id,
      x: node.x,
      y: node.y,
      neighbors: [...node.neighbors]
    };
  }

  // Connect custom hallway tiles
  if (customHallways && customHallways.length > 0) {
    customHallways.forEach((h) => {
      const hId = `hallway_${h.x}_${h.y}`;
      const hpx = (h.x + 0.5) * TILE_SIZE;
      const hpy = (h.y + 0.5) * TILE_SIZE;

      let bestJuncId = 'junc_rotunda_c';
      let bestDist = Infinity;
      for (const [jid, jnode] of Object.entries(BASE_CONCOURSE_GRAPH)) {
        const d = Math.hypot(jnode.x - hpx, jnode.y - hpy);
        if (d < bestDist) {
          bestDist = d;
          bestJuncId = jid;
        }
      }

      graph[hId] = {
        id: hId,
        x: hpx,
        y: hpy,
        neighbors: [bestJuncId]
      };

      if (graph[bestJuncId] && !graph[bestJuncId].neighbors.includes(hId)) {
        graph[bestJuncId].neighbors.push(hId);
      }
    });
  }

  // Connect all store doorway nodes dynamically
  units.forEach((unit, idx) => {
    const doorId = unit[6] || `door_u${idx}`;
    const doorX = unit[5].x;
    const doorY = unit[5].y;

    // Find 2 closest concourse spine junctions
    let bestJuncId = 'junc_rotunda_c';
    let bestDist = Infinity;
    let secondJuncId = '';
    let secondDist = Infinity;

    for (const [jid, jnode] of Object.entries(BASE_CONCOURSE_GRAPH)) {
      if (jid.startsWith('ent_')) continue;
      const d = Math.hypot(jnode.x - doorX, jnode.y - doorY);
      if (d < bestDist) {
        secondDist = bestDist;
        secondJuncId = bestJuncId;
        bestDist = d;
        bestJuncId = jid;
      } else if (d < secondDist) {
        secondDist = d;
        secondJuncId = jid;
      }
    }

    const neighbors = [bestJuncId];
    if (secondJuncId && secondDist < bestDist * 1.5) {
      neighbors.push(secondJuncId);
    }

    graph[doorId] = {
      id: doorId,
      x: doorX,
      y: doorY,
      neighbors
    };

    // Add bidirectional link to junctions
    if (graph[bestJuncId] && !graph[bestJuncId].neighbors.includes(doorId)) {
      graph[bestJuncId].neighbors.push(doorId);
    }
    if (secondJuncId && graph[secondJuncId] && !graph[secondJuncId].neighbors.includes(doorId)) {
      graph[secondJuncId].neighbors.push(doorId);
    }
  });

  // Connect amenities if present
  if (amenities) {
    amenities.forEach((amenity) => {
      const amenId = `amenity_${amenity.id}`;
      const ax = amenity.x + amenity.w / 2;
      const ay = amenity.y + amenity.h / 2;

      let bestJuncId = 'junc_rotunda_c';
      let bestDist = Infinity;
      for (const [jid, jnode] of Object.entries(BASE_CONCOURSE_GRAPH)) {
        if (jid.startsWith('ent_')) continue;
        const d = Math.hypot(jnode.x - ax, jnode.y - ay);
        if (d < bestDist) {
          bestDist = d;
          bestJuncId = jid;
        }
      }

      graph[amenId] = {
        id: amenId,
        x: ax,
        y: ay,
        neighbors: [bestJuncId]
      };

      if (graph[bestJuncId] && !graph[bestJuncId].neighbors.includes(amenId)) {
        graph[bestJuncId].neighbors.push(amenId);
      }
    });
  }

  NAV_GRAPH = graph;
}

// Find closest nav graph node to any (x, y)
export function findClosestNavNode(x: number, y: number): string {
  let closestId = 'junc_rotunda_c';
  let minDist = Infinity;

  for (const [id, node] of Object.entries(NAV_GRAPH)) {
    const dist = Math.hypot(node.x - x, node.y - y);
    if (dist < minDist) {
      minDist = dist;
      closestId = id;
    }
  }

  return closestId;
}

// A* shortest path search over the concourse network
export function findHallwayPath(startX: number, startY: number, destX: number, destY: number): PathNode[] {
  const startNodeId = findClosestNavNode(startX, startY);
  const targetNodeId = findClosestNavNode(destX, destY);

  if (startNodeId === targetNodeId) {
    const n = NAV_GRAPH[startNodeId];
    return [
      { x: n ? n.x : startX, y: n ? n.y : startY },
      { x: destX, y: destY }
    ];
  }

  const openSet = new Set<string>([startNodeId]);
  const cameFrom = new Map<string, string>();
  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();

  const startNode = NAV_GRAPH[startNodeId];
  const targetNode = NAV_GRAPH[targetNodeId];
  if (!startNode || !targetNode) {
    return [{ x: destX, y: destY }];
  }

  gScore.set(startNodeId, 0);
  fScore.set(
    startNodeId,
    Math.hypot(startNode.x - targetNode.x, startNode.y - targetNode.y)
  );

  while (openSet.size > 0) {
    let currentId = '';
    let lowestF = Infinity;
    for (const id of openSet) {
      const f = fScore.get(id) ?? Infinity;
      if (f < lowestF) {
        lowestF = f;
        currentId = id;
      }
    }

    if (currentId === targetNodeId) {
      const path: PathNode[] = [];
      let curr = currentId;
      while (curr) {
        const node = NAV_GRAPH[curr];
        if (node) path.unshift({ x: node.x, y: node.y });
        curr = cameFrom.get(curr) || '';
      }
      path.push({ x: destX, y: destY });
      return path;
    }

    openSet.delete(currentId);
    const currentNode = NAV_GRAPH[currentId];
    if (!currentNode) continue;

    for (const neighborId of currentNode.neighbors) {
      const neighborNode = NAV_GRAPH[neighborId];
      if (!neighborNode) continue;

      const dist = Math.hypot(neighborNode.x - currentNode.x, neighborNode.y - currentNode.y);
      const tentativeG = (gScore.get(currentId) ?? Infinity) + dist;

      if (tentativeG < (gScore.get(neighborId) ?? Infinity)) {
        cameFrom.set(neighborId, currentId);
        gScore.set(neighborId, tentativeG);
        const h = Math.hypot(neighborNode.x - targetNode.x, neighborNode.y - targetNode.y);
        fScore.set(neighborId, tentativeG + h);
        openSet.add(neighborId);
      }
    }
  }

  return [{ x: destX, y: destY }];
}
