// Color palette management with hex and HSV support

export const PRESET_PALETTES = {
  ocean: {
    name: 'Ocean',
    colors: ['#001f3f', '#0074d9', '#39cccc', '#7fdbda', '#ffffff'],
    type: 'hex'
  },
  sunset: {
    name: 'Sunset',
    colors: ['#ff6b6b', '#ffa94d', '#ffd93d', '#6bcf7f', '#4ecdc4'],
    type: 'hex'
  },
  forest: {
    name: 'Forest',
    colors: ['#2c5530', '#3e7c41', '#6b8e23', '#9bcc50', '#c4d67f'],
    type: 'hex'
  },
  purple_dream: {
    name: 'Purple Dream',
    colors: ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#e9d5ff'],
    type: 'hex'
  },
  monochrome: {
    name: 'Monochrome',
    colors: ['#000000', '#333333', '#666666', '#999999', '#cccccc'],
    type: 'hex'
  },
  vibrant: {
    name: 'Vibrant',
    colors: ['#ff0080', '#ff8c00', '#40e0d0', '#ff0080', '#800080'],
    type: 'hex'
  }
};

// Convert hex to HSV
export function hexToHsv(hex) {
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

  return { h, s, v };
}

// Convert HSV to hex
export function hsvToHex(h, s, v) {
  s /= 100;
  v /= 100;

  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;

  let r, g, b;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Get color for tile based on geometry/topology
export function getTileColor(tile, palette, colorMode, random) {
  const colors = palette.colors || [];
  if (colors.length === 0) return '#000000';

  let index = 0;

  // Color based on tile properties (geometry/topology)
  if (tile.type === 'square') {
    // Use position and rotation to determine color
    index = Math.floor((tile.x + tile.y + tile.rotation) / 100) % colors.length;
  } else if (tile.type === 'triangle') {
    // Use orientation and position
    index = (tile.orientation + Math.floor(tile.x / 50) + Math.floor(tile.y / 50)) % colors.length;
  } else if (tile.type === 'hexagon') {
    // Use radius and position
    index = (Math.floor(tile.x / tile.radius) + Math.floor(tile.y / tile.radius)) % colors.length;
  } else if (tile.type === 'rhombus') {
    // Use angle and position
    index = (Math.floor(tile.x / 30) + Math.floor(tile.y / 30) + Math.floor(tile.angle / 30)) % colors.length;
  } else {
    // Random fallback
    index = random.randomInt(0, colors.length - 1);
  }

  const selectedColor = colors[index];

  if (colorMode === 'hex') {
    return selectedColor;
  } else {
    // Convert to HSV and return as string
    const hsv = hexToHsv(selectedColor);
    return `hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`;
  }
}

