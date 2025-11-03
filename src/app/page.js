'use client';

import { useState, useRef, useEffect } from 'react';
import { TESSELATION_TYPES, generateTessellation, SeededRandom } from '../utils/tessellations';
import { PRESET_PALETTES, getTileColor } from '../utils/colorPalettes';

export default function GenerativeArtPage() {
  const [tessellationType, setTessellationType] = useState('square');
  const [canvasWidth, setCanvasWidth] = useState(210); // A4 width in mm
  const [canvasHeight, setCanvasHeight] = useState(297); // A4 height in mm
  const [tileSize, setTileSize] = useState(10); // in mm
  const [spacing, setSpacing] = useState(2); // in mm
  const [seed, setSeed] = useState(12345);
  const [selectedPalette, setSelectedPalette] = useState('ocean');
  const [colorMode, setColorMode] = useState('hex');
  const [customPalette, setCustomPalette] = useState([]);
  const [paletteName, setPaletteName] = useState('Custom');
  const [showPaletteEditor, setShowPaletteEditor] = useState(false);
  const svgRef = useRef(null);
  const [tiles, setTiles] = useState([]);

  // Convert mm to pixels (assuming 96 DPI = 3.779527559 pixels per mm)
  const mmToPx = (mm) => mm * 3.779527559;

  // Generate tiles when parameters change
  useEffect(() => {
    const widthPx = mmToPx(canvasWidth);
    const heightPx = mmToPx(canvasHeight);
    const tileSizePx = mmToPx(tileSize);
    const spacingPx = mmToPx(spacing);

    const newTiles = generateTessellation(
      tessellationType,
      widthPx,
      heightPx,
      tileSizePx,
      spacingPx,
      seed
    );
    setTiles(newTiles);
  }, [tessellationType, canvasWidth, canvasHeight, tileSize, spacing, seed]);

  // Get current palette
  const getCurrentPalette = () => {
    if (showPaletteEditor && customPalette.length > 0) {
      return { name: paletteName, colors: customPalette, type: colorMode };
    }
    return PRESET_PALETTES[selectedPalette] || PRESET_PALETTES.ocean;
  };

  const currentPalette = getCurrentPalette();
  const random = new SeededRandom(seed);

  // Export to SVG
  const exportToSVG = () => {
    const svg = svgRef.current;
    if (!svg) return;

    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(svg);
    
    // Add proper SVG namespace and dimensions in mm
    svgString = svgString.replace(
      '<svg',
      `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}mm" height="${canvasHeight}mm" viewBox="0 0 ${mmToPx(canvasWidth)} ${mmToPx(canvasHeight)}"`
    );

    // Create download link
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `generative-art-${tessellationType}-${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Render a single tile as SVG
  const renderTile = (tile) => {
    const color = getTileColor(tile, currentPalette, colorMode, random);
    const randomForTile = new SeededRandom(seed + tile.id.split('-').reduce((a, b) => parseInt(a) + parseInt(b), 0));

    if (tile.type === 'square') {
      return (
        <g key={tile.id} transform={`translate(${tile.x},${tile.y}) rotate(${tile.rotation} ${tile.size/2} ${tile.size/2})`}>
          <rect
            x="0"
            y="0"
            width={tile.size}
            height={tile.size}
            fill={color}
            stroke={colorMode === 'hex' ? '#ffffff' : 'hsv(0, 0%, 100%)'}
            strokeWidth="0.5"
            opacity={0.8 + randomForTile.random() * 0.2}
          />
        </g>
      );
    } else if (tile.type === 'triangle') {
      const size = tile.size;
      const points = [
        `${size/2},0`,
        `${size},${size}`,
        `0,${size}`
      ].join(' ');
      return (
        <g key={tile.id} transform={`translate(${tile.x},${tile.y}) rotate(${tile.rotation} ${size/2} ${size/2})`}>
          <polygon
            points={points}
            fill={color}
            stroke={colorMode === 'hex' ? '#ffffff' : 'hsv(0, 0%, 100%)'}
            strokeWidth="0.5"
            opacity={0.8 + randomForTile.random() * 0.2}
          />
        </g>
      );
    } else if (tile.type === 'hexagon') {
      const radius = tile.radius;
      const points = [];
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        points.push(`${radius + radius * Math.cos(angle)},${radius + radius * Math.sin(angle)}`);
      }
      return (
        <g key={tile.id} transform={`translate(${tile.x},${tile.y}) rotate(${tile.rotation} ${radius} ${radius})`}>
          <polygon
            points={points.join(' ')}
            fill={color}
            stroke={colorMode === 'hex' ? '#ffffff' : 'hsv(0, 0%, 100%)'}
            strokeWidth="0.5"
            opacity={0.8 + randomForTile.random() * 0.2}
          />
        </g>
      );
    } else if (tile.type === 'rhombus') {
      const size = tile.size;
      const angle = (tile.angle * Math.PI) / 180;
      const height = size * Math.sin(angle);
      const points = [
        `0,0`,
        `${size},0`,
        `${size + size * Math.cos(Math.PI - angle)},${height}`,
        `${size * Math.cos(Math.PI - angle)},${height}`
      ].join(' ');
      return (
        <g key={tile.id} transform={`translate(${tile.x},${tile.y}) rotate(${tile.rotation} ${size/2} ${height/2})`}>
          <polygon
            points={points}
            fill={color}
            stroke={colorMode === 'hex' ? '#ffffff' : 'hsv(0, 0%, 100%)'}
            strokeWidth="0.5"
            opacity={0.8 + randomForTile.random() * 0.2}
          />
        </g>
      );
    }
    return null;
  };

  // Add color to custom palette
  const addColorToPalette = (color) => {
    if (customPalette.length < 10) {
      setCustomPalette([...customPalette, color]);
    }
  };

  // Remove color from custom palette
  const removeColorFromPalette = (index) => {
    setCustomPalette(customPalette.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-center">2D Generative Art Studio</h1>
        <p className="text-center text-gray-400 mb-8">Create beautiful tessellations with customizable color palettes</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Tessellation Type */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">Tessellation Type</h2>
              <select
                value={tessellationType}
                onChange={(e) => setTessellationType(e.target.value)}
                className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600"
              >
                {Object.entries(TESSELATION_TYPES).map(([key, name]) => (
                  <option key={key} value={key}>{name}</option>
                ))}
              </select>
            </div>

            {/* Canvas Size */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">Canvas Size (mm)</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm mb-1">Width (mm)</label>
                  <input
                    type="number"
                    value={canvasWidth}
                    onChange={(e) => setCanvasWidth(Number(e.target.value))}
                    min="50"
                    max="1000"
                    className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Height (mm)</label>
                  <input
                    type="number"
                    value={canvasHeight}
                    onChange={(e) => setCanvasHeight(Number(e.target.value))}
                    min="50"
                    max="1000"
                    className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600"
                  />
                </div>
                <div className="text-xs text-gray-400">
                  Presets: <button onClick={() => { setCanvasWidth(210); setCanvasHeight(297); }} className="text-purple-400 hover:underline">A4</button>
                  {' | '}
                  <button onClick={() => { setCanvasWidth(297); setCanvasHeight(420); }} className="text-purple-400 hover:underline">A3</button>
                </div>
              </div>
            </div>

            {/* Tile Settings */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">Tile Settings</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm mb-1">Tile Size (mm)</label>
                  <input
                    type="number"
                    value={tileSize}
                    onChange={(e) => setTileSize(Number(e.target.value))}
                    min="2"
                    max="50"
                    step="0.5"
                    className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Spacing (mm)</label>
                  <input
                    type="number"
                    value={spacing}
                    onChange={(e) => setSpacing(Number(e.target.value))}
                    min="0"
                    max="20"
                    step="0.5"
                    className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600"
                  />
                </div>
              </div>
            </div>

            {/* Randomness */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">Randomness Seed</h2>
              <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(Number(e.target.value))}
                className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600"
              />
              <button
                onClick={() => setSeed(Math.floor(Math.random() * 100000))}
                className="mt-2 w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded transition"
              >
                Random Seed
              </button>
              <p className="text-xs text-gray-400 mt-2">Change seed to generate different patterns with same settings</p>
            </div>

            {/* Color Palette */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">Color Palette</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm mb-1">Preset Palettes</label>
                  <select
                    value={selectedPalette}
                    onChange={(e) => { setSelectedPalette(e.target.value); setShowPaletteEditor(false); }}
                    className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600"
                  >
                    {Object.entries(PRESET_PALETTES).map(([key, palette]) => (
                      <option key={key} value={key}>{palette.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Color Mode</label>
                  <select
                    value={colorMode}
                    onChange={(e) => setColorMode(e.target.value)}
                    className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600"
                  >
                    <option value="hex">Hex</option>
                    <option value="hsv">HSV</option>
                  </select>
                </div>
                <button
                  onClick={() => setShowPaletteEditor(!showPaletteEditor)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition"
                >
                  {showPaletteEditor ? 'Use Preset' : 'Create Custom Palette'}
                </button>
              </div>
            </div>

            {/* Custom Palette Editor */}
            {showPaletteEditor && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h2 className="text-xl font-semibold mb-4">Custom Palette</h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm mb-1">Palette Name</label>
                    <input
                      type="text"
                      value={paletteName}
                      onChange={(e) => setPaletteName(e.target.value)}
                      className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Add Color (Hex)</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        onChange={(e) => addColorToPalette(e.target.value)}
                        className="h-10 w-20 border border-gray-600 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        placeholder="#000000"
                        pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && e.target.value.match(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)) {
                            addColorToPalette(e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="flex-1 bg-gray-700 text-white p-2 rounded border border-gray-600"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Current Colors ({customPalette.length}/10)</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {customPalette.map((color, index) => (
                        <div key={index} className="relative group">
                          <div
                            className="w-10 h-10 rounded border-2 border-gray-600 cursor-pointer"
                            style={{ backgroundColor: color }}
                          />
                          <button
                            onClick={() => removeColorFromPalette(index)}
                            className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 text-xs opacity-0 group-hover:opacity-100 transition"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Export */}
            <div className="bg-gray-800 rounded-lg p-4">
              <button
                onClick={exportToSVG}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded font-semibold transition"
              >
                Export SVG (mm)
              </button>
              <p className="text-xs text-gray-400 mt-2 text-center">
                Exports with dimensions in millimetres for precise printing
              </p>
            </div>

            {/* Info */}
            <div className="bg-gray-800 rounded-lg p-4 text-sm">
              <h2 className="text-xl font-semibold mb-2">Generated Tiles</h2>
              <p className="text-gray-400">{tiles.length} tiles</p>
            </div>
          </div>

          {/* Canvas */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="bg-white rounded-lg overflow-hidden" style={{ aspectRatio: `${canvasWidth}/${canvasHeight}` }}>
                <svg
                  ref={svgRef}
                  width="100%"
                  height="100%"
                  viewBox={`0 0 ${mmToPx(canvasWidth)} ${mmToPx(canvasHeight)}`}
                  preserveAspectRatio="xMidYMid meet"
                  style={{ display: 'block' }}
                >
                  {tiles.map(renderTile)}
                </svg>
              </div>
              <div className="mt-2 text-sm text-gray-400 text-center">
                Canvas: {canvasWidth}mm × {canvasHeight}mm | Scale: 1:{Math.round(mmToPx(canvasWidth) / 400)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

