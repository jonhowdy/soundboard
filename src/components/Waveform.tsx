import { useMemo } from 'react';

/**
 * Lightweight SVG waveform preview rendered from precomputed peaks (0..1).
 * Purely presentational; costs nothing to animate via CSS.
 */
export function Waveform({
  peaks,
  color = 'currentColor',
  className,
  animated,
}: {
  peaks: number[];
  color?: string;
  className?: string;
  animated?: boolean;
}) {
  const bars = useMemo(() => {
    if (peaks.length === 0) return Array.from({ length: 40 }, () => 0.15);
    return peaks;
  }, [peaks]);

  const width = 100;
  const gap = 1.2;
  const barW = (width - gap * (bars.length - 1)) / bars.length;

  return (
    <svg
      viewBox={`0 0 ${width} 24`}
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      {bars.map((p, i) => {
        const h = Math.max(1.5, p * 22);
        return (
          <rect
            key={i}
            x={i * (barW + gap)}
            y={(24 - h) / 2}
            width={barW}
            height={h}
            rx={barW / 2}
            fill={color}
            opacity={0.85}
            className={animated ? 'animate-pulse' : undefined}
            style={animated ? { animationDelay: `${i * 20}ms` } : undefined}
          />
        );
      })}
    </svg>
  );
}
