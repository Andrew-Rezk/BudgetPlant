import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { supabase } from "./supabase";

/* ─── Default Categories ─── */
const DEFAULT_CATEGORIES = [
  { cat_id: "housing", label: "Housing", icon: "🏠", color: "#E07A5F", sort_order: 0 },
  { cat_id: "groceries", label: "Groceries", icon: "🛒", color: "#81B29A", sort_order: 1 },
  { cat_id: "dining", label: "Dining", icon: "🍽️", color: "#F2CC8F", sort_order: 2 },
  { cat_id: "transport", label: "Transport", icon: "🚗", color: "#3D405B", sort_order: 3 },
  { cat_id: "utilities", label: "Utilities", icon: "⚡", color: "#5E81AC", sort_order: 4 },
  { cat_id: "entertainment", label: "Entertainment", icon: "🎬", color: "#B48EAD", sort_order: 5 },
  { cat_id: "shopping", label: "Shopping", icon: "🛍️", color: "#D08770", sort_order: 6 },
  { cat_id: "health", label: "Health", icon: "💊", color: "#A3BE8C", sort_order: 7 },
  { cat_id: "subscriptions", label: "Subscriptions", icon: "🔄", color: "#8FBCBB", sort_order: 8 },
  { cat_id: "income", label: "Income", icon: "💰", color: "#2E7D32", sort_order: 9 },
  { cat_id: "transfer", label: "Transfer", icon: "🔁", color: "#78909C", sort_order: 10 },
  { cat_id: "other", label: "Other", icon: "📦", color: "#90A4AE", sort_order: 11 },
];

const ICON_OPTIONS = ["🏠","🛒","🍽️","🚗","⚡","🎬","🛍️","💊","🔄","💰","🔁","📦","🎮","🐶","🎓","✈️","🏋️","💇","🎁","📱","🏥","🎵","📚","🧾","💳","🏦","🌿","☕","🍕","🎯","⛽","🧹","👶","💻","🔧","🎨","🏖️","🚌","🧘","🪴"];
const COLOR_OPTIONS = ["#E07A5F","#81B29A","#F2CC8F","#3D405B","#5E81AC","#B48EAD","#D08770","#A3BE8C","#8FBCBB","#2E7D32","#78909C","#90A4AE","#EF5350","#AB47BC","#42A5F5","#26A69A","#FF7043","#8D6E63","#EC407A","#7E57C2","#29B6F6","#66BB6A","#FFA726","#5C6BC0"];

const KEYWORDS = {
  housing: ["rent", "mortgage", "property", "hoa", "real estate", "landlord", "lease"],
  groceries: ["grocery", "supermarket", "walmart", "costco", "trader joe", "whole foods", "safeway", "kroger", "aldi", "market", "food mart", "publix", "wegmans", "target", "freshco", "no fril", "metro ", "fortinos"],
  dining: ["restaurant", "cafe", "coffee", "starbucks", "mcdonald", "burger", "pizza", "doordash", "uber eats", "grubhub", "chipotle", "subway", "dunkin", "wendy", "taco bell", "panda express", "diner", "bar ", "pub ", "grill", "sushi", "thai", "noodle", "bakery", "tim horton", "osmow", "poulet", "roadhou", "hideawa", "chocolato", "shanghai", "local by ma"],
  transport: ["gas", "fuel", "shell", "chevron", "uber", "lyft", "taxi", "parking", "transit", "metro", "bus", "train", "toll", "auto", "car wash", "petro", "esso", "bp ", "presto", "ultramar", "costco gas", "mobil@", "kia"],
  utilities: ["electric", "power", "water", "gas bill", "internet", "phone", "mobile", "verizon", "at&t", "t-mobile", "comcast", "spectrum", "hydro", "sewer", "garbage", "waste", "telus", "rogers", "bell canada", "fido", "freedom mobile", "ebox", "enbridge", "alectra"],
  entertainment: ["netflix", "spotify", "movie", "theater", "theatre", "game", "steam", "playstation", "xbox", "concert", "ticket", "hulu", "disney+", "hbo", "apple tv", "youtube premium", "twitch", "cinema", "board gam", "fit4less"],
  shopping: ["amazon", "ebay", "etsy", "shop", "store", "mall", "clothing", "apparel", "nike", "adidas", "zara", "h&m", "best buy", "home depot", "ikea", "wayfair", "nordstrom", "canadian tire", "dollar tree", "dollarama", "pet valu"],
  health: ["pharmacy", "doctor", "medical", "dental", "hospital", "clinic", "health", "drug mart", "cvs", "walgreens", "optom", "vision", "therapy", "physio", "chiro", "psycho", "nail loung", "hair desi", "compass cen"],
  subscriptions: ["subscription", "membership", "annual fee", "monthly fee", "premium", "plan", "aws", "adobe", "microsoft 365", "github", "slack", "hp *instant", "airalo", "zensurance", "account fee"],
  income: ["payroll", "salary", "deposit", "direct dep", "income", "dividend", "interest earned", "refund", "tax refund", "cashback", "reimbursement", "inorbital", "m. lucas", "rebate", "mobile deposit", "e-tfr.*epay"],
  transfer: ["transfer", "e-transfer", "interac", "etransfer", "zelle", "venmo", "paypal", "wire", "eft", "ach", "send e-tfr", "tfr-to", "amex", "bill pymt", "loan payment", "nslsc", "intact ins", "college of reg", "cra"],
};

function categorize(description) {
  const lower = (description || "").toLowerCase();
  for (const [cat, keys] of Object.entries(KEYWORDS)) {
    if (keys.some((k) => lower.includes(k))) return cat;
  }
  return "other";
}

