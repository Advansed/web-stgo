import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { DropdownOption } from './useFindLics';
import './DropDownFilter.css';

interface DropdownFilterProps {
  options: DropdownOption[];
  selected?: DropdownOption | null;
  onSelect: (item: DropdownOption) => void;
  onClear?: () => void;
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
  label: string;
}

const DropdownFilter: React.FC<DropdownFilterProps> = ({
  options, selected, onSelect, onClear, disabled = false, loading = false,
  placeholder = 'Выберите значение', label,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(selected?.name || '');
  const [filterQuery, setFilterQuery] = useState('');
  const [highlighted, setHighlighted] = useState(-1);
  const [placement, setPlacement] = useState({ top: 0, left: 0, width: 0, maxHeight: 260, above: false });
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const editedSelection = useRef(false);

  useLayoutEffect(() => {
    if (editedSelection.current) { editedSelection.current = false; return; }
    setQuery(selected?.name || ''); setFilterQuery(''); setOpen(false); setHighlighted(-1);
  }, [selected?.id, selected?.name]);
  useEffect(() => { if (disabled) setOpen(false); }, [disabled]);

  const updatePlacement = useCallback(() => {
    const rect = inputRef.current?.getBoundingClientRect();
    if (!rect) return;
    const viewport = window.visualViewport;
    const viewportTop = viewport?.offsetTop || 0;
    const viewportBottom = viewportTop + (viewport?.height || window.innerHeight);
    const below = viewportBottom - rect.bottom - 12;
    const above = rect.top - viewportTop - 12;
    const openAbove = below < 200 && above > below;
    const room = openAbove ? above : below;
    setPlacement({
      top: openAbove ? rect.top - 6 : rect.bottom + 6,
      left: rect.left,
      width: rect.width,
      maxHeight: Math.max(72, Math.min(300, room - 6)),
      above: openAbove,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePlacement();
    window.addEventListener('resize', updatePlacement);
    window.addEventListener('scroll', updatePlacement, true);
    window.visualViewport?.addEventListener('resize', updatePlacement);
    window.visualViewport?.addEventListener('scroll', updatePlacement);
    const closeOutside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!inputRef.current?.contains(target) && !listRef.current?.contains(target)) setOpen(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => {
      window.removeEventListener('resize', updatePlacement);
      window.removeEventListener('scroll', updatePlacement, true);
      window.visualViewport?.removeEventListener('resize', updatePlacement);
      window.visualViewport?.removeEventListener('scroll', updatePlacement);
      document.removeEventListener('pointerdown', closeOutside);
    };
  }, [open, updatePlacement]);

  const filtered = options.filter((item) => item.name.toLocaleLowerCase('ru-RU').includes(filterQuery.toLocaleLowerCase('ru-RU').trim()));
  const select = (item: DropdownOption) => {
    setQuery(item.name);
    setFilterQuery('');
    setOpen(false);
    setHighlighted(-1);
    onSelect(item);
  };

  return (
    <div className="dropdown-container">
      <input
        ref={inputRef}
        type="text"
        className="dropdown-input"
        value={query}
        onChange={(event) => {
          editedSelection.current = true;
          setQuery(event.target.value);
          setFilterQuery(event.target.value);
          setHighlighted(-1);
          if (selected) onClear?.();
          setOpen(true);
        }}
        onFocus={() => { if (!disabled) { if (selected) setFilterQuery(''); updatePlacement(); setOpen(true); } }}
        onClick={() => { if (!disabled) { if (selected) setFilterQuery(''); updatePlacement(); setOpen(true); } }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') { setOpen(false); return; }
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            setOpen(true);
            setHighlighted((current) => event.key === 'ArrowDown'
              ? (current + 1) % Math.max(filtered.length, 1)
              : (current <= 0 ? filtered.length - 1 : current - 1));
          }
          if (event.key === 'Enter' && open) {
            event.preventDefault();
            if (filtered[highlighted]) select(filtered[highlighted]);
            else if (filtered.length === 1) select(filtered[0]);
          }
        }}
        placeholder={placeholder}
        disabled={disabled || loading}
        autoComplete="off"
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-autocomplete="list"
      />
      {loading && <span className="dropdown-loading" aria-live="polite">Загрузка…</span>}
      {open && createPortal(
        <div
          ref={listRef}
          id={listId}
          className="dropdown-list"
          role="listbox"
          aria-label={label}
          style={{ top: placement.top, left: placement.left, width: placement.width, maxHeight: placement.maxHeight, transform: placement.above ? 'translateY(-100%)' : undefined }}
        >
          {filtered.length ? filtered.map((item, index) => (
            <button
              key={item.type + '-' + item.id + '-' + index}
              type="button"
              role="option"
              aria-selected={highlighted === index || selected?.id === item.id}
              className={'dropdown-item' + (highlighted === index ? ' dropdown-item--highlighted' : '')}
              onPointerDown={(event) => event.preventDefault()}
              onMouseEnter={() => setHighlighted(index)}
              onClick={() => select(item)}
            >{item.name}</button>
          )) : <div className="dropdown-empty">Ничего не найдено</div>}
        </div>,
        document.body,
      )}
    </div>
  );
};

export default DropdownFilter;
