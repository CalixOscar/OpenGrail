/* SPDX-License-Identifier: AGPL-3.0-or-later OR LicenseRef-OpenGrail-Commercial */
/* See LICENSE and LICENSE-COMMERCIAL.md for the applicable terms. */

import {
  Pause,
  Play,
  RotateCcw,
} from 'lucide-react';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAtlasState } from '../state/AtlasState';

export const MIN_YEAR = -3000;
export const MAX_YEAR = new Date().getFullYear();

export interface TimelinePreset {
  id: string;
  label: string;
  year: number;
  description: string;
}

export const TIMELINE_PRESETS: TimelinePreset[] = [
  { id: 'bronze-age', label: 'Bronze Age', year: -2000, description: 'Early Mesopotamian and Indus valley traditions' },
  { id: 'axial-age', label: 'Axial Age', year: -500, description: 'Emergence of Classical philosophy, Buddhism, Jainism, Daoism' },
  { id: 'hellenistic', label: 'Hellenistic', year: -323, description: 'Mediterranean syncretism and philosophical schools' },
  { id: 'medieval', label: 'Medieval Schisms', year: 1054, description: 'Great Schism of East and West Christendom' },
  { id: 'reformation', label: 'Reformation', year: 1517, description: 'European Protestant Reformation' },
  { id: 'modern-nrms', label: 'Modern NRMs', year: 1900, description: 'New Religious Movements and modern global diaspora' },
  { id: 'present', label: 'Present', year: MAX_YEAR, description: 'Contemporary atlas state' },
];

export function formatYearLabel(year: number): string {
  if (year < 0) return `${Math.abs(year)} BCE`;
  if (year === 0) return '1 BCE / 1 CE';
  return `${year} CE`;
}

// Piecewise monotonic non-linear scale anchors: [t (0..1), year]
const SCALE_ANCHORS: [number, number][] = [
  [0.0, -3000],
  [0.16, -2000],
  [0.36, -500],
  [0.48, 0],
  [0.66, 1054],
  [0.78, 1517],
  [0.88, 1900],
  [1.0, MAX_YEAR],
];

export function yearToRatio(year: number): number {
  const clampedYear = Math.max(MIN_YEAR, Math.min(MAX_YEAR, year));
  for (let i = 0; i < SCALE_ANCHORS.length - 1; i++) {
    const [t1, y1] = SCALE_ANCHORS[i];
    const [t2, y2] = SCALE_ANCHORS[i + 1];
    if (clampedYear >= y1 && clampedYear <= y2) {
      const segmentFraction = (clampedYear - y1) / (y2 - y1);
      return t1 + segmentFraction * (t2 - t1);
    }
  }
  return 1;
}

export function ratioToYear(ratio: number): number {
  const clampedRatio = Math.max(0, Math.min(1, ratio));
  for (let i = 0; i < SCALE_ANCHORS.length - 1; i++) {
    const [t1, y1] = SCALE_ANCHORS[i];
    const [t2, y2] = SCALE_ANCHORS[i + 1];
    if (clampedRatio >= t1 && clampedRatio <= t2) {
      const segmentFraction = (clampedRatio - t1) / (t2 - t1);
      return Math.round(y1 + segmentFraction * (y2 - y1));
    }
  }
  return MAX_YEAR;
}

export interface TimelineScrubberProps {
  className?: string;
  onYearChange?: (year: number) => void;
}

