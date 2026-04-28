import { useEffect, useState } from "react"
import SuccessState from "../modelPieces/SuccessState"

export default function AuthModal({ onClose }) {
  const [tab, setTab] = useState("student")
  const [mode, setMode] = useState("signup") // signup | login
  const [done, setDone] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState({ type: "", message: "" })
  const [college, setCollege] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    college: '',
    collegeEmail: '',
    rollNumber: '',
    branch: '',
    yearOfStudy: '',
    password: '',
  })

  const createUser = async() => {
    setIsSubmitting(true)
    setFeedback({ type: "", message: "" })
    try {
      const payload = {
        fullName: formData.name,
        email: formData.email,
        role: tab,
        collegeId: formData.college || null,
        collegeEmail: formData.collegeEmail,
        rollNumber: formData.rollNumber,
        branch: formData.branch,
        yearOfStudy: formData.yearOfStudy,
        password: formData.password
      }

      let res = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`,{
        method: "POST",
        headers: {
        "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      })
      const responsePayload = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(responsePayload?.message || 'Failed to create student')
      }
      setDone(true)
      setFeedback({
        type: "success",
        message: responsePayload?.message || "User registered successfully"
      })
    } catch (error) {
      setDone(false)
      setFeedback({
        type: "error",
        message: error?.message || "Something went wrong"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    const fetchCollege = async() => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/colleges/`)
        const data = await res.json()
        if(!res.ok) {
          setCollege([])
          return;
        }
        setCollege(Array.isArray(data?.data?.data) ? data?.data?.data : [])
        console.log("success")
      } catch (error) {
        console.log(error.message)
        setCollege([])
      }
    }
    fetchCollege()
  }, [])
  

  const handleSubmit = async (event) => {
    event.preventDefault();
    await createUser();
  }

  const handleInputChange = (event) => {
    const { name, value } = event.target
    setFormData((previous) => ({ ...previous, [name]: value }))
  }

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
        onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="w-full max-w-md rounded-2xl p-6 border border-white/10"
          style={{ background: "#0D1526", animation: "fadeUp .3s ease both" }}>
          <SuccessState
            title="Registration successful"
            sub={feedback.message || "Your account has been created."}
            onClose={onClose}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl p-6 border border-white/10"
        style={{ background: "#0D1526", animation: "fadeUp .3s ease both" }}>
          
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

        <div className="flex justify-between items-start mb-5">
          <div>
            <h3 className="font-display text-xl text-[#E8E4DC] font-bold mb-0.5">Fill the Details</h3>
              <p className="text-sm text-[#7A8494]">
                <button className="text-[#F0A500] hover:underline ml-0.5">hello</button>
              </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#7A8494] hover:text-[#E8E4DC] hover:bg-white/8 transition-all text-lg">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {feedback.message ? (
            <p className={`mb-4 text-sm ${feedback.type === "error" ? "text-red-300" : "text-green-300"}`}>
              {feedback.message}
            </p>
          ) : null}
          <div>
            <label>
              <span>Name: </span>
              <input 
                type="text"
                placeholder="Enter Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="border p-2 rounded-2xl" />
            </label>
            <br/>
            <label>
              <span>email: </span>
              <input
                type="text" 
                placeholder="Enter email"
                name="email"
                value={formData.email} 
                onChange={handleInputChange}
                className="border p-2 rounded-2xl" />
            </label>
            <br/>
            <label>
              <span>college: </span>
              <select 
                name="college"
                value={formData.college}
                onChange={handleInputChange}
                className="border p-2 rounded-2xl"
              >
                <option value="" className="bg-[#0D1526] text-gray-300 opacity-10">Select college...</option>
                { college.length > 0 && college.map((item,idx) => (
                  <option
                    key={idx}
                    value={item.id}
                    className="bg-[#0D1526]"
                  >{item.name}</option>
                ))}
              </select>
            </label>
            <br/>
            <label>
              <span>college Email: </span>
              <input 
                type="email" 
                placeholder="you@vtu.edu.in" 
                name="collegeEmail"
                value={formData.collegeEmail}
                onChange={handleInputChange}
                className="border p-2 rounded-2xl" />
            </label>
            <br/>
            <label>
              <span>USN: </span>
              <input 
                type="text" 
                placeholder="University seat number" 
                name="rollNumber"
                value={formData.rollNumber}
                onChange={handleInputChange}
                className="border p-2 rounded-2xl" />
            </label>
            <br/>
            <label>
              <span>Branch: </span>
              <input 
                type="text" 
                placeholder="Enter Branch" 
                onChange={handleInputChange}
                name="branch"
                value={formData.branch}
                className="border p-2 rounded-2xl" />
            </label>
            <br/>
            <label>
              <span>year: </span>
              <select 
                name="yearOfStudy"
                value={formData.yearOfStudy}
                onChange={handleInputChange}
                className="border p-2 rounded-2xl"
                >
                <option value="" className="bg-[#0D1526] text-gray-300 opacity-10">Choose year...</option>
                <option value="1" className="bg-[#0D1526]">1st year</option>
                <option value="2" className="bg-[#0D1526]">2nd year</option>
                <option value="3" className="bg-[#0D1526]">3rd year</option>
                <option value="4" className="bg-[#0D1526]">4th year</option>
              </select>
            </label>
            <br/>
            <label>
              <span>Password </span>
              <input 
                type="password" 
                placeholder="Enter strong password" 
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="border p-2 rounded-2xl" />
            </label>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-11 w-full rounded-xl bg-blue-600 px-8 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-200 sm:w-auto"
          >
            {isSubmitting ? "Submitting..." : "submit"}
          </button>
        </form>

      </div>
    </div>
  )
}