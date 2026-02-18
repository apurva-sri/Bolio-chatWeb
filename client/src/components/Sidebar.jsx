import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../utils/api";

/* ─── tiny icon wrappers ─── */
const Icon = ({ d, size = 22, className = "" }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={`fill-current ${className}`}>
    <path d={d} />
  </svg>
);

const ICONS = {
  chat:     "M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z",
  calls:    "M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1C10.61 21 3 13.39 3 4c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.24 1.02l-2.21 2.2z",
  notes:    "M3 18h12v-2H3v2zm0-5h12v-2H3v2zm0-7v2h12V6H3zm14 9.5V8h-2v7.5l3 3 1.5-1.5-2.5-2.5z",
  settings: "M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96a7.02 7.02 0 00-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.37 1.04.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.57 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z",
  profile:  "M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z",
  close:    "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
  pin:      "M16 12V4h1V2H7v2h1v8l-2 2v2h5v6h2v-6h5v-2l-2-2z",
  trash:    "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z",
  edit:     "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z",
  bell:     "M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z",
  check:    "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z",
  mic:      "M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z",
  plus:     "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",
  camera:   "M12 15.2A3.2 3.2 0 0 1 8.8 12 3.2 3.2 0 0 1 12 8.8 3.2 3.2 0 0 1 15.2 12 3.2 3.2 0 0 1 12 15.2M12 7a5 5 0 0 0-5 5 5 5 0 0 0 5 5 5 5 0 0 0 5-5 5 5 0 0 0-5-5m6.5-1H19l-2-2.2c-.2-.2-.5-.3-.8-.3h-8.4c-.3 0-.6.1-.8.3L5 6H4.5C3.1 6 2 7.1 2 8.5v11C2 20.9 3.1 22 4.5 22h15c1.4 0 2.5-1.1 2.5-2.5v-11C22 7.1 20.9 6 19.5 6z",
};

/* ─────────────────────────────────────────────
   NAV BUTTON
───────────────────────────────────────────── */
const NavBtn = ({ icon, label, active, onClick, badge }) => (
  <button
    onClick={onClick}
    title={label}
    className={`relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-150 ${
      active
        ? "bg-[#00a884] text-white"
        : "text-[#8696a0] hover:bg-[#2a3942] hover:text-[#e9edef]"
    }`}
  >
    <Icon d={ICONS[icon]} size={21} />
    {badge > 0 && (
      <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
        {badge > 9 ? "9+" : badge}
      </span>
    )}
  </button>
);