function parseAmount(val) {
  if (typeof val === "number") return val;
  const cleaned = String(val).replace(/[$,\s"]/g, "").replace(/\((.+)\)/, "-$1");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function parseDate(val) {
  if (!val) return null;
  const s = String(val).trim();
  const formats = [/^(\d{4})-(\d{1,2})-(\d{1,2})/, /^(\d{1,2})\/(\d{1,2})\/(\d{4})/, /^(\d{1,2})-(\d{1,2})-(\d{4})/, /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/];
  let d = new Date(s);
  if (!isNaN(d.getTime()) && s.match(formats[0])) return d;
  for (const fmt of formats) {
    const m = s.match(fmt);
    if (m) {
      if (fmt === formats[0]) d = new Date(+m[1], +m[2] - 1, +m[3]);
      else if (fmt === formats[3]) d = new Date(2000 + +m[3], +m[1] - 1, +m[2]);
      else d = new Date(+m[3], +m[1] - 1, +m[2]);
      if (!isNaN(d.getTime())) return d;
    }
  }
  return null;
}

function detectColumns(row) {
  const cols = { dateCol: -1, descCol: -1, amountCol: -1, debitCol: -1, creditCol: -1 };
  for (let i = 0; i < row.length; i++) {
    const val = String(row[i]).trim();
    if (cols.dateCol === -1 && parseDate(val)) { cols.dateCol = i; continue; }
    if (cols.descCol === -1 && val.length > 0 && isNaN(parseFloat(val.replace(/[$,]/g, ""))) && !parseDate(val)) { cols.descCol = i; continue; }
  }
  const numericCols = [];
  for (let i = 0; i < row.length; i++) {
    if (i === cols.dateCol || i === cols.descCol) continue;
    const val = String(row[i]).trim();
    if (val === "" || !isNaN(parseFloat(val.replace(/[$,]/g, "")))) numericCols.push(i);
  }
  if (numericCols.length >= 3) { cols.debitCol = numericCols[0]; cols.creditCol = numericCols[1]; }
  else if (numericCols.length === 1) { cols.amountCol = numericCols[0]; }
  else if (numericCols.length === 2) { cols.amountCol = numericCols[0]; }
  return { dateCol: Math.max(cols.dateCol, 0), descCol: Math.max(cols.descCol, 1), amountCol: cols.amountCol, debitCol: cols.debitCol, creditCol: cols.creditCol };
}

function detectColumnsFromHeaders(headers, firstRow) {
  const h = headers.map((x) => x.toLowerCase().trim());
  let dateCol = h.findIndex((x) => /^date|trans.*date|posted/.test(x));
  let descCol = h.findIndex((x) => /desc|narr|memo|detail|payee|merchant|name/.test(x));
  let amountCol = h.findIndex((x) => /^amount$|^sum$|^value$/.test(x));
  let debitCol = h.findIndex((x) => /debit|withdrawal|expense|charge/.test(x));
  let creditCol = h.findIndex((x) => /credit|deposit/.test(x));
  if (dateCol === -1) dateCol = h.findIndex((_, i) => parseDate(firstRow?.[i]) !== null);
  if (descCol === -1) descCol = h.findIndex((x, i) => i !== dateCol && i !== amountCol && isNaN(parseAmount(firstRow?.[i])));
  if (amountCol === -1 && debitCol === -1) amountCol = h.findIndex((_, i) => i !== dateCol && i !== descCol && !isNaN(parseFloat(String(firstRow?.[i]).replace(/[$,]/g, ""))));
  return { dateCol: Math.max(dateCol, 0), descCol: Math.max(descCol, 1), amountCol, debitCol, creditCol };
}

function splitCSVLine(line) {
  const result = []; let current = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') inQ = !inQ;
    else if (ch === "," && !inQ) { result.push(current.trim()); current = ""; }
    else current += ch;
  }
  result.push(current.trim());
  return result;
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 1) return [];
  const firstRow = splitCSVLine(lines[0]);
  const firstRowHasDate = firstRow.some((val) => parseDate(val) !== null);
  let cols, dataRows;
  if (firstRowHasDate) {
    cols = detectColumns(firstRow);
    dataRows = lines.map(splitCSVLine);
  } else {
    if (lines.length < 2) return [];
    dataRows = lines.slice(1).map(splitCSVLine);
    cols = detectColumnsFromHeaders(firstRow, dataRows[0]);
  }
  return dataRows.map((r) => {
    let amount;
    if (cols.amountCol >= 0) {
      amount = parseAmount(r[cols.amountCol]);
    } else if (cols.debitCol >= 0 || cols.creditCol >= 0) {
      const debitStr = cols.debitCol >= 0 ? String(r[cols.debitCol]).trim() : "";
      const creditStr = cols.creditCol >= 0 ? String(r[cols.creditCol]).trim() : "";
      const debit = debitStr ? parseAmount(debitStr) : 0;
      const credit = creditStr ? parseAmount(creditStr) : 0;
      if (credit && credit !== 0) amount = Math.abs(credit);
      else if (debit && debit !== 0) amount = -Math.abs(debit);
      else amount = 0;
    } else { amount = 0; }
    const desc = (r[cols.descCol] || "Unknown").replace(/^"|"$/g, "").trim();
    const date = parseDate(r[cols.dateCol]);
    if (!date) return null;
    return { date: date.toISOString().slice(0, 10), description: desc, amount, category: categorize(desc), manual_category: false };
  }).filter(Boolean);
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
function formatMoney(n) { const abs = Math.abs(n); const f = abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); return n < 0 ? `-$${f}` : `$${f}`; }

