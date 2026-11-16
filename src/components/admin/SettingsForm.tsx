// src/components/admin/SettingsForm.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { Image, CheckCircle, XCircle, Upload, ZoomIn, ZoomOut } from 'lucide-react';
import CustomSelect from './CustomSelect';

// ── Logo Crop Modal ──────────────────────────────────────────────────────────
type CropShape = 'circle' | 'square' | 'rectangle';

function LogoCropModal({
  src,
  onConfirm,
  onCancel,
}: {
  src: string;
  onConfirm: (croppedDataUrl: string, shape: CropShape) => void;
  onCancel: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [shape, setShape] = useState<CropShape>('square');
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ mx: 0, my: 0, ox: 0, oy: 0 });
  const imgRef = useRef<HTMLImageElement | null>(null);

// Canvas dimensions
  const CANVAS_W = 320;
  const CANVAS_H = shape === 'rectangle' ? 120 : 320;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    const scale = zoom;
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    const x = (CANVAS_W - drawW) / 2 + offset.x;
    const y = (CANVAS_H - drawH) / 2 + offset.y;

// Clip to shape
    ctx.save();
    ctx.beginPath();
    if (shape === 'circle') {
      ctx.arc(CANVAS_W / 2, CANVAS_H / 2, CANVAS_W / 2, 0, Math.PI * 2);
    } else {

// square or rectangle — fill the whole canvas
      ctx.rect(0, 0, CANVAS_W, CANVAS_H);
    }
    ctx.clip();
    ctx.drawImage(img, x, y, drawW, drawH);
    ctx.restore();

// Dim outside for circle
    if (shape === 'circle') {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath();
      ctx.rect(0, 0, CANVAS_W, CANVAS_H);
      ctx.arc(CANVAS_W / 2, CANVAS_H / 2, CANVAS_W / 2, 0, Math.PI * 2, true);
      ctx.fill();
      ctx.restore();
    }
  }, [zoom, offset, shape, CANVAS_W, CANVAS_H]);

// Load image and initialize canvas
  useEffect(() => {
    const img = new window.Image();
    img.onload = () => { imgRef.current = img; draw(); };
    img.src = src;
  }, [src]);

// Redraw canvas when zoom, offset, or shape changes
  useEffect(() => { draw(); }, [draw]);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.min(5, Math.max(0.2, z - e.deltaY * 0.001)));
  };

// Handle mouse wheel for zooming
  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    dragStart.current = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y };
  };

// Handle mouse drag for panning
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setOffset({
      x: dragStart.current.ox + (e.clientX - dragStart.current.mx),
      y: dragStart.current.oy + (e.clientY - dragStart.current.my),
    });
  };

// Handle mouse release to stop panning
  const onMouseUp = () => setDragging(false);

// Handle confirm button click
  const handleConfirm = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onConfirm(canvas.toDataURL('image/png'), shape);
  };

