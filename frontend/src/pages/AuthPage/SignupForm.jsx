import { useEffect, useMemo, useState } from "react";

const SIGNUP_TABS = [
  { id: "student", label: "Student", hint: "Public signup. Verify your college email later to unlock registrations." },
  { id: "faculty", label: "Faculty", hint: "Needs your college email. A college admin turns you into an organizer." },
  { id: "college_admin", label: "College admin", hint: "Request a spot for your college. A super admin reviews it." },
];

const MOCK_COLLEGES = [
  { id: "mock-1", name: "Sapthagiri College of Engineering", short_name: "SCE", email_domain: "sapthagiri.edu.in" },
  { id: "mock-2", name: "Sample Institute of Technology", short_name: "SIT", email_domain: "sit.edu.in" },
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


function CollegePicker({ colleges, value, onChange, loading }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} disabled={loading}>
      <option value="">{loading ? "Loading colleges…" : "Select your college"}</option>
      {colleges.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}{c.short_name ? ` (${c.short_name})` : ""}
        </option>
      ))}
    </select>
  );
}

export default function SignupForm({ goLogin }) {
  const [tab, setTab] = useState("student");
  const [colleges, setColleges] = useState([]);
  const [loadingColleges, setLoadingColleges] = useState(true);
  const [usingMock, setUsingMock] = useState(false);

  const blank = {
    fullName: "", email: "", password: "", confirm: "",
    collegeId: "", collegeEmail: "",
    rollNumber: "", branch: "", yearOfStudy: "",
    phone: "", designation: "", reason: "",
    collegeName: "", collegeShortName: "", collegeEmailDomain: "",
    collegeCity: "", collegeState: "", collegeWebsiteUrl: "",
  };
  const [f, setF] = useState(blank);
  const [avatar, setAvatar] = useState(null);
  const [errs, setErrs] = useState({});
  const [formErr, setFormErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null); // { kind }

  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));
  const inp = (k, extra = {}) => (
    <input value={f[k]} onChange={(e) => set(k)(e.target.value)} {...extra} />
  );

  useEffect(() => {
    let alive = true;
    api("/colleges?limit=100")
      .then((r) => alive && setColleges(r.data?.data || []))
      .catch(() => {
        if (!alive) return;
        setColleges(MOCK_COLLEGES);
        setUsingMock(true);
      })
      .finally(() => alive && setLoadingColleges(false));
    return () => { alive = false; };
  }, []);

  const college = useMemo(() => colleges.find((c) => c.id === f.collegeId), [colleges, f.collegeId]);
  const current = SIGNUP_TABS.find((t) => t.id === tab);

  const changeTab = (t) => { setTab(t); setErrs({}); setFormErr(""); };

  const validate = () => {
    const e = {};
    if (!f.fullName.trim()) e.fullName = "Enter your full name.";
    if (!emailRe.test(f.email.trim())) e.email = "Enter a valid email.";

    if (tab !== "college_admin") {
      if (f.password.length < 8) e.password = "Use at least 8 characters.";
      if (f.confirm !== f.password) e.confirm = "Passwords don't match.";
      if (!f.collegeId) e.collegeId = "Select your college.";

      const ce = f.collegeEmail.trim();
      if (tab === "faculty" && !ce) e.collegeEmail = "Faculty need a college email.";
      if (ce) {
        if (!emailRe.test(ce)) e.collegeEmail = "Enter a valid college email.";
        else if (college && domainOf(ce) !== college.email_domain.toLowerCase())
          e.collegeEmail = `Must end with @${college.email_domain}.`;
      }
    }

    if (tab === "student") {
      // Backend doesn't validate these yet, and a missing year crashes the insert
      if (!f.rollNumber.trim()) e.rollNumber = "Enter your roll number.";
      if (!f.branch.trim()) e.branch = "Enter your branch.";
      const y = Number(f.yearOfStudy);
      if (!Number.isInteger(y) || y < 1 || y > 8) e.yearOfStudy = "Pick a year from 1 to 8.";
    }

    if (tab === "college_admin") {
      if (!f.collegeName.trim()) e.collegeName = "Enter the college name.";
      if (!f.collegeEmailDomain.trim()) e.collegeEmailDomain = "Enter the email domain, like college.edu.in.";
      else if (f.collegeEmailDomain.includes("@") || !f.collegeEmailDomain.includes("."))
        e.collegeEmailDomain = "Domain only, without @.";
    }
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrs(e);
    setFormErr("");
    if (Object.keys(e).length) return;

    setBusy(true);
    try {
      if (tab === "college_admin") {
        await api("/admin/college-admin-requests", {
          method: "POST",
          json: {
            fullName: f.fullName.trim(),
            email: f.email.trim(),
            phone: f.phone.trim(),
            designation: f.designation.trim(),
            reason: f.reason.trim(),
            collegeName: f.collegeName.trim(),
            collegeShortName: f.collegeShortName.trim(),
            collegeEmailDomain: f.collegeEmailDomain.trim(),
            collegeCity: f.collegeCity.trim(),
            collegeState: f.collegeState.trim(),
            collegeWebsiteUrl: f.collegeWebsiteUrl.trim(),
          },
        });
        setDone({ kind: "request" });
      } else {
        const fd = new FormData();
        fd.append("role", tab);
        fd.append("fullName", f.fullName.trim());
        fd.append("email", f.email.trim());
        fd.append("password", f.password);
        fd.append("collegeId", f.collegeId);
        if (f.collegeEmail.trim()) fd.append("collegeEmail", f.collegeEmail.trim());
        if (tab === "student") {
          fd.append("rollNumber", f.rollNumber.trim());
          fd.append("branch", f.branch.trim());
          fd.append("yearOfStudy", f.yearOfStudy);
        }
        if (avatar) fd.append("avatar", avatar);
        await api("/auth/register", { method: "POST", form: fd });
        setDone({ kind: tab });
      }
    } catch (err) {
      setFormErr(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    const isReq = done.kind === "request";
    return (
      <div className="result">
        <div className="big-stamp" aria-hidden="true">{isReq ? "Filed" : "Pinned"}</div>
        <h2>{isReq ? "Request sent" : "You're on the board"}</h2>
        <p>
          {isReq
            ? "A super admin will review your college and your details. No account exists until it's approved, and your first password is set by them."
            : done.kind === "faculty"
            ? "Your faculty account is ready. Ask your college admin to set you up as an organizer so you can create events."
            : "Your student account is ready. Verify your college email to unlock event registrations."}
        </p>
        {!isReq && <button className="stamp-btn" onClick={goLogin}>Go to sign in</button>}
        {isReq && <button className="stamp-btn ghost" onClick={goLogin}>Back to sign in</button>}
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <RoleTabs tabs={SIGNUP_TABS} active={tab} onChange={changeTab} name="Sign up as" />
      <p className="role-hint">{current.hint}</p>

      <div className="grid">
        <Field label="Full name" error={errs.fullName}>{inp("fullName", { autoComplete: "name" })}</Field>
        <Field label={tab === "college_admin" ? "Work email" : "Personal email"} error={errs.email}>
          {inp("email", { type: "email", autoComplete: "email" })}
        </Field>

        {tab !== "college_admin" && (
          <>
            <Field label="Password" error={errs.password} hint="At least 8 characters.">
              <PasswordInput value={f.password} onChange={set("password")} autoComplete="new-password" />
            </Field>
            <Field label="Confirm password" error={errs.confirm}>
              <PasswordInput value={f.confirm} onChange={set("confirm")} autoComplete="new-password" />
            </Field>

            <Field label="College" error={errs.collegeId} wide>
              <CollegePicker colleges={colleges} value={f.collegeId} onChange={set("collegeId")} loading={loadingColleges} />
              {usingMock && <span className="kf-hint">Couldn't load colleges from the server, showing sample data.</span>}
            </Field>

            <Field
              label={tab === "faculty" ? "College email" : "College email (optional)"}
              error={errs.collegeEmail}
              hint={college ? `Must end with @${college.email_domain}` : "Select a college first."}
              wide
            >
              {inp("collegeEmail", { type: "email", autoComplete: "off" })}
            </Field>
          </>
        )}

        {tab === "student" && (
          <>
            <Field label="Roll number" error={errs.rollNumber}>{inp("rollNumber")}</Field>
            <Field label="Branch" error={errs.branch}>{inp("branch", { placeholder: "e.g. CSE" })}</Field>
            <Field label="Year of study" error={errs.yearOfStudy}>
              <select value={f.yearOfStudy} onChange={(e) => set("yearOfStudy")(e.target.value)}>
                <option value="">Select year</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </Field>
          </>
        )}

        {tab !== "college_admin" && (
          <Field label="Profile photo (optional)" hint={avatar ? avatar.name : "JPG or PNG"} wide={tab !== "student"}>
            <input type="file" accept="image/*" onChange={(e) => setAvatar(e.target.files?.[0] || null)} />
          </Field>
        )}

        {tab === "college_admin" && (
          <>
            <Field label="Phone (optional)">{inp("phone", { type: "tel" })}</Field>
            <Field label="Designation (optional)">{inp("designation", { placeholder: "e.g. Dean, Student Affairs" })}</Field>

            <Field label="College name" error={errs.collegeName} wide>{inp("collegeName")}</Field>
            <Field label="Short name (optional)">{inp("collegeShortName")}</Field>
            <Field label="College email domain" error={errs.collegeEmailDomain} hint="Everyone's college email ends with this.">
              {inp("collegeEmailDomain", { placeholder: "college.edu.in" })}
            </Field>
            <Field label="City (optional)">{inp("collegeCity")}</Field>
            <Field label="State (optional)">{inp("collegeState")}</Field>
            <Field label="Website (optional)" wide>{inp("collegeWebsiteUrl", { type: "url", placeholder: "https://" })}</Field>
            <Field label="Why do you need access? (optional)" wide>
              <textarea rows={3} value={f.reason} onChange={(e) => set("reason")(e.target.value)} />
            </Field>
          </>
        )}
      </div>

      {formErr && <div className="form-err" role="alert">{formErr}</div>}

      <button className="stamp-btn" disabled={busy}>
        {busy ? "Sending…" : tab === "college_admin" ? "Send request" : "Create account"}
      </button>

      <p className="switch">
        Already have an account? <button type="button" onClick={goLogin}>Sign in</button>
      </p>
    </form>
  );
}