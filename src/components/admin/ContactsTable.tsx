// src/components/admin/ContactsTable.tsx
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAppDialog } from './useAppDialog';
import { Phone, Mail, MapPin, Search, ChevronUp, ChevronDown, X, Download, Tag, ExternalLink, Camera, ZoomIn, ZoomOut, Plus, FileText, Upload } from 'lucide-react';

// ── Avatar Crop Modal ─────────────────────────────────────────────────────────
function AvatarCropModal({ src, onConfirm, onCancel }: {
  src: string;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
}) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const imgRef     = useRef<HTMLImageElement | null>(null);
  const dragStart  = useRef({ mx: 0, my: 0, ox: 0, oy: 0 });
  const [zoom, setZoom]       = useState(1);
  const [offset, setOffset]   = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const SIZE = 280;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img    = imgRef.current;
    if (!canvas || !img) return;
    canvas.width = SIZE; canvas.height = SIZE;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, SIZE, SIZE);
    const drawW = img.naturalWidth  * zoom;
    const drawH = img.naturalHeight * zoom;
    const x = (SIZE - drawW) / 2 + offset.x;
    const y = (SIZE - drawH) / 2 + offset.y;
    ctx.save();
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, x, y, drawW, drawH);
    ctx.restore();
    // dim corners outside circle
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.rect(0, 0, SIZE, SIZE);
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.restore();
  }, [zoom, offset]);

  useEffect(() => {
    const img = new window.Image();
    img.onload = () => { imgRef.current = img; draw(); };
    img.src = src;
  }, [src]);

  useEffect(() => { draw(); }, [draw]);

  const onWheel      = (e: React.WheelEvent) => { e.preventDefault(); setZoom(z => Math.min(5, Math.max(0.1, z - e.deltaY * 0.001))); };
  const onMouseDown  = (e: React.MouseEvent) => { setDragging(true); dragStart.current = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y }; };
  const onMouseMove  = (e: React.MouseEvent) => { if (!dragging) return; setOffset({ x: dragStart.current.ox + (e.clientX - dragStart.current.mx), y: dragStart.current.oy + (e.clientY - dragStart.current.my) }); };
  const onMouseUp    = () => setDragging(false);

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const out = document.createElement('canvas');
    out.width = 240; out.height = 240;
    out.getContext('2d')!.drawImage(canvas, 0, 0, 240, 240);
    // PNG source → keep PNG to preserve transparency; everything else → JPEG 85%
    const isPng = src.startsWith('data:image/png');
    out.toBlob(blob => { if (blob) onConfirm(blob); }, isPng ? 'image/png' : 'image/jpeg', 0.85);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onCancel}>
      <div className="bg-white rounded-xl shadow-2xl p-5 flex flex-col gap-4 w-80" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-[#111827]">Crop Avatar</p>
          <button type="button" onClick={onCancel} className="text-[#6b7280] hover:text-[#374151] text-lg leading-none">&times;</button>
        </div>
        <div className="flex justify-center">
          <canvas ref={canvasRef} width={SIZE} height={SIZE}
            className="rounded-full border border-[#e5e7eb] cursor-grab active:cursor-grabbing bg-[#f3f4f6]"
            onWheel={onWheel} onMouseDown={onMouseDown} onMouseMove={onMouseMove}
            onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
          />
        </div>
        <div className="flex items-center gap-2">
          <ZoomOut className="w-3.5 h-3.5 text-[#6b7280] shrink-0" />
          <input type="range" min={0.1} max={5} step={0.01} value={zoom}
            aria-label="Zoom" title="Zoom"
            onChange={e => setZoom(Number(e.target.value))}
            className="flex-1 accent-[#374151] h-1.5"
          />
          <ZoomIn className="w-3.5 h-3.5 text-[#6b7280] shrink-0" />
        </div>
        <p className="text-[0.72rem] text-center text-[#6b7280] -mt-2">Drag to reposition · Scroll or slide to zoom</p>
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onCancel} className="flex-1 py-1.5 text-xs border border-[#e5e7eb] rounded-md hover:bg-[#f9fafb] transition">Cancel</button>
          <button type="button" onClick={handleConfirm} className="flex-1 py-1.5 text-xs rounded-md btn-primary transition">Apply</button>
        </div>
      </div>
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────
type ContactStatus = 'active' | 'inactive' | 'on-hold';
type SourceType    = 'client' | 'vendor' | 'tenant' | 'staff' | 'booking';

interface ContactRole {
  sourceType: SourceType;
  service?:   string | null;
  id:          string;
  accountNumber?: string;
}

interface Contact {
  id:            string;
  name:          string;
  email?:        string;
  phone?:        string;
  address?:      string;
  contactPerson?: string;
  roles:         ContactRole[];
  contactStatus: ContactStatus;
  notes?:        string;
  tags?:         string[];
  avatarUrl?:    string;
}

