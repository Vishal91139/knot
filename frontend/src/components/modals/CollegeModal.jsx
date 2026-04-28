import { useEffect, useState } from "react"

export default function CollegeModal({ onClose }) {
  const [done, setDone] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState({ type: "", message: "" })
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    collegeName: '',
    collegeShortName: '',
    collegeEmailDomain: '',
    collegeCity: '',
    collegeState: '',
    collegeWebsiteUrl: '',
    collegeLogoUrl: '',
    phone: '',
    designation: '',
    reason: ''
  })

  const submitCollegeReq = async() => {
    setIsSubmitting(true);
    setFeedback({ type: "", message: "" })
    try {
      const payload = {
        fullName,
        email,
        collegeName,
        collegeShortName,
        collegeEmailDomain,
        collegeCity,
        collegeState,
        collegeWebsiteUrl,
        collegeLogoUrl,
        phone,
        designation,
        reason
      } 

      let res = await fetch(`${import.meta.env.VITE_API_URL}/admin/college-admin-requests`, {
        method: "POST",
        headers: {
        "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      })
      const responsePayload = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(responsePayload?.message || 'Failed to submit Request')
      }
      setDone(true)
      setFeedback({
        type: "success",
        message: responsePayload?.message || "Request submitted successfully"
      })
    } catch(error){
      setDone(false)
      setFeedback({
        type: "error",
        message: error?.message || "Something went wrong"
      })
      console.log(error)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    await submitCollegeReq();
  }

  const handleInputChange = (event) => {
    const { name, value } = event.target
    setFormData((previous) => ({ ...previous, [name]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl p-6 border border-white/10"
        style={{ background: "#0D1526", animation: "fadeUp .3s ease both" }}>

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
                placeholder="Enter organization head name"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className="border p-2 rounded-2xl" />
            </label>
            <br/>
            <label>
              <span>email: </span>
              <input
                type="text" 
                placeholder="Enter head email"
                name="email"
                value={formData.email} 
                onChange={handleInputChange}
                className="border p-2 rounded-2xl" 
              />
            </label>
            <br/>
            <label>
              <span>college Name: </span>
              <input 
                type="text"
                placeholder="Enter college name"
                name="collegeName"
                value={formData.collegeName}
                onChange={handleInputChange}
                className="border p-2 rounded-2xl"
              />
            </label>
            <br/>
            <label>
              <span>college Email Domain: </span>
              <input 
                type="text" 
                placeholder="@vtu.edu.in" 
                name="collegeEmailDomain"
                value={formData.collegeEmailDomain}
                onChange={handleInputChange}
                className="border p-2 rounded-2xl" />
            </label>
            <br/>
            <label>
              <span>college short name: </span>
              <input 
                type="text" 
                placeholder="VTU" 
                name="collegeShortName"
                value={formData.collegeShortName}
                onChange={handleInputChange}
                className="border p-2 rounded-2xl" />
            </label>
            <br/>
            <label>
              <span>CITY: </span>
              <input 
                type="text" 
                placeholder="college city" 
                name="collegeCity"
                value={formData.collegeCity}
                onChange={handleInputChange}
                className="border p-2 rounded-2xl" />
            </label>
            <br/>
            <label>
              <span>state: </span>
              <input 
                type="text" 
                placeholder="Enter state" 
                onChange={handleInputChange}
                name="collegeState"
                value={formData.collegeState}
                className="border p-2 rounded-2xl" />
            </label>
            <br/>
            <label>
              <span>collegeWebsiteUrl: </span>
              <input 
                text="text"
                placeholder="upload the url"
                name="collegeWebsiteUrl"
                value={formData.collegeWebsiteUrl}
                onChange={handleInputChange}
                className="border p-2 rounded-2xl"
              />
            </label>
            <br/>
            <label>
              <span>college logo: </span>
              <input 
                text="text"
                placeholder="upload the url"
                name="collegeLogoUrl"
                value={formData.collegeLogoUrl}
                onChange={handleInputChange}
                className="border p-2 rounded-2xl"
              />
            </label>
            <br/>
            <label>
              <span>phone: </span>
              <input 
                text="text"
                placeholder="enter the phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="border p-2 rounded-2xl"
              />
            </label>
            <br/>
            <label>
              <span>designation: </span>
              <input 
                text="text"
                placeholder="enter designation"
                name="designation"
                value={formData.designation}
                onChange={handleInputChange}
                className="border p-2 rounded-2xl"
                
              />
            </label>
            <br/>
            <label>
              <span>reason </span>
              <input 
                type="text" 
                placeholder="Enter reason" 
                name="reason"
                value={formData.reason}
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