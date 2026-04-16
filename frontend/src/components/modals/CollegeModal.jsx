import Btn from "../modelPieces/Btn"
import Field from "../modelPieces/Field"
import ModalHead from "../modelPieces/ModalHead"
import ModalWrap from "../modelPieces/ModalWrap"
import Select from "../modelPieces/Select"
import SuccessState from "../modelPieces/SuccessState"

export default function CollegeModal({ onClose }) {
  const [done, setDone] = useState(false)
  return (
    <ModalWrap onClose={onClose}>
      {!done ? (
        <>
          <ModalHead onClose={onClose} title="Bring KNOT to your college" sub="We'll review your request and get back within 1–2 business days." />
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Field label="First Name" placeholder="Priya" />
            <Field label="Last Name"  placeholder="Sharma" />
          </div>
          <Field label="College / University Name" placeholder="e.g. R.V. College of Engineering" />
          <Field label="Official Email" type="email" placeholder="you@college.edu" note="We'll verify via your institution email." />
          <Field label="Your Role at the College">
            <Select options={["Principal / Director","Dean of Student Affairs","Administrative Staff","Faculty Coordinator","Other"]} />
          </Field>
          <Field label="City" placeholder="Bengaluru" />
          <Field label="Tell us about your college" textarea placeholder="Number of students, departments, types of events you run..." />
          <Btn amber onClick={() => setDone(true)}>Submit Request →</Btn>
        </>
      ) : (
        <SuccessState
          title="Request received!"
          sub="We'll review your college details and reach out to your official email within 1–2 business days."
          onClose={onClose}
        />
      )}
    </ModalWrap>
  )
}