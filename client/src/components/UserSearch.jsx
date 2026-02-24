import React, { useState, useEffect, useRef } from "react";
import API from "../utils/api";

/* ── Debounce hook ── */
const useDebounce = (value, delay) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

const Icon = ({ d, size = 18, className = "" }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={`fill-current ${className}`}>
    <path d={d} />
  </svg>
);

const ICONS = {
  search:  "M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z",
  close:   "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
  check:   "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17",
  bell:    "M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z",
  chat:    "M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z",
  add:     "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",
  pending: "M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z",
};

/* ─────────────────────────────────────────────
   ACTION BUTTON — changes based on relation
───────────────────────────────────────────── */
const RequestButton = ({ user, onAction }) => {
  const [loading, setLoading] = useState(false);

  const handle = async (fn) => {
    setLoading(true);
    try { await fn(); }
    finally { setLoading(false); }
  };

  const { relationStatus, requestId, _id } = user;

  if (relationStatus === "friends") {
    return (
      <button
        onClick={() => onAction("open-chat", user)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00a884]/20 text-[#00a884] text-xs font-semibold hover:bg-[#00a884]/30 transition"
      >
        <Icon d={ICONS.chat} size={13} />
        Message
      </button>
    );
  }

  if (relationStatus === "sent") {
    return (
      <button
        disabled={loading}
        onClick={() => handle(async () => {
          await API.delete(`/user/request/${requestId}`);
          onAction("cancelled", user);
        })}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2a3942] text-[#8696a0] text-xs font-semibold hover:bg-[#374045] transition disabled:opacity-50"
      >
        <Icon d={ICONS.pending} size={13} />
        {loading ? "..." : "Requested"}
      </button>
    );
  }

  if (relationStatus === "incoming") {
    return (
      <div className="flex gap-1.5">
        <button
          disabled={loading}
          onClick={() => handle(async () => {
            const { data } = await API.put(`/user/request/${requestId}/accept`);
            onAction("accepted", user, data.chat);
          })}
          className="px-3 py-1.5 rounded-lg bg-[#00a884] text-white text-xs font-semibold hover:bg-[#02c197] transition disabled:opacity-50"
        >
          {loading ? "..." : "Accept"}
        </button>
        <button
          disabled={loading}
          onClick={() => handle(async () => {
            await API.put(`/user/request/${requestId}/decline`);
            onAction("declined", user);
          })}
          className="px-3 py-1.5 rounded-lg bg-[#2a3942] text-[#ef4444] text-xs font-semibold hover:bg-[#374045] transition disabled:opacity-50"
        >
          Decline
        </button>
      </div>
    );
  }

  // "none" — send request
  return (
    <button
      disabled={loading}
      onClick={() => handle(async () => {
        await API.post(`/user/request/${_id}`);
        onAction("sent", user);
      })}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00a884] text-white text-xs font-semibold hover:bg-[#02c197] transition disabled:opacity-50"
    >
      <Icon d={ICONS.add} size={13} />
      {loading ? "Sending..." : "Add"}
    </button>
  );
};

/* ─────────────────────────────────────────────
   INCOMING REQUESTS DROPDOWN
───────────────────────────────────────────── */
const IncomingRequestsPanel = ({ onAccepted, onClose }) => {
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    API.get("/user/requests")
      .then(({ data }) => setRequests(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const accept = async (req) => {
    const { data } = await API.put(`/user/request/${req._id}/accept`);
    setRequests((prev) => prev.filter((r) => r._id !== req._id));
    onAccepted(data.chat);
  };

  const decline = async (req) => {
    await API.put(`/user/request/${req._id}/decline`);
    setRequests((prev) => prev.filter((r) => r._id !== req._id));
  };

  return (
    <div className="absolute top-12 right-0 w-80 bg-[#233138] border border-[#2a3942] rounded-xl shadow-2xl z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a3942]">
        <p className="text-[#e9edef] font-semibold text-sm">Connection Requests</p>
        <button onClick={onClose} className="text-[#8696a0] hover:text-[#e9edef] transition">
          <Icon d={ICONS.close} size={16} />
        </button>
      </div>

      <div className="max-h-72 overflow-y-auto">
        {loading ? (
          <p className="text-[#8696a0] text-sm text-center py-6">Loading...</p>
        ) : requests.length === 0 ? (
          <p className="text-[#8696a0] text-sm text-center py-6">No pending requests</p>
        ) : (
          requests.map((req) => (
            <div key={req._id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#2a3942] transition border-b border-[#2a3942]/40 last:border-0">
              <div className="w-10 h-10 rounded-full bg-[#374045] flex items-center justify-center text-white font-semibold shrink-0 overflow-hidden">
                {req.from.avatar
                  ? <img src={req.from.avatar} alt={req.from.username} className="w-full h-full object-cover" />
                  : req.from.username?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#e9edef] text-sm font-medium truncate">{req.from.username}</p>
                <p className="text-[#8696a0] text-xs truncate">{req.from.about}</p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button
                  onClick={() => accept(req)}
                  className="w-8 h-8 rounded-full bg-[#00a884] flex items-center justify-center hover:bg-[#02c197] transition"
                  title="Accept"
                >
                  <Icon d={ICONS.check} size={15} className="text-white" />
                </button>
                <button
                  onClick={() => decline(req)}
                  className="w-8 h-8 rounded-full bg-[#2a3942] flex items-center justify-center hover:bg-[#ef4444]/30 transition"
                  title="Decline"
                >
                  <Icon d={ICONS.close} size={15} className="text-[#ef4444]" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   MAIN EXPORT
───────────────────────────────────────────── */
const UserSearch = ({ onChatOpen }) => {
  const [query,        setQuery]        = useState("");
  const [results,      setResults]      = useState([]);
  const [searching,    setSearching]    = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [reqCount,     setReqCount]     = useState(0);

  const debouncedQuery = useDebounce(query, 350);
  const bellRef        = useRef();

  // Fetch incoming count on mount
  useEffect(() => {
    API.get("/user/requests")
      .then(({ data }) => setReqCount(data.length))
      .catch(() => {});
  }, []);

  // Search on debounced query
  useEffect(() => {
    if (!debouncedQuery.trim()) { setResults([]); return; }
    setSearching(true);
    API.get(`/user/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then(({ data }) => setResults(data))
      .catch(console.error)
      .finally(() => setSearching(false));
  }, [debouncedQuery]);

  const updateResult = (userId, newStatus, newRequestId = null) =>
    setResults((prev) =>
      prev.map((u) =>
        u._id === userId
          ? { ...u, relationStatus: newStatus, requestId: newRequestId ?? u.requestId }
          : u
      )
    );

  const handleAction = (action, user, chat = null) => {
    switch (action) {
      case "sent":      return updateResult(user._id, "sent");
      case "cancelled": return updateResult(user._id, "none", null);
      case "declined":  return updateResult(user._id, "none");
      case "accepted":
        updateResult(user._id, "friends");
        setReqCount((c) => Math.max(0, c - 1));
        if (chat) onChatOpen(chat);
        return;
      case "open-chat":
        API.post("/chat", { userId: user._id })
          .then(({ data }) => onChatOpen(data))
          .catch(console.error);
        return;
    }
  };

  return (
    <div className="relative">
      {/* Search bar + Bell */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#111b21]">
        <div className="flex items-center flex-1 bg-[#202c33] rounded-lg px-3 gap-2">
          <Icon d={ICONS.search} size={16} className="text-[#8696a0] shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by username..."
            className="bg-transparent text-[#d1d7db] placeholder-[#8696a0] text-sm py-2 outline-none w-full"
          />
          {query && (
            <button onClick={() => { setQuery(""); setResults([]); }}>
              <Icon d={ICONS.close} size={15} className="text-[#8696a0] hover:text-[#e9edef] transition" />
            </button>
          )}
        </div>

        {/* Bell */}
        <div className="relative shrink-0" ref={bellRef}>
          <button
            onClick={() => setShowRequests((v) => !v)}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition ${
              showRequests ? "bg-[#00a884] text-white" : "text-[#8696a0] hover:bg-[#2a3942]"
            }`}
          >
            <Icon d={ICONS.bell} size={18} />
          </button>
          {reqCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center pointer-events-none">
              {reqCount > 9 ? "9+" : reqCount}
            </span>
          )}
          {showRequests && (
            <IncomingRequestsPanel
              onAccepted={(chat) => {
                setReqCount((c) => Math.max(0, c - 1));
                setShowRequests(false);
                onChatOpen(chat);
              }}
              onClose={() => setShowRequests(false)}
            />
          )}
        </div>
      </div>

      {/* Search results */}
      {query && (results.length > 0 || searching) && (
        <div className="mx-3 mb-2 bg-[#233138] border border-[#2a3942] rounded-xl overflow-hidden shadow-xl z-40 relative">
          {searching ? (
            <p className="text-[#8696a0] text-sm text-center py-4">Searching...</p>
          ) : (
            results.map((u) => (
              <div
                key={u._id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-[#2a3942] transition border-b border-[#2a3942]/40 last:border-0"
              >
                <div className="w-10 h-10 rounded-full bg-[#374045] flex items-center justify-center text-white font-semibold shrink-0 overflow-hidden">
                  {u.avatar
                    ? <img src={u.avatar} alt={u.username} className="w-full h-full object-cover" />
                    : u.username?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#e9edef] text-sm font-medium truncate">{u.username}</p>
                  <p className="text-[#8696a0] text-xs truncate">{u.about}</p>
                </div>
                <div className="shrink-0">
                  <RequestButton user={u} onAction={handleAction} />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* No results */}
      {!searching && query && results.length === 0 && (
        <div className="mx-3 mb-2 bg-[#233138] border border-[#2a3942] rounded-xl py-4 text-center">
          <p className="text-[#8696a0] text-sm">No users found for "{query}"</p>
        </div>
      )}
    </div>
  );
};

export default UserSearch;
