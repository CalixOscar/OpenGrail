/* SPDX-License-Identifier: MIT */

import {
  Activity,
  History,
  Layers,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAtlasState } from '../state/AtlasState';

export const HISTORIC_MIN_YEAR = -3000;
export const DEEP_MIN_YEAR = -100000;
export const MIN_YEAR = -3000;
export const MAX_YEAR = new Date().getFullYear();

export type TimelineMode = 'historic' | 'deep';

export interface TimelinePreset {
  id: string;
  label: string;
  year: number;
  description: string;
}

export const HISTORIC_PRESETS: TimelinePreset[] = [
  { id: 'bronze-age', label: 'Bronze Age', year: -2000, description: 'Early Mesopotamian, Egyptian, and Indus valley traditions' },
  { id: 'axial-age', label: 'Axial Age', year: -500, description: 'Emergence of Classical philosophy, Buddhism, Jainism, Daoism, Zoroastrianism' },
  { id: 'hellenistic', label: 'Hellenistic', year: -323, description: 'Mediterranean syncretism and philosophical schools' },
  { id: 'medieval', label: 'Medieval Schisms', year: 1054, description: 'Great Schism of East and West Christendom' },
  { id: 'reformation', label: 'Reformation', year: 1517, description: 'European Protestant Reformation' },
  { id: 'modern-nrms', label: 'Modern NRMs', year: 1900, description: 'New Religious Movements and modern global diaspora' },
  { id: 'present', label: 'Present', year: MAX_YEAR, description: 'Contemporary atlas state' },
];

export const DEEP_PRESETS: TimelinePreset[] = [
  { id: 'ritual-burials', label: 'Ritual Burials', year: -100000, description: 'Earliest intentional ceremonial burials with red ochre & grave goods (Qafzeh, Skhul, Shanidar)' },
  { id: 'lion-man', label: 'Paleolithic Shamanism', year: -40000, description: 'Löwenmensch (Lion-Man) carving & Chauvet cave sanctuaries' },
  { id: 'venus-figurines', label: 'Venus Figurines', year: -25000, description: 'Widespread Eurasian fertility & Mother Goddess cult symbols (Willendorf)' },
  { id: 'gobekli-tepe', label: 'Göbekli Tepe', year: -9500, description: 'World’s oldest monumental megalithic sanctuary complex (Anatolia)' },
  { id: 'written-history', label: 'Written History', year: -3000, description: 'First deciphered religious texts (Sumerian cuneiform & Egyptian hieroglyphs)' },
  { id: 'axial-age', label: 'Axial Age', year: -500, description: 'Foundational world religions & classical philosophies' },
  { id: 'present', label: 'Present', year: MAX_YEAR, description: 'Contemporary atlas state' },
];

export const TIMELINE_PRESETS = HISTORIC_PRESETS;

export function formatYearLabel(year: number): string {
  if (year < 0) {
    const abs = Math.abs(year);
    return `${abs.toLocaleString('en-US')} BCE`;
  }
  if (year === 0) return '1 BCE / 1 CE';
  return `${year.toLocaleString('en-US')} CE`;
}

// Piecewise non-linear scale anchors for standard historic timeline [t (0..1), year]
const HISTORIC_SCALE_ANCHORS: [number, number][] = [
  [0.0, -3000],
  [0.16, -2000],
  [0.36, -500],
  [0.48, 0],
  [0.66, 1054],
  [0.78, 1517],
  [0.88, 1900],
  [1.0, MAX_YEAR],
];

// Piecewise non-linear scale anchors for deep prehistoric timeline [t (0..1), year]
const DEEP_SCALE_ANCHORS: [number, number][] = [
  [0.00, -100000], // 100k BCE - Ritual Burials & Red Ochre
  [0.16, -40000],  // 40k BCE - Lion-Man & Shamanic Art
  [0.28, -25000],  // 25k BCE - Venus Figurines
  [0.42, -9500],   // 9.5k BCE - Göbekli Tepe
  [0.56, -3000],   // 3k BCE - Written History
  [0.70, -500],    // 500 BCE - Axial Age
  [0.82, 1054],    // 1054 CE - Medieval
  [0.91, 1900],    // 1900 CE - Modern
  [1.00, MAX_YEAR],
];

export function yearToRatio(year: number, mode: TimelineMode = 'historic'): number {
  const anchors = mode === 'deep' ? DEEP_SCALE_ANCHORS : HISTORIC_SCALE_ANCHORS;
  const minYear = mode === 'deep' ? DEEP_MIN_YEAR : HISTORIC_MIN_YEAR;
  const clampedYear = Math.max(minYear, Math.min(MAX_YEAR, year));

  for (let i = 0; i < anchors.length - 1; i++) {
    const [t1, y1] = anchors[i];
    const [t2, y2] = anchors[i + 1];
    if (clampedYear >= y1 && clampedYear <= y2) {
      const segmentFraction = (clampedYear - y1) / (y2 - y1);
      return t1 + segmentFraction * (t2 - t1);
    }
  }
  return 1;
}

