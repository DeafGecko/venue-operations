import { useState, useEffect, useMemo, useRef } from 'react';
import { useAppDialog } from './useAppDialog';
import { FileText, Plus, Upload, Edit, Trash2, X, Check, ExternalLink, AlertTriangle, Clock, CheckCircle, XCircle, FileSignature, Search, Paperclip, Image, ChevronDown, ChevronUp } from 'lucide-react';

type ContractType   = 'rental' | 'vendor' | 'lease' | 'custom';
type ContractStatus = 'draft' | 'sent' | 'signed' | 'expired' | 'cancelled';

interface Contract {
  _id:           string;
  _createdAt:    string;
  contactId:     string;
  contactName:   string;
  contactEmail?: string;
  contractType:  ContractType;
  title:         string;
  status:        ContractStatus;
  notes?:        string;
  startDate?:    string;
  endDate?:      string;
  sentAt?:       string;
  signedAt?:     string;
  pdfUrl?:       string;
  pdfName?:      string;
  attachments?:  { label: string; fileType: string; url: string; filename: string; uploadedAt: string }[];
}

const TYPE_CONFIG: Record<ContractType, { label: string; color: string }> = {
  rental:  { label: 'Rental',  color: 'bg-blue-100 text-blue-700' },
  vendor:  { label: 'Vendor',  color: 'bg-orange-100 text-orange-700' },
  lease:   { label: 'Lease',   color: 'bg-purple-100 text-purple-700' },
  custom:  { label: 'Custom',  color: 'bg-gray-100 text-[#374151]' },
};

const STATUS_CONFIG: Record<ContractStatus, { label: string; color: string; icon: React.ReactNode }> = {
  draft:     { label: 'Draft',     color: 'bg-gray-400 text-white',        icon: <FileText className="w-3 h-3" /> },
  sent:      { label: 'Sent',      color: 'bg-blue-500 text-white',        icon: <Clock className="w-3 h-3" /> },
  signed:    { label: 'Signed',    color: 'bg-emerald-500 text-white',     icon: <CheckCircle className="w-3 h-3" /> },
  expired:   { label: 'Expired',   color: 'bg-amber-500 text-white',       icon: <AlertTriangle className="w-3 h-3" /> },
  cancelled: { label: 'Cancelled', color: 'bg-red-400 text-white',         icon: <XCircle className="w-3 h-3" /> },
};

const ALL_STATUSES: ContractStatus[] = ['draft', 'sent', 'signed', 'expired', 'cancelled'];
const ALL_TYPES:    ContractType[]   = ['rental', 'vendor', 'lease', 'custom'];