/* ─────────────────────────────────────────────
   SETTINGS PANEL
───────────────────────────────────────────── */
const SettingsPanel = ({ onClose }) => {
  const { user, setUser } = useAuth();
  const [username, setUsername] = useState(user?.username || "");
  const [about, setAbout] = useState(user?.about || "");
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef();

  const handleAvatarChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("about", about);
      if (avatarFile) formData.append("avatar", avatarFile);

      const { data } = await API.put("/auth/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUser((prev) => ({ ...prev, ...data }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#111b21]">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-4 bg-[#202c33]">
        <button onClick={onClose} className="text-[#aebac1] hover:text-[#e9edef] transition">
          <Icon d={ICONS.close} size={20} />
        </button>
        <h2 className="text-[#e9edef] font-semibold text-base">Settings</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="relative w-24 h-24 rounded-full overflow-hidden cursor-pointer group"
            onClick={() => fileRef.current.click()}
          >
            <div className="w-full h-full bg-[#374045] flex items-center justify-center text-2xl font-bold text-white">
              {avatarPreview ? (
                <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                user?.username?.[0]?.toUpperCase()
              )}
            </div>
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition">
              <Icon d={ICONS.camera} size={20} className="text-white" />
              <span className="text-white text-[10px] mt-1 font-medium">Change</span>
            </div>
          </div>
          <input type="file" hidden ref={fileRef} accept="image/*" onChange={handleAvatarChange} />
          <p className="text-[#8696a0] text-xs">Click to change photo</p>
        </div>

        {/* Username */}
        <div>
          <label className="text-[#00a884] text-xs font-medium uppercase tracking-wider mb-2 block">
            Your name
          </label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={25}
            className="w-full bg-[#2a3942] text-[#e9edef] rounded-lg px-4 py-2.5 text-sm outline-none border border-transparent focus:border-[#00a884] transition"
            placeholder="Username"
          />
        </div>

        {/* About */}
        <div>
          <label className="text-[#00a884] text-xs font-medium uppercase tracking-wider mb-2 block">
            About
          </label>
          <textarea
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            maxLength={139}
            rows={3}
            className="w-full bg-[#2a3942] text-[#e9edef] rounded-lg px-4 py-2.5 text-sm outline-none border border-transparent focus:border-[#00a884] transition resize-none"
            placeholder="Hey there! I am using this app."
          />
          <p className="text-right text-[#8696a0] text-xs mt-1">{about.length}/139</p>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2.5 rounded-lg bg-[#00a884] text-white font-semibold text-sm hover:bg-[#02c197] transition flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {saved ? (
            <><Icon d={ICONS.check} size={18} className="text-white" /> Saved!</>
          ) : saving ? (
            "Saving..."
          ) : (
            "Save changes"
          )}
        </button>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   CALLS PANEL
───────────────────────────────────────────── */
const CallsPanel = ({ onClose }) => {
  const { user } = useAuth();
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/calls")
      .then(({ data }) => setCalls(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const fmt = (secs) => {
    if (!secs) return "";
    const m = Math.floor(secs / 60), s = secs % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col h-full bg-[#111b21]">
      <div className="flex items-center gap-4 px-4 py-4 bg-[#202c33]">
        <button onClick={onClose} className="text-[#aebac1] hover:text-[#e9edef] transition">
          <Icon d={ICONS.close} size={20} />
        </button>
        <h2 className="text-[#e9edef] font-semibold text-base">Calls</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-[#8696a0] text-sm">Loading...</div>
        ) : calls.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-[#8696a0]">
            <Icon d={ICONS.calls} size={40} className="opacity-30" />
            <p className="text-sm">No call history yet</p>
          </div>
        ) : (
          calls.map((call) => {
            const other = call.caller._id === user._id ? call.receiver : call.caller;
            const isIncoming = call.receiver._id === user._id;
            const isMissed = call.status === "missed";

            return (
              <div key={call._id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#2a3942] transition border-b border-[#2a3942]/40">
                <div className="w-10 h-10 rounded-full bg-[#374045] flex items-center justify-center text-white font-semibold shrink-0 overflow-hidden">
                  {other.avatar ? (
                    <img src={other.avatar} alt={other.username} className="w-full h-full object-cover" />
                  ) : (
                    other.username?.[0]?.toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#e9edef] text-sm font-medium truncate">{other.username}</p>
                  <p className={`text-xs ${isMissed ? "text-red-400" : "text-[#8696a0]"}`}>
                    {isIncoming ? "↙ Incoming" : "↗ Outgoing"} · {call.type} · {call.status}
                    {call.duration > 0 && ` · ${fmt(call.duration)}`}
                  </p>
                </div>
                <p className="text-[#8696a0] text-xs shrink-0">
                  {new Date(call.createdAt).toLocaleDateString()}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   NOTES PANEL
───────────────────────────────────────────── */
const NOTE_COLORS = ["#1e2a30", "#1a2f1a", "#2f1a1a", "#1a1a2f", "#2f2a1a"];

const NotesPanel = ({ onClose }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null); // note being edited
  const [form, setForm] = useState({ title: "", content: "", color: NOTE_COLORS[0], reminderAt: "" });

  useEffect(() => {
    API.get("/notes")
      .then(({ data }) => setNotes(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", content: "", color: NOTE_COLORS[0], reminderAt: "" });
    setCreating(true);
  };

  const openEdit = (note) => {
    setEditing(note);
    setForm({
      title: note.title,
      content: note.content,
      color: note.color || NOTE_COLORS[0],
      reminderAt: note.reminderAt
        ? new Date(note.reminderAt).toISOString().slice(0, 16)
        : "",
    });
    setCreating(true);
  };

  const handleSave = async () => {
    const payload = {
      title: form.title || "Untitled",
      content: form.content,
      color: form.color,
      reminderAt: form.reminderAt || null,
    };
    try {
      if (editing) {
        const { data } = await API.put(`/notes/${editing._id}`, payload);
        setNotes((prev) => prev.map((n) => (n._id === editing._id ? data : n)));
      } else {
        const { data } = await API.post("/notes", payload);
        setNotes((prev) => [data, ...prev]);
      }
      setCreating(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    await API.delete(`/notes/${id}`);
    setNotes((prev) => prev.filter((n) => n._id !== id));
  };

  const handlePin = async (note) => {
    const { data } = await API.put(`/notes/${note._id}`, { isPinned: !note.isPinned });
    setNotes((prev) => prev.map((n) => (n._id === note._id ? data : n)));
  };

  return (
    <div className="flex flex-col h-full bg-[#111b21]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 bg-[#202c33]">
        <div className="flex items-center gap-4">
          <button onClick={creating ? () => setCreating(false) : onClose} className="text-[#aebac1] hover:text-[#e9edef] transition">
            <Icon d={ICONS.close} size={20} />
          </button>
          <h2 className="text-[#e9edef] font-semibold text-base">
            {creating ? (editing ? "Edit note" : "New note") : "Notes"}
          </h2>
        </div>
        {!creating && (
          <button onClick={openCreate} className="w-8 h-8 rounded-full bg-[#00a884] flex items-center justify-center hover:bg-[#02c197] transition">
            <Icon d={ICONS.plus} size={18} className="text-white" />
          </button>
        )}
      </div>

      {creating ? (
        /* ── Create / Edit form ── */
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Title"
            className="w-full bg-transparent text-[#e9edef] text-xl font-semibold outline-none border-b border-[#2a3942] pb-2 placeholder-[#8696a0]"
          />
          <textarea
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="Write your note..."
            rows={8}
            className="w-full bg-transparent text-[#d1d7db] text-sm outline-none resize-none placeholder-[#8696a0] leading-relaxed"
          />

          {/* Color picker */}
          <div>
            <p className="text-[#8696a0] text-xs mb-2">Card color</p>
            <div className="flex gap-2">
              {NOTE_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setForm({ ...form, color: c })}
                  className="w-7 h-7 rounded-full border-2 transition"
                  style={{
                    backgroundColor: c,
                    borderColor: form.color === c ? "#00a884" : "transparent",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Reminder */}
          <div>
            <label className="text-[#8696a0] text-xs mb-2 flex items-center gap-1">
              <Icon d={ICONS.bell} size={14} className="text-[#8696a0]" />
              Set reminder
            </label>
            <input
              type="datetime-local"
              value={form.reminderAt}
              onChange={(e) => setForm({ ...form, reminderAt: e.target.value })}
              className="w-full bg-[#2a3942] text-[#d1d7db] text-sm rounded-lg px-3 py-2 outline-none border border-transparent focus:border-[#00a884] transition"
            />
          </div>

          <button
            onClick={handleSave}
            className="w-full py-2.5 rounded-lg bg-[#00a884] text-white font-semibold text-sm hover:bg-[#02c197] transition"
          >
            {editing ? "Update note" : "Save note"}
          </button>
        </div>
      ) : (
        /* ── Notes list ── */
        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-[#8696a0] text-sm">Loading...</div>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-[#8696a0]">
              <Icon d={ICONS.notes} size={40} className="opacity-30" />
              <p className="text-sm">No notes yet. Tap + to create one.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <div
                  key={note._id}
                  className="rounded-xl p-4 relative group cursor-pointer"
                  style={{ backgroundColor: note.color || "#1e2a30" }}
                  onClick={() => openEdit(note)}
                >
                  {/* Pin badge */}
                  {note.isPinned && (
                    <Icon d={ICONS.pin} size={14} className="absolute top-3 right-10 text-[#00a884]" />
                  )}

                  {/* Actions */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={(e) => { e.stopPropagation(); handlePin(note); }}
                      className="w-7 h-7 rounded-full bg-[#111b21]/60 flex items-center justify-center hover:bg-[#00a884]/80 transition"
                    >
                      <Icon d={ICONS.pin} size={13} className="text-[#aebac1]" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(note._id); }}
                      className="w-7 h-7 rounded-full bg-[#111b21]/60 flex items-center justify-center hover:bg-red-500/80 transition"
                    >
                      <Icon d={ICONS.trash} size={13} className="text-[#aebac1]" />
                    </button>
                  </div>

                  <p className="text-[#e9edef] font-semibold text-sm mb-1 pr-14 truncate">
                    {note.title}
                  </p>
                  <p className="text-[#8696a0] text-xs leading-relaxed line-clamp-3">
                    {note.content || <span className="italic">No content</span>}
                  </p>

                  {/* Reminder badge */}
                  {note.reminderAt && (
                    <div className="flex items-center gap-1 mt-2">
                      <Icon d={ICONS.bell} size={11} className={note.reminderSent ? "text-[#8696a0]" : "text-[#00a884]"} />
                      <span className={`text-[10px] ${note.reminderSent ? "text-[#8696a0]" : "text-[#00a884]"}`}>
                        {new Date(note.reminderAt).toLocaleString()}
                        {note.reminderSent && " · Sent"}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   PROFILE VIEW PANEL
───────────────────────────────────────────── */
const ProfilePanel = ({ onClose }) => {
  const { user } = useAuth();
  return (
    <div className="flex flex-col h-full bg-[#111b21]">
      <div className="flex items-center gap-4 px-4 py-4 bg-[#202c33]">
        <button onClick={onClose} className="text-[#aebac1] hover:text-[#e9edef] transition">
          <Icon d={ICONS.close} size={20} />
        </button>
        <h2 className="text-[#e9edef] font-semibold text-base">Profile</h2>
      </div>
      <div className="flex flex-col items-center gap-4 p-6">
        <div className="w-32 h-32 rounded-full bg-[#374045] overflow-hidden flex items-center justify-center text-4xl font-bold text-white">
          {user?.avatar ? (
            <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            user?.username?.[0]?.toUpperCase()
          )}
        </div>
        <div className="text-center">
          <p className="text-[#e9edef] text-xl font-semibold">{user?.username}</p>
          <p className="text-[#8696a0] text-sm mt-0.5">{user?.email}</p>
        </div>
        <div className="w-full bg-[#202c33] rounded-xl p-4 mt-2">
          <p className="text-[#00a884] text-xs font-medium uppercase tracking-wider mb-1">About</p>
          <p className="text-[#d1d7db] text-sm">{user?.about || "Hey there! I am using this app."}</p>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   MAIN SIDEBAR
───────────────────────────────────────────── */
const PANELS = { settings: SettingsPanel, calls: CallsPanel, notes: NotesPanel, profile: ProfilePanel };

const Sidebar = ({ onReminderAlert }) => {
  const [active, setActive] = useState(null);

  const toggle = (panel) => setActive((prev) => (prev === panel ? null : panel));

  const ActivePanel = active ? PANELS[active] : null;

  return (
    <div className="flex h-full">
      {/* ── Icon strip ── */}
      <div className="flex flex-col items-center py-3 gap-1 bg-[#202c33] w-[62px] shrink-0 border-r border-[#2a3942]">
        {/* Top nav */}
        <div className="flex flex-col gap-1 flex-1">
          <NavBtn icon="chat"     label="Chats"    active={false}              onClick={() => {}} />
          <NavBtn icon="calls"    label="Calls"    active={active === "calls"} onClick={() => toggle("calls")} />
          <NavBtn icon="notes"    label="Notes"    active={active === "notes"} onClick={() => toggle("notes")} />
        </div>

        {/* Bottom nav */}
        <div className="flex flex-col gap-1">
          <NavBtn icon="profile"  label="Profile"  active={active === "profile"}  onClick={() => toggle("profile")} />
          <NavBtn icon="settings" label="Settings" active={active === "settings"} onClick={() => toggle("settings")} />
        </div>
      </div>

      {/* ── Sliding panel ── */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out bg-[#111b21] ${
          active ? "w-[340px]" : "w-0"
        }`}
        style={{ minWidth: active ? "280px" : "0" }}
      >
        {ActivePanel && <ActivePanel onClose={() => setActive(null)} />}
      </div>
    </div>
  );
};

export default Sidebar;
