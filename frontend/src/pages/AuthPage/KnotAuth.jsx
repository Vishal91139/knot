import { useLocation, useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext.jsx";
import LoginForm from "./LoginForm.jsx";
import SignupForm from "./SignupForm.jsx";

const ROLE_HOME = {
  student: { path: "/dashboard/student", label: "your student board" },
  organizer: { path: "/dashboard/organizer/overview", label: "the organizer desk" },
  faculty: { path: "/dashboard/student", label: "your student board" },
  college_admin: { path: "/college-admin", label: "the college admin desk" },
  super_admin: { path: "/dashboard/admin", label: "the control room" },
};


export default function KnotAuth({ onAuthSuccess }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useUser();
  const mode = location.pathname === "/signup" ? "signup" : "login";

  const handleLogin = (session) => {
    const home = ROLE_HOME[session.user.role];
    setUser(session.user);
    if (onAuthSuccess) onAuthSuccess({ ...session, redirectTo: home.path });
    navigate(home.path, { replace: true });
  };

  return (
    <div className="knot-auth">
      <style>{CSS}</style>

      <header className="bar">
        <div className="logo">KNOT</div>
        <button className="bar-link" onClick={() => navigate(mode === "login" ? "/signup" : "/login")}>
          {mode === "login" ? "Sign up" : "Sign in"}
        </button>
      </header>

      <main className="board">
        <section className="notice" aria-hidden={false}>
          <h1>{mode === "login" ? "Back on the board." : "Pin your name up."}</h1>
          <p className="lede">
            {mode === "login"
              ? "Your events, teams and tickets are where you left them."
              : "One account for every event your college runs. Pick the role that fits you."}
          </p>

          <ul className="stubs">
            <li className="stub s1"><b>Student</b><span>Register, form teams, collect badges</span></li>
            <li className="stub s2"><b>Faculty</b><span>Organize events for your club or department</span></li>
            <li className="stub s3"><b>Admin</b><span>Review events and manage your college</span></li>
          </ul>
        </section>

        <section className="paper" aria-live="polite">
          <span className="pin" aria-hidden="true" />
          <span className="tape" aria-hidden="true" />

          {mode === "login" ? (
            <>
              <h2 className="form-title">Sign in</h2>
              <LoginForm onDone={handleLogin} goSignup={() => navigate("/signup")} />
            </>
          ) : (
            <>
              <h2 className="form-title">Create your account</h2>
              <SignupForm goLogin={() => navigate("/login")} />
            </>
          )}
        </section>
      </main>
    </div>
  );
}

/* ============================================================
   STYLES
   ============================================================ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Anton&family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');

.knot-auth{
  --cork:#b58a5c; --cork-dark:#8f6840; --paper:#fbf6e8; --paper-edge:#e9dfc4;
  --ink:#241d16; --ink-soft:#5d5142; --stamp:#c43a2e; --mustard:#e9b82e; --teal:#1f6f68;
  min-height:100vh; color:var(--ink);
  font-family:'Space Grotesk',system-ui,sans-serif;
  background-color:var(--cork);
  background-image:
    radial-gradient(rgba(60,35,10,.28) 1.2px, transparent 1.6px),
    radial-gradient(rgba(255,235,200,.22) 1px, transparent 1.4px),
    radial-gradient(rgba(60,35,10,.16) 2px, transparent 2.6px);
  background-size:14px 14px, 23px 23px, 37px 37px;
  background-position:0 0, 7px 9px, 15px 4px;
}
.knot-auth *{box-sizing:border-box}

.bar{display:flex;justify-content:space-between;align-items:center;padding:18px clamp(16px,4vw,48px)}
.logo{font-family:'Anton',sans-serif;font-size:30px;letter-spacing:.06em;background:var(--ink);color:var(--paper);padding:2px 14px;transform:rotate(-2deg)}
.bar-link{font:600 15px 'Space Grotesk';background:var(--paper);border:2px solid var(--ink);padding:8px 18px;cursor:pointer;box-shadow:3px 3px 0 var(--ink);color:var(--ink)}
.bar-link:hover{transform:translate(1px,1px);box-shadow:2px 2px 0 var(--ink)}

.board{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,6fr);gap:clamp(24px,5vw,72px);
  max-width:1180px;margin:0 auto;padding:12px clamp(16px,4vw,48px) 64px;align-items:start}

/* notice side */
.notice h1{font-family:'Anton',sans-serif;font-weight:400;font-size:clamp(44px,6.4vw,84px);line-height:.98;letter-spacing:.01em;margin:24px 0 16px;
  text-transform:uppercase;text-shadow:3px 3px 0 rgba(255,240,210,.55)}
.lede{font-size:18px;line-height:1.5;max-width:34ch;margin:0 0 32px;font-weight:500}
.stubs{list-style:none;margin:0;padding:0;display:grid;gap:14px;max-width:340px}
.stub{display:flex;flex-direction:column;gap:2px;background:var(--paper);padding:12px 18px 12px 26px;position:relative;
  border-right:3px dashed var(--cork-dark);box-shadow:0 3px 0 rgba(0,0,0,.18)}
.stub::before,.stub::after{content:"";position:absolute;left:-9px;width:18px;height:18px;border-radius:50%;background:var(--cork)}
.stub::before{top:-9px;display:none}
.stub::after{top:50%;margin-top:-9px}
.stub b{font-family:'Anton',sans-serif;font-weight:400;font-size:22px;letter-spacing:.04em}
.stub span{font:400 13px 'Space Mono',monospace;color:var(--ink-soft)}
.s1{transform:rotate(-1.4deg)} .s2{transform:rotate(1deg) translateX(14px)} .s3{transform:rotate(-.6deg)}

/* paper form */
.paper{position:relative;background:var(--paper);padding:44px clamp(20px,3.4vw,40px) 32px;transform:rotate(.4deg);
  box-shadow:0 2px 0 var(--paper-edge),0 14px 28px rgba(45,25,5,.35);border:1px solid var(--paper-edge)}
.pin{position:absolute;top:-10px;left:50%;width:22px;height:22px;margin-left:-11px;border-radius:50%;
  background:radial-gradient(circle at 35% 30%,#ff8a7d,var(--stamp) 55%,#7d1f17);box-shadow:2px 4px 4px rgba(0,0,0,.35)}
.tape{position:absolute;top:-6px;right:-18px;width:90px;height:24px;background:rgba(233,184,46,.55);transform:rotate(28deg)}
.form-title{font-family:'Anton',sans-serif;font-weight:400;font-size:34px;letter-spacing:.03em;margin:0 0 18px;text-transform:uppercase}

/* role tabs */
.tabs{display:flex;gap:0;margin:0 0 6px;border:2px solid var(--ink)}
.tab{flex:1;font:600 14px 'Space Grotesk';padding:10px 8px;background:transparent;border:0;border-right:2px dashed var(--ink);cursor:pointer;color:var(--ink)}
.tab:last-child{border-right:0}
.tab.on{background:var(--ink);color:var(--paper)}
.tab:not(.on):hover{background:var(--paper-edge)}
.role-hint{font:400 13px/1.45 'Space Mono',monospace;color:var(--ink-soft);margin:10px 0 20px;min-height:2.9em}

/* fields */
.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px 18px}
.kf{display:flex;flex-direction:column;gap:5px}
.kf-wide{grid-column:1/-1}
.kf-label{font:600 14px 'Space Grotesk'}
.knot-auth input:not([type=file]),.knot-auth select,.knot-auth textarea{
  width:100%;font:400 15px 'Space Mono',monospace;color:var(--ink);background:#fffdf5;
  border:2px solid var(--ink);padding:10px 12px;border-radius:0;appearance:none}
.knot-auth select{background-image:linear-gradient(45deg,transparent 50%,var(--ink) 50%),linear-gradient(135deg,var(--ink) 50%,transparent 50%);
  background-position:calc(100% - 18px) 55%,calc(100% - 12px) 55%;background-size:6px 6px;background-repeat:no-repeat;padding-right:34px}
.knot-auth input[type=file]{font:400 13px 'Space Mono',monospace}
.knot-auth input:focus-visible,.knot-auth select:focus-visible,.knot-auth textarea:focus-visible,
.knot-auth button:focus-visible{outline:3px solid var(--teal);outline-offset:2px}
.kf-hint{font:400 12px 'Space Mono',monospace;color:var(--ink-soft)}
.kf-err{font:700 12px 'Space Mono',monospace;color:var(--stamp)}
.kf:has(.kf-err) input,.kf:has(.kf-err) select{border-color:var(--stamp)}
.kf-pw{position:relative;display:block}
.kf-pw input{padding-right:64px}
.kf-eye{position:absolute;right:6px;top:50%;transform:translateY(-50%);font:600 12px 'Space Grotesk';background:none;border:0;cursor:pointer;color:var(--teal);padding:6px}

.form-err{margin:18px 0 0;padding:10px 14px;border:2px solid var(--stamp);background:#fdebe7;color:#7d1f17;font:500 14px/1.4 'Space Grotesk'}

/* buttons */
.stamp-btn{display:block;width:100%;margin-top:22px;font-family:'Anton',sans-serif;font-size:22px;letter-spacing:.08em;text-transform:uppercase;
  background:var(--stamp);color:var(--paper);border:2px solid var(--ink);padding:12px 18px;cursor:pointer;box-shadow:4px 4px 0 var(--ink);transition:transform .08s,box-shadow .08s}
.stamp-btn:hover:not(:disabled){transform:translate(1px,1px);box-shadow:3px 3px 0 var(--ink)}
.stamp-btn:active:not(:disabled){transform:translate(4px,4px);box-shadow:0 0 0 var(--ink)}
.stamp-btn:disabled{opacity:.6;cursor:progress}
.stamp-btn.ghost{background:var(--paper);color:var(--ink)}

.switch{margin:20px 0 0;font-size:14px;text-align:center}
.switch button{background:none;border:0;padding:0;font:700 14px 'Space Grotesk';color:var(--teal);cursor:pointer;text-decoration:underline;text-underline-offset:3px}

/* result */
.result{text-align:center;padding:12px 0 4px}
.result h2{font-family:'Anton',sans-serif;font-weight:400;font-size:36px;text-transform:uppercase;margin:34px 0 8px}
.result p{max-width:38ch;margin:0 auto;line-height:1.5}
.big-stamp{display:inline-block;font-family:'Anton',sans-serif;font-size:44px;letter-spacing:.12em;text-transform:uppercase;color:var(--stamp);
  border:5px double var(--stamp);padding:2px 22px;transform:rotate(-8deg);opacity:.92;animation:thunk .35s cubic-bezier(.3,1.6,.5,1) both}
@keyframes thunk{from{transform:rotate(-8deg) scale(1.7);opacity:0}to{transform:rotate(-8deg) scale(1);opacity:.92}}

@media (max-width:900px){
  .board{grid-template-columns:1fr}
  .notice h1{margin-top:4px}
  .stubs{display:none}
  .lede{margin-bottom:8px}
}
@media (max-width:560px){
  .grid{grid-template-columns:1fr}
  .tab{font-size:13px;padding:10px 4px}
  .paper{transform:none}
}
@media (prefers-reduced-motion:reduce){
  .big-stamp{animation:none}
  .stamp-btn{transition:none}
}
`;