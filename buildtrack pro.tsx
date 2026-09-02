import { useState, useEffect, useRef } from "react";

// ─── Storage helpers (artifact persistent storage, not localStorage) ───────────
const STORAGE_KEY = "contractor_app_data";
const loadRemote = async () => {
  try {
    const result = await window.storage.get(STORAGE_KEY);
    return result && result.value ? JSON.parse(result.value) : null;
  } catch {
    return null;
  }
};
const saveRemote = async (data) => {
  try {
    await window.storage.set(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Storage error:", e);
  }
};

// ─── Initial seed data ──────────────────────────────────────────────────────────
const seed = {
  projects: [
    {
      id: "p1",
      name: "123 Maple St Flip",
      address: "123 Maple Street, Austin TX 78701",
      client: "Self (Flip)",
      startDate: "2026-01-15",
      endDate: "2026-04-30",
      contractValue: 85000,
      paymentTerms: "Net 30",
      selfPerformed: true,
      status: "active",
      notes: "Full cosmetic remodel + kitchen upgrade",
      documents: [],
      scope: [
        { id: "s1", section: "Demolition", description: "Remove old flooring, cabinets, drywall patches", estimatedCost: 4000, assignment: "Self", status: "completed", notes: "" },
        { id: "s2", section: "Electrical", description: "Panel upgrade, new outlets, recessed lighting", estimatedCost: 8500, assignment: "Sub", status: "in-progress", notes: "Lic. electrician: Mike Torres" },
        { id: "s3", section: "Plumbing", description: "Reroute kitchen drain, new fixtures", estimatedCost: 5200, assignment: "Sub", status: "not-started", notes: "" },
        { id: "s4", section: "Flooring", description: "LVP throughout main floor, tile in baths", estimatedCost: 12000, assignment: "Self", status: "not-started", notes: "" },
      ],
      punchLists: [
        {
          id: "pl1", version: "v1 – Initial Walkthrough", date: "2026-02-01",
          items: [
            { id: "i1", description: "Patch drywall corner in master bedroom", location: "Master Bedroom", responsible: "Crew", deadline: "2026-02-10", status: "completed", photo: null },
            { id: "i2", description: "GFCI outlet missing in master bath", location: "Master Bath", responsible: "Mike Torres", deadline: "2026-02-08", status: "open", photo: null },
          ]
        }
      ],
      closeOut: null,
    }
  ]
};

// ─── Helpers ────────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 10);
const fmt$ = (n) => `$${Number(n || 0).toLocaleString()}`;
const scopeStatuses = ["not-started", "in-progress", "completed"];
const scopeSections = ["Demolition", "Framing", "Electrical", "Plumbing", "HVAC", "Insulation", "Drywall", "Flooring", "Tile", "Painting", "Cabinets & Counters", "Trim & Doors", "Roofing", "Exterior", "Landscaping", "Other"];
const punchStatuses = ["open", "in-progress", "completed"];

const statusColor = (s) => ({
  "not-started": "#64748b",
  "in-progress": "#f59e0b",
  "completed": "#22c55e",
  "open": "#ef4444",
  "active": "#3b82f6",
  "closed": "#64748b",
}[s] || "#64748b");

const pct = (items) => {
  if (!items.length) return 0;
  return Math.round(items.filter(i => i.status === "completed").length / items.length * 100);
};

// ─── Sub-components ──────────────────────────────────────────────────────────────

function Badge({ label, color }) {
  return (
    <span style={{
      background: color + "22", color, border: `1px solid ${color}44`,
      borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700,
      textTransform: "uppercase", letterSpacing: 1, whiteSpace: "nowrap"
    }}>{label}</span>
  );
}

function ProgressBar({ pct: p, color = "#f59e0b" }) {
  return (
    <div style={{ background: "#1e293b", borderRadius: 99, height: 6, width: "100%", overflow: "hidden" }}>
      <div style={{ width: `${p}%`, background: color, height: "100%", borderRadius: 99, transition: "width .4s" }} />
    </div>
  );
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 16
    }} onClick={onClose}>
      <div style={{
        background: "#0f172a", border: "1px solid #334155", borderRadius: 12, padding: 28,
        width: "100%", maxWidth: wide ? 780 : 560, maxHeight: "90vh", overflowY: "auto"
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: "#f1f5f9", fontSize: 18, fontFamily: "'DM Serif Display',serif" }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 22 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", fontSize: 12, color: "#94a3b8", marginBottom: 5, fontWeight: 600, letterSpacing: .5 }}>{label}</label>}
      <input {...props} style={{
        width: "100%", background: "#1e293b", border: "1px solid #334155", borderRadius: 8,
        color: "#f1f5f9", padding: "10px 12px", fontSize: 14, outline: "none", boxSizing: "border-box",
        ...(props.style || {})
      }} />
    </div>
  );
}

