import { TenantDefinition, MallUnit, AmenityDefinition } from './types';

export const TILE_SIZE = 32;
export const CANVAS_WIDTH = 2560;
export const CANVAS_HEIGHT = 1536;
export const TICKS_PER_DAY = 260;

// Placable Concourse Amenities Catalog
export const AMENITIES_CATALOG: AmenityDefinition[] = [
  {
    type: 'fountain_tier',
    name: 'Tiered Dancing Fountain',
    category: 'Decor',
    icon: '⛲',
    cost: 450,
    w: 2,
    h: 2,
    reputationBonus: 8,
    description: 'Illuminated choreographed water fountain that creates a soothing atmosphere for resting shoppers.',
    effect: '+8 Mall Reputation & Shopper Happiness'
  },
  {
    type: 'palm_planter',
    name: 'Tropical Palm Planter',
    category: 'Decor',
    icon: '🌴',
    cost: 180,
    w: 1,
    h: 1,
    reputationBonus: 3,
    description: 'Lush indoor tropical palm in handcrafted stoneware planter. Beautifies concourse corridors.',
    effect: '+3 Aesthetics & Cleanliness rating'
  },
  {
    type: 'rest_bench',
    name: 'Teakwood Concourse Bench',
    category: 'Comfort',
    icon: '🪑',
    cost: 220,
    w: 2,
    h: 1,
    reputationBonus: 4,
    description: 'Ergonomic bench where tired shoppers can sit down to rest, extending their stay at the mall.',
    effect: 'Provides rest seating for 2 shoppers'
  },
  {
    type: 'atm_kiosk',
    name: 'Premier Bank ATM Kiosk',
    category: 'Utility',
    icon: '🏧',
    cost: 550,
    w: 1,
    h: 1,
    reputationBonus: 5,
    description: 'Cash dispenser machine. Shoppers low on funds visit to withdraw more cash for shopping!',
    effect: 'Replenishes shopper spending budgets'
  },
  {
    type: 'coffee_cart',
    name: 'Atrium Espresso Cart',
    category: 'Dining',
    icon: '☕',
    cost: 750,
    w: 2,
    h: 1,
    reputationBonus: 6,
    description: 'Artisan mobile espresso kiosk serving cortados, cold brews, and biscotti right in the concourse.',
    effect: 'Generates passive concourse beverage sales'
  },
  {
    type: 'boba_pop_up',
    name: 'Boba Tea Pop-up Kiosk',
    category: 'Dining',
    icon: '🧋',
    cost: 820,
    w: 2,
    h: 1,
    reputationBonus: 7,
    description: 'High-draw pop-up station serving fresh tiger boba milk tea and fruit slushies.',
    effect: 'Boosts foot traffic and generates passive cash'
  },
  {
    type: 'bistro_dining_set',
    name: 'Food Court Bistro Umbrella Set',
    category: 'Dining',
    icon: '⛱️',
    cost: 320,
    w: 2,
    h: 2,
    reputationBonus: 5,
    description: 'Communal dining table with 4 chairs and a vibrant canvas umbrella for food court snacking.',
    effect: 'Adds 4 communal dining seats'
  },
  {
    type: 'luxury_restroom',
    name: 'Executive Restroom Pavilion',
    category: 'Utility',
    icon: '🚻',
    cost: 650,
    w: 2,
    h: 2,
    reputationBonus: 6,
    description: 'Marble-appointed luxury restrooms with touchless amenities and lounge vanity mirrors.',
    effect: '+6 Cleanliness & Shopper Satisfaction'
  },
  {
    type: 'concierge_info',
    name: 'Digital Directory & Concierge',
    category: 'Utility',
    icon: 'ℹ️',
    cost: 400,
    w: 1,
    h: 1,
    reputationBonus: 5,
    description: 'Interactive touchscreen mall guide helping shoppers find their favorite boutiques and dining.',
    effect: 'Speeds up shopper pathfinding and store discovery'
  }
];

