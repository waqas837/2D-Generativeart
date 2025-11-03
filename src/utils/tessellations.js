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
export function generateTessellation(type, width, height, tileSize, spacing, seed) {
  const random = new SeededRandom(seed);
  
  switch (type) {
    case 'square':
      return generateSquareTiles(width, height, tileSize, spacing, random);
    case 'triangle':
      return generateTriangleTiles(width, height, tileSize, spacing, random);
    case 'hexagon':
      return generateHexagonTiles(width, height, tileSize, spacing, random);
    case 'rhombus':
      return generateRhombusTiles(width, height, tileSize, spacing, random);
    default:
      return generateSquareTiles(width, height, tileSize, spacing, random);
  }
}

