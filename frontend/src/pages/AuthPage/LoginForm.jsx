import { useEffect, useMemo, useState } from "react";

const LOGIN_TABS = [
  { id: "student", label: "Student", roles: ["student"], hint: "Register for events, join teams, climb leaderboards." },
  { id: "faculty", label: "Faculty / Organizer", roles: ["faculty", "organizer"], hint: "Run events under your club or department." },
  { id: "admin", label: "Admin", roles: ["college_admin", "super_admin"], hint: "Approve events and manage your college." },
];

const API_BASE = "http://localhost:8000/api/v1";

/* ---------- MOCK: used only if GET /colleges fails. Remove once API is live ---------- */


/* ---------- Where each role lands after login (wire to your router) ---------- */
const ROLE_HOME = {
  student: { path: "/student", label: "your student board" },
  organizer: { path: "/organizer", label: "the organizer desk" },
  faculty: { path: "/organizer", label: "the faculty desk" },
  college_admin: { path: "/college-admin", label: "the college admin desk" },
  super_admin: { path: "/super-admin", label: "the control room" },
};

/* Login tabs -> backend roles that are allowed through each tab */




/* ---------- helpers ---------- */
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const domainOf = (e) => (e && e.includes("@") ? e.split("@").pop().toLowerCase() : "");

async function api(path, { method = "GET", json, form } = {}) {
  const opts = { method, credentials: "include", headers: {} };
  if (json) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(json);
  }
  if (form) opts.body = form;
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, opts);
  } catch {
    throw new Error("Can't reach the server. Check your connection and try again.");
  }
  let body = null;
  try {
    body = await res.json();
  } catch {
    /* backend returned HTML/empty (no error middleware) */
  }
  if (!res.ok) throw new Error(body?.message || `Request failed (${res.status}). Please try again.`);
  return body;
}

/* ---------- small UI pieces ---------- */
function Field({ label, error, hint, children, wide }) {
  return (
    <label className={`kf ${wide ? "kf-wide" : ""}`}>
      <span className="kf-label">{label}</span>
      {children}
      {error ? <span className="kf-err" role="alert">{error}</span> : hint ? <span className="kf-hint">{hint}</span> : null}
    </label>
  );
}

function PasswordInput({ value, onChange, autoComplete, id }) {
  const [show, setShow] = useState(false);
  return (
    <span className="kf-pw">
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
      />
      <button type="button" className="kf-eye" onClick={() => setShow((s) => !s)} aria-pressed={show}>
        {show ? "Hide" : "Show"}
      </button>
    </span>
  );
}

function RoleTabs({ tabs, active, onChange, name }) {
  return (
    <div className="tabs" role="tablist" aria-label={name}>
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          type="button"
          aria-selected={active === t.id}
          className={`tab ${active === t.id ? "on" : ""}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}


export default function LoginForm({ onDone, goSignup }) {
  const [tab, setTab] = useState("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errs, setErrs] = useState({});
  const [formErr, setFormErr] = useState("");
  const [busy, setBusy] = useState(false);
  const current = LOGIN_TABS.find((t) => t.id === tab);

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!emailRe.test(email.trim())) next.email = "Enter the email you signed up with.";
    if (!password) next.password = "Enter your password.";
    setErrs(next);
    setFormErr("");
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      const res = await api("/auth/login", { method: "POST", json: { email: email.trim(), password } });
      const { user, accessToken } = res.data;
      if (!current.roles.includes(user.role)) {
        // wrong door: undo the session cookies the server just set
        api("/auth/logout", { method: "POST" }).catch(() => {});
        const right = LOGIN_TABS.find((t) => t.roles.includes(user.role));
        throw new Error(`This is a ${user.role.replace("_", " ")} account. Use the "${right?.label}" tab to sign in.`);
      }
      onDone({ user, accessToken });
    } catch (err) {
      setFormErr(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      <RoleTabs tabs={LOGIN_TABS} active={tab} onChange={(t) => { setTab(t); setFormErr(""); }} name="Sign in as" />
      <p className="role-hint">{current.hint}</p>

      <div className="grid">
        <Field label="Email" error={errs.email} wide>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </Field>
        <Field label="Password" error={errs.password} wide>
          <PasswordInput value={password} onChange={setPassword} autoComplete="current-password" />
        </Field>
      </div>

      {formErr && <div className="form-err" role="alert">{formErr}</div>}

      <button className="stamp-btn" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>

      <p className="switch">
        New to KNOT? <button type="button" onClick={goSignup}>Create an account</button>
      </p>
    </form>
  );
}