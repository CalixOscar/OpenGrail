/* SPDX-License-Identifier: MIT */

import { ExternalLink, Landmark, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { TraditionArtifact } from '../types/graph';

export interface LightboxProps {
  open: boolean;
  artifact: TraditionArtifact | null;
  accentColor?: string;
  onClose: () => void;
}

function resolveAssetPath(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('/artifacts/')) {
    const base = import.meta.env.BASE_URL || '/';
    const cleanBase = base.endsWith('/') ? base : `${base}/`;
    return `${cleanBase}${url.slice(1)}`;
  }
  return url;
}

export function Lightbox({ open, artifact, accentColor = '#64d8c0', onClose }: LightboxProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Reset image failure state when artifact changes
  useEffect(() => {
    setImageFailed(false);
  }, [artifact]);

  // Focus management: save previous focus, focus close button, restore on close
  useEffect(() => {
    if (open && artifact) {
      previousActiveElementRef.current = document.activeElement as HTMLElement | null;
      // Focus the close button after render
      const timeoutId = window.setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 0);
      return () => {
        window.clearTimeout(timeoutId);
        previousActiveElementRef.current?.focus();
      };
    }
  }, [open, artifact]);

  // Keyboard navigation: Escape to close, Tab focus trapping
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === 'Tab') {
        const dialog = dialogRef.current;
        if (!dialog) return;

        const focusableElements = dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    },
    [onClose],
  );

  if (!open || !artifact) return null;

  const rawUrl = artifact.imageUrl || artifact.url || artifact.image_url;
  const imgPath = resolveAssetPath(rawUrl);
  const sourceLink =
    artifact.sourceUrl || (rawUrl?.startsWith('http') ? rawUrl : undefined);

  return (
    <div
      className="artifact-lightbox-backdrop"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label={artifact.title}
    >
      <div
        ref={dialogRef}
        className="artifact-lightbox-dialog"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        <button
          ref={closeButtonRef}
          type="button"
          className="artifact-lightbox-close icon-button"
          onClick={onClose}
          aria-label="Close image preview"
        >
          <X size={18} />
        </button>

        {imgPath && !imageFailed ? (
          <div className="artifact-lightbox-img-wrap">
            <img
              src={imgPath}
              alt={artifact.title}
              className="artifact-lightbox-img"
              onError={() => setImageFailed(true)}
            />
          </div>
        ) : (
          <div
            className="artifact-lightbox-img-wrap"
            style={{
              padding: '2.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <Landmark style={{ width: 44, height: 44, color: accentColor, opacity: 0.85 }} />
            <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
              Archival artifact representation
            </span>
          </div>
        )}

        <div className="artifact-lightbox-content">
          <h3 className="artifact-lightbox-title">{artifact.title}</h3>
          <div className="artifact-lightbox-badges">
            {artifact.provenance && (
              <span className="document-badge">📍 {artifact.provenance}</span>
            )}
            {artifact.period && (
              <span className="document-badge document-badge--era">⏳ {artifact.period}</span>
            )}
          </div>
          {artifact.description && (
            <p className="artifact-lightbox-desc">{artifact.description}</p>
          )}
          {sourceLink && (
            <div style={{ marginTop: '14px' }}>
              <a
                href={sourceLink}
                target="_blank"
                rel="noopener noreferrer"
                className="source-link"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#93c5fd' }}
              >
                <span>View full-size original on Wikimedia Commons</span>
                <ExternalLink size={13} />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Lightbox;
