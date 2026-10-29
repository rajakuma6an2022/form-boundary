import { EllipsisVertical } from 'lucide-react';
import { type KeyboardEvent, useEffect, useId, useRef, useState } from 'react';

export type RowAction = 'edit' | 'preview' | 'copy-link' | 'responses' | 'duplicate' | 'delete';

const ITEMS: { id: RowAction; label: string }[] = [
  { id: 'edit', label: 'Edit' },
  { id: 'preview', label: 'Preview' },
  { id: 'copy-link', label: 'Copy public link' },
  { id: 'responses', label: 'View responses' },
  { id: 'duplicate', label: 'Duplicate' },
  { id: 'delete', label: 'Delete' },
];

interface RowActionsMenuProps {
  formName: string;
  onSelect?: (action: RowAction) => void;
}

export function RowActionsMenu({ formName, onSelect }: RowActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    itemRefs.current[0]?.focus();

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  function close(returnFocus: boolean) {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const items = itemRefs.current.filter((item): item is HTMLButtonElement => item !== null);
    const current = items.indexOf(document.activeElement as HTMLButtonElement);

    if (event.key === 'Escape') {
      event.preventDefault();
      close(true);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      items[(current + 1) % items.length]?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      items[(current - 1 + items.length) % items.length]?.focus();
    } else if (event.key === 'Tab') {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative inline-block text-left">
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Actions for ${formName}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
        className="grid size-9 place-items-center rounded-control text-ink-muted transition-colors hover:bg-canvas hover:text-ink"
      >
        <EllipsisVertical aria-hidden className="size-4" />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label={`Actions for ${formName}`}
          onKeyDown={onKeyDown}
          className="absolute right-0 top-full z-20 mt-1 w-48 rounded-card border border-line bg-surface py-1 shadow-menu"
        >
          {ITEMS.map((item, index) => (
            <button
              key={item.id}
              ref={(node) => {
                itemRefs.current[index] = node;
              }}
              type="button"
              role="menuitem"
              tabIndex={-1}
              onClick={() => {
                onSelect?.(item.id);
                close(true);
              }}
              className={`block w-full px-3 py-2 text-left text-sm hover:bg-canvas ${
                item.id === 'delete' ? 'mt-1 border-t border-line text-danger' : 'text-ink'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}