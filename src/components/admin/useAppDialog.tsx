// src/components/admin/useAppDialog.tsx
// Replaces the browser's confirm() and alert() popups with a centered dialog on a tinted backdrop.
// Usage: const { confirm, notify, dialog } = useAppDialog();  ...  render {dialog} inside the component.
import { useEffect, useRef, useState } from 'react';

export interface DialogOptions {
  title?: string;
  confirmLabel?: string;
  danger?: boolean;
}

interface Pending {
  kind: 'confirm' | 'notice';
  title: string;
  message: string;
  confirmLabel: string;
  danger: boolean;
  resolve: (ok: boolean) => void;
}

export function useAppDialog() {
  const [pending, setPending] = useState<Pending | null>(null);

  // Resolves true when the user confirms, false when they cancel or press Escape.
  const confirm = (message: string, opts: DialogOptions = {}) =>
    new Promise<boolean>((resolve) => {
      setPending({
        kind: 'confirm',
        title: opts.title ?? 'Please confirm',
        message,
        confirmLabel: opts.confirmLabel ?? 'Confirm',
        danger: !!opts.danger,
        resolve,
      });
    });

  // A message with only an OK button.
  const notify = (message: string, opts: DialogOptions = {}) =>
    new Promise<boolean>((resolve) => {
      setPending({
        kind: 'notice',
        title: opts.title ?? 'Notice',
        message,
        confirmLabel: 'OK',
        danger: false,
        resolve,
      });
    });

  const close = (ok: boolean) => {
    pending?.resolve(ok);
    setPending(null);
  };

  const dialog = pending ? (
    <AppDialogView pending={pending} onConfirm={() => close(true)} onCancel={() => close(false)} />
  ) : null;

  return { confirm, notify, dialog };
}

function AppDialogView({
  pending,
  onConfirm,
  onCancel,
}: {
  pending: Pending;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const okRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    okRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-indigo-950/40 backdrop-blur-[2px] p-4" onMouseDown={onCancel}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="app-dialog-title"
        aria-describedby="app-dialog-message"
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-xl border border-indigo-100 bg-white p-5 shadow-2xl"
      >
        <h3 id="app-dialog-title" className="text-sm font-semibold text-[#111827]">{pending.title}</h3>
        <p id="app-dialog-message" className="mt-2 text-sm text-[#374151]">{pending.message}</p>
        <div className="mt-5 flex justify-end gap-2">
          {pending.kind === 'confirm' && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md border border-[#e5e7eb] px-3 py-1.5 text-sm hover:bg-[#f9fafb] transition"
            >
              Cancel
            </button>
          )}
          <button
            ref={okRef}
            type="button"
            onClick={onConfirm}
            className={`rounded-md px-3 py-1.5 text-sm font-medium text-white transition ${pending.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
          >
            {pending.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