function StatusPill({ status }: { status: ContractStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.72rem] font-semibold ${cfg.color}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

// ── Attachments panel ────────────────────────────────────────────────────────
function AttachmentsPanel({ contractId, attachments, onRefresh }: {
  contractId:  string;
  attachments: Contract['attachments'];
  onRefresh:   () => void;
}) {
  const { confirm, notify, dialog } = useAppDialog();
  const [uploading, setUploading] = useState(false);
  const [label, setLabel]         = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const res = await fetch(
        `/api/admin/contracts/${contractId}?mode=attachment&filename=${encodeURIComponent(file.name)}&label=${encodeURIComponent(label || file.name)}`,
        { method: 'PATCH', headers: { 'Content-Type': file.type || 'application/octet-stream' }, body: file }
      );
      if (!res.ok) throw new Error('Upload failed');
      setLabel('');
      onRefresh();
    } catch (e: any) { void notify(e.message); }
    finally { setUploading(false); }
  };

  const handleRemove = async (index: number) => {
    if (!(await confirm('Remove this attachment?', { danger: true, confirmLabel: 'Remove' }))) return;
    await fetch(`/api/admin/contracts/${contractId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ removeAttachmentIndex: index }),
    });
    onRefresh();
  };

  const list = attachments ?? [];

  return (
    <>
      {dialog}
    <div className="px-4 pb-4 pt-1">
      <div className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-3 space-y-2">
        <p className="text-[0.72rem] font-semibold uppercase tracking-widest text-[#6b7280] flex items-center gap-1">
          <Paperclip className="w-3 h-3" /> Attachments
        </p>

        {/* File list */}
        {list.length === 0 ? (
          <p className="text-xs text-[#6b7280] italic">No attachments yet.</p>
        ) : (
          <div className="space-y-1.5">
            {list.map((a, i) => (
              <div key={i} className="flex items-center gap-2 bg-white rounded-md border border-[#e5e7eb] px-2.5 py-1.5">
                {a.fileType === 'image'
                  ? <Image className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  : <FileText className="w-3.5 h-3.5 text-red-400 shrink-0" />
                }
                <span className="text-xs text-[#374151] flex-1 truncate">{a.label || a.filename}</span>
                <a href={a.url} target="_blank" rel="noreferrer"
                  className="text-[0.72rem] text-blue-600 hover:underline shrink-0 flex items-center gap-0.5">
                  <ExternalLink className="w-2.5 h-2.5" /> Open
                </a>
                <button type="button" title="Remove attachment" onClick={() => handleRemove(i)}
                  className="text-[#d1d5db] hover:text-red-400 transition shrink-0">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload row */}
        <div className="flex items-center gap-2 pt-1">
          <input value={label} onChange={e => setLabel(e.target.value)}
            placeholder="Label (optional)"
            className="flex-1 h-7 border border-[#e5e7eb] rounded px-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#374151] bg-white" />
          <label className={`h-7 flex items-center gap-1 px-3 rounded-md text-xs font-medium cursor-pointer transition ${
            uploading ? 'bg-[#e5e7eb] text-[#6b7280]' : 'btn-primary'
          }`}>
            <Upload className="w-3 h-3" />
            {uploading ? 'Uploading…' : 'Add File'}
            <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.gif,.webp" className="hidden"
              disabled={uploading}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ''; }} />
          </label>
        </div>
        <p className="text-[0.72rem] text-[#6b7280]">Accepts PDF, JPG, PNG, GIF, WEBP</p>
      </div>
    </div>
    </>
  );
}

function isExpiringSoon(endDate?: string): boolean {
  if (!endDate) return false;
  const days = (new Date(endDate).getTime() - Date.now()) / 86400000;
  return days >= 0 && days <= 30;
}

function isExpired(endDate?: string, status?: ContractStatus): boolean {
  if (!endDate || status === 'cancelled') return false;
  return new Date(endDate) < new Date() && status !== 'signed';
}

// ── Add / Edit form modal ─────────────────────────────────────────────────────
function ContractFormModal({ initial, onSave, onClose }: {
  initial?: Partial<Contract>;
  onSave:   (data: Partial<Contract>, files: File[]) => Promise<void>;
  onClose:  () => void;
}) {
  const { confirm, notify, dialog } = useAppDialog();
  const [form, setForm] = useState<Partial<Contract>>({
    title: '', contractType: 'rental', status: 'draft',
    notes: '', startDate: '', endDate: '',
    contactName: '', contactEmail: '',
    contactId: initial?.contactId ?? `manual-${Date.now()}`,
    ...initial,
  });
  const [saving, setSaving]     = useState(false);
  // Contacts come from the same Clients list used elsewhere in the app, so names and emails match.
  const [clients, setClients]   = useState<{ _id: string; name: string; email?: string }[]>([]);
  useEffect(() => {
    fetch('/api/admin/clients')
      .then(r => (r.ok ? r.json() : []))
      .then((list: any[]) => setClients(list.map(c => ({ _id: c._id, name: c.name, email: c.email }))))
      .catch(() => setClients([]));
  }, []);
  const pickClient = (id: string) => {
    const c = clients.find(x => x._id === id);
    setForm(f => ({ ...f, contactId: id, contactName: c?.name ?? '', contactEmail: c?.email ?? '' }));
  };
  const [files, setFiles]       = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);

  const set = (k: keyof Contract, v: any) => setForm(f => ({ ...f, [k]: v }));

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const allowed = Array.from(incoming).filter(f =>
      f.type === 'application/pdf' || f.type.startsWith('image/')
    );
    setFiles(prev => {
      const names = new Set(prev.map(f => f.name));
      return [...prev, ...allowed.filter(f => !names.has(f.name))];
    });
  };

  const handleSave = async () => {
    if (!form.title?.trim()) { void notify('Title is required.'); return; }
    if (!form.contactName?.trim()) { void notify('Contact name is required.'); return; }
    setSaving(true);
    try { await onSave(form, files); onClose(); }
    catch (e: any) { void notify(e.message); }
    finally { setSaving(false); }
  };

  return (
    <>
      {dialog}
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden max-h-[90vh]"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#e5e7eb] shrink-0">
          <p className="text-sm font-semibold text-[#111827]">{initial?._id ? 'Edit Contract' : 'New Contract'}</p>
          <button type="button" onClick={onClose} className="text-[#6b7280] hover:text-[#374151] text-lg">&times;</button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-[#6b7280] mb-1">Contract Title *</label>
              <input value={form.title ?? ''} onChange={e => set('title', e.target.value)}
                placeholder="e.g. Vendor Agreement 2026"
                className="w-full h-9 border border-[#e5e7eb] rounded-md px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#374151]" />
            </div>

            <div>
              <label htmlFor="contract-client" className="block text-xs font-semibold uppercase tracking-wide text-[#6b7280] mb-1">Client *</label>
              <select id="contract-client" value={form.contactId ?? ''} onChange={e => pickClient(e.target.value)}
                className="w-full h-9 border border-[#e5e7eb] rounded-md px-3 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#374151]">
                <option value="">Choose a client</option>
                {clients.map(c => (
                  <option key={c._id} value={c._id}>{c.name}{c.email ? ` · ${c.email}` : ''}</option>
                ))}
              </select>
              {form.contactEmail && (
                <p className="mt-1 text-xs text-[#6b7280]">{form.contactName} · {form.contactEmail}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-[#6b7280] mb-1">Type</label>
              <select value={form.contractType} onChange={e => set('contractType', e.target.value as ContractType)} title="Contract type"
                className="w-full h-9 border border-[#e5e7eb] rounded-md px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#374151]">
                {ALL_TYPES.map(t => <option key={t} value={t}>{TYPE_CONFIG[t].label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-[#6b7280] mb-1">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value as ContractStatus)} title="Contract status"
                className="w-full h-9 border border-[#e5e7eb] rounded-md px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#374151]">
                {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-[#6b7280] mb-1">Start Date</label>
              <input type="date" title="Start date" value={form.startDate ?? ''} onChange={e => set('startDate', e.target.value)}
                className="w-full h-9 border border-[#e5e7eb] rounded-md px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#374151]" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-[#6b7280] mb-1">End / Expiry Date</label>
              <input type="date" title="End / expiry date" value={form.endDate ?? ''} onChange={e => set('endDate', e.target.value)}
                className="w-full h-9 border border-[#e5e7eb] rounded-md px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#374151]" />
            </div>

          </div>

          {/* Drag-and-drop zone */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[#6b7280] mb-1.5">
              Attachments <span className="normal-case font-normal text-[#6b7280]">(optional — PDF, JPG, PNG)</span>
            </label>
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
              className={`border border-dashed rounded-lg px-4 py-6 text-center transition-colors ${
                dragging ? 'border-(--admin-primary) bg-blue-50/40' : 'border-[#e5e7eb] hover:border-[#d1d5db]'
              }`}
            >
              <Upload className="w-6 h-6 mx-auto mb-2 text-[#d1d5db]" />
              <p className="text-xs text-[#6b7280]">
                Drag & drop files here, or{' '}
                <label className="text-(--admin-primary) cursor-pointer underline underline-offset-2">
                  browse
                  <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.gif,.webp" className="hidden"
                    onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
                </label>
              </p>
              <p className="text-[0.72rem] text-[#6b7280] mt-1">PDF · JPG · PNG · GIF · WEBP</p>
            </div>

            {files.length > 0 && (
              <ul className="mt-2 space-y-1">
                {files.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-[#374151] bg-[#f9fafb] border border-[#e5e7eb] rounded-md px-3 py-1.5">
                    {f.type.startsWith('image/')
                      ? <Image className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      : <FileText className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                    <span className="flex-1 truncate">{f.name}</span>
                    <span className="text-[#6b7280] shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
                    <button type="button" title="Remove" onClick={() => setFiles(p => p.filter((_, j) => j !== i))}
                      className="text-[#d1d5db] hover:text-red-400 transition shrink-0">
                      <X className="w-3 h-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Notes — below the drop zone */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[#6b7280] mb-1">Notes</label>
            <textarea value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} rows={2} title="Notes"
              className="w-full border border-[#e5e7eb] rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[#374151]" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-6 py-4 border-t border-[#e5e7eb] shrink-0">
          <button type="button" onClick={onClose}
            className="flex-1 py-2 text-xs border border-[#e5e7eb] rounded-md hover:bg-[#f9fafb] transition">Cancel</button>
          <button type="button" onClick={handleSave} disabled={saving}
            className="flex-1 py-2 text-xs rounded-md btn-primary transition disabled:opacity-50">
            {saving ? 'Saving…' : <><Check className="w-3.5 h-3.5 inline mr-1" />{initial?._id ? 'Update' : 'Create'}</>}
          </button>
        </div>
      </div>
    </div>
    </>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function ContractsTable() {
  const { confirm, notify, dialog } = useAppDialog();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState<ContractStatus | 'all'>('all');
  const [filterType, setFilterType]     = useState<ContractType | 'all'>('all');
  const [showModal, setShowModal]       = useState(false);
  const [editing, setEditing]           = useState<Contract | null>(null);
  const [uploadingId, setUploadingId]   = useState<string | null>(null);
  const [expandedId, setExpandedId]     = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/contracts');
      const data = await res.json();
      setContracts(Array.isArray(data) ? data : []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const visible = useMemo(() => {
    const q = search.toLowerCase();
    return contracts.filter(c => {
      if (filterStatus !== 'all' && c.status !== filterStatus) return false;
      if (filterType   !== 'all' && c.contractType !== filterType) return false;
      if (q && !c.title.toLowerCase().includes(q) && !c.contactName?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [contracts, search, filterStatus, filterType]);

  const handleCreate = async (form: Partial<Contract>, files: File[]) => {
    const res = await fetch('/api/admin/contracts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (!res.ok) throw new Error('Failed to create contract');
    const { _id } = await res.json();
    // upload any attached files
    for (const file of files) {
      await fetch(`/api/admin/contracts/${_id}?mode=attachment&filename=${encodeURIComponent(file.name)}&label=${encodeURIComponent(file.name)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      });
    }
    await load();
  };

  const handleUpdate = async (form: Partial<Contract>, files: File[]) => {
    const res = await fetch(`/api/admin/contracts/${form._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (!res.ok) throw new Error('Failed to update contract');
    for (const file of files) {
      await fetch(`/api/admin/contracts/${form._id}?mode=attachment&filename=${encodeURIComponent(file.name)}&label=${encodeURIComponent(file.name)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      });
    }
    await load();
  };

  const handleDelete = async (id: string, title: string) => {
    if (!(await confirm(`Delete contract "${title}"? This cannot be undone.`, { danger: true, confirmLabel: 'Delete' }))) return;
    await fetch(`/api/admin/contracts/${id}`, { method: 'DELETE' });
    await load();
  };

  const handlePdfUpload = async (id: string, file: File) => {
    setUploadingId(id);
    try {
      const res = await fetch(
        `/api/admin/contracts/${id}?mode=signed-pdf&filename=${encodeURIComponent(file.name)}`,
        { method: 'PATCH', headers: { 'Content-Type': file.type || 'application/pdf' }, body: file }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(body.error ?? 'Upload failed');
      }
      await load();
    } catch (e: any) { void notify(e.message); }
    finally { setUploadingId(null); }
  };

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: contracts.length };
    for (const s of ALL_STATUSES) counts[s] = contracts.filter(c => c.status === s).length;
    return counts;
  }, [contracts]);

  const expiringSoon = contracts.filter(c => isExpiringSoon(c.endDate) && c.status === 'signed').length;

  if (loading) return <div className="text-center py-16 text-sm text-[#6b7280]">Loading contracts…</div>;

  return (
    <>
      {dialog}
    <div className="space-y-4">

      {/* Expiry warning banner */}
      {expiringSoon > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span><strong>{expiringSoon}</strong> contract{expiringSoon > 1 ? 's' : ''} expiring within 30 days — review and renew as needed.</span>
        </div>
      )}

      {/* Status filter pills */}
      <div className="flex flex-wrap items-center gap-2">
        {(['all', ...ALL_STATUSES] as const).map(s => (
          <button key={s} type="button" onClick={() => setFilterStatus(s)}
            className={`h-7 px-3 rounded-full text-xs font-semibold transition ${
              filterStatus === s ? 'btn-primary' : 'bg-white border border-[#e5e7eb] text-[#6b7280] hover:bg-[#f9fafb]'
            }`}>
            {s === 'all' ? 'All' : STATUS_CONFIG[s].label} <span className="ml-1 opacity-70">{statusCounts[s] ?? 0}</span>
          </button>
        ))}
      </div>

      {/* Search + type filter + add */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6b7280]" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search title or contact…"
            className="w-full h-9 pl-8 pr-3 border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#374151] bg-white" />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value as any)} title="Filter by type"
          className="h-9 border border-[#e5e7eb] rounded-md px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#374151] bg-white text-[#374151]">
          <option value="all">All Types</option>
          {ALL_TYPES.map(t => <option key={t} value={t}>{TYPE_CONFIG[t].label}</option>)}
        </select>
        <button type="button" onClick={() => { setEditing(null); setShowModal(true); }}
          className="h-9 flex items-center gap-1.5 px-4 rounded-md btn-primary text-xs transition">
          <Plus className="w-3.5 h-3.5" /> New Contract
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#e5e7eb] overflow-hidden bg-white">
        <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-20rem)]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#f9fafb] border-b border-[#e5e7eb]">
                <th className="text-left px-4 py-2.5 text-[0.72rem] font-semibold uppercase tracking-widest text-[#6b7280]">Title</th>
                <th className="text-left px-4 py-2.5 text-[0.72rem] font-semibold uppercase tracking-widest text-[#6b7280]">Contact</th>
                <th className="text-left px-4 py-2.5 text-[0.72rem] font-semibold uppercase tracking-widest text-[#6b7280]">Type</th>
                <th className="text-left px-4 py-2.5 text-[0.72rem] font-semibold uppercase tracking-widest text-[#6b7280]">Status</th>
                <th className="text-left px-4 py-2.5 text-[0.72rem] font-semibold uppercase tracking-widest text-[#6b7280]">Dates</th>
                <th className="text-left px-4 py-2.5 text-[0.72rem] font-semibold uppercase tracking-widest text-[#6b7280]">PDF</th>
                <th className="text-left px-4 py-2.5 text-[0.72rem] font-semibold uppercase tracking-widest text-[#6b7280]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f4f6] dark:divide-white/4">
              {visible.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center">
                  <FileSignature className="w-8 h-8 mx-auto mb-2 text-[#d1d5db]" />
                  <p className="text-xs text-[#6b7280]">No contracts found.</p>
                </td></tr>
              ) : visible.map(c => {
                const expiring = isExpiringSoon(c.endDate) && c.status === 'signed';
                const expired  = isExpired(c.endDate, c.status);
                return (
                  <>
                  <tr key={c._id} className={`bg-white hover:bg-[#fafafa] transition ${expiring ? 'bg-amber-50/40' : ''} ${expired ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-[#111827]">{c.title}</p>
                      {c.notes && <p className="text-xs text-[#6b7280] mt-0.5 truncate max-w-[180px]">{c.notes}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-[#374151]">{c.contactName || '—'}</p>
                      {c.contactEmail && <p className="text-xs text-[#6b7280]">{c.contactEmail}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[0.72rem] font-semibold ${TYPE_CONFIG[c.contractType]?.color}`}>
                        {TYPE_CONFIG[c.contractType]?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={c.status} />
                      {expiring && <p className="text-[0.72rem] text-amber-600 mt-0.5 font-medium">Expiring soon</p>}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#6b7280] space-y-0.5">
                      {c.startDate && <p>Start: {new Date(c.startDate).toLocaleDateString()}</p>}
                      {c.endDate   && <p className={expired ? 'text-red-500 font-medium' : ''}>End: {new Date(c.endDate).toLocaleDateString()}</p>}
                      {c.signedAt  && <p className="text-emerald-600">Signed: {new Date(c.signedAt).toLocaleDateString()}</p>}
                    </td>
                    <td className="px-4 py-3">
                      {c.pdfUrl ? (
                        <a href={c.pdfUrl} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                          <ExternalLink className="w-3 h-3" /> View PDF
                        </a>
                      ) : (
                        <label className={`inline-flex items-center gap-1 text-xs cursor-pointer transition ${
                          uploadingId === c._id ? 'text-[#6b7280]' : 'text-[#6b7280] hover:text-[#374151]'
                        }`}>
                          <Upload className="w-3 h-3" />
                          {uploadingId === c._id ? 'Uploading…' : 'Upload PDF'}
                          <input type="file" accept=".pdf" className="hidden" disabled={uploadingId === c._id}
                            onChange={e => { const f = e.target.files?.[0]; if (f) handlePdfUpload(c._id, f); }} />
                        </label>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button type="button" title="Attachments"
                          onClick={() => setExpandedId(expandedId === c._id ? null : c._id)}
                          className={`p-1.5 rounded-md transition relative ${expandedId === c._id ? 'text-[#374151] bg-[#f3f4f6]' : 'text-[#6b7280] hover:text-[#374151] hover:bg-[#f3f4f6]'}`}>
                          <Paperclip className="w-3.5 h-3.5" />
                          {(c.attachments?.length ?? 0) > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-(--admin-primary) text-white text-[0.72rem] font-bold flex items-center justify-center">
                              {c.attachments!.length}
                            </span>
                          )}
                        </button>
                        <button type="button" title="Edit" onClick={() => { setEditing(c); setShowModal(true); }}
                          className="p-1.5 rounded-md text-[#6b7280] hover:text-[#374151] hover:bg-[#f3f4f6] transition">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" title="Delete" onClick={() => handleDelete(c._id, c.title)}
                          className="p-1.5 rounded-md text-[#6b7280] hover:text-red-500 hover:bg-red-50 transition">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedId === c._id && (
                    <tr key={`${c._id}-attachments`} className="bg-[#fafafa]">
                      <td colSpan={7} className="p-0">
                        <AttachmentsPanel
                          contractId={c._id}
                          attachments={c.attachments}
                          onRefresh={load}
                        />
                      </td>
                    </tr>
                  )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2.5 border-t border-[#e5e7eb] bg-[#f9fafb] text-xs text-[#6b7280] flex items-center justify-between">
          <span>{visible.length} of {contracts.length} contract{contracts.length !== 1 ? 's' : ''}</span>
          <span>{contracts.filter(c => c.status === 'signed').length} signed · {contracts.filter(c => c.status === 'draft').length} draft</span>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <ContractFormModal
          initial={editing ?? undefined}
          onSave={editing ? handleUpdate : handleCreate}
          onClose={() => { setShowModal(false); setEditing(null); }}
        />
      )}
    </div>
    </>
  );
}