//
  const shapes: { value: CropShape; label: string }[] = [
    { value: 'square', label: 'Square' },
    { value: 'circle', label: 'Circle' },
    { value: 'rectangle', label: 'Rectangle' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onCancel}>
{/* Modal content */}
      <div className="bg-white rounded-xl shadow-2xl p-5 w-100 flex flex-col gap-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-[#111827]">Crop Logo</p>
          <button type="button" onClick={onCancel} className="text-[#6b7280] hover:text-[#374151] text-lg leading-none">&times;</button>
        </div>

{/* Shape picker */}
        <div className="flex gap-2">
          {shapes.map(s => (
            <button
              key={s.value}
              type="button"
              onClick={() => { setShape(s.value); setOffset({ x: 0, y: 0 }); setZoom(1); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium border rounded-md transition ${
                shape === s.value ? 'border-[#374151] bg-[#374151] text-white' : 'border-[#e5e7eb] text-[#6b7280] hover:bg-[#f9fafb]'
              }`}
            >
              <span className={`w-3.5 shrink-0 border border-current ${
                s.value === 'circle' ? 'h-3.5 rounded-full' : s.value === 'square' ? 'h-3.5 rounded-sm' : 'h-2 rounded-sm'
              }`} />
              {s.label}
            </button>
          ))}
        </div>

{/* Canvas preview */}
        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="rounded-lg border border-[#e5e7eb] cursor-grab active:cursor-grabbing bg-[#f3f4f6] max-w-full"
            onWheel={onWheel}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          />
        </div>

{/* Zoom slider */}
        <div className="flex items-center gap-2">
          <ZoomOut className="w-3.5 h-3.5 text-[#6b7280] shrink-0" />
          <input
            type="range" min={0.2} max={5} step={0.01}
            value={zoom}
            aria-label="Zoom"
            title="Zoom"
            onChange={e => setZoom(Number(e.target.value))}
            className="flex-1 accent-[#374151] h-1.5"
          />
          <ZoomIn className="w-3.5 h-3.5 text-[#6b7280] shrink-0" />
        </div>
        <p className="text-[0.72rem] text-center text-[#6b7280] -mt-2">Drag to reposition · Scroll or slide to zoom</p>

{/* Actions */}
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onCancel} className="flex-1 py-1.5 text-xs border border-[#e5e7eb] rounded-md hover:bg-[#f9fafb] transition">Cancel</button>
          <button type="button" onClick={handleConfirm} className="flex-1 py-1.5 text-xs rounded-md btn-primary transition">Apply Crop</button>
        </div>
      </div>
    </div>
  );
}

// ── Settings types ────────────────────────────────────────────────────────────
interface Settings {
  _id?: string;
  venueName: string;
  companyName: string;
  taxId: string;
  tagline: string;
  logo?: { asset?: { _id?: string; url?: string } } | null;
  logoShape?: CropShape;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  sidebarColor: string;
  sidebarTextColor: string;
  adminAvatar?: string;
  themePreference: 'light' | 'dark' | 'high-contrast';
  contactEmail: string;
  contactPhone: string;
  address: string;
  bookingFee: number;
  taxRate: number;
  depositPercentage: number;
  fontFamily: string;
}

// ── Form components ────────────────────────────────────────────────────────────
const Label = ({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) => (
  <label htmlFor={htmlFor} className="block text-xs font-medium text-[#374151] mb-1">{children}</label>
);

// Input component
const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className={`w-full border border-[#e5e7eb] rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#374151] ${props.className ?? ''}`} />
);

// Section title component
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs font-semibold uppercase tracking-widest text-[#6b7280] mb-2 mt-5 first:mt-0">{children}</p>
);

// Font options for the font selector dropdown
const FONT_OPTIONS = [
  { label: 'Inter',              value: 'Inter, system-ui, sans-serif',              fontFamily: 'Inter, system-ui, sans-serif',              description: 'Clean & modern (default)' },
  { label: 'DM Sans',            value: "'DM Sans', system-ui, sans-serif",           fontFamily: "'DM Sans', system-ui, sans-serif",           description: 'Geometric, friendly' },
  { label: 'Nunito',             value: "'Nunito', system-ui, sans-serif",            fontFamily: "'Nunito', system-ui, sans-serif",            description: 'Rounded & approachable' },
  { label: 'Poppins',            value: "'Poppins', system-ui, sans-serif",           fontFamily: "'Poppins', system-ui, sans-serif",           description: 'Bold & stylish' },
  { label: 'Lato',               value: "'Lato', system-ui, sans-serif",              fontFamily: "'Lato', system-ui, sans-serif",              description: 'Humanist, warm' },
  { label: 'Open Sans',          value: "'Open Sans', system-ui, sans-serif",         fontFamily: "'Open Sans', system-ui, sans-serif",         description: 'Neutral & legible' },
  { label: 'Roboto',             value: "'Roboto', system-ui, sans-serif",            fontFamily: "'Roboto', system-ui, sans-serif",            description: 'Google standard' },
  { label: 'Outfit',             value: "'Outfit', system-ui, sans-serif",            fontFamily: "'Outfit', system-ui, sans-serif",            description: 'Techy & clean' },
  { label: 'Plus Jakarta Sans',  value: "'Plus Jakarta Sans', system-ui, sans-serif", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", description: 'Contemporary' },
  { label: 'System UI',          value: 'system-ui, -apple-system, sans-serif',       fontFamily: 'system-ui, -apple-system, sans-serif',       description: "OS default font" },
];

// Theme options for the theme selector dropdown
const THEME_OPTIONS = [
  { label: 'Light', value: 'light', description: 'White background' },
  { label: 'Dark',  value: 'dark',  description: 'Dark background' },
];

// Additional settings options can be added here in a similar manner
export default function SettingsForm() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

// Fetch settings from the server on component mount
  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setSettings)
      .catch(() => setError('Could not load settings.'))
      .finally(() => setLoading(false));

// Load Google Fonts for the font picker
    const id = 'settings-gfonts';
    if (!document.getElementById(id)) {
      const families = FONT_OPTIONS.filter(f => !f.value.startsWith('system')).map(f => f.label.replace(/ /g, '+')).join('&family=');
      const link = document.createElement('link');
      link.id = id; link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${families}&display=swap`;
      document.head.appendChild(link);
    }
  }, []);

// Handle changes to form inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setSettings((prev) => prev ? { ...prev, [name]: type === 'checkbox' ? checked : value } : prev);
  };

// Open the crop modal for the selected file
  const openCropFor = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

// Handle logo file selection and open the crop modal
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) openCropFor(file);
  };

// Handle logo file drop and open the crop modal
  const handleLogoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) openCropFor(file);
  };

// Upload an image blob to the Sanity asset store and return its asset id and CDN url
  const uploadImage = async (blob: Blob, filename: string) => {
    const res = await fetch(`/api/admin/uploads?filename=${encodeURIComponent(filename)}`, {
      method: 'POST',
      headers: { 'Content-Type': blob.type || 'image/png' },
      body: blob,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data as { assetId: string; url: string };
  };

// Handle confirmation of the cropped logo: upload it, then keep the asset reference
  const handleCropConfirm = async (dataUrl: string, shape: CropShape) => {
    setCropSrc(null);
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const { assetId, url } = await uploadImage(blob, 'logo.png');
      setSettings(prev => ({ ...prev!, logo: { asset: { _id: assetId, url } }, logoShape: shape }));
    } catch (err: any) {
      setError(err.message || 'Logo upload failed');
    }
  };

// Handle avatar file selection: upload it and store the CDN url
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { url } = await uploadImage(file, file.name);
      setSettings((prev) => ({ ...prev!, adminAvatar: url }));
    } catch (err: any) {
      setError(err.message || 'Avatar upload failed');
    }
  };

// Handle form submission and save settings
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to save'); }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

// Render loading, error, or no settings states
  if (loading) return <div className="text-center py-10 text-sm text-[#6b7280]">Loading…</div>;
  if (error && !settings) return <div className="text-sm text-red-600">{error}</div>;
  if (!settings) return <div className="text-sm text-[#6b7280] py-10 text-center">No settings found.</div>;

// Define color settings options
  const colors = [
    { id: 'primaryColor',     label: 'Primary',          def: '#374151' },
    { id: 'backgroundColor',  label: 'Background',       def: '#F5F5F5' },
    { id: 'textColor',        label: 'Text',             def: '#111827' },
    { id: 'sidebarColor',     label: 'Sidebar BG',       def: '#222222' },
    { id: 'sidebarTextColor', label: 'Sidebar Text',     def: '#ffffff' },
  ];

// Define font settings options
  return (
    <>
    {cropSrc && (
      <LogoCropModal
        src={cropSrc}
        onConfirm={handleCropConfirm}
        onCancel={() => setCropSrc(null)}
      />
    )}
    <form onSubmit={handleSubmit} className="space-y-1">

      {success && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-2 rounded-md text-xs mb-3">
          <CheckCircle className="w-3.5 h-3.5 shrink-0" /> Settings saved successfully!
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-md text-xs mb-3">
          <XCircle className="w-3.5 h-3.5 shrink-0" /> {error}
        </div>
      )}

{/* ── Company ── */}
      <SectionTitle>Company</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label htmlFor="companyName">Company Legal Name</Label>
          <Input id="companyName" name="companyName" value={settings.companyName || ''} onChange={handleChange} placeholder="e.g. The Factory LLC" />
        </div>
        <div>
          <Label htmlFor="taxId">Tax ID</Label>
          <Input id="taxId" name="taxId" value={settings.taxId || ''} onChange={handleChange} placeholder="e.g. 12-3456789" />
        </div>
      </div>

{/* ── Branding ── */}
      <SectionTitle>Branding</SectionTitle>

      <div className="grid grid-cols-2 gap-3">
{/* Left: Venue Name + Tagline stacked */}
        <div className="flex flex-col gap-2">
          <div>
            <Label htmlFor="venueName">Venue Name</Label>
            <Input id="venueName" name="venueName" value={settings.venueName || ''} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="tagline">Tagline</Label>
            <Input id="tagline" name="tagline" value={settings.tagline || ''} onChange={handleChange} placeholder="e.g. Operations Platform" />
          </div>
        </div>

{/* Right: Logo drop zone */}
        <div>
          <Label>Logo</Label>
          <label
            className={`flex flex-col items-center justify-center gap-2 w-full h-full min-h-22 border border-dashed rounded-lg cursor-pointer transition text-xs text-[#6b7280] hover:bg-[#f9fafb] ${dragOver ? 'border-[#374151] bg-[#f9fafb]' : 'border-[#d1d5db]'}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleLogoDrop}
          >
            {settings.logo?.asset?.url ? (
              <img
                src={settings.logo.asset.url}
                alt="Logo preview"
                className="max-h-14 max-w-full object-contain rounded-md"
              />
            ) : (
              <>
                <Upload className="w-4 h-4 text-[#d1d5db]" />
                <span className="text-center leading-tight">Click or drag &amp;<br />drop logo here</span>
              </>
            )}
            <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
          </label>
          {settings.logo?.asset?.url && (
            <button
              type="button"
              onClick={() => setSettings(p => ({ ...p!, logo: null }))}
              className="mt-1 text-[0.72rem] text-red-600 hover:text-red-700"
            >
              Remove logo
            </button>
          )}
        </div>
      </div>

{/* Avatar */}
      <div className="mt-[-0.7rem]">
        <Label>Admin Avatar</Label>
        <div className="flex items-center gap-2">
          {settings.adminAvatar ? (
            <img src={settings.adminAvatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-[#e5e7eb]" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-semibold">A</div>
          )}
          <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 border border-[#e5e7eb] rounded-md hover:bg-[#f9fafb] text-xs transition">
            <Image className="w-3.5 h-3.5" /> Upload
            <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
          </label>
          {settings.adminAvatar && (
            <button type="button" onClick={() => setSettings((p) => ({ ...p!, adminAvatar: undefined }))} className="text-xs text-red-600 hover:text-red-700">Remove</button>
          )}
        </div>
      </div>

{/* ── Colors ── */}
      <SectionTitle>Colors</SectionTitle>
      <div className="grid grid-cols-5 gap-2">
        {colors.map(({ id, label, def }) => (
          <div key={id}>
            <Label htmlFor={id}>{label}</Label>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                id={id}
                name={id}
                value={settings[id as keyof Settings] as string || def}
                onChange={handleChange}
                className="w-8 h-8 border border-[#e5e7eb] rounded cursor-pointer p-0.5"
              />
              <Input
                name={id}
                aria-label={`${label} hex code`}
                value={settings[id as keyof Settings] as string || ''}
                onChange={handleChange}
                className="font-mono text-xs"
              />
            </div>
          </div>
        ))}
      </div>

{/* ── Theme & Font ── */}
      <SectionTitle>Theme &amp; Typography</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Default Theme</Label>
          <CustomSelect
            value={settings.themePreference || 'light'}
            onChange={v => setSettings((p: any) => ({ ...p, themePreference: v }))}
            options={THEME_OPTIONS}
          />
        </div>
        <div>
          <Label>Font Family</Label>
          <CustomSelect
            value={settings.fontFamily || 'Inter, system-ui, sans-serif'}
            onChange={v => setSettings((p: any) => ({ ...p, fontFamily: v }))}
            options={FONT_OPTIONS}
            previewFont
          />
        </div>
      </div>

{/* ── Fees & Taxes ── */}
      <SectionTitle>Fees &amp; Taxes</SectionTitle>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label htmlFor="bookingFee">Booking Fee ($)</Label>
          <Input type="number" id="bookingFee" name="bookingFee" value={settings.bookingFee || 0} onChange={handleChange} min="0" step="0.01" />
        </div>
        <div>
          <Label htmlFor="taxRate">Tax Rate (%)</Label>
          <Input type="number" id="taxRate" name="taxRate" value={settings.taxRate || 0} onChange={handleChange} min="0" step="0.01" />
        </div>
        <div>
          <Label htmlFor="depositPercentage">Deposit (%)</Label>
          <Input type="number" id="depositPercentage" name="depositPercentage" value={settings.depositPercentage || 25} onChange={handleChange} min="0" max="100" />
        </div>
      </div>

{/* ── Contact ── */}
      <SectionTitle>Contact</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="contactEmail">Email</Label>
          <Input type="email" id="contactEmail" name="contactEmail" value={settings.contactEmail || ''} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor="contactPhone">Phone</Label>
          <Input type="text" id="contactPhone" name="contactPhone" value={settings.contactPhone || ''} onChange={handleChange} />
        </div>
      </div>
      <div className="mt-3">
        <Label htmlFor="address">Address</Label>
        <textarea
          id="address"
          name="address"
          value={settings.address || ''}
          onChange={handleChange}
          rows={2}
          title="Address"
          placeholder="Street, City, State, ZIP"
          className="w-full border border-[#e5e7eb] rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#374151]"
        />
      </div>

{/* ── Save ── */}
      <div className="pt-4 border-t border-[#e5e7eb] flex justify-end mt-4">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 rounded-md btn-primary text-sm disabled:opacity-50 transition"
        >
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </form>
    </>
  );
}