export function ratioToYear(ratio: number, mode: TimelineMode = 'historic'): number {
  const anchors = mode === 'deep' ? DEEP_SCALE_ANCHORS : HISTORIC_SCALE_ANCHORS;
  const clampedRatio = Math.max(0, Math.min(1, ratio));

  for (let i = 0; i < anchors.length - 1; i++) {
    const [t1, y1] = anchors[i];
    const [t2, y2] = anchors[i + 1];
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
  const { currentYear, setCurrentYear, temporalMode, setTemporalMode } = useAtlasState();
  const [timelineMode, setTimelineMode] = useState<TimelineMode>('historic');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<0.5 | 1 | 2 | 4>(1);
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const lastTimeRef = useRef<number | null>(null);

  const minYear = timelineMode === 'deep' ? DEEP_MIN_YEAR : HISTORIC_MIN_YEAR;
  const presets = timelineMode === 'deep' ? DEEP_PRESETS : HISTORIC_PRESETS;

  const speedMultiplier = playbackSpeed;
  const baseRate = (MAX_YEAR - minYear) / 30;

  const setYear = useCallback(
    (year: number) => {
      const clamped = Math.max(minYear, Math.min(MAX_YEAR, Math.round(year)));
      setCurrentYear(clamped);
      onYearChange?.(clamped);
    },
    [minYear, onYearChange, setCurrentYear],
  );

  // Playback animation loop
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
      setYear(ratioToYear(ratio, timelineMode));
      setIsDragging(true);
      (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
    },
    [setYear, timelineMode],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging || !trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const ratio = (event.clientX - rect.left) / rect.width;
      setYear(ratioToYear(ratio, timelineMode));
    },
    [isDragging, setYear, timelineMode],
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const step = timelineMode === 'deep' ? 1000 : 10;
      const largeStep = timelineMode === 'deep' ? 5000 : 100;

      if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
        event.preventDefault();
        setYear(currentYear + (event.shiftKey ? largeStep : step));
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
        event.preventDefault();
        setYear(currentYear - (event.shiftKey ? largeStep : step));
      } else if (event.key === 'Home') {
        event.preventDefault();
        setYear(minYear);
      } else if (event.key === 'End') {
        event.preventDefault();
        setYear(MAX_YEAR);
      } else if (event.key === ' ' || event.code === 'Space') {
        event.preventDefault();
        setIsPlaying((playing) => !playing);
      }
    },
    [currentYear, minYear, setYear, timelineMode],
  );

  const currentRatio = useMemo(
    () => yearToRatio(currentYear, timelineMode),
    [currentYear, timelineMode],
  );

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
            onClick={() => setYear(minYear)}
            title={`Reset to ${formatYearLabel(minYear)}`}
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

        {/* Timeline Scale Mode Selector (Written History vs Deep Prehistory) */}
        <div className="timeline-mode-toggle" role="group" aria-label="Timeline scale mode">
          <button
            type="button"
            className={`timeline-mode-btn${timelineMode === 'historic' ? ' is-active' : ''}`}
            onClick={() => {
              setTimelineMode('historic');
              if (currentYear < HISTORIC_MIN_YEAR) setYear(HISTORIC_MIN_YEAR);
            }}
            title="Written History scale (3000 BCE – Present)"
          >
            <History size={13} />
            <span>Written History</span>
          </button>

          <button
            type="button"
            className={`timeline-mode-btn${timelineMode === 'deep' ? ' is-active' : ''}`}
            onClick={() => {
              setTimelineMode('deep');
            }}
            title="Deep Prehistory scale (100,000 BCE – Present: Göbekli Tepe, Shamanism, Ritual Burials)"
          >
            <Sparkles size={13} />
            <span>Deep Prehistory</span>
          </button>
        </div>

        {/* Temporal Visibility Mode Selector (Emergent vs Active) */}
        <div className="timeline-mode-toggle" role="group" aria-label="Temporal visibility mode">
          <button
            type="button"
            className={`timeline-mode-btn${temporalMode === 'emergent' ? ' is-active' : ''}`}
            onClick={() => setTemporalMode('emergent')}
            title="Emergent mode: Cumulative history (origin year ≤ scrubbed year)"
            aria-pressed={temporalMode === 'emergent'}
          >
            <Layers size={13} />
            <span>Emergent</span>
          </button>

          <button
            type="button"
            className={`timeline-mode-btn${temporalMode === 'active' ? ' is-active' : ''}`}
            onClick={() => setTemporalMode('active')}
            title="Active mode: Traditions active in this era (hides extinct traditions)"
            aria-pressed={temporalMode === 'active'}
          >
            <Activity size={13} />
            <span>Active</span>
          </button>
        </div>

        <div className="timeline-display" aria-live="polite">
          <span className="timeline-display__label">Era</span>
          <span className="timeline-display__year">{formatYearLabel(currentYear)}</span>
        </div>

        <div className="timeline-presets" role="group" aria-label="Era presets">
          {presets.map((preset) => {
            const threshold = timelineMode === 'deep' ? 1000 : 25;
            const isActive = Math.abs(currentYear - preset.year) <= threshold;
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
        aria-valuemin={minYear}
        aria-valuemax={MAX_YEAR}
        aria-valuenow={currentYear}
        aria-valuetext={formatYearLabel(currentYear)}
        aria-label="Timeline year slider"
      >
        <div
          className="timeline-track__progress"
          style={{ width: `${currentRatio * 100}%` }}
        />

        {presets.map((preset) => {
          const ratio = yearToRatio(preset.year, timelineMode);
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
        {timelineMode === 'deep' ? (
          <>
            <span>100,000 BCE (Burials)</span>
            <span>40,000 BCE (Shamanism)</span>
            <span>25,000 BCE (Venus Figurines)</span>
            <span>9,500 BCE (Göbekli Tepe)</span>
            <span>3,000 BCE (Writing)</span>
            <span>500 BCE (Axial Age)</span>
            <span>1054 CE</span>
            <span>{MAX_YEAR} CE</span>
          </>
        ) : (
          <>
            <span>3000 BCE</span>
            <span>2000 BCE</span>
            <span>500 BCE</span>
            <span>1 CE</span>
            <span>1054 CE</span>
            <span>1517 CE</span>
            <span>1900 CE</span>
            <span>{MAX_YEAR} CE</span>
          </>
        )}
      </div>
    </footer>
  );
}

export default TimelineScrubber;