export const TENANTS_CATALOG: TenantDefinition[] = [
  // =========================================================================
  // 1. LUXURY COLLECTION (Inspired by Valley Fair's Luxury Wing)
  // =========================================================================
  {
    id: 'luxury_maison',
    name: 'Maison De L\'Étoile Haute Couture',
    cat: 'Luxury',
    icon: '✦',
    color: '#831843',
    cost: 3200,
    draw: 45,
    w: 2,
    h: 2,
    baseIncome: 140,
    itemDescription: 'Two-story luxury fashion house with private champagne VIP salons, haute runway gowns, and bespoke leather atelier.',
    mechanicType: 'fashion_luxury',
    baseSeatingPerTile: 3,
    baseStaff: 2,
    signatureItem: 'Parisian Silk Evening Gown & Diamond Clutch',
    upgrades: [
      {
        tier: 2,
        name: 'Private VIP Salon & Atelier',
        cost: 2400,
        seatingBonus: 4,
        staffCount: 3,
        revenueMultiplier: 1.6,
        drawBonus: 18,
        features: ['Crystal Chandelier Runway', 'Champagne Fitting Suite', 'Personal Stylist Service'],
        signatureItem: 'Bespoke Velvet Tuxedo'
      },
      {
        tier: 3,
        name: 'Flagship Luxury Palace',
        cost: 4900,
        seatingBonus: 6,
        staffCount: 4,
        revenueMultiplier: 2.45,
        drawBonus: 32,
        features: ['Private Rooftop Fitting Lounge', 'Gold Leaf Facade', 'Exclusive Fashion Week Previews'],
        signatureItem: 'Limited Haute Couture Runway Masterpiece'
      }
    ]
  },
  {
    id: 'swiss_watches',
    name: 'Aurelia Swiss Timepieces & Diamonds',
    cat: 'Luxury',
    icon: '◈',
    color: '#b45309',
    cost: 3600,
    draw: 48,
    w: 2,
    h: 1,
    baseIncome: 160,
    itemDescription: 'Swiss tourbillon chronometers, platinum jewelry vaults, and master horologist service counters.',
    mechanicType: 'fashion_luxury',
    baseSeatingPerTile: 2,
    baseStaff: 2,
    signatureItem: 'Tourbillon Platinum Chronometer & Diamond Necklace',
    upgrades: [
      {
        tier: 2,
        name: 'Horology Vault & Lounge',
        cost: 2600,
        seatingBonus: 3,
        staffCount: 3,
        revenueMultiplier: 1.55,
        drawBonus: 16,
        features: ['Anti-Reflective Vault Cases', 'Master Watchmaker Workbench', 'Cognac Tasting Lounge'],
        signatureItem: 'Skeletonized Rose Gold Watch'
      },
      {
        tier: 3,
        name: 'Global Flagship Vault',
        cost: 5200,
        seatingBonus: 5,
        staffCount: 4,
        revenueMultiplier: 2.4,
        drawBonus: 30,
        features: ['High-Jewelry Private Suite', 'Rare Vintage Timepiece Archive', 'Armored VIP Room'],
        signatureItem: 'One-of-a-Kind Perpetual Calendar Watch'
      }
    ]
  },
  {
    id: 'leather_atelier',
    name: 'Saddle & Stitch Parisian Leather',
    cat: 'Luxury',
    icon: '👜',
    color: '#78350f',
    cost: 2400,
    draw: 38,
    w: 1,
    h: 2,
    baseIncome: 110,
    itemDescription: 'Handcrafted Italian full-grain leather bags, monogramming desks, and luxury travel luggage trunks.',
    mechanicType: 'fashion_luxury',
    baseSeatingPerTile: 2,
    baseStaff: 1,
    signatureItem: 'Hand-Stitched Calfskin Birkin Tote',
    upgrades: [
      {
        tier: 2,
        name: 'Custom Monogram Atelier',
        cost: 1800,
        seatingBonus: 2,
        staffCount: 2,
        revenueMultiplier: 1.5,
        drawBonus: 14,
        features: ['Live Gold-Foil Hot Stamping', 'Exotic Skin Showcase', 'Luggage Customizer Bar'],
        signatureItem: 'Personalized Leather Travel Trunk'
      },
      {
        tier: 3,
        name: 'Maison Heritage Flagship',
        cost: 3800,
        seatingBonus: 4,
        staffCount: 3,
        revenueMultiplier: 2.3,
        drawBonus: 26,
        features: ['Master Tanner Workbench Display', 'Plush Leather Loungers', 'Archival Showcase'],
        signatureItem: 'Limited Heritage Alligator Duffle'
      }
    ]
  },

  // =========================================================================
  // 2. DINING TERRACE & ASIAN GOURMET HALL (Valley Fair iconic eateries)
  // =========================================================================
  {
    id: 'dumpling_house',
    name: 'Din Blossom Dumpling House',
    cat: 'Food',
    icon: '🥟',
    color: '#be123c',
    cost: 2100,
    draw: 42,
    w: 2,
    h: 2,
    baseIncome: 115,
    itemDescription: 'Glass-walled show kitchen with master dumpling chefs folding 18-fold Kurobuta pork Xiao Long Bao and spicy wontons.',
    mechanicType: 'dining_asian_dumpling',
    baseSeatingPerTile: 4,
    baseStaff: 3,
    signatureItem: 'Truffle Kurobuta Xiao Long Bao & Sesame Noodles',
    upgrades: [
      {
        tier: 2,
        name: 'Imperial Dim Sum Parlor',
        cost: 1600,
        seatingBonus: 6,
        staffCount: 4,
        revenueMultiplier: 1.55,
        drawBonus: 18,
        features: ['Glass Dumpling Theater Showcase', 'Teakwood Dining Booths', 'Steamer Cart Service'],
        signatureItem: 'Crab Roe & Black Truffle Soup Dumplings'
      },
      {
        tier: 3,
        name: 'Michelin Star Dining Pavilion',
        cost: 3600,
        seatingBonus: 8,
        staffCount: 5,
        revenueMultiplier: 2.35,
        drawBonus: 32,
        features: ['Private Emperor Tea Rooms', 'Live Wok Stations', 'Sommelier Tea Pairings'],
        signatureItem: 'Grand Golden Dumpling Feast'
      }
    ]
  },
  {
    id: 'ramen_bar',
    name: 'Kyoto Craft Ramen & Izakaya',
    cat: 'Food',
    icon: '🍜',
    color: '#c2410c',
    cost: 1650,
    draw: 36,
    w: 2,
    h: 1,
    baseIncome: 88,
    itemDescription: '24-hour simmered Tonkotsu broth, handmade springy noodles, sizzling gyoza, and counter bar seating.',
    mechanicType: 'dining_ramen',
    baseSeatingPerTile: 4,
    baseStaff: 2,
    signatureItem: 'Black Garlic Tonkotsu & Sizzling Gyoza',
    upgrades: [
      {
        tier: 2,
        name: 'Artisan Noodle Lab',
        cost: 1250,
        seatingBonus: 4,
        staffCount: 3,
        revenueMultiplier: 1.5,
        drawBonus: 14,
        features: ['Custom Broth Customization Cards', 'Lantern Counter Lighting', 'Rapid Noodle Cookers'],
        signatureItem: 'Spicy Red King Chashu Bowl'
      },
      {
        tier: 3,
        name: 'Izakaya & Ramen Emporium',
        cost: 2800,
        seatingBonus: 6,
        staffCount: 4,
        revenueMultiplier: 2.3,
        drawBonus: 28,
        features: ['Robata Yakitori Charcoal Grill', 'Japanese Craft Beer Taps', 'Tatami Dining Booths'],
        signatureItem: 'A5 Wagyu Tonkotsu & Sake Flight'
      }
    ]
  },
  {
    id: 'trattoria',
    name: 'Bella Vista Trattoria & Brick Oven',
    cat: 'Food',
    icon: '🍕',
    color: '#991b1b',
    cost: 1950,
    draw: 38,
    w: 2,
    h: 2,
    baseIncome: 105,
    itemDescription: 'Woodfired brick oven pizza, handmade extruded pasta, cured charcuterie displays, and Chianti wine bar.',
    mechanicType: 'dining_restaurant',
    baseSeatingPerTile: 4,
    baseStaff: 2,
    signatureItem: 'Woodfired Truffle Burrata Pizza & Chianti',
    upgrades: [
      {
        tier: 2,
        name: 'Ristorante con Enoteca',
        cost: 1500,
        seatingBonus: 4,
        staffCount: 3,
        revenueMultiplier: 1.5,
        drawBonus: 15,
        features: ['Open Brick Oven Flame Display', 'Oak Dining Booths', 'Floor Waiter Service'],
        signatureItem: 'Tagliatelle al Tartufo Nero'
      },
      {
        tier: 3,
        name: 'Grand Italian Market & Dining Hall',
        cost: 3400,
        seatingBonus: 8,
        staffCount: 5,
        revenueMultiplier: 2.35,
        drawBonus: 30,
        features: ['Sommelier Cellar', 'Live Gelato & Prosciutto Bar', 'Tasting Menus'],
        signatureItem: 'Chef Truffle & Barolo Reserve Menu'
      }
    ]
  },
  {
    id: 'boba_lounge',
    name: 'Matcha Bliss & Boba Teahouse',
    cat: 'Food',
    icon: '🧋',
    color: '#4d7c0f',
    cost: 850,
    draw: 24,
    w: 1,
    h: 1,
    baseIncome: 48,
    itemDescription: 'Ceremonial grade Kyoto matcha lattes, slow-cooked brown sugar boba pearls, and egg waffles.',
    mechanicType: 'dining_boba',
    baseSeatingPerTile: 3,
    baseStaff: 2,
    signatureItem: 'Brown Sugar Tiger Milk & Matcha Soft Serve',
    upgrades: [
      {
        tier: 2,
        name: 'Artisan Boba & Dessert Bar',
        cost: 650,
        seatingBonus: 2,
        staffCount: 2,
        revenueMultiplier: 1.45,
        drawBonus: 10,
        features: ['Ceremonial Whisking Station', 'Boba Cooking Pots', 'Neon Bubble Signage'],
        signatureItem: 'Taro Ube Swirl & Egg Puff'
      },
      {
        tier: 3,
        name: 'Grand Kyoto Tea Pavilion',
        cost: 1450,
        seatingBonus: 4,
        staffCount: 3,
        revenueMultiplier: 2.2,
        drawBonus: 20,
        features: ['Matcha Dessert Omakase', 'Bamboo Zen Seating', 'Live Crepe Station'],
        signatureItem: 'Matcha Parfait Tower & Gold Leaf Tea'
      }
    ]
  },
  {
    id: 'smokehouse',
    name: 'Prime Smokehouse & Craft Shakes',
    cat: 'Food',
    icon: '🍔',
    color: '#ea580c',
    cost: 1200,
    draw: 28,
    w: 2,
    h: 1,
    baseIncome: 68,
    itemDescription: 'Wagyu smashburgers on potato brioche, seasoned waffle fries, and frozen custard shakes.',
    mechanicType: 'dining_cafe',
    baseSeatingPerTile: 3,
    baseStaff: 2,
    signatureItem: 'Double Truffle Smash & Salted Caramel Shake',
    upgrades: [
      {
        tier: 2,
        name: 'Gourmet Smokehouse Grill',
        cost: 950,
        seatingBonus: 3,
        staffCount: 2,
        revenueMultiplier: 1.45,
        drawBonus: 12,
        features: ['Smoked Brisket Toppings', 'Self-Serve Sauce Bar', 'Express Kitchen Line'],
        signatureItem: 'Smoked Gouda BBQ Bacon Burger'
      },
      {
        tier: 3,
        name: 'Flagship Burger Lounge',
        cost: 2100,
        seatingBonus: 5,
        staffCount: 3,
        revenueMultiplier: 2.25,
        drawBonus: 24,
        features: ['Craft Beer & Soda Wall', 'Leather Diner Booths', 'Flame Charred Grill'],
        signatureItem: 'Gold Leaf Wagyu & Bourbon Shake'
      }
    ]
  },
  {
    id: 'cafe_roastery',
    name: 'Juniper Artisan Coffee & Bakery',
    cat: 'Food',
    icon: '☕',
    color: '#854d0e',
    cost: 820,
    draw: 22,
    w: 1,
    h: 1,
    baseIncome: 45,
    itemDescription: 'Single-origin espresso bar with live pastry oven timers, hot almond croissants, and cozy marble cafe tables.',
    mechanicType: 'dining_cafe',
    baseSeatingPerTile: 3,
    baseStaff: 2,
    signatureItem: 'Vanilla Bean Flat White & Warm Croissant',
    upgrades: [
      {
        tier: 2,
        name: 'Artisan Roastery & Patisserie',
        cost: 650,
        seatingBonus: 2,
        staffCount: 2,
        revenueMultiplier: 1.45,
        drawBonus: 10,
        features: ['Italian Lever Espresso Machine', 'Marble Bistro Tables', 'Live Croissant Proofer'],
        signatureItem: 'Signature Cold Foam Affogato'
      },
      {
        tier: 3,
        name: 'Grand Reserve Roastery',
        cost: 1550,
        seatingBonus: 4,
        staffCount: 3,
        revenueMultiplier: 2.2,
        drawBonus: 20,
        features: ['In-House Micro-Roaster', 'Velvet Lounge Booths', 'Pour-Over Tasting Bar'],
        signatureItem: 'Geisha Reserve Flight & French Macarons'
      }
    ]
  },
  {
    id: 'chocolatier',
    name: 'Chocolatier De Valois & Gelato',
    cat: 'Food',
    icon: '🍫',
    color: '#581c87',
    cost: 780,
    draw: 20,
    w: 1,
    h: 1,
    baseIncome: 42,
    itemDescription: 'Belgian artisan chocolate truffles, chocolate fountain fondue, and authentic Italian gelato bar.',
    mechanicType: 'dining_cafe',
    baseSeatingPerTile: 2,
    baseStaff: 1,
    signatureItem: 'Handmade Dark Truffle Box & Pistachio Gelato',
    upgrades: [
      {
        tier: 2,
        name: 'Chocolaterie & Creperie',
        cost: 600,
        seatingBonus: 2,
        staffCount: 2,
        revenueMultiplier: 1.4,
        drawBonus: 9,
        features: ['Flowing Chocolate Fountain', 'Fresh Crepe Griddle', 'Tasting Counter'],
        signatureItem: 'Warm Nutella Strawberry Crepe'
      },
      {
        tier: 3,
        name: 'Grand Palace Chocolatier',
        cost: 1350,
        seatingBonus: 4,
        staffCount: 3,
        revenueMultiplier: 2.15,
        drawBonus: 18,
        features: ['Custom Gift Packaging Lounge', 'Gold-Dusted Pralines', 'Hot Chocolate Bar'],
        signatureItem: 'Grand Royal Truffle Collection'
      }
    ]
  },

  // =========================================================================
  // 3. ENTERTAINMENT & TECH (Valley Fair ICON Cinema, Apple Flagship, VR/Arcade)
  // =========================================================================
  {
    id: 'cinema',
    name: 'Starlight IMAX & Dolby Cinema',
    cat: 'Entertainment',
    icon: '🎬',
    color: '#0f172a',
    cost: 4500,
    draw: 60,
    w: 3,
    h: 2,
    baseIncome: 195,
    itemDescription: 'Multi-screen theater with scheduled movie rotations, laser 4K projectors, VIP heated power recliners, and fresh butter popcorn concessions.',
    mechanicType: 'cinema_theater',
    baseSeatingPerTile: 4,
    baseStaff: 3,
    signatureItem: 'IMAX VIP Recliner & Gourmet Popcorn Combo',
    upgrades: [
      {
        tier: 2,
        name: 'Dolby Laser 4DX Multiplex',
        cost: 3200,
        seatingBonus: 6,
        staffCount: 4,
        revenueMultiplier: 1.65,
        drawBonus: 24,
        features: ['Floor-to-Ceiling Curved Screen', 'Dolby Atmos 64-Channel Sound', 'In-Seat Gourmet Dining Call Buttons'],
        signatureItem: 'Premiere Night Red Carpet Pass'
      },
      {
        tier: 3,
        name: 'Ultra-Luxe VIP Dine-In Cinema',
        cost: 6200,
        seatingBonus: 10,
        staffCount: 5,
        revenueMultiplier: 2.5,
        drawBonus: 40,
        features: ['Private Director Balconies', 'Laser 8K Dual Projectors', 'Sommelier Wine & Truffle Service'],
        signatureItem: 'Private Director Screening Salon & Champagne'
      }
    ]
  },
  {
    id: 'tech_apple',
    name: 'Horizon Quantum Tech Flagship',
    cat: 'Specialty',
    icon: '◈',
    color: '#0284c7',
    cost: 3800,
    draw: 55,
    w: 3,
    h: 2,
    baseIncome: 180,
    itemDescription: 'Monumental 2-story glass cube facade with live product keynote demonstrations, smart devices, and Genius support bar.',
    mechanicType: 'tech_demo',
    baseSeatingPerTile: 3,
    baseStaff: 3,
    signatureItem: 'Quantum Pro Ultra Spatial Headset',
    upgrades: [
      {
        tier: 2,
        name: 'Genius Experience Center',
        cost: 2800,
        seatingBonus: 4,
        staffCount: 4,
        revenueMultiplier: 1.55,
        drawBonus: 20,
        features: ['OLED Smart Table Displays', 'VR Spatial Playground', 'Hardware Genius Bar'],
        signatureItem: 'Neural Link Smart Glasses'
      },
      {
        tier: 3,
        name: 'Mega Flagship Cyber Lab',
        cost: 5400,
        seatingBonus: 6,
        staffCount: 5,
        revenueMultiplier: 2.4,
        drawBonus: 35,
        features: ['Hologram Demo Amphitheater', 'Robotics AI Assistant Pods', 'Express Drone Pickup'],
        signatureItem: 'Autonomous AI Companion Bot'
      }
    ]
  },
  {
    id: 'arcade_bowlero',
    name: 'Neon Horizon Retro Cyber Arcade',
    cat: 'Entertainment',
    icon: '◉',
    color: '#581c87',
    cost: 2600,
    draw: 38,
    w: 2,
    h: 2,
    baseIncome: 110,
    itemDescription: 'Glowing neon arcade cabinets, air hockey, full-motion racing pods, and golden jackpot ticket dispensers.',
    mechanicType: 'arcade_gaming',
    baseSeatingPerTile: 3,
    baseStaff: 2,
    signatureItem: '1,000 Golden Ticket Jackpots',
    upgrades: [
      {
        tier: 2,
        name: 'Cyber Arcade & VR Arena',
        cost: 1800,
        seatingBonus: 4,
        staffCount: 3,
        revenueMultiplier: 1.5,
        drawBonus: 16,
        features: ['Dual 4-Player Driving Sims', 'Buzzer Prize Dispensers', 'Retro Synth DJ Booth'],
        signatureItem: 'Giant Plush Crane Trophy'
      },
      {
        tier: 3,
        name: 'Esports Stadium & Arena',
        cost: 3800,
        seatingBonus: 6,
        staffCount: 4,
        revenueMultiplier: 2.35,
        drawBonus: 32,
        features: ['8-Pod LAN Tournament Arena', 'Full-Motion Flight Simulator', 'VIP Arcade Lounge'],
        signatureItem: 'Grand Championship Trophy'
      }
    ]
  },
  {
    id: 'toy_wonderland',
    name: 'Toy Box Wonderland & LEGO Lab',
    cat: 'Entertainment',
    icon: '★',
    color: '#be123c',
    cost: 1450,
    draw: 30,
    w: 2,
    h: 1,
    baseIncome: 75,
    itemDescription: 'Interactive LEGO brick building tables, motorized train mountain, plush animal towers, and kids play zone.',
    mechanicType: 'toy_playlab',
    baseSeatingPerTile: 3,
    baseStaff: 2,
    signatureItem: 'Giant 5,000-Piece Castle LEGO Set',
    upgrades: [
      {
        tier: 2,
        name: 'Interactive Workshop Lab',
        cost: 1100,
        seatingBonus: 3,
        staffCount: 2,
        revenueMultiplier: 1.45,
        drawBonus: 14,
        features: ['Robotic Train Mountain', 'Build-Your-Own Bot Station', 'Toy Tester Floor Staff'],
        signatureItem: 'Programmable Quadcopter Kit'
      },
      {
        tier: 3,
        name: 'Theme Park Toy Megastore',
        cost: 2400,
        seatingBonus: 5,
        staffCount: 3,
        revenueMultiplier: 2.25,
        drawBonus: 28,
        features: ['Indoor Ferris Wheel Carousel', 'Life-Size Animatronic Dragon', 'Costume Mascot Visits'],
        signatureItem: 'Custom Motorized Mini-EV Car'
      }
    ]
  },

  // =========================================================================
  // 4. FASHION & LIFESTYLE (Zara, Uniqlo, Sephora, Lululemon style)
  // =========================================================================
  {
    id: 'fast_fashion',
    name: 'Urban Thread Contemporary Apparel',
    cat: 'Fashion',
    icon: '👗',
    color: '#334155',
    cost: 1850,
    draw: 35,
    w: 2,
    h: 2,
    baseIncome: 95,
    itemDescription: 'Runway trend apparel, denim walls, mirror fitting suites, and seasonal fashion collections.',
    mechanicType: 'fashion_boutique',
    baseSeatingPerTile: 3,
    baseStaff: 2,
    signatureItem: 'Tailored Linen Blazer & Denim Set',
    upgrades: [
      {
        tier: 2,
        name: 'High Fashion Concept Store',
        cost: 1400,
        seatingBonus: 3,
        staffCount: 3,
        revenueMultiplier: 1.45,
        drawBonus: 14,
        features: ['Illuminated Runway Mannequins', 'Smart Mirrored Dressing Suites', 'Shoe Display Wall'],
        signatureItem: 'Designer Wool Trench Coat'
      },
      {
        tier: 3,
        name: 'Flagship Megastore',
        cost: 3200,
        seatingBonus: 6,
        staffCount: 4,
        revenueMultiplier: 2.3,
        drawBonus: 28,
        features: ['Self-Checkout Express Hub', 'VIP Personal Styling Room', 'DJ Sound Stage'],
        signatureItem: 'Limited Runway Capsule Collection'
      }
    ]
  },
  {
    id: 'cosmetics_palace',
    name: 'Velvet & Glow Cosmetics Palace',
    cat: 'Fashion',
    icon: '💄',
    color: '#db2777',
    cost: 1650,
    draw: 34,
    w: 2,
    h: 1,
    baseIncome: 85,
    itemDescription: 'Illuminated vanity mirrors, luxury skincare bars, fragrance atomizer testing stations, and makeover chairs.',
    mechanicType: 'fashion_boutique',
    baseSeatingPerTile: 3,
    baseStaff: 2,
    signatureItem: 'Rose Gold Hydration Serum & Luxury Palette',
    upgrades: [
      {
        tier: 2,
        name: 'Beauty Studio & Makeup Bar',
        cost: 1200,
        seatingBonus: 3,
        staffCount: 3,
        revenueMultiplier: 1.45,
        drawBonus: 14,
        features: ['Ring Light Makeup Vanities', 'Custom Foundation Scanner', 'Perfume Bar'],
        signatureItem: 'Bespoke Custom Blend Lipstick'
      },
      {
        tier: 3,
        name: 'Grand Haute Beauty Emporium',
        cost: 2700,
        seatingBonus: 5,
        staffCount: 4,
        revenueMultiplier: 2.25,
        drawBonus: 26,
        features: ['Private Skincare Spa Cabin', 'Virtual AR Mirror Try-Ons', 'Fragrance Organ'],
        signatureItem: 'Gold Leaf Radiance Facial Collection'
      }
    ]
  },
  {
    id: 'athletics_hub',
    name: 'Apex Athletic Performance & Yoga',
    cat: 'Fashion',
    icon: '🏃',
    color: '#0369a1',
    cost: 1550,
    draw: 32,
    w: 2,
    h: 1,
    baseIncome: 80,
    itemDescription: 'Premium moisture-wicking athleisure, compression gear, yoga accessories, and runner gait testing treadmill.',
    mechanicType: 'fashion_boutique',
    baseSeatingPerTile: 2,
    baseStaff: 2,
    signatureItem: 'Butter-Soft Align Leggings & Performance Hoodie',
    upgrades: [
      {
        tier: 2,
        name: 'Athletic Studio & Fitting Lab',
        cost: 1150,
        seatingBonus: 3,
        staffCount: 2,
        revenueMultiplier: 1.45,
        drawBonus: 12,
        features: ['3D Gait Analysis Treadmill', 'Hydration Refill Station', 'Stretch Studio Demo'],
        signatureItem: 'Carbon Fiber Running Shoe'
      },
      {
        tier: 3,
        name: 'Flagship Sports Performance Pavilion',
        cost: 2600,
        seatingBonus: 5,
        staffCount: 4,
        revenueMultiplier: 2.25,
        drawBonus: 26,
        features: ['Live In-Store Yoga Deck', 'Cryo Recovery Demo Pod', 'Community Run Club Hub'],
        signatureItem: 'Titanium Smart Fitness Tracker & Gear'
      }
    ]
  },
  {
    id: 'streetwear_kicks',
    name: 'Kicks & Co. Sneakerhead Atelier',
    cat: 'Fashion',
    icon: '👟',
    color: '#047857',
    cost: 1350,
    draw: 28,
    w: 1,
    h: 2,
    baseIncome: 72,
    itemDescription: 'Sneaker display wall with rotating rare grails, shrink-wrapped vintage kicks, and custom lace bar.',
    mechanicType: 'fashion_streetwear',
    baseSeatingPerTile: 2,
    baseStaff: 1,
    signatureItem: 'Grail Retro High-Top Sneakers',
    upgrades: [
      {
        tier: 2,
        name: 'Sneaker Vault & Customizer Bar',
        cost: 1000,
        seatingBonus: 2,
        staffCount: 2,
        revenueMultiplier: 1.45,
        drawBonus: 12,
        features: ['Airbrush Customization Desk', 'Drop Vault Display Cases', 'Trading Lounge'],
        signatureItem: 'Custom Hand-Painted High-Tops'
      },
      {
        tier: 3,
        name: 'Global Streetwear Flagship',
        cost: 2300,
        seatingBonus: 4,
        staffCount: 3,
        revenueMultiplier: 2.2,
        drawBonus: 24,
        features: ['Exclusive Mystery Drop Box', 'Sneaker Cleaning Spa', 'Skate Ramp Demo'],
        signatureItem: 'Numbered 1-of-50 Collector Grails'
      }
    ]
  },

  // =========================================================================
  // 5. SPECIALTY & ANCHORS (Nordstrom/Bloomingdale's, Books, Living)
  // =========================================================================
  {
    id: 'dept_anchor',
    name: 'Grand Metropolitan Department Store',
    cat: 'Specialty',
    icon: '🏬',
    color: '#1e293b',
    cost: 5800,
    draw: 75,
    w: 3,
    h: 2,
    baseIncome: 250,
    itemDescription: 'Monumental 2-story department store anchor featuring designer cosmetics, luxury menswear, fine home goods, and concierge personal shoppers.',
    mechanicType: 'department_anchor',
    baseSeatingPerTile: 5,
    baseStaff: 4,
    signatureItem: 'Designer Wardrobe Suite & Concierge Valet',
    upgrades: [
      {
        tier: 2,
        name: 'Luxury Premier Department Pavilion',
        cost: 4200,
        seatingBonus: 8,
        staffCount: 5,
        revenueMultiplier: 1.6,
        drawBonus: 28,
        features: ['Bridal Registry Salon', 'Fine Crystal & Tableware Floor', 'Personal Shopper Suites'],
        signatureItem: 'Designer Platinum Wardrobe Collection'
      },
      {
        tier: 3,
        name: 'Ultra-Luxe Grand Flagship Anchor',
        cost: 8500,
        seatingBonus: 12,
        staffCount: 7,
        revenueMultiplier: 2.45,
        drawBonus: 48,
        features: ['Rooftop Champagne Terrace', 'Private Vault Services', 'Tailor & Alterations Atelier'],
        signatureItem: 'Grand VIP Concierge Lifetime Membership'
      }
    ]
  },
  {
    id: 'book_nook',
    name: 'The Book Nook & Literary Tea Lounge',
    cat: 'Specialty',
    icon: '▤',
    color: '#713f12',
    cost: 950,
    draw: 22,
    w: 1,
    h: 1,
    baseIncome: 50,
    itemDescription: 'Floor-to-ceiling mahogany bookshelves, cozy leather reading armchairs, author signing circle, and herbal teas.',
    mechanicType: 'book_reading',
    baseSeatingPerTile: 2,
    baseStaff: 1,
    signatureItem: 'First Edition Hardcover & Earl Grey',
    upgrades: [
      {
        tier: 2,
        name: 'Literary Salon & Café',
        cost: 720,
        seatingBonus: 2,
        staffCount: 2,
        revenueMultiplier: 1.4,
        drawBonus: 10,
        features: ['Leather Armchairs', 'Author Signing Desk', 'Tea Infusion Bar'],
        signatureItem: 'Signed Collector Edition Book'
      },
      {
        tier: 3,
        name: 'Grand Atrium Athenaeum',
        cost: 1650,
        seatingBonus: 4,
        staffCount: 3,
        revenueMultiplier: 2.15,
        drawBonus: 22,
        features: ['Rolling Library Ladders', 'Mezzanine Reading Gallery', 'Private Book Clubs'],
        signatureItem: 'Rare Antiquarian Leather Manuscript'
      }
    ]
  },
  {
    id: 'botanical_home',
    name: 'Celestial Living & Botanical Oasis',
    cat: 'Specialty',
    icon: '🌿',
    color: '#15803d',
    cost: 880,
    draw: 20,
    w: 1,
    h: 1,
    baseIncome: 46,
    itemDescription: 'Exotic indoor tropical houseplants, artisan ceramic planters, aroma diffusers, and luxury home fragrance candles.',
    mechanicType: 'book_reading',
    baseSeatingPerTile: 2,
    baseStaff: 1,
    signatureItem: 'Rare Monstera Albo & Hand-Poured Candle',
    upgrades: [
      {
        tier: 2,
        name: 'Botanical Greenhouse & Living Bar',
        cost: 650,
        seatingBonus: 2,
        staffCount: 2,
        revenueMultiplier: 1.4,
        drawBonus: 10,
        features: ['Indoor Terrarium Workshop', 'Ceramic Potting Station', 'Misting Water Wall'],
        signatureItem: 'Living Bonsai & Terrarium Kit'
      },
      {
        tier: 3,
        name: 'Grand Botanical Sanctuary',
        cost: 1450,
        seatingBonus: 4,
        staffCount: 3,
        revenueMultiplier: 2.2,
        drawBonus: 20,
        features: ['Tropical Palm Glass Conservatory', 'Aromatherapy Apothecary', 'Interior Design Studio'],
        signatureItem: 'Master Landscape Specimen Bonsai'
      }
    ]
  }
];