function Select({ label, children, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", fontSize: 12, color: "#94a3b8", marginBottom: 5, fontWeight: 600, letterSpacing: .5 }}>{label}</label>}
      <select {...props} style={{
        width: "100%", background: "#1e293b", border: "1px solid #334155", borderRadius: 8,
        color: "#f1f5f9", padding: "10px 12px", fontSize: 14, outline: "none", boxSizing: "border-box"
      }}>{children}</select>
    </div>
  );
}

function Textarea({ label, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", fontSize: 12, color: "#94a3b8", marginBottom: 5, fontWeight: 600, letterSpacing: .5 }}>{label}</label>}
      <textarea {...props} style={{
        width: "100%", background: "#1e293b", border: "1px solid #334155", borderRadius: 8,
        color: "#f1f5f9", padding: "10px 12px", fontSize: 14, outline: "none", resize: "vertical",
        boxSizing: "border-box", minHeight: 80, ...(props.style || {})
      }} />
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", small, style: s }) {
  const styles = {
    primary: { background: "#f59e0b", color: "#0f172a", border: "none" },
    secondary: { background: "#1e293b", color: "#f1f5f9", border: "1px solid #334155" },
    danger: { background: "#ef444420", color: "#ef4444", border: "1px solid #ef444440" },
    success: { background: "#22c55e20", color: "#22c55e", border: "1px solid #22c55e40" },
  };
  return (
    <button onClick={onClick} style={{
      ...styles[variant], borderRadius: 8, padding: small ? "6px 12px" : "10px 18px",
      fontSize: small ? 12 : 14, fontWeight: 700, cursor: "pointer", letterSpacing: .3,
      transition: "opacity .15s", ...(s || {})
    }} onMouseEnter={e => e.currentTarget.style.opacity = ".8"}
      onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
      {children}
    </button>
  );
}

// ─── Project Form ────────────────────────────────────────────────────────────────
function ProjectForm({ project, onSave, onClose }) {
  const [f, setF] = useState(project || {
    id: uid(), name: "", address: "", client: "", startDate: "", endDate: "",
    contractValue: "", paymentTerms: "Net 30", selfPerformed: true, status: "active",
    notes: "", documents: [], scope: [], punchLists: [], closeOut: null
  });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <Input label="Project Name *" value={f.name} onChange={e => set("name", e.target.value)} placeholder="123 Maple St Flip" />
        <Input label="Address *" value={f.address} onChange={e => set("address", e.target.value)} placeholder="123 Maple St, City, ST" />
        <Input label="Client Name" value={f.client} onChange={e => set("client", e.target.value)} placeholder="Client or Self" />
        <Input label="Contract Value ($)" type="number" value={f.contractValue} onChange={e => set("contractValue", e.target.value)} />
        <Input label="Start Date" type="date" value={f.startDate} onChange={e => set("startDate", e.target.value)} />
        <Input label="End Date" type="date" value={f.endDate} onChange={e => set("endDate", e.target.value)} />
        <Input label="Payment Terms" value={f.paymentTerms} onChange={e => set("paymentTerms", e.target.value)} placeholder="Net 30" />
        <Select label="Status" value={f.status} onChange={e => set("status", e.target.value)}>
          <option value="active">Active</option>
          <option value="closed">Closed</option>
        </Select>
      </div>
      <div style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
        <input type="checkbox" id="self" checked={f.selfPerformed} onChange={e => set("selfPerformed", e.target.checked)} />
        <label htmlFor="self" style={{ color: "#94a3b8", fontSize: 13 }}>Self-performed (no primary subcontractor)</label>
      </div>
      <Textarea label="Notes" value={f.notes} onChange={e => set("notes", e.target.value)} />
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn onClick={() => { if (!f.name) return alert("Project name required"); onSave(f); }}>Save Project</Btn>
      </div>
    </div>
  );
}

