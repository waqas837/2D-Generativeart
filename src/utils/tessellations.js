// Tessellation generators for 2D art

export const TESSELATION_TYPES = {
  square: 'Square Grid',
  triangle: 'Triangular',
  hexagon: 'Hexagonal',
  rhombus: 'Rhombus',
  kagome: 'Kagome',
  penrose: 'Penrose-like'
};

// Seeded random number generator
export class SeededRandom {
  constructor(seed = 12345) {
    this.seed = seed;
  }

  random() {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  randomInt(min, max) {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }

  randomFloat(min, max) {
    return this.random() * (max - min) + min;
  }
}

// Generate square grid tessellation
export function generateSquareTiles(width, height, tileSize, spacing, random) {
  const tiles = [];
  const cols = Math.floor((width + spacing) / (tileSize + spacing));
  const rows = Math.floor((height + spacing) / (tileSize + spacing));

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * (tileSize + spacing) + spacing;
      const y = row * (tileSize + spacing) + spacing;
      
      tiles.push({
        type: 'square',
        x,
        y,
        size: tileSize,
        rotation: random.randomFloat(0, 360),
        id: `${row}-${col}`
      });
    }
  }
  return tiles;
}

// Generate triangular tessellation
export function generateTriangleTiles(width, height, tileSize, spacing, random) {
  const tiles = [];
  const rows = Math.floor((height + spacing) / ((tileSize * Math.sqrt(3) / 2) + spacing));
  const cols = Math.floor((width + spacing) / (tileSize + spacing));

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols * 2; col++) {
      const x = (col % 2 === 0) 
        ? col * (tileSize / 2) + spacing
        : col * (tileSize / 2) + tileSize / 4 + spacing;
      const y = row * (tileSize * Math.sqrt(3) / 2) + spacing;
      
      if (x + tileSize <= width && y + tileSize <= height) {
        tiles.push({
          type: 'triangle',
          x,
          y,
          size: tileSize,
          rotation: random.randomFloat(0, 360),
          orientation: col % 4,
          id: `${row}-${col}`
        });
      }
    }
  }
  return tiles;
}

// Generate hexagonal tessellation
export function generateHexagonTiles(width, height, tileSize, spacing, random) {
  const tiles = [];
  const radius = tileSize / 2;
  const hexHeight = Math.sqrt(3) * radius;
  const hexWidth = 2 * radius;
  const rows = Math.floor((height + spacing) / (hexHeight + spacing));
  const cols = Math.floor((width + spacing) / (hexWidth * 0.75 + spacing));

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * hexWidth * 0.75 + (row % 2) * hexWidth * 0.375 + spacing;
      const y = row * hexHeight * 0.5 + spacing;
      
      if (x + hexWidth <= width && y + hexHeight <= height) {
        tiles.push({
          type: 'hexagon',
          x,
          y,
          radius,
          rotation: random.randomFloat(0, 360),
          id: `${row}-${col}`
        });
      }
    }
  }
  return tiles;
}

// Generate rhombus tessellation
export function generateRhombusTiles(width, height, tileSize, spacing, random) {
  const tiles = [];
  const rows = Math.floor((height + spacing) / (tileSize * Math.sin(Math.PI / 3) + spacing));
  const cols = Math.floor((width + spacing) / (tileSize + spacing));

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * tileSize + (row % 2) * (tileSize / 2) + spacing;
      const y = row * tileSize * Math.sin(Math.PI / 3) + spacing;
      
      tiles.push({
        type: 'rhombus',
        x,
        y,
        size: tileSize,
        rotation: random.randomFloat(0, 360),
        angle: 60,
        id: `${row}-${col}`
      });
    }
  }
  return tiles;
}

// Generate tiles based on tessellation type
export function generateTessellation(type, width, height, tileSize, spacing, seed, palette, colorMode, maxTiles = 5000) {
  const random = new SeededRandom(seed);
  let tiles;
  
  switch (type) {
    case 'square':
      tiles = generateSquareTiles(width, height, tileSize, spacing, random);
      break;
    case 'triangle':
      tiles = generateTriangleTiles(width, height, tileSize, spacing, random);
      break;
    case 'hexagon':
      tiles = generateHexagonTiles(width, height, tileSize, spacing, random);
      break;
    case 'rhombus':
      tiles = generateRhombusTiles(width, height, tileSize, spacing, random);
      break;
    default:
      tiles = generateSquareTiles(width, height, tileSize, spacing, random);
  }

  // Limit tiles for performance
  if (tiles.length > maxTiles) {
    const skip = Math.ceil(tiles.length / maxTiles);
    tiles = tiles.filter((_, i) => i % skip === 0);
  }

  // Precompute colors and opacity for performance
  if (palette && palette.colors && palette.colors.length > 0) {
    tiles = tiles.map(tile => {
      const idSum = tile.id.split('-').reduce((a, b) => parseInt(a || 0) + parseInt(b || 0), 0);
      const tileRandom = new SeededRandom(seed + idSum);
      const color = getTileColorPrecomputed(tile, palette, colorMode);
      return {
        ...tile,
        color,
        opacity: 0.8 + tileRandom.random() * 0.2
      };
    });
  } else {
    // Still compute opacity even without colors
    tiles = tiles.map(tile => {
      const idSum = tile.id.split('-').reduce((a, b) => parseInt(a || 0) + parseInt(b || 0), 0);
      const tileRandom = new SeededRandom(seed + idSum);
      return {
        ...tile,
        color: '#000000',
        opacity: 0.8 + tileRandom.random() * 0.2
      };
    });
  }

  return tiles;
}

// Optimized color calculation - no random needed for index calculation
function getTileColorPrecomputed(tile, palette, colorMode) {
  const colors = palette.colors || [];
  if (colors.length === 0) return colorMode === 'hex' ? '#000000' : 'hsv(0, 0%, 0%)';

  let index = 0;

  if (tile.type === 'square') {
    index = Math.floor((tile.x + tile.y + tile.rotation) / 100) % colors.length;
  } else if (tile.type === 'triangle') {
    index = ((tile.orientation || 0) + Math.floor(tile.x / 50) + Math.floor(tile.y / 50)) % colors.length;
  } else if (tile.type === 'hexagon') {
    index = (Math.floor(tile.x / (tile.radius || 1)) + Math.floor(tile.y / (tile.radius || 1))) % colors.length;
  } else if (tile.type === 'rhombus') {
    index = (Math.floor(tile.x / 30) + Math.floor(tile.y / 30) + Math.floor((tile.angle || 60) / 30)) % colors.length;
  }

  const selectedColor = colors[index] || colors[0];
  
  if (colorMode === 'hex') {
    return selectedColor;
  } else {
    // Import hexToHsv from colorPalettes would cause circular dependency
    // So we'll convert here
    return hexToHsvString(selectedColor);
  }
}

// Helper function to convert hex to HSV string (to avoid circular dependency)
function hexToHsvString(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === r) {
      h = ((g - b) / delta) % 6;
    } else if (max === g) {
      h = (b - r) / delta + 2;
    } else {
      h = (r - g) / delta + 4;
    }
  }
  h = Math.round(h * 60);
  if (h < 0) h += 360;

  const s = max === 0 ? 0 : Math.round((delta / max) * 100);
  const v = Math.round(max * 100);

  return `hsv(${h}, ${s}%, ${v}%)`;
}

