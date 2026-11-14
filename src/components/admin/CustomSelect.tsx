// src/components/admin/CustomSelect.tsx
// Reusable styled dropdown — use anywhere instead of <select>
// Dropdown renders via React portal so overflow:hidden ancestors never clip it
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  /** Optional: render label in a specific font-family */
  fontFamily?: string;
  /** Optional: left-side badge/icon node */
  icon?: React.ReactNode;
  /** Optional: dim description shown under the label */
  description?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  /** If true the trigger button renders in the selected option's fontFamily */
  previewFont?: boolean;
  disabled?: boolean;
  id?: string;
  /** Open the list in the middle of the screen over a dimmed backdrop, instead of under the trigger */
  centered?: boolean;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = '— Select —',
  className = '',
  previewFont = false,
  disabled = false,
  id,
  centered = false,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const current = options.find(o => o.value === value);

  // Position the portal dropdown to align with the trigger button
  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    });
  };

  useEffect(() => {
    if (open && !centered) updatePosition();
  }, [open, centered]);

  // Centered lists have no anchor, so Escape is the keyboard way out
  useEffect(() => {
    if (!open || !centered) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, centered]);

  // Close on outside click or scroll
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (
        !triggerRef.current?.contains(e.target as Node) &&
        !dropdownRef.current?.contains(e.target as Node)
      ) setOpen(false);
    };
    const closeOnScroll = () => setOpen(false);
    document.addEventListener('mousedown', close);
    window.addEventListener('scroll', closeOnScroll, true);
    return () => {
      document.removeEventListener('mousedown', close);
      window.removeEventListener('scroll', closeOnScroll, true);
    };
  }, []);

  const handleSelect = (opt: SelectOption) => {
    onChange(opt.value);
    setOpen(false);
  };

  const optionList = options.map(opt => (
    <button
      key={opt.value}
      type="button"
      role="option"
      aria-selected={opt.value === value}
      onClick={() => handleSelect(opt)}
      className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2.5 hover:bg-[#f3f4f6] transition ${opt.value === value ? 'bg-[#f9fafb]' : ''}`}
      style={opt.fontFamily ? { fontFamily: opt.fontFamily } : undefined}
    >
      {opt.icon && <span className="shrink-0">{opt.icon}</span>}
      <span className="flex-1 min-w-0">
        <span className="block truncate">{opt.label}</span>
        {opt.description && (
          <span className="block text-[0.72rem] text-[#6b7280] truncate" style={{ fontFamily: 'system-ui' }}>
            {opt.description}
          </span>
        )}
      </span>
      {opt.value === value && (
        <Check className="w-3.5 h-3.5 text-[#374151] shrink-0" style={{ fontFamily: 'system-ui' }} />
      )}
    </button>
  ));

  return (
    <div className={`relative ${className}`}>
      {/* Trigger */}
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => { if (!disabled) setOpen(o => !o); }}
        className="w-full h-8.5 border border-[#e5e7eb] rounded-md px-3 text-sm bg-white flex items-center gap-2 focus:outline-none focus:ring-1 focus:ring-[#374151] disabled:opacity-50 disabled:cursor-not-allowed transition"
        style={previewFont && current?.fontFamily ? { fontFamily: current.fontFamily } : undefined}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {current?.icon && <span className="shrink-0">{current.icon}</span>}
        <span className="flex-1 text-left truncate text-[#111827]">
          {current ? current.label : <span className="text-[#6b7280]">{placeholder}</span>}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-[#6b7280] shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Centered: full-screen overlay with the list in the middle */}
      {open && centered && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/30 p-4">
          <div
            ref={dropdownRef}
            role="listbox"
            aria-label={placeholder}
            className="w-full max-w-xs max-h-[70vh] overflow-y-auto bg-white border border-[#e5e7eb] rounded-xl shadow-2xl py-1"
          >
            {optionList}
          </div>
        </div>,
        document.body
      )}

      {/* Anchored dropdown rendered in a portal — escapes any overflow:hidden ancestor */}
      {open && !centered && typeof document !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          role="listbox"
          style={{ ...dropdownStyle, maxHeight: '220px', overflowY: 'auto' }}
          className="bg-white border border-[#e5e7eb] rounded-lg shadow-xl overflow-hidden"
        >
          {optionList}
        </div>,
        document.body
      )}
    </div>
  );
}
