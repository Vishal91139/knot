import Btn from "../modelPieces/Btn"
import Field from "../modelPieces/Field"
import ModalHead from "../modelPieces/ModalHead"
import ModalWrap from "../modelPieces/ModalWrap"
import Select from "../modelPieces/Select"
import SuccessState from "../modelPieces/SuccessState"

export default function AuthModal({ onClose }) {
  const [tab, setTab] = useState("student")
  const [mode, setMode] = useState("signup") // signup | login
  const [done, setDone] = useState(false)

  return (
    <ModalWrap onClose={onClose}>
      {!done ? (
        <>
          <ModalHead
            onClose={onClose}
            title={mode === "signup" ? "Create your account" : "Welcome back"}
            sub={mode === "signup" ? "Already on KNOT? " : "New here? "}
            linkText={mode === "signup" ? "Sign in" : "Create account"}
            onLink={() => setMode(mode === "signup" ? "login" : "signup")}
          />

          {mode === "signup" && (
            <div className="flex gap-1 p-1 bg-black/30 rounded-lg mb-4">
              {["student", "faculty"].map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition-all capitalize ${
                    tab === t ? "bg-white/10 text-[#E8E4DC]" : "text-[#7A8494] hover:text-[#E8E4DC]"
                  }`}>
                  {t}
                </button>
              ))}
            </div>
          )}

          {mode === "signup" ? (
            <>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <Field label="First Name" placeholder="Arjun" />
                <Field label="Last Name"  placeholder="Menon" />
              </div>
              <Field label="College Email" type="email" placeholder="you@rvce.edu.in" note="Must match your college domain." />
              <Field label="Select College">
                <Select options={["R.V. College of Engineering","BMS College of Engineering","PES University"]} />
              </Field>
              {tab === "student" ? (
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <Field label="Department" placeholder="CSE" />
                  <Field label="Year">
                    <Select options={["1st Year","2nd Year","3rd Year","4th Year"]} />
                  </Field>
                </div>
              ) : (
                <Field label="Department" placeholder="Electronics & Communication" />
              )}
              <Field label="Password" type="password" placeholder="Create a strong password" />
              <Btn teal onClick={() => setDone(true)}>Create Account →</Btn>
            </>
          ) : (
            <>
              <Field label="Email" type="email" placeholder="you@college.edu" />
              <Field label="Password" type="password" placeholder="Your password" />
              <Btn teal onClick={() => setDone(true)}>Sign In →</Btn>
            </>
          )}
        </>
      ) : (
        <SuccessState
          title={mode === "signup" ? "You're in!" : "Welcome back!"}
          sub={mode === "signup"
            ? "Check your college email to verify your account. Start exploring events right after."
            : "Redirecting you to your dashboard..."}
          onClose={onClose}
          teal
        />
      )}
    </ModalWrap>
  )
}