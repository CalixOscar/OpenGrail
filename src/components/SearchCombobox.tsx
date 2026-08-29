/* SPDX-License-Identifier: MIT */

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type SVGProps,
} from 'react';
import { Search as SearchIconLucide, X as XIconLucide } from 'lucide-react';
import { scoreGraphNodeSearch, type GraphNode } from '../types/graph';

export interface SearchComboboxProps {
  id?: string;
  variant?: 'header' | 'sidebar';
  className?: string;
  inputClassName?: string;
  label?: string;
  labelHidden?: boolean;
  placeholder?: string;
  query: string;
  onQueryChange: (query: string) => void;
  nodes?: GraphNode[];
  matches?: GraphNode[];
  onSelect: (node: GraphNode) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  maxResults?: number;
  ariaControlsExtra?: string;
}

function SidebarSearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.75" />
      <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

export const SearchCombobox = forwardRef<HTMLInputElement, SearchComboboxProps>(
  function SearchCombobox(
    {
      id,
      variant = 'header',
      className = '',
      inputClassName = '',
      label = 'Search atlas',
      labelHidden = false,
      placeholder = 'Find a tradition or text…',
      query,
      onQueryChange,
      nodes,
      matches,
      onSelect,
      onFocus,
      onBlur,
      onMouseEnter,
      onMouseLeave,
      maxResults = 6,
      ariaControlsExtra,
    },
    ref,
  ) {
    const generatedId = useId();
    const inputId = id || `search-combobox-${generatedId}`;
    const listboxId = `${inputId}-listbox`;

    const inputRef = useRef<HTMLInputElement>(null);
    useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    const listboxRef = useRef<HTMLDivElement>(null);
    const blurTimerRef = useRef<number | null>(null);

    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    const computedMatches = useMemo(() => {
      if (matches !== undefined) return matches;
      const normalized = query.trim().toLocaleLowerCase();
      if (!normalized || !nodes) return [];
      return nodes
        .filter((node) => scoreGraphNodeSearch(node, normalized) > 0)
        .sort((left, right) => {
          const scoreDelta =
            scoreGraphNodeSearch(right, normalized) - scoreGraphNodeSearch(left, normalized);
          return scoreDelta || left.title.localeCompare(right.title);
        })
        .slice(0, maxResults);
    }, [matches, maxResults, nodes, query]);

    // Ensure activeIndex is within range when matches change
    useEffect(() => {
      if (activeIndex >= computedMatches.length) {
        setActiveIndex(computedMatches.length > 0 ? 0 : -1);
      }
    }, [computedMatches.length, activeIndex]);

    // Scroll active option into view
    useEffect(() => {
      if (activeIndex >= 0 && listboxRef.current) {
        const activeOption = listboxRef.current.children[activeIndex] as HTMLElement | undefined;
        activeOption?.scrollIntoView?.({ block: 'nearest' });
      }
    }, [activeIndex]);

    const handleSelect = useCallback(
      (node: GraphNode) => {
        if (blurTimerRef.current !== null) {
          window.clearTimeout(blurTimerRef.current);
          blurTimerRef.current = null;
        }
        onSelect(node);
        setIsOpen(false);
        setActiveIndex(-1);
      },
      [onSelect],
    );

    const handleKeyDown = useCallback(
      (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          if (!isOpen && query.trim()) {
            setIsOpen(true);
            setActiveIndex(0);
          } else if (computedMatches.length > 0) {
            setActiveIndex((prev) => (prev < computedMatches.length - 1 ? prev + 1 : 0));
          }
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          if (!isOpen && query.trim()) {
            setIsOpen(true);
            setActiveIndex(computedMatches.length - 1);
          } else if (computedMatches.length > 0) {
            setActiveIndex((prev) => (prev > 0 ? prev - 1 : computedMatches.length - 1));
          }
        } else if (event.key === 'Enter') {
          event.preventDefault();
          if (isOpen && activeIndex >= 0 && activeIndex < computedMatches.length) {
            handleSelect(computedMatches[activeIndex]);
          } else if (computedMatches.length > 0) {
            handleSelect(computedMatches[0]);
          }
        } else if (event.key === 'Escape') {
          if (isOpen) {
            event.preventDefault();
            event.stopPropagation();
            setIsOpen(false);
            setActiveIndex(-1);
          }
        } else if (event.key === 'Tab') {
          setIsOpen(false);
          setActiveIndex(-1);
        }
      },
      [activeIndex, computedMatches, handleSelect, isOpen, query],
    );

    const handleInputFocus = useCallback(() => {
      if (blurTimerRef.current !== null) {
        window.clearTimeout(blurTimerRef.current);
        blurTimerRef.current = null;
      }
      if (query.trim()) {
        setIsOpen(true);
      }
      onFocus?.();
    }, [onFocus, query]);

    const handleInputBlur = useCallback(() => {
      blurTimerRef.current = window.setTimeout(() => {
        setIsOpen(false);
        setActiveIndex(-1);
        blurTimerRef.current = null;
      }, 150);
      onBlur?.();
    }, [onBlur]);

    const handleClear = useCallback(() => {
      onQueryChange('');
      setIsOpen(false);
      setActiveIndex(-1);
      inputRef.current?.focus();
    }, [onQueryChange]);

    const isExpanded = isOpen && Boolean(query.trim());
    const activeOptionId =
      isExpanded && activeIndex >= 0 && computedMatches[activeIndex]
        ? `${listboxId}-option-${computedMatches[activeIndex].id}`
        : undefined;

    const ariaControls = ariaControlsExtra
      ? isExpanded
        ? `${listboxId} ${ariaControlsExtra}`
        : ariaControlsExtra
      : isExpanded
        ? listboxId
        : undefined;

    const renderInput = (customInputClassName?: string) => (
      <input
        ref={inputRef}
        id={inputId}
        className={customInputClassName || inputClassName}
        type="search"
        value={query}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={isExpanded}
        aria-controls={ariaControls}
        aria-activedescendant={activeOptionId}
        onChange={(event) => {
          onQueryChange(event.target.value);
          if (event.target.value.trim()) {
            setIsOpen(true);
          }
          setActiveIndex(-1);
        }}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck="false"
      />
    );

    const renderResults = () => {
      if (!isExpanded) return null;
      return (
        <div
          ref={listboxRef}
          id={listboxId}
          className="search-results"
          role="listbox"
          aria-label={`${label} results`}
        >
          {computedMatches.length > 0 ? (
            computedMatches.map((node, index) => {
              const optionId = `${listboxId}-option-${node.id}`;
              const isSelected = index === activeIndex;
              return (
                <button
                  key={node.id}
                  id={optionId}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={-1}
                  className={`search-results__option${isSelected ? ' is-active' : ''}`}
                  onClick={() => handleSelect(node)}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    handleSelect(node);
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <span
                    className="search-results__dot"
                    style={{ backgroundColor: node.color }}
                    aria-hidden="true"
                  />
                  <span>
                    <strong>{node.title}</strong>
                    <small>
                      {node.cluster} · {node.eraStart}
                    </small>
                  </span>
                </button>
              );
            })
          ) : (
            <p role="status">No traditions match “{query.trim()}”.</p>
          )}
        </div>
      );
    };

    const renderAnnouncement = () => (
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isExpanded
          ? computedMatches.length > 0
            ? `${computedMatches.length} tradition${computedMatches.length === 1 ? '' : 's'} found.`
            : `No traditions match “${query.trim()}”.`
          : ''}
      </div>
    );

    if (variant === 'sidebar') {
      return (
        <div
          className={`sidebar-search ${className}`.trim()}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          <label className="sr-only" htmlFor={inputId}>
            {label}
          </label>
          <SidebarSearchIcon className="sidebar-search__icon" />
          {renderInput('sidebar-search__input')}
          {query && (
            <button
              className="sidebar-search__clear"
              type="button"
              onClick={handleClear}
              aria-label={`Clear ${label.toLowerCase()}`}
            >
              <span aria-hidden="true">×</span>
            </button>
          )}
          {renderResults()}
          {renderAnnouncement()}
        </div>
      );
    }

    return (
      <form
        className={`graph-search ${className}`.trim()}
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          if (computedMatches.length > 0) {
            handleSelect(activeIndex >= 0 ? computedMatches[activeIndex] : computedMatches[0]);
          }
        }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <label className={labelHidden ? 'sr-only' : undefined} htmlFor={inputId}>
          {label}
        </label>
        <div className="graph-search__field">
          <SearchIconLucide size={15} aria-hidden="true" />
          {renderInput()}
          {query && (
            <button
              className="graph-search__clear"
              type="button"
              onClick={handleClear}
              aria-label="Clear graph search"
            >
              <XIconLucide size={13} aria-hidden="true" />
            </button>
          )}
        </div>
        {renderResults()}
        {renderAnnouncement()}
      </form>
    );
  },
);

export default SearchCombobox;