// ── Static config ─────────────────────────────────────────────────────────────
const SOURCE_COLORS: Record<SourceType, string> = {
  client:  'bg-blue-100 text-blue-700',
  vendor:  'bg-orange-100 text-orange-700',
  tenant:  'bg-purple-100 text-purple-700',
  staff:   'bg-amber-100 text-amber-700',
  booking: 'bg-teal-100 text-teal-700',
};

// ── Status configuration ──────────────────────────────────────────────────────
const STATUS_CONFIG: Record<ContactStatus, { label: string; dot: string; pill: string }> = {
  active:    { label: 'Active',   dot: 'bg-emerald-500', pill: 'bg-emerald-500 text-white border-emerald-500' },
  inactive:  { label: 'Inactive', dot: 'bg-red-400',     pill: 'bg-red-400 text-white border-red-400' },
  'on-hold': { label: 'On Hold',  dot: 'bg-amber-400',   pill: 'bg-amber-400 text-white border-amber-400' },
};

// ── Arrays of all possible sources, statuses, and preset tags ─────────────────────────────────────────────────────────────
const ALL_SOURCES:  SourceType[]    = ['client', 'vendor', 'tenant', 'staff', 'booking'];
const ALL_STATUSES: ContactStatus[] = ['active', 'inactive', 'on-hold'];
const PRESET_TAGS   = ['VIP', 'Do Not Contact', 'Referral', 'Past Client', 'Hot Lead', 'Partner'];
const ALPHA         = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// ── Source filter dropdown ────────────────────────────────────────────────────
function SourceDropdown({ value, onChange }: {
  value: SourceType | 'all';
  onChange: (v: SourceType | 'all') => void;
}) {
  const [open, setOpen] = useState(false);
  const label = value === 'all' ? 'All sources' : value.charAt(0).toUpperCase() + value.slice(1) + 's';
  const isFiltered = value !== 'all';
  return (
    <div className="relative shrink-0">
      <button type="button" onClick={() => setOpen(o => !o)}
        className={`h-8 inline-flex items-center gap-1.5 px-3 rounded-md text-xs font-medium transition ${
          isFiltered ? 'btn-primary' : 'btn-primary opacity-80'
        }`}
      >
        {label}
        <ChevronDown className="w-3 h-3 opacity-70" />
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-30 bg-white border border-[#e5e7eb] rounded-lg shadow-lg overflow-hidden w-36"
          onMouseLeave={() => setOpen(false)}
        >
          {(['all', ...ALL_SOURCES] as const).map(s => (
            <button key={s} type="button"
              onClick={() => { onChange(s); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs transition hover:bg-[#f9fafb] ${value === s ? 'font-semibold text-[#111827]' : 'text-[#6b7280]'}`}
            >
              {s === 'all' ? 'All sources' : s.charAt(0).toUpperCase() + s.slice(1) + 's'}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Fuzzy search ──────────────────────────────────────────────────────────────
function fuzzyScore(needle: string, haystack: string): number {
  if (!needle) return 1;
  const n = needle.toLowerCase();
  const h = haystack.toLowerCase();
  if (h.includes(n)) return 1;
  let ni = 0, score = 0, consecutive = 0;
  for (let hi = 0; hi < h.length && ni < n.length; hi++) {
    if (h[hi] === n[ni]) { score += 1 + consecutive * 0.5; consecutive++; ni++; }
    else { consecutive = 0; }
  }
  if (ni < n.length) return 0;
  return score / (n.length * 1.5);
}

// ── Contact fuzzy search scoring ─────────────────────────────────────────────
function contactScore(c: Contact, query: string): number {
  if (!query.trim()) return 1;
  const roleFields = c.roles.flatMap(r => [r.service, r.accountNumber, r.sourceType].filter(Boolean) as string[]);
  const fields = [c.name, c.email, c.phone, c.address, c.contactPerson, ...roleFields];
  return Math.max(...fields.map(f => f ? fuzzyScore(query, f) : 0));
}

const FUZZY_THRESHOLD = 0.25;

// ── Helpers ───────────────────────────────────────────────────────────────────
function Avatar({ name, url, size = 8 }: { name: string; url?: string; size?: number }) {
  const initials = name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const dim = `w-${size} h-${size}`;
  if (url) {
    return (
      <img src={url} alt={name}
        className={`${dim} rounded-full object-cover shrink-0 border border-[#e5e7eb]`}
      />
    );
  }
  return (
    <span className={`${dim} rounded-full bg-[#e5e7eb] text-[#374151] flex items-center justify-center text-xs font-semibold shrink-0 select-none`}>
      {initials}
    </span>
  );
}

// ── Role badges ──────────────────────────────────────────────────────────────
function RoleBadges({ roles }: { roles: ContactRole[] }) {
  const unique = Array.from(new Set(roles.map(r => r.sourceType)));
  return (
    <div className="flex flex-wrap gap-1">
      {unique.map(type => (
        <span key={type} className={`px-2 py-0.5 rounded-full text-[0.72rem] font-semibold uppercase tracking-wide ${SOURCE_COLORS[type]}`}>
          {type}
        </span>
      ))}
    </div>
  );
}

// ── VCard download ───────────────────────────────────────────────────────────
function downloadVCard(c: Contact) {
  const primaryRole = c.roles[0];
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${c.name}`,
    c.email   ? `EMAIL:${c.email}`  : '',
    c.phone   ? `TEL:${c.phone}`    : '',
    c.address ? `ADR:;;${c.address.replace(/\n/g, ' ')};;;;` : '',
    primaryRole?.service ? `ORG:${primaryRole.service}` : '',
    c.notes   ? `NOTE:${c.notes}`   : '',
    'END:VCARD',
  ].filter(Boolean).join('\r\n');
  const blob = new Blob([lines], { type: 'text/vcard' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `${c.name.replace(/\s+/g, '_')}.vcf`; a.click();
  URL.revokeObjectURL(url);
}

// ── Maps URL ────────────────────────────────────────────────────────────────
function mapsUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

// ── Status dropdown (inline table cell) ──────────────────────────────────────
function StatusCell({ contact, onSave }: {
  contact: Contact;
  onSave:  (id: string, status: ContactStatus, notes?: string, tags?: string[], avatarAssetId?: string) => Promise<void>;
}) {
  const [open, setOpen]     = useState(false);
  const [saving, setSaving] = useState(false);
  const cfg = STATUS_CONFIG[contact.contactStatus];

  const pick = async (s: ContactStatus) => {
    setSaving(true);
    await onSave(contact.id, s, contact.notes);
    setSaving(false); setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button" disabled={saving}
        onClick={() => setOpen(o => !o)}
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium transition ${cfg.pill} disabled:opacity-60`}
      >
        {cfg.label}
        <ChevronDown className="w-2.5 h-2.5 opacity-70" />
      </button>
      {open && (
        <div className="absolute left-0 top-7 z-30 bg-white border border-[#e5e7eb] rounded-lg shadow-lg overflow-hidden w-32">
          {ALL_STATUSES.map(s => (
            <button key={s} type="button" onClick={() => pick(s)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-[#f9fafb] transition ${contact.contactStatus === s ? 'font-semibold' : ''}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_CONFIG[s].dot}`} />
              {STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Contracts mini-list (inside drawer) ───────────────────────────────────────
type DrawerContract = {
  _id: string; title: string; contractType: string;
  status: string; endDate?: string; pdfUrl?: string; signedAt?: string;
};

const CONTRACT_STATUS_PILL: Record<string, string> = {
  draft:     'bg-gray-400 text-white',
  sent:      'bg-blue-500 text-white',
  signed:    'bg-emerald-500 text-white',
  expired:   'bg-amber-500 text-white',
  cancelled: 'bg-red-400 text-white',
};

function ContactContracts({ contactId, contactName, contactEmail }: {
  contactId: string; contactName: string; contactEmail?: string;
}) {
  const { confirm, notify, dialog } = useAppDialog();
  const [contracts, setContracts] = useState<DrawerContract[]>([]);
  const [loading, setLoading]     = useState(true);
  const [adding, setAdding]       = useState(false);
  const [newTitle, setNewTitle]   = useState('');
  const [newType, setNewType]     = useState<string>('rental');
  const [saving, setSaving]       = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/contracts?contactId=${encodeURIComponent(contactId)}`);
      const data = await res.json();
      setContracts(Array.isArray(data) ? data : []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [contactId]);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setSaving(true);
    try {
      await fetch('/api/admin/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId, contactName, contactEmail, title: newTitle, contractType: newType, status: 'draft' }),
      });
      setNewTitle(''); setAdding(false);
      await load();
    } finally { setSaving(false); }
  };

  const handlePdfUpload = async (id: string, file: File) => {
    setUploadingId(id);
    try {
      const res = await fetch(`/api/admin/contracts/${id}?filename=${encodeURIComponent(file.name)}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/pdf' }, body: file,
      });
      if (!res.ok) throw new Error('Upload failed');
      await load();
    } catch (e: any) { void notify(e.message); }
    finally { setUploadingId(null); }
  };

  return (
    <>
      {dialog}
    <div className="px-5 pt-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[0.72rem] font-semibold uppercase tracking-widest text-[#6b7280]">Contracts</p>
        <button type="button" onClick={() => setAdding(a => !a)}
          className="text-[0.72rem] text-[#6b7280] hover:text-[#374151] transition flex items-center gap-0.5">
          <Plus className="w-3 h-3" /> New
        </button>
      </div>

      {adding && (
        <div className="flex flex-col gap-1.5 mb-3 p-3 rounded-lg bg-[#f9fafb] border border-[#e5e7eb]">
          <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
            placeholder="Contract title…"
            className="h-7 border border-[#e5e7eb] rounded px-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#374151]" />
          <select value={newType} onChange={e => setNewType(e.target.value)} title="Contract type"
            className="h-7 border border-[#e5e7eb] rounded px-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#374151]">
            <option value="rental">Rental</option>
            <option value="vendor">Vendor</option>
            <option value="lease">Lease</option>
            <option value="custom">Custom</option>
          </select>
          <div className="flex gap-1.5">
            <button type="button" onClick={() => setAdding(false)}
              className="flex-1 py-1 text-xs border border-[#e5e7eb] rounded hover:bg-white transition">Cancel</button>
            <button type="button" onClick={handleCreate} disabled={saving || !newTitle.trim()}
              className="flex-1 py-1 text-xs rounded btn-primary disabled:opacity-50 transition">
              {saving ? 'Saving…' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-xs text-[#6b7280]">Loading…</p>
      ) : contracts.length === 0 ? (
        <p className="text-xs text-[#6b7280] italic">No contracts yet.</p>
      ) : (
        <div className="space-y-2">
          {contracts.map(c => (
            <div key={c._id} className="flex items-start gap-2 p-2.5 rounded-lg border border-[#e5e7eb] bg-[#f9fafb]">
              <FileText className="w-3.5 h-3.5 text-[#6b7280] shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[#374151] truncate">{c.title}</p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[0.72rem] font-semibold ${CONTRACT_STATUS_PILL[c.status] ?? 'bg-gray-200 text-gray-600'}`}>
                    {c.status}
                  </span>
                  <span className="text-[0.72rem] text-[#6b7280] capitalize">{c.contractType}</span>
                  {c.endDate && <span className="text-[0.72rem] text-[#6b7280]">Exp: {new Date(c.endDate).toLocaleDateString()}</span>}
                </div>
                <div className="mt-1">
                  {c.pdfUrl ? (
                    <a href={c.pdfUrl} target="_blank" rel="noreferrer"
                      className="text-[0.72rem] text-blue-600 hover:underline flex items-center gap-0.5">
                      <ExternalLink className="w-2.5 h-2.5" /> View PDF
                    </a>
                  ) : (
                    <label className={`text-[0.72rem] cursor-pointer flex items-center gap-0.5 ${uploadingId === c._id ? 'text-[#6b7280]' : 'text-[#6b7280] hover:text-[#374151]'}`}>
                      <Upload className="w-2.5 h-2.5" />
                      {uploadingId === c._id ? 'Uploading…' : 'Upload signed PDF'}
                      <input type="file" accept=".pdf" className="hidden" disabled={uploadingId === c._id}
                        onChange={e => { const f = e.target.files?.[0]; if (f) handlePdfUpload(c._id, f); }} />
                    </label>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </>
  );
}

// ── Right side - detail drawer ─────────────────────────────────────────────────────────────
function ContactDrawer({ contact, onClose, onSave }: {
  contact: Contact;
  onClose: () => void;
  onSave:  (id: string, status: ContactStatus, notes?: string, tags?: string[], avatarAssetId?: string, avatarUrl?: string) => Promise<void>;
}) {
  const [notes, setNotes]         = useState(contact.notes ?? '');
  const [status, setStatus]       = useState<ContactStatus>(contact.contactStatus);
  const [tags, setTags]           = useState<string[]>(contact.tags ?? []);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [visible, setVisible]     = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(contact.avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [cropSrc, setCropSrc]     = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<{ name: string } | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  const handleClose = () => { setVisible(false); setTimeout(onClose, 300); };

// Step 1 — file picked: read as data URL and open crop modal
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile({ name: file.name });
    const reader = new FileReader();
    reader.onload = ev => setCropSrc(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

// Step 2 — crop confirmed: upload the cropped blob
  const handleCropConfirm = async (blob: Blob) => {
    setCropSrc(null);
    setUploading(true);
    try {
      const isPng = blob.type === 'image/png';
      const filename = (pendingFile?.name ?? 'avatar').replace(/\.[^.]+$/, '') + (isPng ? '.png' : '.jpg');
      const res = await fetch(`/api/admin/contacts?filename=${encodeURIComponent(filename)}`, {
        method: 'POST',
        headers: { 'Content-Type': blob.type },
        body: blob,
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        console.error('Avatar upload failed:', data.error ?? res.status);
        return;
      }
      if (data.assetId) {

// show preview immediately from the local blob while CDN propagates
        const localPreview = URL.createObjectURL(blob);
        setAvatarUrl(localPreview);
        await onSave(contact.id, status, notes, tags, data.assetId, data.url);
        
// swap to CDN url once saved
        setAvatarUrl(data.url);
      }
    } finally {
      setUploading(false);
      setPendingFile(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(contact.id, status, notes, tags);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleTag = (t: string) =>
    setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  return (
    <>
    {cropSrc && (
      <AvatarCropModal
        src={cropSrc}
        onConfirm={handleCropConfirm}
        onCancel={() => { setCropSrc(null); setPendingFile(null); }}
      />
    )}
    <div
      className={`fixed inset-0 z-40 flex justify-end transition-colors duration-300 ${visible ? 'bg-black/40' : 'bg-black/0'}`}
      onClick={handleClose}
    >
      <div
        className={`relative h-full w-80 bg-white shadow-2xl border-l border-[#e5e7eb] flex flex-col overflow-y-auto transition-transform duration-300 ease-in-out ${visible ? 'translate-x-0' : 'translate-x-full'}`}
        onClick={e => e.stopPropagation()}
      >

{/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-[#e5e7eb]">
          <div className="flex items-center gap-3 min-w-0">
            
{/* Clickable avatar with camera overlay */}
            <button
              type="button"
              title="Change photo or logo"
              disabled={uploading}
              onClick={() => avatarInputRef.current?.click()}
              className="relative shrink-0 group"
            >
              <Avatar name={contact.name} url={avatarUrl} size={10} />
              <span className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploading
                  ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Camera className="w-3.5 h-3.5 text-white" />
                }
              </span>
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" title="Upload photo or logo" className="hidden" onChange={handleAvatarChange} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#111827] truncate">{contact.name}</p>
              {contact.roles[0]?.accountNumber && (
                <p className="text-[0.72rem] text-[#6b7280] font-mono">{contact.roles[0].accountNumber}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button type="button" title="Download contact card (.vcf)"
              onClick={() => downloadVCard(contact)}
              className="text-[#6b7280] hover:text-[#374151] transition p-1 rounded hover:bg-[#f3f4f6]"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button type="button" title="Close" onClick={handleClose}
              className="text-[#6b7280] hover:text-[#374151] transition p-1 rounded hover:bg-[#f3f4f6]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

{/* Roles — one row per unique source type, merging duplicate services */}
        <div className="px-5 pt-4 space-y-1.5">
          <p className="text-[0.72rem] font-semibold uppercase tracking-widest text-[#6b7280]">Roles</p>
          {Array.from(
            contact.roles.reduce((map, r) => {
              const existing = map.get(r.sourceType);
              if (existing) {
                if (r.service && !existing.services.includes(r.service)) existing.services.push(r.service);
              } else {
                map.set(r.sourceType, { sourceType: r.sourceType, services: r.service ? [r.service] : [], accountNumber: r.accountNumber });
              }
              return map;
            }, new Map<SourceType, { sourceType: SourceType; services: string[]; accountNumber?: string }>())
            .values()
          ).map(g => (
            <div key={g.sourceType} className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-[0.72rem] font-semibold uppercase tracking-wide shrink-0 ${SOURCE_COLORS[g.sourceType]}`}>
                {g.sourceType}
              </span>
              {g.services.length > 0 && (
                <span className="text-xs text-[#6b7280] truncate">{g.services.join(', ')}</span>
              )}
              {g.accountNumber && (
                <span className="text-[0.72rem] text-[#6b7280] font-mono ml-auto shrink-0">{g.accountNumber}</span>
              )}
            </div>
          ))}
        </div>

{/* Active labels (tags) shown under roles */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 px-5 pt-2">
            {tags.map(t => (
              <span key={t} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.72rem] font-medium bg-violet-100 text-violet-700">
                {t}
                <button type="button" onClick={() => toggleTag(t)} title={`Remove ${t}`} className="hover:text-violet-900 leading-none">×</button>
              </span>
            ))}
          </div>
        )}

{/* Contact info */}
        <div className="px-5 pt-4 space-y-2.5">
          <p className="text-[0.72rem] font-semibold uppercase tracking-widest text-[#6b7280]">Contact Info</p>

          {contact.phone ? (
            <a href={`tel:${contact.phone}`} className="flex items-center gap-2.5 text-sm text-[#374151] hover:text-[#111827] group">
              <Phone className="w-3.5 h-3.5 text-[#6b7280] shrink-0 group-hover:text-[#374151]" />
              {contact.phone}
            </a>
          ) : (
            <div className="flex items-center gap-2.5 text-sm text-[#d1d5db]">
              <Phone className="w-3.5 h-3.5 shrink-0" /> <span className="italic text-xs">No phone</span>
            </div>
          )}

          {contact.email ? (
            <a href={`mailto:${contact.email}`} className="flex items-center gap-2.5 text-sm text-[#374151] hover:text-[#111827] group break-all">
              <Mail className="w-3.5 h-3.5 text-[#6b7280] shrink-0 group-hover:text-[#374151]" />
              {contact.email}
            </a>
          ) : (
            <div className="flex items-center gap-2.5 text-sm text-[#d1d5db]">
              <Mail className="w-3.5 h-3.5 shrink-0" /> <span className="italic text-xs">No email</span>
            </div>
          )}

          {contact.address ? (
            <div className="flex items-start gap-2.5 text-sm text-[#374151]">
              <MapPin className="w-3.5 h-3.5 text-[#6b7280] mt-0.5 shrink-0" />
              <div className="min-w-0">
                <span className="whitespace-pre-line">{contact.address}</span>
                <a href={mapsUrl(contact.address)} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[0.72rem] text-blue-500 hover:text-blue-700 mt-0.5 transition"
                >
                  <ExternalLink className="w-2.5 h-2.5" /> Open in Google Maps
                </a>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 text-sm text-[#d1d5db]">
              <MapPin className="w-3.5 h-3.5 shrink-0" /> <span className="italic text-xs">No address</span>
            </div>
          )}

          {contact.contactPerson && (
            <p className="text-xs text-[#6b7280]">via <span className="font-medium text-[#374151]">{contact.contactPerson}</span></p>
          )}
        </div>

{/* Labels */}
        <div className="px-5 pt-5">
          <p className="text-[0.72rem] font-semibold uppercase tracking-widest text-[#6b7280] mb-2 flex items-center gap-1.5">
            <Tag className="w-3 h-3" /> Labels
          </p>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_TAGS.map(t => {
              const on = tags.includes(t);
              return (
                <button key={t} type="button" onClick={() => toggleTag(t)}
                  className={`px-2 py-0.5 rounded-full border text-xs font-medium transition ${
                    on ? 'bg-violet-600 border-violet-600 text-white' : 'border-[#e5e7eb] text-[#6b7280] hover:bg-[#f3f4f6]'
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

{/* Status */}
        <div className="px-5 pt-5">
          <p className="text-[0.72rem] font-semibold uppercase tracking-widest text-[#6b7280] mb-2">Status</p>
          <div className="flex gap-2 flex-wrap">
            {ALL_STATUSES.map(s => {
              const sc = STATUS_CONFIG[s];
              return (
                <button key={s} type="button" onClick={() => setStatus(s)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition ${
                    status === s ? sc.pill : 'text-[#6b7280] hover:bg-[#f9fafb]'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} /> {sc.label}
                </button>
              );
            })}
          </div>
          <p className="text-[0.72rem] text-[#6b7280] mt-1.5">
            {status === 'inactive' && 'No longer in use — archived but not deleted.'}
            {status === 'on-hold'  && 'May be contacted again later if needed.'}
            {status === 'active'   && 'Currently active and available to contact.'}
          </p>
        </div>

{/* Notes */}
        <div className="px-5 pt-5 flex-1">
          <p className="text-[0.72rem] font-semibold uppercase tracking-widest text-[#6b7280] mb-2">Notes</p>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
            placeholder="Add any notes about this contact…"
            className="w-full border border-[#e5e7eb] rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#374151] resize-none"
          />
        </div>

{/* Contracts */}
        <ContactContracts contactId={contact.id} contactName={contact.name} contactEmail={contact.email} />

{/* Footer */}
        <div className="px-5 py-4 border-t border-[#e5e7eb] mt-4 space-y-2">
          <button type="button" disabled={saving} onClick={handleSave}
            className="w-full py-2 text-xs rounded-md btn-primary disabled:opacity-50 transition"
          >
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
          </button>
{/* Links to each source page */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center">
            {contact.roles.map(r => (
              <a key={r.id}
                href={`/admin/${r.sourceType === 'booking' ? '' : r.sourceType + 's'}`}
                className="text-xs text-[#6b7280] hover:text-[#374151] transition"
              >
                View in {r.sourceType === 'booking' ? 'Bookings' : r.sourceType.charAt(0).toUpperCase() + r.sourceType.slice(1) + 's'} →
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

// ── Sort helper ───────────────────────────────────────────────────────────────

type SortKey = 'name' | 'contactStatus';

function sortedContacts(list: Contact[], key: SortKey, dir: 'asc' | 'desc') {
  return [...list].sort((a, b) => {
    const av = a[key] ?? '';
    const bv = b[key] ?? '';
    return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
  });
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ContactsTable() {
  const { confirm, notify, dialog } = useAppDialog();
  const [contacts, setContacts]       = useState<Contact[]>([]);
  const [loading, setLoading]         = useState(true);
  const [fetchError, setFetchError]   = useState<string | null>(null);
  const [search, setSearch]           = useState('');
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const [filterSource, setFilterSource] = useState<SourceType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<ContactStatus | 'all'>('all');
  const [sortKey, setSortKey]         = useState<SortKey>('name');
  const [sortDir, setSortDir]         = useState<'asc' | 'desc'>('asc');
  const [drawer, setDrawer]           = useState<Contact | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const openDrawer  = (c: Contact) => setDrawer(c);
  const closeDrawer = () => setDrawer(null);

  useEffect(() => {
    fetch('/api/admin/contacts')
      .then(r => { if (!r.ok) throw new Error(`API error ${r.status}`); return r.json(); })
      .then(data => {
        if (!Array.isArray(data)) throw new Error('Unexpected response: ' + JSON.stringify(data).slice(0, 100));
        setContacts(data); setLoading(false);
      })
      .catch(err => { setFetchError(err.message); setLoading(false); });
  }, []);

  const handleSave = async (id: string, status: ContactStatus, notes?: string, tags?: string[], avatarAssetId?: string, avatarUrl?: string) => {
    await fetch('/api/admin/contacts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ primaryId: id, contactStatus: status, notes, tags, avatarAssetId }),
    });
    setContacts(prev => prev.map(c => c.id === id ? { ...c, contactStatus: status, notes, tags, ...(avatarUrl ? { avatarUrl } : {}) } : c));
    if (drawer?.id === id) setDrawer(prev => prev ? { ...prev, contactStatus: status, notes, tags, ...(avatarUrl ? { avatarUrl } : {}) } : prev);
  };

// Toggle sort direction or change sort key
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };
  
// Compute the visible contacts based on filters, search, and sorting
  const visible = useMemo(() => {
    let list = contacts;
    if (filterSource !== 'all') list = list.filter(c => c.roles.some(r => r.sourceType === filterSource));
    if (filterStatus !== 'all') list = list.filter(c => c.contactStatus === filterStatus);
    if (activeLetter) list = list.filter(c => c.name?.toUpperCase().startsWith(activeLetter));
    if (search.trim()) {
      const scored = list
        .map(c => ({ c, score: contactScore(c, search) }))
        .filter(x => x.score >= FUZZY_THRESHOLD)
        .sort((a, b) => b.score - a.score);
      return scored.map(x => x.c);
    }
    return sortedContacts(list, sortKey, sortDir);
  }, [contacts, filterSource, filterStatus, activeLetter, search, sortKey, sortDir]);

// Sort icon component
  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k
      ? sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
      : <ChevronUp className="w-3 h-3 opacity-20" />;

// Compute the counts for each contact status
  const counts = useMemo(() => ({
    all:       contacts.length,
    active:    contacts.filter(c => c.contactStatus === 'active').length,
    inactive:  contacts.filter(c => c.contactStatus === 'inactive').length,
    'on-hold': contacts.filter(c => c.contactStatus === 'on-hold').length,
  }), [contacts]);

  if (loading)    return <div className="text-center py-16 text-sm text-[#6b7280]">Loading contacts…</div>;
  if (fetchError) return (
    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
      <strong>Could not load contacts:</strong> {fetchError}
    </div>
  );

  return (
    <>
      {dialog}
    <>
      {drawer && <ContactDrawer contact={drawer} onClose={closeDrawer} onSave={handleSave} />}

{/* ── Sticky header: filters + search + A–Z ── */}
      <div className="sticky top-0 z-10 pb-5 space-y-2 contacts-sticky-header">

{/* Status pills */}
        <div className="flex flex-wrap gap-3">
          {(['all', 'active', 'inactive', 'on-hold'] as const).map(s => (
            <button key={s} type="button" onClick={() => setFilterStatus(s)}
              className={`flex items-center gap-1.5 px-3 py-0 rounded-full border text-xs font-medium transition ${
                filterStatus === s
                  ? s === 'all' ? 'btn-primary border-transparent'
                    : STATUS_CONFIG[s as ContactStatus].pill + ' border'
                  : 'border-[#e5e7eb] text-[#6b7280] hover:bg-[#f9fafb]'
              }`}
            >
              {s !== 'all' && <span className={`w-1.5 h-2 rounded-full ${STATUS_CONFIG[s as ContactStatus].dot}`} />}
              {s === 'all' ? 'All' : STATUS_CONFIG[s as ContactStatus].label}
              <span className="ml-0.5 opacity-60">{counts[s]}</span>
            </button>
          ))}
        </div>

{/* Search + source filter */}
        <div className="flex items-stretch gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6b7280]" />
            <input ref={searchRef} type="text"
              placeholder="Search name, email, phone… (typos ok)"
              value={search}
              onChange={e => { setSearch(e.target.value); setActiveLetter(null); }}
              className="w-full h-8 pl-8 pr-8 border border-[#e5e7eb] rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-[#374151]"
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} title="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-[#374151]"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <SourceDropdown value={filterSource} onChange={setFilterSource} />
        </div>

{/* A–Z bar */}
        <div className="flex flex-wrap gap-0.5">
          <button type="button" onClick={() => setActiveLetter(null)}
            className={`px-2 py-0.5 rounded text-xs font-medium transition ${
              activeLetter === null ? 'btn-primary' : 'text-[#6b7280] hover:text-[#374151] hover:bg-[#f3f4f6]'
            }`}
          >All</button>
          {ALPHA.map(letter => {
            const has = contacts.some(c => c.name?.toUpperCase().startsWith(letter));
            return (
              <button key={letter} type="button" disabled={!has}
                onClick={() => { setActiveLetter(l => l === letter ? null : letter); setSearch(''); }}
                className={`w-6 py-0.5 rounded text-xs font-medium transition ${
                  activeLetter === letter ? 'btn-primary'
                    : has ? 'text-[#374151] hover:bg-[#f3f4f6]' : 'text-[#d1d5db] cursor-default'
                }`}
              >{letter}</button>
            );
          })}
        </div>
      </div>

{/* ── Scrollable table ── */}
      <div className="overflow-hidden rounded-xl border border-[#e5e7eb] dark:border-white/10 bg-white">
        <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-18rem)] bg-white">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#f9fafb] border-b border-[#e5e7eb] dark:border-white/10">
                <th className="text-left px-4 py-2.5">
                  <button type="button" onClick={() => toggleSort('name')} className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                    Name <SortIcon k="name" />
                  </button>
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-[#6b7280]">Roles</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-[#6b7280]">Contact</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-[#6b7280]">Service / Dept</th>
                <th className="text-left px-4 py-2.5">
                  <button type="button" onClick={() => toggleSort('contactStatus')} className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                    Status <SortIcon k="contactStatus" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f4f6] dark:divide-white/4">
              {visible.length === 0 && (
                <tr><td colSpan={5} className="text-center py-12 text-sm text-[#6b7280]">No contacts match your filters.</td></tr>
              )}
              {visible.map(c => {
                const dnc = c.tags?.includes('Do Not Contact');
                return (
                <tr key={c.id}
                  onClick={() => openDrawer(c)}
                  className={`cursor-pointer transition ${
                    dnc
                      ? 'bg-red-50/60 hover:bg-red-100/60 dark:bg-red-900/20 dark:hover:bg-red-900/30 opacity-60'
                      : 'bg-white hover:bg-[#fafafa] dark:hover:bg-white/5'
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={c.name || '?'} url={c.avatarUrl} />
                      <div className="min-w-0">
                        <p className={`text-xs font-medium truncate ${dnc ? 'text-red-600 dark:text-red-400 line-through' : 'text-[#111827]'}`}>{c.name || '—'}</p>
                        {dnc && <p className="text-[0.72rem] font-medium text-red-500 dark:text-red-400">⛔ Do Not Contact</p>}
                        {c.roles[0]?.accountNumber && (
                          <p className="text-[0.72rem] text-[#6b7280] font-mono">{c.roles[0].accountNumber}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <RoleBadges roles={c.roles} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-0.5">
                      {c.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-[#374151]">
                          <Phone className="w-3 h-3 text-[#6b7280] shrink-0" /><span>{c.phone}</span>
                        </div>
                      )}
                      {c.email && (
                        <div className="flex items-center gap-1.5 text-xs text-[#374151] min-w-0">
                          <Mail className="w-3 h-3 text-[#6b7280] shrink-0" />
                          <span className="truncate max-w-40">{c.email}</span>
                        </div>
                      )}
                      {c.address && (
                        <div className="flex items-center gap-1.5 text-xs text-[#6b7280]">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate max-w-40">{c.address}</span>
                        </div>
                      )}
                      {!c.phone && !c.email && <span className="text-xs text-[#d1d5db] italic">No contact info</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-0.5">
                      {c.roles.map(r => r.service ? (
                        <p key={r.id} className="text-xs text-[#6b7280] truncate">{r.service}</p>
                      ) : null)}
                      {c.contactPerson && (
                        <p className="text-[0.72rem] text-[#6b7280]">via {c.contactPerson}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <StatusCell contact={c} onSave={handleSave} />
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
        {visible.length > 0 && (
          <div className="px-4 py-2 border-t border-[#e5e7eb] dark:border-white/10 text-[0.72rem] text-[#6b7280]">
            {visible.length} of {contacts.length} contacts
          </div>
        )}
      </div>
    </>
    </>
  );
}
