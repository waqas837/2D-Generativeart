import { memo } from 'react';

// Memoized tile component for performance
const Tile = memo(({ tile, colorMode }) => {
  const strokeColor = colorMode === 'hex' ? '#ffffff' : 'hsv(0, 0%, 100%)';
  
  if (tile.type === 'square') {
    return (
      <g transform={`translate(${tile.x},${tile.y}) rotate(${tile.rotation} ${tile.size/2} ${tile.size/2})`}>
        <rect
          x="0"
          y="0"
          width={tile.size}
          height={tile.size}
          fill={tile.color}
          stroke={strokeColor}
          strokeWidth="0.5"
          opacity={tile.opacity}
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
      <g transform={`translate(${tile.x},${tile.y}) rotate(${tile.rotation} ${size/2} ${size/2})`}>
        <polygon
          points={points}
          fill={tile.color}
          stroke={strokeColor}
          strokeWidth="0.5"
          opacity={tile.opacity}
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
      <g transform={`translate(${tile.x},${tile.y}) rotate(${tile.rotation} ${radius} ${radius})`}>
        <polygon
          points={points.join(' ')}
          fill={tile.color}
          stroke={strokeColor}
          strokeWidth="0.5"
          opacity={tile.opacity}
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
      <g transform={`translate(${tile.x},${tile.y}) rotate(${tile.rotation} ${size/2} ${height/2})`}>
        <polygon
          points={points}
          fill={tile.color}
          stroke={strokeColor}
          strokeWidth="0.5"
          opacity={tile.opacity}
        />
      </g>
    );
  }
  return null;
});

Tile.displayName = 'Tile';

export default Tile;