export const LOT_SIZE_PRESETS = [
  { id: 'compact', name: 'Boutique Kiosk', w: 3, h: 3, cost: 250, icon: '📦', desc: 'Compact 3×3 boutique space for specialty popups and kiosks' },
  { id: 'standard', name: 'Standard Store', w: 5, h: 4, cost: 500, icon: '🏪', desc: 'Spacious 5×4 retail or casual dining lot with multiple aisles' },
  { id: 'flagship', name: 'Grand Flagship', w: 7, h: 5, cost: 950, icon: '🏬', desc: 'Expansive 7×5 premier flagship showroom with luxury fittings' },
  { id: 'mega', name: 'Mega Anchor Lot', w: 10, h: 6, cost: 1800, icon: '🏛️', desc: 'Monumental 10×6 department anchor or entertainment multiplex' }
];

// ============================================================================
// ARCHITECTURAL MASTERPLAN: WESTFIELD VALLEY FAIR SUPER-REGIONAL MALL
// Canvas Dimensions: 2560px width x 1536px height (80 x 48 tiles, TILE_SIZE = 32px)
// True authentic layout: Center Rotunda, North Bloomingdale's & Luxury Wing,
// West Nordstrom & Apple Flagship, East Macy's & Fashion,
// Outdoor Dining Promenade with Eataly, Din Tai Fung, & ShowPlace ICON Cinema!
// ============================================================================
export const UNITS_LIST: MallUnit[] = [
  // =========================================================================
  // 1. GRAND CENTER COURT ROTUNDA (x: 32.0 to 48.0, y: 18.0 to 30.0, center at 40, 24)
  // Radial marble flooring, brass sunburst medallion, tiered fountain, glass elevators
  // =========================================================================
  ['ROTUNDA NORTH-WEST LOT', 33.0, 18.5, 5.5, 4.5, { x: 38.5 * TILE_SIZE, y: 20.75 * TILE_SIZE }], // Unit 0 (Cafe & Roastery)
  ['ROTUNDA NORTH-EAST LOT', 41.5, 18.5, 5.5, 4.5, { x: 41.5 * TILE_SIZE, y: 20.75 * TILE_SIZE }], // Unit 1 (Gelato & Pastry)
  ['ROTUNDA SOUTH-WEST LOT', 33.0, 25.0, 5.5, 4.5, { x: 38.5 * TILE_SIZE, y: 25.0 * TILE_SIZE }],   // Unit 2 (Espresso Bar)
  ['ROTUNDA SOUTH-EAST LOT', 41.5, 25.0, 5.5, 4.5, { x: 41.5 * TILE_SIZE, y: 25.0 * TILE_SIZE }],   // Unit 3 (Chocolatier)

  // =========================================================================
  // 2. NORTH LUXURY COLLECTION & BLOOMINGDALE'S (North Wing, x: 32.0 to 48.0, y: 2.0 to 18.0)
  // High ceilings, Nero Marquina marble, Cartier, Louis Vuitton, Gucci, Prada, Saint Laurent
  // Terminating into the grand multi-level Bloomingdale's luxury anchor!
  // =========================================================================
  ['BLOOMINGDALE\'S 3-LEVEL FLAGSHIP ANCHOR', 34.0, 2.5, 12.0, 6.0, { x: 40.0 * TILE_SIZE, y: 8.5 * TILE_SIZE }], // Unit 4 (Mega Bloomingdale's Anchor 12x6)
  
  ['MAISON DE L\'ÉTOILE HAUTE COUTURE', 33.0, 9.2, 5.5, 4.0, { x: 38.5 * TILE_SIZE, y: 11.2 * TILE_SIZE }], // Unit 5 (Louis Vuitton / Maison)
  ['SWISS CHRONOMETER & WATCHMAKER VAULT', 33.0, 13.8, 5.5, 4.0, { x: 38.5 * TILE_SIZE, y: 15.8 * TILE_SIZE }], // Unit 6 (Cartier / Rolex / IWC)

  ['ROYAL DIAMOND & HIGH JEWELRY ATELIER', 41.5, 9.2, 5.5, 4.0, { x: 41.5 * TILE_SIZE, y: 11.2 * TILE_SIZE }], // Unit 7 (Tiffany & Co / Bvlgari)
  ['SARTORIA MILANO BESPOKE ITALIAN TAILOR', 41.5, 13.8, 5.5, 4.0, { x: 41.5 * TILE_SIZE, y: 15.8 * TILE_SIZE }], // Unit 8 (Prada / Gucci / Saint Laurent)

  // =========================================================================
  // 3. WEST WING: NORDSTROM ANCHOR & INNOVATION GALLERIA (x: 2.0 to 32.0, y: 18.0 to 30.0)
  // Anchored by Nordstrom, Apple Store Flagship, Sephora, Lululemon, Tesla
  // =========================================================================
  ['NORDSTROM 3-LEVEL DEPARTMENT ANCHOR', 2.5, 18.5, 11.5, 11.0, { x: 14.0 * TILE_SIZE, y: 24.0 * TILE_SIZE }], // Unit 9 (Mega Nordstrom Anchor 11.5x11)
  
  ['HORIZON QUANTUM TECH INNOVATION FLAGSHIP', 15.0, 18.5, 7.5, 4.5, { x: 18.75 * TILE_SIZE, y: 23.0 * TILE_SIZE }], // Unit 10 (Apple Flagship Store)
  ['VELVET & GLOW LUXURY COSMETICS PALACE', 23.5, 18.5, 7.0, 4.5, { x: 27.0 * TILE_SIZE, y: 23.0 * TILE_SIZE }], // Unit 11 (Sephora Beauty)

  ['APEX ATHLETIC PERFORMANCE & YOGA HUB', 15.0, 25.0, 7.5, 4.5, { x: 18.75 * TILE_SIZE, y: 25.0 * TILE_SIZE }], // Unit 12 (Lululemon / Alo Yoga)
  ['GENTLE MONSTER & LUXURY EYEWEAR STUDIO', 23.5, 25.0, 7.0, 4.5, { x: 27.0 * TILE_SIZE, y: 25.0 * TILE_SIZE }], // Unit 13 (Gentle Monster)

  // =========================================================================
  // 4. EAST WING: MACY'S ANCHOR & FASHION GALLERIA (x: 48.0 to 78.0, y: 18.0 to 30.0)
  // Anchored by Macy's, Zara, Uniqlo, Aritzia, Book Nook
  // =========================================================================
  ['MACY\'S GRAND DEPARTMENT STORE ANCHOR', 66.5, 18.5, 11.0, 11.0, { x: 66.5 * TILE_SIZE, y: 24.0 * TILE_SIZE }], // Unit 14 (Mega Macy's Anchor 11x11)

  ['MODERN STREETWEAR & RUNWAY DENIM (ZARA)', 49.5, 18.5, 7.5, 4.5, { x: 53.25 * TILE_SIZE, y: 23.0 * TILE_SIZE }], // Unit 15 (Zara)
  ['MINIMALIST JAPANESE LIFESTYLE (UNIQLO)', 58.0, 18.5, 7.5, 4.5, { x: 61.75 * TILE_SIZE, y: 23.0 * TILE_SIZE }], // Unit 16 (Uniqlo / Muji)

  ['CONTEMPORARY CHIC BOUTIQUE (ARITZIA)', 49.5, 25.0, 7.5, 4.5, { x: 53.25 * TILE_SIZE, y: 25.0 * TILE_SIZE }], // Unit 17 (Aritzia)
  ['THE BOOK NOOK & LITERARY TEA LOUNGE', 58.0, 25.0, 7.5, 4.5, { x: 61.75 * TILE_SIZE, y: 25.0 * TILE_SIZE }], // Unit 18 (Book Nook)

  // =========================================================================
  // 5. THE OUTDOOR DINING PROMENADE & SHOWPLACE ICON CINEMA (x: 48.0 to 78.0, y: 2.0 to 18.0)
  // The iconic Valley Fair 2020 expansion: open-air dining plaza, Eataly, Din Tai Fung,
  // leading right into ShowPlace ICON Cinema multiplex & rooftop lounge!
  // =========================================================================
  ['EATALY 3-STORY ITALIAN MARKETPLACE', 49.0, 2.5, 8.5, 6.5, { x: 53.25 * TILE_SIZE, y: 9.0 * TILE_SIZE }], // Unit 19 (Eataly Food Hall)
  ['DIN TAI FUNG DUMPLING HOUSE', 58.5, 2.5, 7.5, 6.5, { x: 62.25 * TILE_SIZE, y: 9.0 * TILE_SIZE }], // Unit 20 (Din Tai Fung)
  ['SHOWPLACE ICON CINEMA & ROOFTOP LOUNGE', 67.0, 2.5, 10.5, 8.5, { x: 72.25 * TILE_SIZE, y: 11.0 * TILE_SIZE }], // Unit 21 (ShowPlace ICON Cinema 10.5x8.5)

  ['RAMEN NAGI TOKYO GOURMET BAR', 49.0, 10.5, 7.0, 5.0, { x: 52.5 * TILE_SIZE, y: 10.5 * TILE_SIZE }], // Unit 22 (Ramen Nagi)
  ['TIGER BOBA & ARTISAN MATCHA LOUNGE', 57.0, 10.5, 5.0, 5.0, { x: 59.5 * TILE_SIZE, y: 10.5 * TILE_SIZE }], // Unit 23 (SomiSomi Boba)
  ['SHAKE SHACK BURGER & CONCRETE PAVILION', 63.0, 12.0, 6.5, 4.5, { x: 66.25 * TILE_SIZE, y: 12.0 * TILE_SIZE }], // Unit 24 (Shake Shack)

  // =========================================================================
  // 6. SOUTH WING: ENTERTAINMENT, ROUND 1 & BOTANICAL (x: 32.0 to 48.0, y: 30.0 to 46.0)
  // Round 1 Arcade & Bowling, LEGO Play Lab, Urban Outfitters, Celestial Botanical
  // =========================================================================
  ['NEON CYBER VR & ARCADE ARENA (ROUND 1)', 31.5, 31.0, 7.0, 6.5, { x: 38.5 * TILE_SIZE, y: 34.25 * TILE_SIZE }], // Unit 25 (Round 1 Arcade)
  ['TOY BOX WONDERLAND & LEGO LAB', 41.5, 31.0, 7.0, 6.5, { x: 41.5 * TILE_SIZE, y: 34.25 * TILE_SIZE }], // Unit 26 (LEGO Lab)

  ['CELESTIAL LIVING & BOTANICAL OASIS', 31.5, 38.5, 7.0, 6.0, { x: 38.5 * TILE_SIZE, y: 41.5 * TILE_SIZE }], // Unit 27 (Botanical Sanctuary)
  ['URBAN OUTFITTERS & STREET LIFESTYLE', 41.5, 38.5, 7.0, 6.0, { x: 41.5 * TILE_SIZE, y: 41.5 * TILE_SIZE }]  // Unit 28 (Urban Outfitters)
];

// Major Grand Architectural Entrances to Westfield Valley Fair
export const ENTRANCES = [
  { name: 'North Luxury Grand Portal & Valet', x: 40.0 * TILE_SIZE, y: 1.5 * TILE_SIZE },
  { name: 'East Winchester Galleria Gateway', x: 78.5 * TILE_SIZE, y: 24.0 * TILE_SIZE },
  { name: 'West Stevens Creek Grand Court Portal', x: 1.5 * TILE_SIZE, y: 24.0 * TILE_SIZE },
  { name: 'South Fashion Promenade & Garage Gateway', x: 40.0 * TILE_SIZE, y: 46.5 * TILE_SIZE },
  { name: 'Outdoor Dining Promenade Plaza Portal', x: 78.0 * TILE_SIZE, y: 10.0 * TILE_SIZE }
];
