'use client';

import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { TESSELATION_TYPES, generateTessellation } from '../utils/tessellations';
import { PRESET_PALETTES } from '../utils/colorPalettes';
import Tile from '../components/Tile';

// Debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// Preset configurations
const PRESETS = {
  quick: { canvasWidth: 100, canvasHeight: 100, tileSize: 15, spacing: 3, seed: 12345 },
  standard: { canvasWidth: 210, canvasHeight: 297, tileSize: 10, spacing: 2, seed: 12345 },
  large: { canvasWidth: 297, canvasHeight: 420, tileSize: 8, spacing: 1.5, seed: 12345 },
  detailed: { canvasWidth: 150, canvasHeight: 150, tileSize: 5, spacing: 1, seed: 12345 },
};

export default function GenerativeArtPage() {
  const [tessellationType, setTessellationType] = useState('square');
  const [canvasWidth, setCanvasWidth] = useState(210);
  const [canvasHeight, setCanvasHeight] = useState(297);
  const [tileSize, setTileSize] = useState(10);
  const [spacing, setSpacing] = useState(2);
  const [seed, setSeed] = useState(12345);
  const [selectedPalette, setSelectedPalette] = useState('ocean');
  const [colorMode, setColorMode] = useState('hex');
  const [customPalette, setCustomPalette] = useState([]);
  const [paletteName, setPaletteName] = useState('Custom');
  const [showPaletteEditor, setShowPaletteEditor] = useState(false);
  const [performanceMode, setPerformanceMode] = useState('balanced'); // fast, balanced, quality
  const svgRef = useRef(null);

  // Debounce inputs for performance
  const debouncedCanvasWidth = useDebounce(canvasWidth, 300);
  const debouncedCanvasHeight = useDebounce(canvasHeight, 300);
  const debouncedTileSize = useDebounce(tileSize, 300);
  const debouncedSpacing = useDebounce(spacing, 300);

  // Convert mm to pixels
  const mmToPx = useCallback((mm) => mm * 3.779527559, []);

  // Get current palette
  const currentPalette = useMemo(() => {
    if (showPaletteEditor && customPalette.length > 0) {
      return { name: paletteName, colors: customPalette, type: colorMode };
    }
    return PRESET_PALETTES[selectedPalette] || PRESET_PALETTES.ocean;
  }, [showPaletteEditor, customPalette, paletteName, selectedPalette, colorMode]);

  // Performance settings based on mode
  const performanceSettings = useMemo(() => {
    switch (performanceMode) {
      case 'fast':
        return { maxTiles: 2000, skipRender: false };
      case 'balanced':
        return { maxTiles: 5000, skipRender: false };
      case 'quality':
        return { maxTiles: 15000, skipRender: false };
      default:
        return { maxTiles: 5000, skipRender: false };
    }
  }, [performanceMode]);

  // Generate tiles with memoization
  const tiles = useMemo(() => {
    const widthPx = mmToPx(debouncedCanvasWidth);
    const heightPx = mmToPx(debouncedCanvasHeight);
    const tileSizePx = mmToPx(debouncedTileSize);
    const spacingPx = mmToPx(debouncedSpacing);

    const effectiveMaxTiles = performanceSettings.maxTiles;

    const generatedTiles = generateTessellation(
      tessellationType,
      widthPx,
      heightPx,
      tileSizePx,
      spacingPx,
      seed,
      currentPalette,
      colorMode,
      effectiveMaxTiles
    );

    return generatedTiles;
  }, [
    tessellationType,
    debouncedCanvasWidth,
    debouncedCanvasHeight,
    debouncedTileSize,
    debouncedSpacing,
    seed,
    currentPalette,
    colorMode,
    performanceSettings.maxTiles,
    mmToPx
  ]);

  // Apply preset
  const applyPreset = useCallback((presetName) => {
    const preset = PRESETS[presetName];
    if (preset) {
      setCanvasWidth(preset.canvasWidth);
      setCanvasHeight(preset.canvasHeight);
      setTileSize(preset.tileSize);
      setSpacing(preset.spacing);
      setSeed(preset.seed);
    }
  }, []);

  // Export to SVG
  const exportToSVG = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(svg);
    
    svgString = svgString.replace(
      '<svg',
      `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}mm" height="${canvasHeight}mm" viewBox="0 0 ${mmToPx(canvasWidth)} ${mmToPx(canvasHeight)}"`
    );

    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `generative-art-${tessellationType}-${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [canvasWidth, canvasHeight, tessellationType, mmToPx]);

  // Add color to custom palette
  const addColorToPalette = useCallback((color) => {
    if (customPalette.length < 10) {
      setCustomPalette(prev => [...prev, color]);
    }
  }, [customPalette.length]);

  // Remove color from custom palette
  const removeColorFromPalette = useCallback((index) => {
    setCustomPalette(prev => prev.filter((_, i) => i !== index));
  }, []);

  // ViewBox for SVG
  const viewBox = useMemo(() => 
    `0 0 ${mmToPx(canvasWidth)} ${mmToPx(canvasHeight)}`,
    [canvasWidth, canvasHeight, mmToPx]
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-center">2D Generative Art Studio</h1>
        <p className="text-center text-gray-400 mb-8">Create beautiful tessellations with customizable color palettes</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Panel */}
          <div className="lg:col-span-1 space-y-4">
            {/* Quick Presets */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-3">Quick Presets</h2>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => applyPreset(key)}
                    className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-3 rounded text-sm transition capitalize"
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>

            {/* Performance Settings */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-3">Performance</h2>
              <select
                value={performanceMode}
                onChange={(e) => setPerformanceMode(e.target.value)}
                className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600 mb-2"
              >
                <option value="fast">Fast (≤2000 tiles)</option>
                <option value="balanced">Balanced (≤5000 tiles)</option>
                <option value="quality">Quality (≤15000 tiles)</option>
              </select>
              <p className="text-xs text-gray-400">
                {tiles.length} tiles generated {tiles.length > performanceSettings.maxTiles ? '(limited)' : ''}
              </p>
            </div>

            {/* Tessellation Type */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-3">Tessellation Type</h2>
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
              <h2 className="text-xl font-semibold mb-3">Canvas Size (mm)</h2>
              <div className="space-y-2">
                <div>
                  <label className="block text-sm mb-1">Width</label>
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
                  <label className="block text-sm mb-1">Height</label>
                  <input
                    type="number"
                    value={canvasHeight}
                    onChange={(e) => setCanvasHeight(Number(e.target.value))}
                    min="50"
                    max="1000"
                    className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600"
                  />
                </div>
                <div className="text-xs text-gray-400 flex gap-2">
                  <button onClick={() => { setCanvasWidth(210); setCanvasHeight(297); }} className="text-purple-400 hover:underline">A4</button>
                  <button onClick={() => { setCanvasWidth(297); setCanvasHeight(420); }} className="text-purple-400 hover:underline">A3</button>
                </div>
              </div>
            </div>

            {/* Tile Settings */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-3">Tile Settings</h2>
              <div className="space-y-2">
                <div>
                  <label className="block text-sm mb-1">Size (mm)</label>
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
              <h2 className="text-xl font-semibold mb-3">Randomness Seed</h2>
              <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(Number(e.target.value))}
                className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600 mb-2"
              />
              <button
                onClick={() => setSeed(Math.floor(Math.random() * 100000))}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded transition"
              >
                Random Seed
              </button>
            </div>

            {/* Color Palette */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-3">Color Palette</h2>
              <div className="space-y-2">
                <div>
                  <label className="block text-sm mb-1">Preset</label>
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
                  <label className="block text-sm mb-1">Mode</label>
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
                  {showPaletteEditor ? 'Use Preset' : 'Custom Palette'}
                </button>
              </div>
            </div>

            {/* Custom Palette Editor */}
            {showPaletteEditor && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h2 className="text-xl font-semibold mb-3">Custom Palette</h2>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm mb-1">Name</label>
                    <input
                      type="text"
                      value={paletteName}
                      onChange={(e) => setPaletteName(e.target.value)}
                      className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Add Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        onChange={(e) => addColorToPalette(e.target.value)}
                        className="h-10 w-20 border border-gray-600 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        placeholder="#000000"
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
                    <label className="block text-sm mb-1">Colors ({customPalette.length}/10)</label>
                    <div className="flex flex-wrap gap-2 mt-1">
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
                Exports with dimensions in millimetres
              </p>
            </div>
          </div>

          {/* Canvas */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="relative bg-white rounded-lg overflow-hidden" style={{ aspectRatio: `${canvasWidth}/${canvasHeight}` }}>
                <svg
                  ref={svgRef}
                  width="100%"
                  height="100%"
                  viewBox={viewBox}
                  preserveAspectRatio="xMidYMid meet"
                  style={{ display: 'block' }}
                >
                  {tiles.map((tile) => (
                    <Tile key={tile.id} tile={tile} colorMode={colorMode} />
                  ))}
                </svg>
              </div>
              <div className="mt-2 text-sm text-gray-400 text-center">
                {canvasWidth}mm × {canvasHeight}mm | {tiles.length} tiles
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