// ─── Scope Builder ───────────────────────────────────────────────────────────────
function ScopeBuilder({ project, onUpdate }) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ id: uid(), section: "Demolition", description: "", estimatedCost: "", assignment: "Self", status: "not-started", notes: "" });
  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const saveItem = () => {
    if (!form.description) return alert("Description required");
    const scope = editing
      ? project.scope.map(s => s.id === form.id ? form : s)
      : [...project.scope, { ...form, id: uid() }];
    onUpdate({ ...project, scope });
    setAdding(false); setEditing(null);
    setForm({ id: uid(), section: "Demolition", description: "", estimatedCost: "", assignment: "Self", status: "not-started", notes: "" });
  };

  const removeItem = (id) => onUpdate({ ...project, scope: project.scope.filter(s => s.id !== id) });
  const updateStatus = (id, status) => onUpdate({ ...project, scope: project.scope.map(s => s.id === id ? { ...s, status } : s) });

  const totalEst = project.scope.reduce((a, s) => a + Number(s.estimatedCost || 0), 0);
  const completedEst = project.scope.filter(s => s.status === "completed").reduce((a, s) => a + Number(s.estimatedCost || 0), 0);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <span style={{ color: "#94a3b8", fontSize: 13 }}>Total Estimated: </span>
          <span style={{ color: "#f59e0b", fontWeight: 700 }}>{fmt$(totalEst)}</span>
          <span style={{ color: "#64748b", marginLeft: 12, fontSize: 13 }}>({fmt$(completedEst)} completed)</span>
        </div>
        <Btn small onClick={() => { setAdding(true); setEditing(null); }}>+ Add Line Item</Btn>
      </div>

      {(adding || editing) && (
        <div style={{ background: "#1e293b", borderRadius: 10, padding: 16, marginBottom: 16, border: "1px solid #334155" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Select label="Section" value={form.section} onChange={e => setF("section", e.target.value)}>
              {scopeSections.map(s => <option key={s}>{s}</option>)}
            </Select>
            <Input label="Estimated Cost ($)" type="number" value={form.estimatedCost} onChange={e => setF("estimatedCost", e.target.value)} />
          </div>
          <Textarea label="Description" value={form.description} onChange={e => setF("description", e.target.value)} style={{ minHeight: 60 }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 16px" }}>
            <Select label="Assignment" value={form.assignment} onChange={e => setF("assignment", e.target.value)}>
              <option>Self</option><option>Sub</option><option>Owner</option>
            </Select>
            <Select label="Status" value={form.status} onChange={e => setF("status", e.target.value)}>
              {scopeStatuses.map(s => <option key={s} value={s}>{s.replace("-", " ")}</option>)}
            </Select>
            <Input label="Notes" value={form.notes} onChange={e => setF("notes", e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn small onClick={saveItem}>Save</Btn>
            <Btn small variant="secondary" onClick={() => { setAdding(false); setEditing(null); }}>Cancel</Btn>
          </div>
        </div>
      )}

      {project.scope.length === 0 && <div style={{ color: "#475569", textAlign: "center", padding: 32 }}>No scope items yet. Add your first line item above.</div>}

      {project.scope.map(item => (
        <div key={item.id} style={{
          background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, padding: "12px 16px",
          marginBottom: 8, display: "flex", alignItems: "flex-start", gap: 12
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
              <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: 12, textTransform: "uppercase" }}>{item.section}</span>
              <Badge label={item.status.replace("-", " ")} color={statusColor(item.status)} />
              <Badge label={item.assignment} color="#6366f1" />
              {item.estimatedCost && <span style={{ color: "#94a3b8", fontSize: 12 }}>{fmt$(item.estimatedCost)}</span>}
            </div>
            <div style={{ color: "#e2e8f0", fontSize: 14 }}>{item.description}</div>
            {item.notes && <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>{item.notes}</div>}
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            {scopeStatuses.filter(s => s !== item.status).map(s => (
              <Btn key={s} small variant="secondary" onClick={() => updateStatus(item.id, s)}
                style={{ fontSize: 10, padding: "4px 8px" }}>→ {s.replace("-", " ")}</Btn>
            ))}
            <Btn small variant="secondary" onClick={() => { setForm({ ...item }); setEditing(item.id); setAdding(false); }}>✎</Btn>
            <Btn small variant="danger" onClick={() => removeItem(item.id)}>✕</Btn>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Photo Gallery ───────────────────────────────────────────────────────────────
function PhotoGallery({ project, onUpdate }) {
  const fileRef = useRef();
  const [lightbox, setLightbox] = useState(null);

  const handleFiles = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(f => {
      const reader = new FileReader();
      reader.onload = ev => {
        const photo = {
          id: uid(), url: ev.target.result, name: f.name,
          caption: "", tag: "progress", date: new Date().toISOString().slice(0, 10), room: ""
        };
        onUpdate(prev => ({ ...prev, photos: [...(prev.photos || []), photo] }));
      };
      reader.readAsDataURL(f);
    });
    e.target.value = "";
  };

  const updatePhoto = (id, key, val) => {
    onUpdate(prev => ({ ...prev, photos: prev.photos.map(p => p.id === id ? { ...p, [key]: val } : p) }));
  };
  const removePhoto = (id) => onUpdate(prev => ({ ...prev, photos: prev.photos.filter(p => p.id !== id) }));

  const photos = project.photos || [];
  const tags = ["before", "progress", "after", "permit", "inspection", "other"];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ color: "#64748b", fontSize: 13 }}>{photos.length} photo{photos.length !== 1 ? "s" : ""}</span>
        <Btn small onClick={() => fileRef.current.click()}>+ Upload Photos</Btn>
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleFiles} />
      </div>

      {photos.length === 0 && (
        <div style={{ textAlign: "center", padding: 48, color: "#475569", border: "2px dashed #1e293b", borderRadius: 12 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📷</div>
          <div>Upload before, during, and after photos</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Supports JPEG, PNG, HEIC</div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
        {photos.map(p => (
          <div key={p.id} style={{ background: "#0f172a", borderRadius: 10, overflow: "hidden", border: "1px solid #1e293b" }}>
            <div style={{ position: "relative", cursor: "pointer" }} onClick={() => setLightbox(p)}>
              <img src={p.url} alt={p.caption || p.name} style={{ width: "100%", height: 150, objectFit: "cover", display: "block" }} />
              <div style={{ position: "absolute", top: 6, left: 6 }}>
                <Badge label={p.tag} color={p.tag === "before" ? "#ef4444" : p.tag === "after" ? "#22c55e" : "#f59e0b"} />
              </div>
            </div>
            <div style={{ padding: 10 }}>
              <input value={p.caption} onChange={e => updatePhoto(p.id, "caption", e.target.value)}
                placeholder="Add caption…" style={{ width: "100%", background: "transparent", border: "none", color: "#94a3b8", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
              <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                {tags.map(t => (
                  <button key={t} onClick={() => updatePhoto(p.id, "tag", t)}
                    style={{ background: p.tag === t ? "#f59e0b22" : "none", color: p.tag === t ? "#f59e0b" : "#64748b", border: `1px solid ${p.tag === t ? "#f59e0b44" : "#1e293b"}`, borderRadius: 4, padding: "2px 6px", fontSize: 10, cursor: "pointer" }}>
                    {t}
                  </button>
                ))}
                <button onClick={() => removePhoto(p.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 12, marginLeft: "auto" }}>✕</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {lightbox && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}
          onClick={() => setLightbox(null)}>
          <img src={lightbox.url} alt="" style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 8 }} />
        </div>
      )}
    </div>
  );
}

// ─── Punch Lists ─────────────────────────────────────────────────────────────────
function PunchLists({ project, onUpdate }) {
  const [showNewList, setShowNewList] = useState(false);
  const [activeList, setActiveList] = useState(null);
  const [newListName, setNewListName] = useState("");
  const [showItemForm, setShowItemForm] = useState(false);
  const [itemForm, setItemForm] = useState({ id: uid(), description: "", location: "", responsible: "", deadline: "", status: "open", photo: null });

  const lists = project.punchLists || [];

  const createList = () => {
    if (!newListName) return;
    const list = { id: uid(), version: newListName, date: new Date().toISOString().slice(0, 10), items: [] };
    onUpdate(prev => ({ ...prev, punchLists: [...lists, list] }));
    setNewListName(""); setShowNewList(false); setActiveList(list.id);
  };

  const addItem = (listId) => {
    if (!itemForm.description) return alert("Description required");
    const item = { ...itemForm, id: uid() };
    onUpdate(prev => ({
      ...prev,
      punchLists: prev.punchLists.map(l => l.id === listId ? { ...l, items: [...l.items, item] } : l)
    }));
    setItemForm({ id: uid(), description: "", location: "", responsible: "", deadline: "", status: "open", photo: null });
    setShowItemForm(false);
  };

  const updateItem = (listId, itemId, key, val) => {
    onUpdate(prev => ({
      ...prev,
      punchLists: prev.punchLists.map(l => l.id === listId
        ? { ...l, items: l.items.map(i => i.id === itemId ? { ...i, [key]: val } : i) }
        : l)
    }));
  };

  const removeItem = (listId, itemId) => {
    onUpdate(prev => ({
      ...prev,
      punchLists: prev.punchLists.map(l => l.id === listId
        ? { ...l, items: l.items.filter(i => i.id !== itemId) }
        : l)
    }));
  };

  const activeL = lists.find(l => l.id === activeList) || lists[0];

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        {lists.map(l => (
          <button key={l.id} onClick={() => setActiveList(l.id)} style={{
            background: (activeL?.id === l.id) ? "#f59e0b" : "#1e293b",
            color: (activeL?.id === l.id) ? "#0f172a" : "#94a3b8",
            border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer"
          }}>{l.version}</button>
        ))}
        {showNewList
          ? <div style={{ display: "flex", gap: 8 }}>
            <input value={newListName} onChange={e => setNewListName(e.target.value)}
              placeholder="e.g. v2 – Final Walkthrough"
              style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#f1f5f9", padding: "8px 12px", fontSize: 13 }} />
            <Btn small onClick={createList}>Create</Btn>
            <Btn small variant="secondary" onClick={() => setShowNewList(false)}>Cancel</Btn>
          </div>
          : <Btn small variant="secondary" onClick={() => setShowNewList(true)}>+ New List</Btn>}
      </div>

      {!activeL && <div style={{ color: "#475569", textAlign: "center", padding: 32 }}>Create your first punch list above.</div>}

      {activeL && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <span style={{ color: "#64748b", fontSize: 13 }}>Created: {activeL.date} · </span>
              <span style={{ color: "#64748b", fontSize: 13 }}>{activeL.items.length} item{activeL.items.length !== 1 ? "s" : ""} · </span>
              <span style={{ color: "#22c55e", fontSize: 13 }}>{pct(activeL.items)}% complete</span>
            </div>
            <Btn small onClick={() => setShowItemForm(!showItemForm)}>+ Add Item</Btn>
          </div>

          {showItemForm && (
            <div style={{ background: "#1e293b", borderRadius: 10, padding: 16, marginBottom: 16, border: "1px solid #334155" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                <Textarea label="Description *" value={itemForm.description} onChange={e => setItemForm(p => ({ ...p, description: e.target.value }))} style={{ minHeight: 60 }} />
                <div>
                  <Input label="Location/Room" value={itemForm.location} onChange={e => setItemForm(p => ({ ...p, location: e.target.value }))} placeholder="Kitchen, Master Bath..." />
                  <Input label="Responsible Party" value={itemForm.responsible} onChange={e => setItemForm(p => ({ ...p, responsible: e.target.value }))} placeholder="Crew, Mike Torres..." />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                <Input label="Deadline" type="date" value={itemForm.deadline} onChange={e => setItemForm(p => ({ ...p, deadline: e.target.value }))} />
                <Select label="Status" value={itemForm.status} onChange={e => setItemForm(p => ({ ...p, status: e.target.value }))}>
                  {punchStatuses.map(s => <option key={s}>{s}</option>)}
                </Select>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn small onClick={() => addItem(activeL.id)}>Add Item</Btn>
                <Btn small variant="secondary" onClick={() => setShowItemForm(false)}>Cancel</Btn>
              </div>
            </div>
          )}

          <ProgressBar pct={pct(activeL.items)} color="#22c55e" />
          <div style={{ marginTop: 12 }}>
            {activeL.items.map(item => (
              <div key={item.id} style={{
                background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, padding: "12px 16px",
                marginBottom: 8, display: "flex", gap: 12, alignItems: "flex-start"
              }}>
                <button onClick={() => updateItem(activeL.id, item.id, "status", item.status === "completed" ? "open" : "completed")}
                  style={{
                    width: 22, height: 22, borderRadius: "50%", border: `2px solid ${item.status === "completed" ? "#22c55e" : "#334155"}`,
                    background: item.status === "completed" ? "#22c55e" : "none", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                  {item.status === "completed" && <span style={{ color: "#0f172a", fontSize: 12, fontWeight: 900 }}>✓</span>}
                </button>
                <div style={{ flex: 1, opacity: item.status === "completed" ? .5 : 1 }}>
                  <div style={{ color: "#e2e8f0", fontSize: 14, textDecoration: item.status === "completed" ? "line-through" : "none" }}>{item.description}</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                    {item.location && <Badge label={`📍 ${item.location}`} color="#6366f1" />}
                    {item.responsible && <Badge label={`👤 ${item.responsible}`} color="#0ea5e9" />}
                    {item.deadline && <Badge label={`📅 ${item.deadline}`} color={new Date(item.deadline) < new Date() && item.status !== "completed" ? "#ef4444" : "#64748b"} />}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {punchStatuses.filter(s => s !== item.status && s !== "completed").map(s => (
                    <Btn key={s} small variant="secondary" onClick={() => updateItem(activeL.id, item.id, "status", s)} style={{ fontSize: 10, padding: "3px 7px" }}>→ {s}</Btn>
                  ))}
                  <Btn small variant="danger" onClick={() => removeItem(activeL.id, item.id)}>✕</Btn>
                </div>
              </div>
            ))}
            {activeL.items.length === 0 && <div style={{ color: "#475569", textAlign: "center", padding: 24 }}>No items yet. Add your first punch item above.</div>}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Close-Out ───────────────────────────────────────────────────────────────────
function CloseOut({ project, onUpdate }) {
  const [form, setForm] = useState(project.closeOut || {
    completionDate: new Date().toISOString().slice(0, 10),
    finalPayment: "", warrantyNotes: "",
    clientSig: "", contractorSig: "", signedAt: null
  });
  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const sign = () => {
    if (!form.clientSig || !form.contractorSig) return alert("Both signatures required");
    const co = { ...form, signedAt: new Date().toISOString() };
    setForm(co);
    onUpdate(prev => ({ ...prev, closeOut: co, status: "closed" }));
  };

  const signed = form.signedAt;

  return (
    <div>
      {signed && (
        <div style={{ background: "#22c55e22", border: "1px solid #22c55e44", borderRadius: 10, padding: 16, marginBottom: 20, textAlign: "center" }}>
          <div style={{ fontSize: 28 }}>✅</div>
          <div style={{ color: "#22c55e", fontWeight: 700, marginTop: 4 }}>Project Closed Out</div>
          <div style={{ color: "#64748b", fontSize: 12 }}>Signed {new Date(form.signedAt).toLocaleString()}</div>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <Input label="Completion Date" type="date" value={form.completionDate} onChange={e => setF("completionDate", e.target.value)} disabled={signed} />
        <Input label="Final Payment Amount ($)" type="number" value={form.finalPayment} onChange={e => setF("finalPayment", e.target.value)} disabled={signed} />
      </div>
      <Textarea label="Warranty Notes" value={form.warrantyNotes} onChange={e => setF("warrantyNotes", e.target.value)} placeholder="1-year warranty on all workmanship, 10-year on roof..." disabled={signed} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px", marginTop: 8 }}>
        <div>
          <label style={{ display: "block", fontSize: 12, color: "#94a3b8", marginBottom: 5, fontWeight: 600 }}>Client Signature</label>
          <input value={form.clientSig} onChange={e => setF("clientSig", e.target.value)}
            disabled={signed} placeholder="Type full name to sign"
            style={{ width: "100%", background: "#1e293b", border: "2px solid #334155", borderRadius: 8, color: "#e2e8f0", padding: "12px", fontSize: 16, fontFamily: "cursive", boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, color: "#94a3b8", marginBottom: 5, fontWeight: 600 }}>Contractor Signature</label>
          <input value={form.contractorSig} onChange={e => setF("contractorSig", e.target.value)}
            disabled={signed} placeholder="Type full name to sign"
            style={{ width: "100%", background: "#1e293b", border: "2px solid #334155", borderRadius: 8, color: "#e2e8f0", padding: "12px", fontSize: 16, fontFamily: "cursive", boxSizing: "border-box" }} />
        </div>
      </div>
      {!signed && (
        <div style={{ marginTop: 16, textAlign: "center" }}>
          <Btn onClick={sign} variant="success">✍ Execute Close-Out & Sign</Btn>
          <div style={{ color: "#64748b", fontSize: 11, marginTop: 8 }}>By signing, both parties confirm work is complete and final payment is agreed upon.</div>
        </div>
      )}
    </div>
  );
}

// ─── Documents Tab ───────────────────────────────────────────────────────────────
function Documents({ project, onUpdate }) {
  const fileRef = useRef();
  const docTypes = ["Contract", "Bid", "Insurance", "Permit", "Drawing", "Receipt", "Invoice", "Other"];

  const handleFiles = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(f => {
      const doc = { id: uid(), name: f.name, type: "Other", date: new Date().toISOString().slice(0, 10), size: (f.size / 1024).toFixed(1) + " KB" };
      onUpdate(prev => ({ ...prev, documents: [...(prev.documents || []), doc] }));
    });
    e.target.value = "";
  };

  const updateDoc = (id, key, val) => onUpdate(prev => ({ ...prev, documents: prev.documents.map(d => d.id === id ? { ...d, [key]: val } : d) }));
  const removeDoc = (id) => onUpdate(prev => ({ ...prev, documents: prev.documents.filter(d => d.id !== id) }));

  const docs = project.documents || [];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <span style={{ color: "#64748b", fontSize: 13 }}>{docs.length} document{docs.length !== 1 ? "s" : ""}</span>
        <Btn small onClick={() => fileRef.current.click()}>+ Upload Documents</Btn>
        <input ref={fileRef} type="file" multiple style={{ display: "none" }} onChange={handleFiles} />
      </div>

      {docs.length === 0 && (
        <div style={{ textAlign: "center", padding: 48, color: "#475569", border: "2px dashed #1e293b", borderRadius: 12 }}>
          <div style={{ fontSize: 36 }}>📄</div>
          <div style={{ marginTop: 8 }}>Upload contracts, permits, drawings, receipts</div>
        </div>
      )}

      {docs.map(d => (
        <div key={d.id} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, padding: "12px 16px", marginBottom: 8, display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ fontSize: 24 }}>📄</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: "#e2e8f0", fontSize: 14 }}>{d.name}</div>
            <div style={{ color: "#64748b", fontSize: 12 }}>{d.date} · {d.size}</div>
          </div>
          <select value={d.type} onChange={e => updateDoc(d.id, "type", e.target.value)}
            style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 6, color: "#94a3b8", padding: "4px 8px", fontSize: 12 }}>
            {docTypes.map(t => <option key={t}>{t}</option>)}
          </select>
          <Btn small variant="danger" onClick={() => removeDoc(d.id)}>✕</Btn>
        </div>
      ))}
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────────
function Dashboard({ projects, onSelect }) {
  const active = projects.filter(p => p.status === "active");
  const closed = projects.filter(p => p.status === "closed");
  const totalValue = projects.reduce((a, p) => a + Number(p.contractValue || 0), 0);
  const allPunchOpen = projects.flatMap(p =>
    (p.punchLists || []).flatMap(l => l.items.filter(i => i.status === "open").map(i => ({ ...i, project: p.name })))
  );

  return (
    <div>
      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 28 }}>
        {[
          { label: "Active Projects", value: active.length, color: "#3b82f6", icon: "🏗️" },
          { label: "Closed Projects", value: closed.length, color: "#22c55e", icon: "✅" },
          { label: "Total Contract Value", value: fmt$(totalValue), color: "#f59e0b", icon: "💰" },
          { label: "Open Punch Items", value: allPunchOpen.length, color: allPunchOpen.length > 0 ? "#ef4444" : "#22c55e", icon: "📋" },
        ].map(k => (
          <div key={k.label} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{k.icon}</div>
            <div style={{ color: k.color, fontSize: 26, fontWeight: 800, fontFamily: "'DM Serif Display',serif" }}>{k.value}</div>
            <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Project Cards */}
      <h3 style={{ color: "#94a3b8", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Active Projects</h3>
      {active.length === 0 && <div style={{ color: "#475569", padding: 24, textAlign: "center" }}>No active projects. Create one above!</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {active.map(p => {
          const scopePct = pct(p.scope || []);
          const openPunch = (p.punchLists || []).flatMap(l => l.items.filter(i => i.status === "open")).length;
          const totalEst = (p.scope || []).reduce((a, s) => a + Number(s.estimatedCost || 0), 0);
          return (
            <div key={p.id} onClick={() => onSelect(p.id)}
              style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20, cursor: "pointer", transition: "border-color .2s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "#f59e0b"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "#1e293b"}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 16 }}>{p.name}</div>
                  <div style={{ color: "#64748b", fontSize: 12 }}>{p.address}</div>
                </div>
                <Badge label="active" color="#3b82f6" />
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ color: "#94a3b8", fontSize: 12 }}>Scope Progress</span>
                  <span style={{ color: "#f59e0b", fontSize: 12, fontWeight: 700 }}>{scopePct}%</span>
                </div>
                <ProgressBar pct={scopePct} />
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <div>
                  <div style={{ color: "#f59e0b", fontWeight: 700 }}>{fmt$(totalEst)}</div>
                  <div style={{ color: "#64748b", fontSize: 11 }}>Estimated</div>
                </div>
                <div>
                  <div style={{ color: openPunch > 0 ? "#ef4444" : "#22c55e", fontWeight: 700 }}>{openPunch}</div>
                  <div style={{ color: "#64748b", fontSize: 11 }}>Open Items</div>
                </div>
                {p.endDate && <div>
                  <div style={{ color: "#94a3b8", fontWeight: 700 }}>{p.endDate}</div>
                  <div style={{ color: "#64748b", fontSize: 11 }}>Due Date</div>
                </div>}
              </div>
            </div>
          );
        })}
      </div>

      {allPunchOpen.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <h3 style={{ color: "#ef4444", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>⚠ Overdue / Open Punch Items</h3>
          {allPunchOpen.slice(0, 5).map(i => (
            <div key={i.id} style={{ background: "#0f172a", border: "1px solid #ef444430", borderRadius: 8, padding: "10px 14px", marginBottom: 6, display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <span style={{ color: "#e2e8f0", fontSize: 13 }}>{i.description}</span>
                <span style={{ color: "#64748b", fontSize: 12, marginLeft: 8 }}>— {i.project}</span>
              </div>
              {i.deadline && <Badge label={i.deadline} color={new Date(i.deadline) < new Date() ? "#ef4444" : "#64748b"} />}
              {i.responsible && <Badge label={i.responsible} color="#0ea5e9" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Project Detail ───────────────────────────────────────────────────────────────
function ProjectDetail({ project, onUpdate, onBack, onDelete }) {
  const [tab, setTab] = useState("scope");
  const tabs = ["scope", "photos", "documents", "punch", "closeout"];
  const tabLabels = { scope: "Scope of Work", photos: "Photos", documents: "Documents", punch: "Punch Lists", closeout: "Close-Out" };
  const [editing, setEditing] = useState(false);

  const handleUpdate = (updater) => {
    if (typeof updater === "function") {
      onUpdate(updater(project));
    } else {
      onUpdate(updater);
    }
  };

  return (
    <div>
      {editing && (
        <Modal title="Edit Project" onClose={() => setEditing(false)} wide>
          <ProjectForm project={project} onSave={(p) => { onUpdate(p); setEditing(false); }} onClose={() => setEditing(false)} />
        </Modal>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: "#1e293b", border: "none", color: "#94a3b8", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 14 }}>← Back</button>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, color: "#f1f5f9", fontFamily: "'DM Serif Display',serif", fontSize: 22 }}>{project.name}</h2>
          <div style={{ color: "#64748b", fontSize: 13 }}>{project.address} · {project.client}</div>
        </div>
        <Badge label={project.status} color={statusColor(project.status)} />
        <Btn small variant="secondary" onClick={() => setEditing(true)}>Edit</Btn>
        <Btn small variant="danger" onClick={() => { if (confirm("Delete this project?")) onDelete(project.id); }}>Delete</Btn>
      </div>

      {/* Info row */}
      <div style={{ display: "flex", gap: 20, background: "#0f172a", borderRadius: 10, padding: "14px 18px", marginBottom: 20, flexWrap: "wrap" }}>
        {[
          ["Contract Value", fmt$(project.contractValue)],
          ["Payment Terms", project.paymentTerms],
          ["Start", project.startDate],
          ["End", project.endDate],
          ["Type", project.selfPerformed ? "Self-performed" : "Subcontracted"],
        ].map(([k, v]) => v && (
          <div key={k}>
            <div style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>{k}</div>
            <div style={{ color: "#e2e8f0", fontWeight: 600, fontSize: 14 }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #1e293b", paddingBottom: 0 }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: "none", border: "none", color: tab === t ? "#f59e0b" : "#64748b",
            fontSize: 13, fontWeight: 700, cursor: "pointer", padding: "10px 14px",
            borderBottom: `2px solid ${tab === t ? "#f59e0b" : "transparent"}`,
            letterSpacing: .3
          }}>{tabLabels[t]}</button>
        ))}
      </div>

      {tab === "scope" && <ScopeBuilder project={project} onUpdate={onUpdate} />}
      {tab === "photos" && <PhotoGallery project={project} onUpdate={handleUpdate} />}
      {tab === "documents" && <Documents project={project} onUpdate={handleUpdate} />}
      {tab === "punch" && <PunchLists project={project} onUpdate={handleUpdate} />}
      {tab === "closeout" && <CloseOut project={project} onUpdate={handleUpdate} />}
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────────
export default function App() {
  const [data, setData] = useState(seed);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState("dashboard");
  const [activeProject, setActiveProject] = useState(null);
  const [showNewProject, setShowNewProject] = useState(false);

  // Load persisted data once on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const remote = await loadRemote();
      if (!cancelled && remote) setData(remote);
      if (!cancelled) setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, []);

  // Persist on every change, once initial load has completed
  useEffect(() => {
    if (!loaded) return;
    saveRemote(data);
  }, [data, loaded]);

  const projects = data.projects;

  const updateProject = (updated) => {
    setData(d => ({ ...d, projects: d.projects.map(p => p.id === updated.id ? updated : p) }));
    if (activeProject?.id === updated.id) setActiveProject(updated);
  };

  const addProject = (p) => {
    setData(d => ({ ...d, projects: [...d.projects, p] }));
    setShowNewProject(false);
    setActiveProject(p);
    setView("project");
  };

  const deleteProject = (id) => {
    setData(d => ({ ...d, projects: d.projects.filter(p => p.id !== id) }));
    setView("dashboard");
    setActiveProject(null);
  };

  const selectProject = (id) => {
    setActiveProject(projects.find(p => p.id === id));
    setView("project");
  };

  if (!loaded) {
    return (
      <div style={{ minHeight: "100vh", background: "#060d1a", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
        Loading projects…
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=IBM+Plex+Sans:wght@400;600;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; background: #060d1a; color: #f1f5f9; font-family: 'IBM Plex Sans', sans-serif; }
        input, textarea, select { font-family: 'IBM Plex Sans', sans-serif; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #0f172a; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
      `}</style>

      {/* Header */}
      <div style={{ background: "#080f1e", borderBottom: "1px solid #1e293b", padding: "14px 24px", display: "flex", alignItems: "center", gap: 16, position: "sticky", top: 0, zIndex: 50 }}>
        <div onClick={() => { setView("dashboard"); setActiveProject(null); }} style={{ cursor: "pointer" }}>
          <span style={{ fontFamily: "'DM Serif Display',serif", fontSize: 20, color: "#f59e0b" }}>BuildTrack</span>
          <span style={{ color: "#334155", fontSize: 14, marginLeft: 8 }}>Pro</span>
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={() => { setView("dashboard"); setActiveProject(null); }}
          style={{ background: view === "dashboard" ? "#1e293b" : "none", border: "none", color: view === "dashboard" ? "#f1f5f9" : "#64748b", padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
          Dashboard
        </button>
        <Btn small onClick={() => setShowNewProject(true)}>+ New Project</Btn>
      </div>

      {showNewProject && (
        <Modal title="New Project" onClose={() => setShowNewProject(false)} wide>
          <ProjectForm onSave={addProject} onClose={() => setShowNewProject(false)} />
        </Modal>
      )}

      {/* Main */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px" }}>
        {view === "dashboard" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h1 style={{ margin: 0, fontFamily: "'DM Serif Display',serif", fontSize: 28, color: "#f1f5f9" }}>
                Project Overview
              </h1>
              <Btn onClick={() => setShowNewProject(true)}>+ New Project</Btn>
            </div>
            <Dashboard projects={projects} onSelect={selectProject} />
          </div>
        )}

        {view === "project" && activeProject && (
          <ProjectDetail
            project={projects.find(p => p.id === activeProject.id) || activeProject}
            onUpdate={updateProject}
            onBack={() => { setView("dashboard"); setActiveProject(null); }}
            onDelete={deleteProject}
          />
        )}
      </div>
    </>
  );
}