/* ─── Shared Styles ─── */
const inputStyle = { width: "100%", padding: "10px 14px", background: "#222", border: "1px solid #333", borderRadius: 10, color: "#E0E0E0", fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none", transition: "border-color 0.15s" };
const labelStyle = { fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 6, display: "block" };
const btnPrimary = { width: "100%", padding: "12px", background: "#E07A5F", border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s", boxShadow: "0 2px 12px rgba(224,122,95,0.25)" };

/* ═══════════════ AUTH SCREEN ═══════════════ */
function AuthScreen({ onAuth }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) { setError("Fill in both fields"); return; }
    if (password.length < 6) { setError("Password must be 6+ characters"); return; }
    setLoading(true); setError("");
    try {
      let result;
      if (mode === "register") {
        result = await supabase.auth.signUp({ email: email.trim(), password: password.trim() });
      } else {
        result = await supabase.auth.signInWithPassword({ email: email.trim(), password: password.trim() });
      }
      if (result.error) { setError(result.error.message); setLoading(false); return; }
      // onAuth will be triggered by the auth state listener
    } catch (e) { setError("Something went wrong"); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#111", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 380, animation: "fadeInUp 0.5s ease" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 36, color: "#F5F5F5", fontWeight: 400, marginBottom: 6 }}>Budget</h1>
          <p style={{ fontSize: 14, color: "#555" }}>Track every dollar, effortlessly</p>
        </div>
        <div style={{ background: "#1a1a1a", borderRadius: 16, border: "1px solid #222", padding: 28 }}>
          <div style={{ display: "flex", marginBottom: 24, background: "#151515", borderRadius: 10, padding: 3 }}>
            {["login", "register"].map((m) => (
              <button key={m} onClick={() => { setMode(m); setError(""); }} style={{
                flex: 1, padding: "10px", border: "none", borderRadius: 8, cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, transition: "all 0.2s",
                background: mode === m ? "#282828" : "transparent", color: mode === m ? "#E0E0E0" : "#555",
              }}>{m === "login" ? "Sign In" : "Create Account"}</button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={labelStyle}>Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" type="email"
                style={inputStyle} onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                onFocus={(e) => e.target.style.borderColor = "#E07A5F"} onBlur={(e) => e.target.style.borderColor = "#333"} />
            </div>
            <div>
              <label style={labelStyle}>Password</label>
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••"
                style={inputStyle} onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                onFocus={(e) => e.target.style.borderColor = "#E07A5F"} onBlur={(e) => e.target.style.borderColor = "#333"} />
            </div>
            {error && <div style={{ fontSize: 13, color: "#EF5350", textAlign: "center", padding: "8px 12px", background: "#EF535012", borderRadius: 8 }}>{error}</div>}
            <button onClick={handleSubmit} disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.6 : 1 }}>
              {loading ? "..." : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </div>
          <p style={{ fontSize: 11, color: "#444", textAlign: "center", marginTop: 16 }}>
            {mode === "register" ? "Check your email to confirm your account" : "Your data syncs across all devices"}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ MODAL ═══════════════ */
function Modal({ title, onClose, children, width = 400 }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(10,10,10,0.7)", backdropFilter: "blur(6px)" }} />
      <div onClick={(e) => e.stopPropagation()} style={{
        position: "relative", background: "#1E1E1E", border: "1px solid #333", borderRadius: 16,
        padding: 28, width, maxWidth: "95vw", maxHeight: "85vh", overflowY: "auto", animation: "fadeInUp 0.25s ease",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#888", textTransform: "uppercase", letterSpacing: 1.5 }}>{title}</div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#555", fontSize: 20, cursor: "pointer", padding: 4, lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ═══════════════ EDIT TRANSACTION ═══════════════ */
function EditTransactionModal({ tx, categories, onSave, onDelete, onClose }) {
  const [desc, setDesc] = useState(tx.description);
  const [amount, setAmount] = useState(String(tx.amount));
  const [date, setDate] = useState(tx.date);
  const [cat, setCat] = useState(tx.category);

  return (
    <Modal title="Edit Transaction" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={labelStyle}>Description</label>
          <input value={desc} onChange={(e) => setDesc(e.target.value)} style={inputStyle}
            onFocus={(e) => e.target.style.borderColor = "#E07A5F"} onBlur={(e) => e.target.style.borderColor = "#333"} />
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Amount</label>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} style={inputStyle} type="number" step="0.01"
              onFocus={(e) => e.target.style.borderColor = "#E07A5F"} onBlur={(e) => e.target.style.borderColor = "#333"} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Date</label>
            <input value={date} onChange={(e) => setDate(e.target.value)} style={{ ...inputStyle, colorScheme: "dark" }} type="date"
              onFocus={(e) => e.target.style.borderColor = "#E07A5F"} onBlur={(e) => e.target.style.borderColor = "#333"} />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Category</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {categories.map((c) => (
              <button key={c.cat_id} onClick={() => setCat(c.cat_id)} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 8, cursor: "pointer",
                fontSize: 13, fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
                background: cat === c.cat_id ? `${c.color}25` : "#222",
                border: cat === c.cat_id ? `1px solid ${c.color}66` : "1px solid #333",
                color: cat === c.cat_id ? c.color : "#999",
              }}>
                <span style={{ fontSize: 14 }}>{c.icon}</span> {c.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button onClick={() => onDelete(tx.id)} style={{
            padding: "11px 18px", background: "transparent", border: "1px solid #EF535044", borderRadius: 10,
            color: "#EF5350", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
          }}>Delete</button>
          <button onClick={() => {
            const parsedAmount = parseFloat(amount);
            if (isNaN(parsedAmount) || !desc.trim() || !date) return;
            onSave({ ...tx, description: desc.trim(), amount: parsedAmount, date, category: cat, manual_category: true });
          }} style={{ ...btnPrimary, flex: 1 }}>Save Changes</button>
        </div>
      </div>
    </Modal>
  );
}

/* ═══════════════ MANAGE CATEGORIES ═══════════════ */
function ManageCategoriesModal({ categories, onSave, onClose }) {
  const [cats, setCats] = useState(categories);
  const [adding, setAdding] = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  const [form, setForm] = useState({ label: "", icon: "📦", color: "#5E81AC" });

  const startAdd = () => { setForm({ label: "", icon: "📦", color: "#5E81AC" }); setAdding(true); setEditIdx(null); };
  const startEdit = (i) => { setForm({ label: cats[i].label, icon: cats[i].icon, color: cats[i].color }); setEditIdx(i); setAdding(false); };
  const cancelForm = () => { setAdding(false); setEditIdx(null); };

  const saveForm = () => {
    if (!form.label.trim()) return;
    if (adding) {
      const cat_id = form.label.trim().toLowerCase().replace(/[^a-z0-9]/g, "_") + "_" + Date.now().toString(36);
      setCats([...cats, { cat_id, label: form.label.trim(), icon: form.icon, color: form.color, sort_order: cats.length }]);
    } else if (editIdx !== null) {
      const updated = [...cats];
      updated[editIdx] = { ...updated[editIdx], label: form.label.trim(), icon: form.icon, color: form.color };
      setCats(updated);
    }
    cancelForm();
  };

  const deleteAt = (i) => { if (cats.length <= 1) return; setCats(cats.filter((_, idx) => idx !== i)); };
  const showForm = adding || editIdx !== null;

  return (
    <Modal title="Manage Categories" onClose={onClose} width={440}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 16, maxHeight: 260, overflowY: "auto" }}>
        {cats.map((c, i) => (
          <div key={c.cat_id} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10,
            background: editIdx === i ? `${c.color}15` : "transparent",
          }}>
            <span style={{ fontSize: 18, width: 28, textAlign: "center" }}>{c.icon}</span>
            <span style={{ flex: 1, fontSize: 14, color: "#ccc" }}>{c.label}</span>
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
            <button onClick={() => startEdit(i)} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 13, padding: "2px 6px" }}>✎</button>
            <button onClick={() => deleteAt(i)} style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: 15, padding: "2px 6px" }}>×</button>
          </div>
        ))}
      </div>
      {showForm && (
        <div style={{ background: "#171717", borderRadius: 12, padding: 16, marginBottom: 16, border: "1px solid #2a2a2a" }}>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Name</label>
            <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} style={inputStyle} placeholder="e.g. Pets"
              onFocus={(e) => e.target.style.borderColor = "#E07A5F"} onBlur={(e) => e.target.style.borderColor = "#333"} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Icon</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {ICON_OPTIONS.map((ic) => (
                <button key={ic} onClick={() => setForm({ ...form, icon: ic })} style={{
                  width: 34, height: 34, borderRadius: 8, border: form.icon === ic ? "2px solid #E07A5F" : "1px solid #2a2a2a",
                  background: form.icon === ic ? "#E07A5F18" : "#1a1a1a", cursor: "pointer", fontSize: 16,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>{ic}</button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Color</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {COLOR_OPTIONS.map((co) => (
                <button key={co} onClick={() => setForm({ ...form, color: co })} style={{
                  width: 26, height: 26, borderRadius: "50%", background: co, border: form.color === co ? "2px solid #fff" : "2px solid transparent",
                  cursor: "pointer",
                }} />
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={cancelForm} style={{ flex: 1, padding: 10, background: "transparent", border: "1px solid #333", borderRadius: 8, color: "#888", cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
            <button onClick={saveForm} style={{ flex: 1, padding: 10, background: "#E07A5F", border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
              {adding ? "Add" : "Update"}
            </button>
          </div>
        </div>
      )}
      {!showForm && (
        <button onClick={startAdd} style={{
          width: "100%", padding: "11px", border: "1px dashed #333", borderRadius: 10,
          background: "transparent", color: "#888", fontSize: 13, cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif", marginBottom: 16,
        }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#E07A5F"; e.currentTarget.style.color = "#E07A5F"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#333"; e.currentTarget.style.color = "#888"; }}>
          + Add Category
        </button>
      )}
      <button onClick={() => onSave(cats)} style={btnPrimary}>Save Categories</button>
    </Modal>
  );
}

/* ═══════════════ MANAGE RECURRING RULES ═══════════════ */
function ManageRulesModal({ rules, categories, onSave, onClose }) {
  const [items, setItems] = useState(rules);
  const [adding, setAdding] = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  const [form, setForm] = useState({ label: "", matchType: "amount", amount: "", matchName: "", category: "housing" });

  const catMap = Object.fromEntries(categories.map((c) => [c.cat_id, c]));

  const startAdd = () => { setForm({ label: "", matchType: "amount", amount: "", matchName: "", category: "housing" }); setAdding(true); setEditIdx(null); };
  const startEdit = (i) => { const r = items[i]; setForm({ label: r.label, matchType: r.match_name ? "name" : "amount", amount: String(Math.abs(r.amount || 0)), matchName: r.match_name || "", category: r.category }); setEditIdx(i); setAdding(false); };
  const cancelForm = () => { setAdding(false); setEditIdx(null); };

  const saveForm = () => {
    if (!form.label.trim()) return;
    let ruleData;
    if (form.matchType === "name") {
      if (!form.matchName.trim()) return;
      ruleData = { label: form.label.trim(), amount: 0, match_name: form.matchName.trim(), category: form.category };
    } else {
      const amt = parseFloat(form.amount);
      if (isNaN(amt) || amt === 0) return;
      ruleData = { label: form.label.trim(), amount: amt, match_name: null, category: form.category };
    }
    if (adding) {
      setItems([...items, ruleData]);
    } else if (editIdx !== null) {
      const updated = [...items];
      updated[editIdx] = { ...updated[editIdx], ...ruleData };
      setItems(updated);
    }
    cancelForm();
  };

  const deleteAt = (i) => setItems(items.filter((_, idx) => idx !== i));
  const showForm = adding || editIdx !== null;

  return (
    <Modal title="Recurring Rules" onClose={onClose} width={460}>
      <div style={{ fontSize: 12, color: "#666", marginBottom: 16, lineHeight: 1.5 }}>
        When a transaction matches by amount or name, it auto-labels with the name and category you set here.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 16, maxHeight: 280, overflowY: "auto" }}>
        {items.length === 0 && !showForm && (
          <div style={{ textAlign: "center", padding: "24px", color: "#444", fontSize: 13 }}>No rules yet — add one below</div>
        )}
        {items.map((r, i) => {
          const cat = catMap[r.category] || { icon: "📦", color: "#90A4AE", label: r.category };
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10,
              background: editIdx === i ? "#1a1a1a" : "transparent",
            }}>
              <span style={{ fontSize: 16, width: 24, textAlign: "center" }}>{cat.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, color: "#ccc" }}>{r.label}</div>
                <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>
                  {r.match_name ? `"${r.match_name}"` : `$${Math.abs(r.amount).toFixed(2)}`} → {cat.label}
                </div>
              </div>
              <button onClick={() => startEdit(i)} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 13, padding: "2px 6px" }}>✎</button>
              <button onClick={() => deleteAt(i)} style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: 15, padding: "2px 6px" }}>×</button>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div style={{ background: "#171717", borderRadius: 12, padding: 16, marginBottom: 16, border: "1px solid #2a2a2a" }}>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Label</label>
            <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} style={inputStyle} placeholder="e.g. Netflix"
              onFocus={(e) => e.target.style.borderColor = "#E07A5F"} onBlur={(e) => e.target.style.borderColor = "#333"} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Match By</label>
            <div style={{ display: "flex", gap: 4, background: "#151515", borderRadius: 8, padding: 3, width: "fit-content" }}>
              {["amount", "name"].map((t) => (
                <button key={t} onClick={() => setForm({ ...form, matchType: t })} style={{
                  padding: "5px 14px", border: "none", borderRadius: 6, cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, transition: "all 0.15s",
                  background: form.matchType === t ? "#282828" : "transparent", color: form.matchType === t ? "#E0E0E0" : "#555",
                }}>{t === "amount" ? "Amount" : "Name"}</button>
              ))}
            </div>
          </div>
          {form.matchType === "amount" ? (
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Exact Amount</label>
              <input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} style={inputStyle} type="number" step="0.01" placeholder="2491.00"
                onFocus={(e) => e.target.style.borderColor = "#E07A5F"} onBlur={(e) => e.target.style.borderColor = "#333"} />
            </div>
          ) : (
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Name Contains</label>
              <input value={form.matchName} onChange={(e) => setForm({ ...form, matchName: e.target.value })} style={inputStyle} placeholder="e.g. NETFLIX"
                onFocus={(e) => e.target.style.borderColor = "#E07A5F"} onBlur={(e) => e.target.style.borderColor = "#333"} />
            </div>
          )}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Category</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {categories.map((c) => (
                <button key={c.cat_id} onClick={() => setForm({ ...form, category: c.cat_id })} style={{
                  display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 7, cursor: "pointer",
                  fontSize: 12, fontFamily: "'DM Sans', sans-serif",
                  background: form.category === c.cat_id ? `${c.color}25` : "#222",
                  border: form.category === c.cat_id ? `1px solid ${c.color}66` : "1px solid #333",
                  color: form.category === c.cat_id ? c.color : "#888",
                }}>
                  <span style={{ fontSize: 13 }}>{c.icon}</span> {c.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={cancelForm} style={{ flex: 1, padding: 10, background: "transparent", border: "1px solid #333", borderRadius: 8, color: "#888", cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
            <button onClick={saveForm} style={{ flex: 1, padding: 10, background: "#E07A5F", border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
              {adding ? "Add Rule" : "Update"}
            </button>
          </div>
        </div>
      )}

      {!showForm && (
        <button onClick={startAdd} style={{
          width: "100%", padding: "11px", border: "1px dashed #333", borderRadius: 10,
          background: "transparent", color: "#888", fontSize: 13, cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif", marginBottom: 16,
        }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#8FBCBB"; e.currentTarget.style.color = "#8FBCBB"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#333"; e.currentTarget.style.color = "#888"; }}>
          + Add Rule
        </button>
      )}
      <button onClick={() => onSave(items)} style={btnPrimary}>Save Rules</button>
    </Modal>
  );
}

/* ═══════════════ PIE CHART ═══════════════ */
function PieChart({ breakdown, selectedCat, onSelectCategory }) {
  const total = breakdown.reduce((s, b) => s + b.total, 0);
  if (total === 0) return null;
  const size = 200, cx = 100, cy = 100, outerR = 88, innerR = 52;
  let angle = -Math.PI / 2;
  const slices = breakdown.map((b) => {
    const sweep = (b.total / total) * 2 * Math.PI;
    const start = angle;
    angle += sweep;
    return { ...b, start, end: angle };
  });
  const arc = (s, e, ro, ri) => {
    const x1 = cx + ro * Math.cos(s), y1 = cy + ro * Math.sin(s);
    const x2 = cx + ro * Math.cos(e), y2 = cy + ro * Math.sin(e);
    const x3 = cx + ri * Math.cos(e), y3 = cy + ri * Math.sin(e);
    const x4 = cx + ri * Math.cos(s), y4 = cy + ri * Math.sin(s);
    const lg = e - s > Math.PI ? 1 : 0;
    return `M${x1} ${y1} A${ro} ${ro} 0 ${lg} 1 ${x2} ${y2} L${x3} ${y3} A${ri} ${ri} 0 ${lg} 0 ${x4} ${y4}Z`;
  };
  const active = selectedCat ? breakdown.find((b) => b.cat_id === selectedCat) : null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap", justifyContent: "center" }}>
      <svg width={size} height={size} style={{ flexShrink: 0 }}>
        {slices.map((s) => (
          <path key={s.cat_id} d={arc(s.start, s.end, outerR, innerR)} fill={s.color}
            opacity={selectedCat && selectedCat !== s.cat_id ? 0.25 : 1}
            style={{ cursor: "pointer", transition: "opacity 0.15s" }}
            onClick={() => onSelectCategory(s.cat_id === selectedCat ? null : s.cat_id)} />
        ))}
        <text x={cx} y={cy - 7} textAnchor="middle" fill="#888" fontSize="10" fontFamily="'DM Sans', sans-serif">{active ? active.label : "Total"}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="#E0E0E0" fontSize="14" fontFamily="'DM Mono', monospace" fontWeight="500">
          {formatMoney(-(active ? active.total : total))}
        </text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
        {breakdown.map((b) => (
          <div key={b.cat_id} onClick={() => onSelectCategory(b.cat_id === selectedCat ? null : b.cat_id)}
            style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
              opacity: selectedCat && selectedCat !== b.cat_id ? 0.3 : 1, transition: "opacity 0.15s" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: b.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "#ccc" }}>{b.icon} {b.label}</span>
            <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: "#666", marginLeft: 6 }}>
              {((b.total / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════ CATEGORY BREAKDOWN ═══════════════ */
function CategoryBreakdown({ transactions, categories, selectedCat, onSelectCategory }) {
  const [chartType, setChartType] = useState("bar");
  const catMap = useMemo(() => Object.fromEntries(categories.map((c) => [c.cat_id, c])), [categories]);
  const breakdown = useMemo(() => {
    const totals = {};
    transactions.forEach((t) => { if (t.amount >= 0) return; totals[t.category] = (totals[t.category] || 0) + Math.abs(t.amount); });
    return Object.entries(totals).map(([id, total]) => ({ ...(catMap[id] || { cat_id: id, label: id, icon: "📦", color: "#90A4AE" }), total })).sort((a, b) => b.total - a.total);
  }, [transactions, catMap]);
  const maxVal = Math.max(...breakdown.map((b) => b.total), 1);
  const totalSpend = breakdown.reduce((s, b) => s + b.total, 0);
  if (breakdown.length === 0) return null;
  return (
    <div>
      <div style={{ display: "flex", gap: 4, marginBottom: 16, background: "#151515", borderRadius: 8, padding: 3, width: "fit-content" }}>
        {["bar", "pie"].map((t) => (
          <button key={t} onClick={() => setChartType(t)} style={{
            padding: "5px 14px", border: "none", borderRadius: 6, cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, transition: "all 0.15s",
            background: chartType === t ? "#282828" : "transparent", color: chartType === t ? "#E0E0E0" : "#555",
          }}>{t === "bar" ? "Bar" : "Pie"}</button>
        ))}
      </div>
      {chartType === "pie" ? (
        <PieChart breakdown={breakdown} selectedCat={selectedCat} onSelectCategory={onSelectCategory} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {breakdown.map((b) => (
            <div key={b.cat_id} onClick={() => onSelectCategory(b.cat_id === selectedCat ? null : b.cat_id)}
              style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
                opacity: selectedCat && selectedCat !== b.cat_id ? 0.35 : 1, transition: "opacity 0.15s" }}>
              <span style={{ fontSize: 16, width: 28, textAlign: "center", flexShrink: 0 }}>{b.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: "#ccc" }}>{b.label}</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#E0E0E0" }}>{formatMoney(-b.total)}</span>
                </div>
                <div style={{ height: 6, background: "#2a2a2a", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 3, background: b.color, width: `${(b.total / maxVal) * 100}%`, transition: "width 0.5s ease" }} />
                </div>
              </div>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#666", width: 40, textAlign: "right", flexShrink: 0 }}>
                {((b.total / totalSpend) * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════ DASHBOARD ═══════════════ */
function Dashboard({ user, onLogout }) {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`; });
  const [editingTx, setEditingTx] = useState(null);
  const [showCatManager, setShowCatManager] = useState(false);
  const [showRulesManager, setShowRulesManager] = useState(false);
  const [rules, setRules] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [importCount, setImportCount] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedCat, setSelectedCat] = useState(null);
  const fileRef = useRef(null);

  // Load data from Supabase
  useEffect(() => {
    (async () => {
      const { data: txData } = await supabase.from("transactions").select("*").eq("user_id", user.id).order("date", { ascending: false });
      if (txData) setTransactions(txData);

      const { data: catData } = await supabase.from("categories").select("*").eq("user_id", user.id).order("sort_order");
      if (catData && catData.length > 0) setCategories(catData);
      else {
        // First time: insert default categories
        const toInsert = DEFAULT_CATEGORIES.map((c) => ({ ...c, user_id: user.id }));
        const { data: inserted } = await supabase.from("categories").insert(toInsert).select();
        setCategories(inserted || DEFAULT_CATEGORIES);
      }

      const { data: rulesData } = await supabase.from("recurring_rules").select("*").eq("user_id", user.id);
      if (rulesData) setRules(rulesData);

      setLoaded(true);
    })();
  }, [user.id]);

  const catMap = useMemo(() => Object.fromEntries(categories.map((c) => [c.cat_id, c])), [categories]);

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    const text = await file.text();
    const newTxs = parseCSV(text);
    if (newTxs.length === 0) return;

    // Apply recurring rules: match by name (contains) or exact amount
    const ruledTxs = newTxs.map((t) => {
      const absAmount = Math.abs(t.amount);
      const match = rules.find((r) => {
        if (r.match_name) return t.description.toLowerCase().includes(r.match_name.toLowerCase());
        return Math.abs(Math.abs(r.amount) - absAmount) < 0.01;
      });
      if (match) {
        return { ...t, description: match.label, category: match.category, manual_category: true };
      }
      return t;
    });

    // Deduplicate
    const existing = new Set(transactions.map((t) => `${t.date}|${t.description}|${t.amount}`));
    const unique = ruledTxs.filter((t) => !existing.has(`${t.date}|${t.description}|${t.amount}`));
    if (unique.length === 0) { setImportCount(0); return; }

    setSaving(true);
    const toInsert = unique.map((t) => ({ ...t, user_id: user.id }));
    const { data: inserted, error } = await supabase.from("transactions").insert(toInsert).select();
    setSaving(false);

    if (inserted) {
      setTransactions((prev) => [...inserted, ...prev]);
      setImportCount(inserted.length);
      setTimeout(() => setImportCount(0), 3000);
    }
  }, [transactions, rules, user.id]);

  const handleDrop = useCallback((e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer?.files?.[0]; if (f?.name.endsWith(".csv")) handleFile(f); }, [handleFile]);

  const updateTransaction = useCallback(async (updatedTx) => {
    const { id, user_id, created_at, ...updates } = updatedTx;
    await supabase.from("transactions").update(updates).eq("id", id);
    setTransactions((prev) => prev.map((t) => t.id === id ? updatedTx : t));
    setEditingTx(null);
  }, []);

  const deleteTransaction = useCallback(async (txId) => {
    await supabase.from("transactions").delete().eq("id", txId);
    setTransactions((prev) => prev.filter((t) => t.id !== txId));
    setEditingTx(null);
  }, []);

  const updateCategories = useCallback(async (newCats) => {
    await supabase.from("categories").delete().eq("user_id", user.id);
    const toInsert = newCats.map((c, i) => ({ cat_id: c.cat_id, label: c.label, icon: c.icon, color: c.color, sort_order: i, user_id: user.id }));
    const { data } = await supabase.from("categories").insert(toInsert).select();
    if (data) setCategories(data);
    setShowCatManager(false);
  }, [user.id]);

  const updateRules = useCallback(async (newRules) => {
    await supabase.from("recurring_rules").delete().eq("user_id", user.id);
    let savedRules = newRules;
    if (newRules.length > 0) {
      const toInsert = newRules.map((r) => ({ label: r.label, amount: r.amount || 0, match_name: r.match_name || null, category: r.category, user_id: user.id }));
      const { data } = await supabase.from("recurring_rules").insert(toInsert).select();
      if (data) { setRules(data); savedRules = data; }
      else setRules(newRules);
    } else {
      setRules([]);
      savedRules = [];
    }

    // Apply rules to all existing transactions
    if (savedRules.length > 0) {
      const toUpdate = [];
      for (const tx of transactions) {
        const absAmount = Math.abs(tx.amount);
        const match = savedRules.find((r) => {
          if (r.match_name) return tx.description.toLowerCase().includes(r.match_name.toLowerCase());
          return Math.abs(Math.abs(r.amount) - absAmount) < 0.01;
        });
        if (match && (tx.category !== match.category || tx.description !== match.label)) {
          toUpdate.push({ ...tx, description: match.label, category: match.category, manual_category: true });
        }
      }
      if (toUpdate.length > 0) {
        await Promise.all(toUpdate.map(({ id, description, category }) =>
          supabase.from("transactions").update({ description, category, manual_category: true }).eq("id", id)
        ));
        setTransactions((prev) => prev.map((t) => toUpdate.find((u) => u.id === t.id) || t));
      }
    }

    setShowRulesManager(false);
  }, [user.id, transactions]);

  const clearMonth = useCallback(async () => {
    const [cy, cm] = currentMonth.split("-").map(Number);
    const monthTxIds = transactions
      .filter((t) => { const d = new Date(t.date + "T12:00:00"); return d.getFullYear() === cy && d.getMonth() + 1 === cm; })
      .map((t) => t.id);
    if (monthTxIds.length === 0) return;
    await supabase.from("transactions").delete().in("id", monthTxIds);
    setTransactions((prev) => prev.filter((t) => !monthTxIds.includes(t.id)));
  }, [user.id, currentMonth, transactions]);

  const [year, month] = currentMonth.split("-").map(Number);
  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const d = new Date(t.date + "T12:00:00");
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, year, month]);
  const availableMonths = useMemo(() => {
    const set = new Set(transactions.map((t) => { const d = new Date(t.date + "T12:00:00"); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; }));
    return [...set].sort().reverse();
  }, [transactions]);
  const totals = useMemo(() => { let income = 0, expenses = 0; filtered.forEach((t) => { if (t.amount >= 0) income += t.amount; else expenses += Math.abs(t.amount); }); return { income, expenses, net: income - expenses }; }, [filtered]);
  const navMonth = (dir) => { const d = new Date(year, month - 1 + dir, 1); setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`); setSelectedCat(null); };
  const displayTxs = selectedCat ? filtered.filter((t) => t.category === selectedCat) : filtered;

  if (!loaded) return <div style={{ minHeight: "100vh", background: "#111", display: "flex", alignItems: "center", justifyContent: "center", color: "#555" }}>Loading...</div>;
  const editingTxObj = editingTx ? transactions.find((t) => t.id === editingTx) : null;

  return (
    <div style={{ minHeight: "100vh", background: "#111", color: "#E0E0E0", fontFamily: "'DM Sans', sans-serif" }}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}>

      {dragOver && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(17,17,17,0.9)", border: "3px dashed #E07A5F" }}>
          <div style={{ textAlign: "center" }}><div style={{ fontSize: 48, marginBottom: 12 }}>📄</div><div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 28, color: "#E07A5F" }}>Drop your CSV here</div></div>
        </div>
      )}

      {importCount > 0 && (
        <div style={{ position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)", zIndex: 1001, background: "#2E7D32", color: "#fff", padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 500, animation: "toast 3s ease forwards", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
          ✓ Imported {importCount} transaction{importCount > 1 ? "s" : ""}
        </div>
      )}
      {saving && (
        <div style={{ position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)", zIndex: 1001, background: "#333", color: "#fff", padding: "12px 24px", borderRadius: 12, fontSize: 14 }}>
          Saving...
        </div>
      )}

      {editingTxObj && <EditTransactionModal tx={editingTxObj} categories={categories} onSave={updateTransaction} onDelete={deleteTransaction} onClose={() => setEditingTx(null)} />}
      {showCatManager && <ManageCategoriesModal categories={categories} onSave={updateCategories} onClose={() => setShowCatManager(false)} />}
      {showRulesManager && <ManageRulesModal rules={rules} categories={categories} onSave={updateRules} onClose={() => setShowRulesManager(false)} />}

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 20px 60px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 38, fontWeight: 400, color: "#F5F5F5", letterSpacing: -0.5, lineHeight: 1.1 }}>Budget</h1>
            <div style={{ fontSize: 13, color: "#666", marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "#E07A5F" }}>●</span> {user.email} — {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={onLogout} style={{ background: "transparent", border: "1px solid #2a2a2a", borderRadius: 10, padding: "10px 14px", color: "#555", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#aaa"} onMouseLeave={(e) => e.currentTarget.style.color = "#555"}>Sign Out</button>
            <button onClick={() => setShowCatManager(true)} style={{ background: "transparent", border: "1px solid #333", borderRadius: 10, padding: "10px 14px", color: "#888", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#B48EAD"; e.currentTarget.style.color = "#B48EAD"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#333"; e.currentTarget.style.color = "#888"; }}>Categories</button>
            <button onClick={() => setShowRulesManager(true)} style={{ background: "transparent", border: "1px solid #333", borderRadius: 10, padding: "10px 14px", color: "#888", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#8FBCBB"; e.currentTarget.style.color = "#8FBCBB"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#333"; e.currentTarget.style.color = "#888"; }}>Rules</button>
            {filtered.length > 0 && (
              <button onClick={clearMonth} style={{ background: "transparent", border: "1px solid #333", borderRadius: 10, padding: "10px 14px", color: "#888", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#EF5350"; e.currentTarget.style.color = "#EF5350"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#333"; e.currentTarget.style.color = "#888"; }}>Clear Month</button>
            )}
            <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ""; }} />
            <button onClick={() => fileRef.current?.click()} style={{ background: "#E07A5F", border: "none", borderRadius: 10, padding: "10px 20px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 2px 12px rgba(224,122,95,0.3)" }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-1px)"} onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}>Upload CSV</button>
          </div>
        </div>

        {transactions.length === 0 ? (
          <div style={{ border: "2px dashed #2a2a2a", borderRadius: 20, padding: "80px 40px", textAlign: "center", animation: "fadeInUp 0.5s ease" }}>
            <div style={{ fontSize: 56, marginBottom: 16, opacity: 0.6 }}>📊</div>
            <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 26, color: "#ccc", marginBottom: 8 }}>Start tracking your money</div>
            <div style={{ fontSize: 14, color: "#666", maxWidth: 380, margin: "0 auto", lineHeight: 1.6 }}>Upload a CSV from your bank to get started. Transactions auto-categorize. Drag & drop works too.</div>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <button onClick={() => navMonth(-1)} style={{ background: "transparent", border: "1px solid #2a2a2a", borderRadius: 8, padding: "8px 14px", color: "#888", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>‹</button>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 26, color: "#F5F5F5" }}>{MONTHS[month - 1]}</div>
                <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{year}</div>
              </div>
              <button onClick={() => navMonth(1)} style={{ background: "transparent", border: "1px solid #2a2a2a", borderRadius: 8, padding: "8px 14px", color: "#888", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>›</button>
            </div>

            <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 28 }}>
              {[
                { label: "Income", value: totals.income, color: "#2E7D32", prefix: "+" },
                { label: "Expenses", value: totals.expenses, color: "#E07A5F", prefix: "-" },
                { label: "Net", value: totals.net, color: totals.net >= 0 ? "#2E7D32" : "#E07A5F", prefix: totals.net >= 0 ? "+" : "" },
              ].map((card) => (
                <div key={card.label} style={{ background: "#1a1a1a", borderRadius: 14, padding: "18px 16px", border: "1px solid #222" }}>
                  <div style={{ fontSize: 11, color: "#666", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 8 }}>{card.label}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 20, fontWeight: 500, color: card.color, letterSpacing: -0.5 }}>
                    {card.prefix}${Math.abs(card.value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>

            {filtered.length > 0 && (
              <div style={{ background: "#1a1a1a", borderRadius: 14, padding: 20, border: "1px solid #222", marginBottom: 28 }}>
                <div style={{ fontSize: 11, color: "#666", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 16 }}>Spending Breakdown</div>
                <CategoryBreakdown transactions={filtered} categories={categories} selectedCat={selectedCat} onSelectCategory={setSelectedCat} />
              </div>
            )}

            {availableMonths.length > 1 && (
              <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
                {availableMonths.map((m) => {
                  const [y, mo] = m.split("-").map(Number);
                  const active = m === currentMonth;
                  return (
                    <button key={m} onClick={() => { setCurrentMonth(m); setSelectedCat(null); }} style={{
                      padding: "6px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                      background: active ? "#E07A5F22" : "transparent", border: active ? "1px solid #E07A5F55" : "1px solid #222",
                      color: active ? "#E07A5F" : "#666",
                    }}>{MONTHS[mo - 1].slice(0, 3)} {y !== new Date().getFullYear() ? y : ""}</button>
                  );
                })}
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "#666", textTransform: "uppercase", letterSpacing: 1.2 }}>
                {selectedCat ? `${catMap[selectedCat]?.icon || ""} ${catMap[selectedCat]?.label || selectedCat} · ${displayTxs.length}` : `Transactions · ${filtered.length}`}
              </div>
              {selectedCat && (
                <button onClick={() => setSelectedCat(null)} style={{ background: "transparent", border: "none", color: "#555", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", padding: "2px 6px" }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "#ccc"} onMouseLeave={(e) => e.currentTarget.style.color = "#555"}>
                  × clear
                </button>
              )}
            </div>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 20px", color: "#444", fontSize: 14, borderRadius: 14, border: "1px dashed #222" }}>No transactions this month</div>
            ) : (
              <div style={{ borderRadius: 14, border: "1px solid #222", overflow: "hidden", background: "#161616" }}>
                {displayTxs.map((tx, i) => {
                  const cat = catMap[tx.category] || { icon: "📦", label: tx.category, color: "#90A4AE" };
                  const d = new Date(tx.date + "T12:00:00");
                  return (
                    <div key={tx.id} className="tx-row" onClick={() => setEditingTx(tx.id)} style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
                      borderBottom: i < displayTxs.length - 1 ? "1px solid #1e1e1e" : "none",
                      animation: `fadeInUp 0.3s ease ${Math.min(i * 0.03, 0.5)}s both`, cursor: "pointer",
                    }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${cat.color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{cat.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, color: "#ddd", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tx.description}</div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 3 }}>
                          <span style={{ fontSize: 11, color: "#555" }}>{d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                          <span style={{ fontSize: 10, color: cat.color, background: `${cat.color}15`, padding: "2px 7px", borderRadius: 4 }}>{cat.label}</span>
                          {tx.manual_category && <span style={{ fontSize: 10, color: "#555" }}>✎</span>}
                        </div>
                      </div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 500, color: tx.amount >= 0 ? "#2E7D32" : "#E07A5F", flexShrink: 0 }}>
                        {tx.amount >= 0 ? "+" : ""}{formatMoney(tx.amount)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ═══════════════ ROOT ═══════════════ */
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) return <div style={{ minHeight: "100vh", background: "#111" }} />;
  return user ? <Dashboard user={user} onLogout={logout} /> : <AuthScreen />;
}
