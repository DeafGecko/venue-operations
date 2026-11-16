import { useState, useEffect, useRef } from 'react';
import { useAppDialog } from './useAppDialog';
import { Plus, Edit, X, Check, Archive, PartyPopper, FileText, ShoppingCart, Package, CheckCircle, XCircle, LayoutGrid, RotateCcw } from 'lucide-react';

interface Floor {
  _id: string;
  code: string;
  name: string;
  type: 'party' | 'market' | 'lease';
  capacity: number;
  isAvailable: boolean;
  isArchived: boolean;
  archivedAt?: string;
  notes?: string;
  _createdAt: string;
}

export default function FloorManager() {
  const { confirm, notify, dialog } = useAppDialog();
  const [floors, setFloors]           = useState<Floor[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [isAdding, setIsAdding]       = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    code: '', name: '', type: 'party' as Floor['type'],
    capacity: 0, isAvailable: true, notes: '',
  });

  const fetchFloors = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/spaces${showArchived ? '?includeArchived=true' : ''}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data: Floor[] = await res.json();
      // when showArchived: show ONLY archived; otherwise show only active
      setFloors(showArchived ? data.filter(f => f.isArchived) : data.filter(f => !f.isArchived));
      setError(null);
    } catch {
      setError('Could not load floor plans.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFloors(); }, [showArchived]);

  // Escape closes the add/edit modal
  useEffect(() => {
    if (!isAdding && !editingId) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') resetForm(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isAdding, editingId]);

  const resetForm = () => {
    setFormData({ code: '', name: '', type: 'party', capacity: 0, isAvailable: true, notes: '' });
    setEditingId(null);
    setIsAdding(false);
  };

  const startEdit = (floor: Floor) => {
    setFormData({ code: floor.code, name: floor.name || '', type: floor.type, capacity: floor.capacity || 0, isAvailable: floor.isAvailable, notes: floor.notes || '' });
    setEditingId(floor._id);
    setIsAdding(false);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const handleSave = async () => {
    if (!formData.code.trim()) { void notify('Floor code is required.'); return; }
    try {
      const url = editingId ? `/api/admin/spaces/${editingId}` : '/api/admin/spaces';
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed to save'); }
      await fetchFloors();
      resetForm();
    } catch (err: any) { void notify(err.message); }
  };

  const handleArchive = async (id: string, code: string) => {
    if (!(await confirm(`Archive floor "${code}"? It can be restored later.`))) return;
    try {
      const res = await fetch(`/api/admin/spaces/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to archive');
      await fetchFloors();
    } catch (err: any) { void notify(err.message); }
  };

  const handleRestore = async (id: string) => {
    if (!(await confirm('Restore this archived floor?'))) return;
    try {
      const res = await fetch(`/api/admin/spaces/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore' }),
      });
      if (!res.ok) throw new Error('Failed to restore');
      await fetchFloors();
    } catch (err: any) { void notify(err.message); }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'party':  return <span className="flex items-center gap-1"><PartyPopper className="w-3 h-3" /> Party</span>;
      case 'market': return <span className="flex items-center gap-1"><ShoppingCart className="w-3 h-3" /> Market</span>;
      case 'lease':  return <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> Lease</span>;
      default: return type;
    }
  };

  if (loading) return <div className="text-center py-12 text-sm text-[#6b7280]">Loading floor plans…</div>;

  const formOpen = isAdding || !!editingId;

  return (
    <>
      {dialog}
    <div className="rounded-xl border border-[#e5e7eb] dark:border-white/6 overflow-hidden bg-white">

      {/* Toolbar */}
      <div className="px-4 py-3 border-b border-[#e5e7eb] dark:border-white/6 bg-[#f9fafb] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#6b7280]">
            {floors.length} floor{floors.length !== 1 ? 's' : ''}{showArchived ? ' archived' : ' active'}
          </span>
          <label className="flex items-center gap-1.5 text-xs text-[#6b7280] cursor-pointer select-none">
            <input type="checkbox" checked={showArchived} onChange={e => { setShowArchived(e.target.checked); resetForm(); }}
              className="accent-[var(--admin-primary)]" />
            Show Archived Only
          </label>
        </div>
        {!showArchived && (
          <button type="button" onClick={() => { resetForm(); setIsAdding(true); setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); }}
            className="h-8 flex items-center gap-1.5 px-4 rounded-md btn-primary text-xs transition">
            <Plus className="w-3.5 h-3.5" /> Add Floor
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-red-50 text-red-600 text-xs border-b border-red-200 flex items-center gap-2">
          <XCircle className="w-3.5 h-3.5 shrink-0" /> {error}
        </div>
      )}

      {/* Add / Edit form */}
      {formOpen && (
        <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/60 p-4" onMouseDown={resetForm}>
        <div ref={formRef} role="dialog" aria-modal="true" aria-labelledby="floor-form-title" onMouseDown={(e) => e.stopPropagation()}
          className="w-full max-w-2xl rounded-xl bg-white p-5 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <p id="floor-form-title" className="text-sm font-semibold text-[#111827]">{editingId ? 'Edit Floor' : 'Add New Floor'}</p>
            <button type="button" aria-label="Close" onClick={resetForm} className="p-1 rounded-md hover:bg-[#f3f4f6] transition">
              <X className="w-4 h-4 text-[#6b7280]" />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <input type="text" placeholder="Code (e.g. P089)" value={formData.code}
              onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="h-8 border border-[#e5e7eb] rounded-md px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#374151]" />
            <input type="text" placeholder="Name (e.g. Main Hall)" value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="h-8 border border-[#e5e7eb] rounded-md px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#374151]" />
            <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as Floor['type'] })}
              className="h-8 border border-[#e5e7eb] rounded-md px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#374151]">
              <option value="party">🎉 Party Room</option>
              <option value="market">🛒 Market Booth</option>
              <option value="lease">📝 Lease / Rental</option>
            </select>
            <input type="number" placeholder="Capacity" value={formData.capacity || ''}
              onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
              className="h-8 border border-[#e5e7eb] rounded-md px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#374151]" />
          </div>
          <div className="flex items-center gap-3 mt-2">
            <input type="text" placeholder="Notes (optional)" value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="flex-1 h-8 border border-[#e5e7eb] rounded-md px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#374151]" />
            <label className="flex items-center gap-1.5 text-xs text-[#6b7280] cursor-pointer shrink-0">
              <input type="checkbox" checked={formData.isAvailable} onChange={e => setFormData({ ...formData, isAvailable: e.target.checked })}
                className="accent-[var(--admin-primary)]" />
              Available
            </label>
            <button type="button" onClick={handleSave}
              className="h-8 flex items-center gap-1 px-4 rounded-md btn-primary text-xs transition shrink-0">
              <Check className="w-3.5 h-3.5" /> {editingId ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={resetForm}
              className="h-8 flex items-center gap-1 px-3 rounded-md border border-[#e5e7eb] text-xs hover:bg-[#f3f4f6] transition shrink-0">
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          </div>
        </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-16rem)] bg-white">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#f9fafb] border-b border-[#e5e7eb] dark:border-white/6 sticky top-0 z-10">
              <th className="text-left px-4 py-2.5 text-[0.72rem] font-semibold uppercase tracking-widest text-[#6b7280]">Code</th>
              <th className="text-left px-4 py-2.5 text-[0.72rem] font-semibold uppercase tracking-widest text-[#6b7280]">Name</th>
              <th className="text-left px-4 py-2.5 text-[0.72rem] font-semibold uppercase tracking-widest text-[#6b7280]">Type</th>
              <th className="text-left px-4 py-2.5 text-[0.72rem] font-semibold uppercase tracking-widest text-[#6b7280]">Capacity</th>
              <th className="text-left px-4 py-2.5 text-[0.72rem] font-semibold uppercase tracking-widest text-[#6b7280]">Status</th>
              {showArchived && <th className="text-left px-4 py-2.5 text-[0.72rem] font-semibold uppercase tracking-widest text-[#6b7280]">Archived</th>}
              <th className="text-left px-4 py-2.5 text-[0.72rem] font-semibold uppercase tracking-widest text-[#6b7280]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f3f4f6] dark:divide-white/4">
            {floors.length === 0 ? (
              <tr>
                <td colSpan={showArchived ? 7 : 6} className="py-14 text-center text-[#6b7280]">
                  <LayoutGrid className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">{showArchived ? 'No archived floors.' : 'No floor plans yet. Add your first floor above.'}</p>
                </td>
              </tr>
            ) : floors.map(floor => (
              <tr key={floor._id} className={`transition ${editingId === floor._id ? 'bg-blue-50/30 dark:bg-blue-900/20' : 'bg-white hover:bg-[#fafafa] dark:hover:bg-white/5'}`}>
                <td className="px-4 py-3 font-mono text-xs text-[#111827] font-medium">{floor.code}</td>
                <td className="px-4 py-3 text-sm text-[#374151]">{floor.name || '—'}</td>
                <td className="px-4 py-3 text-xs text-[#6b7280]">{getTypeLabel(floor.type)}</td>
                <td className="px-4 py-3 text-xs text-[#6b7280]">{floor.capacity || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.72rem] font-semibold ${
                    floor.isArchived ? 'bg-[#6b7280] text-white'
                    : floor.isAvailable ? 'bg-emerald-700 text-white'
                    : 'bg-red-600 text-white'
                  }`}>
                    {floor.isArchived
                      ? <><Package className="w-3 h-3" /> Archived</>
                      : floor.isAvailable
                        ? <><CheckCircle className="w-3 h-3" /> Available</>
                        : <><XCircle className="w-3 h-3" /> Unavailable</>}
                  </span>
                </td>
                {showArchived && (
                  <td className="px-4 py-3 text-xs text-[#6b7280]">
                    {floor.archivedAt ? new Date(floor.archivedAt).toLocaleDateString() : '—'}
                  </td>
                )}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {floor.isArchived ? (
                      <button type="button" title="Restore" onClick={() => handleRestore(floor._id)}
                        className="p-1.5 rounded-md text-emerald-700 hover:bg-emerald-50 transition">
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <>
                        <button type="button" title="Edit" onClick={() => startEdit(floor)}
                          className="p-1.5 rounded-md text-[#6b7280] hover:text-[#374151] hover:bg-[#f3f4f6] transition">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" title="Archive" onClick={() => handleArchive(floor._id, floor.code)}
                          className="p-1.5 rounded-md text-[#6b7280] hover:text-amber-700 hover:bg-amber-50 transition">
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-[#e5e7eb] dark:border-white/6 bg-[#f9fafb] flex items-center justify-between text-xs text-[#6b7280]">
        <span>{floors.length} floor{floors.length !== 1 ? 's' : ''} {showArchived ? 'archived' : 'total'}</span>
        {!showArchived && <span>{floors.filter(f => f.isAvailable).length} available</span>}
      </div>
    </div>
    </>
  );
}