export function TimelineScrubber({
  className = '',
  onYearChange,
}: TimelineScrubberProps) {
  const { currentYear, setCurrentYear } = useAtlasState();
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<0.5 | 1 | 2 | 4>(1);
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const lastTimeRef = useRef<number | null>(null);

  const speedMultiplier = playbackSpeed;
  // Full range ~5000 years in 30 seconds at 1x => ~167 years per second
  const baseRate = (MAX_YEAR - MIN_YEAR) / 30;

  const setYear = useCallback(
    (year: number) => {
      const clamped = Math.max(MIN_YEAR, Math.min(MAX_YEAR, Math.round(year)));
      setCurrentYear(clamped);
      onYearChange?.(clamped);
    },
    [onYearChange, setCurrentYear],
  );

  // Playback animation frame loop
  useEffect(() => {
    if (!isPlaying) {
      lastTimeRef.current = null;
      return undefined;
    }

    let animationFrameId: number;

    const tick = (time: number) => {
      if (lastTimeRef.current !== null) {
        const deltaSeconds = (time - lastTimeRef.current) / 1000;
        const yearsToAdd = deltaSeconds * baseRate * speedMultiplier;
        setCurrentYear((prev) => {
          const next = prev + yearsToAdd;
          if (next >= MAX_YEAR) {
            setIsPlaying(false);
            return MAX_YEAR;
          }
          return Math.round(next);
        });
      }
      lastTimeRef.current = time;
      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animationFrameId);
      lastTimeRef.current = null;
    };
  }, [baseRate, isPlaying, setCurrentYear, speedMultiplier]);

  // Pointer drag on track
  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const ratio = (event.clientX - rect.left) / rect.width;
      setYear(ratioToYear(ratio));
      setIsDragging(true);
      (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
    },
    [setYear],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging || !trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const ratio = (event.clientX - rect.left) / rect.width;
      setYear(ratioToYear(ratio));
    },
    [isDragging, setYear],
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
        event.preventDefault();
        setYear(currentYear + (event.shiftKey ? 100 : 10));
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
        event.preventDefault();
        setYear(currentYear - (event.shiftKey ? 100 : 10));
      } else if (event.key === 'Home') {
        event.preventDefault();
        setYear(MIN_YEAR);
      } else if (event.key === 'End') {
        event.preventDefault();
        setYear(MAX_YEAR);
      } else if (event.key === ' ' || event.code === 'Space') {
        event.preventDefault();
        setIsPlaying((playing) => !playing);
      }
    },
    [currentYear, setYear],
  );

  const currentRatio = useMemo(() => yearToRatio(currentYear), [currentYear]);

  return (
    <footer
      className={`timeline-scrubber ${className}`.trim()}
      aria-label="Chronological atlas scrubber"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="timeline-scrubber__header">
        <div className="timeline-scrubber__playback">
          <button
            type="button"
            className="timeline-btn timeline-btn--play"
            onClick={() => setIsPlaying((p) => !p)}
            title={isPlaying ? 'Pause (Space)' : 'Play timeline (Space)'}
            aria-label={isPlaying ? 'Pause timeline' : 'Play timeline'}
          >
            {isPlaying ? <Pause size={15} /> : <Play size={15} />}
          </button>

          <button
            type="button"
            className="timeline-btn"
            onClick={() => setYear(MIN_YEAR)}
            title="Reset to 3000 BCE"
            aria-label="Jump to start"
          >
            <RotateCcw size={13} />
          </button>

          <div className="timeline-speeds" role="group" aria-label="Playback speed">
            {([0.5, 1, 2, 4] as const).map((speed) => (
              <button
                key={speed}
                type="button"
                className={`timeline-speed-chip${playbackSpeed === speed ? ' is-active' : ''}`}
                onClick={() => setPlaybackSpeed(speed)}
                aria-pressed={playbackSpeed === speed}
                title={`${speed}x playback speed`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        <div className="timeline-display" aria-live="polite">
          <span className="timeline-display__label">Era</span>
          <span className="timeline-display__year">{formatYearLabel(currentYear)}</span>
        </div>

        <div className="timeline-presets" role="group" aria-label="Era presets">
          {TIMELINE_PRESETS.map((preset) => {
            const isActive = Math.abs(currentYear - preset.year) <= 15;
            return (
              <button
                key={preset.id}
                type="button"
                className={`timeline-preset-chip${isActive ? ' is-active' : ''}`}
                onClick={() => {
                  setYear(preset.year);
                  setIsPlaying(false);
                }}
                title={`${preset.label} (${formatYearLabel(preset.year)}): ${preset.description}`}
                aria-pressed={isActive}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        ref={trackRef}
        className="timeline-track"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        role="slider"
        aria-valuemin={MIN_YEAR}
        aria-valuemax={MAX_YEAR}
        aria-valuenow={currentYear}
        aria-valuetext={formatYearLabel(currentYear)}
        aria-label="Timeline year slider"
      >
        <div
          className="timeline-track__progress"
          style={{ width: `${currentRatio * 100}%` }}
        />

        {TIMELINE_PRESETS.map((preset) => {
          const ratio = yearToRatio(preset.year);
          return (
            <div
              key={preset.id}
              className="timeline-track__marker"
              style={{ left: `${ratio * 100}%` }}
              title={`${preset.label} (${formatYearLabel(preset.year)})`}
            >
              <span className="timeline-track__marker-tick" />
            </div>
          );
        })}

        <div
          className="timeline-track__thumb"
          style={{ left: `${currentRatio * 100}%` }}
        >
          <div className="timeline-track__thumb-pulse" />
        </div>
      </div>

      <div className="timeline-labels">
        <span>3000 BCE</span>
        <span>2000 BCE</span>
        <span>500 BCE</span>
        <span>1 CE</span>
        <span>1054 CE</span>
        <span>1517 CE</span>
        <span>1900 CE</span>
        <span>{MAX_YEAR} CE</span>
      </div>
    </footer>
  );
}

export default TimelineScrubber;
