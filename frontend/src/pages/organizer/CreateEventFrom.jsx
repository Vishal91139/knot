import { useState, useRef, useEffect, useCallback } from "react"
import { useUser } from "../../context/UserContext"
import { ApiError } from "../../api/client"
import { createEvent } from "../../api/events"
import { getMyOrganizer } from "../../api/organizers"
import "./create-event.css"

/* ─────────────────────────────────────────────────────────────
   KNOT — Create Event Form
   Covers every field from the Event model schema.

   Usage:
     import CreateEventForm from "./CreateEventForm"
     <CreateEventForm onSuccess={(data) => console.log(data)} onCancel={() => navigate(-1)} />
───────────────────────────────────────────────────────────── */

// ── ENUMS (match your Prisma schema) ─────────────────────────

const EVENT_CATEGORIES = [
  { value: "technical", label: "Technical", icon: "💻", color: "blue" },
  { value: "cultural", label: "Cultural", icon: "🎭", color: "purple" },
  { value: "sports", label: "Sports", icon: "⚽", color: "green" },
  { value: "academic", label: "Academic", icon: "📚", color: "amber" },
  { value: "workshop", label: "Workshop", icon: "🔧", color: "blue" },
  { value: "hackathon", label: "Hackathon", icon: "⚡", color: "red" },
  { value: "other", label: "Other", icon: "◈", color: "ink" },
]

const EVENT_TYPES = [
  { value: "incollege", label: "In-College", icon: "🏛️", desc: "Only for students of your college" },
  { value: "intercollege", label: "Inter-College", icon: "🌐", desc: "Open to students from other colleges too" },
]

const EVENT_MODES = [
  { value: "offline",  label: "Offline",      icon: "📍", desc: "Physical venue — students attend in person" },
  { value: "online",   label: "Online",        icon: "💻", desc: "Virtual event via a link or platform"      },
  { value: "hybrid",   label: "Hybrid",        icon: "⬡",  desc: "Both physical venue and online access"    },
]

const EVENT_STATUSES = {
  draft:    { label: "Draft",    color: "pill-amber" },
  pending:  { label: "Pending",  color: "pill-amber" },
  approved: { label: "Approved", color: "pill-green" },
}

// ── STEPS CONFIG ──────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Basic Info",         desc: "Title, category & type"      },
  { id: 2, label: "Date & Time",        desc: "Schedule & deadline"          },
  { id: 3, label: "Venue & Mode",       desc: "Where it happens"             },
  { id: 4, label: "Capacity & Teams",   desc: "Seats, team setup, waitlist"  },
  { id: 5, label: "Pricing & Extras",   desc: "Fees, tags, rounds"           },
  { id: 6, label: "Media & Review",     desc: "Uploads & final check"        },
]

// ── EMPTY FORM STATE (maps 1:1 to schema) ────────────────────

const EMPTY = {
  // Step 1
  title:             "",
  short_description: "",
  long_description:  "",
  category:          "",
  event_type:        "incollege",
  mode:              "offline",
  // Step 2
  start_datetime:        "",
  end_datetime:          "",
  registration_deadline: "",
  // Step 3
  venue_name:    "",
  venue_address: "",
  online_link:   "",
  // Step 4
  max_capacity:      "",
  is_team_event:     false,
  min_team_size:     "",
  max_team_size:     "",
  waitlist_enabled:  false,
  // Step 5
  is_paid:          false,
  entry_fee:        "",
  currency:         "INR",
  has_multi_rounds: false,
  is_featured:      false,
  tags:             [],
  // Step 6
  banner_url:   null,
  poster_url:   null,
  document_url: null,
}

// ── VALIDATION PER STEP ───────────────────────────────────────

function validateStep(step, form) {
  const errors = {}
  if (step === 1) {
    if (!form.title.trim())             errors.title = "Title is required"
    else if (form.title.length > 200)   errors.title = "Max 200 characters"
    if (!form.short_description.trim()) errors.short_description = "Short description is required"
    else if (form.short_description.length > 300) errors.short_description = "Max 300 characters"
    if (!form.long_description.trim())  errors.long_description = "Long description is required"
    if (!form.category)                 errors.category = "Select a category"
  }
  if (step === 2) {
    if (!form.start_datetime)               errors.start_datetime = "Start date & time is required"
    if (!form.end_datetime)                 errors.end_datetime   = "End date & time is required"
    if (!form.registration_deadline)        errors.registration_deadline = "Registration deadline is required"
    if (form.start_datetime && form.end_datetime && form.end_datetime <= form.start_datetime)
      errors.end_datetime = "End must be after start"
    if (form.registration_deadline && form.start_datetime && form.registration_deadline > form.start_datetime)
      errors.registration_deadline = "Deadline must be before event start"
  }
  if (step === 3) {
    if ((form.mode === "offline" || form.mode === "hybrid") && !form.venue_name.trim())
      errors.venue_name = "Venue name is required for offline/hybrid events"
    if ((form.mode === "online" || form.mode === "hybrid") && !form.online_link.trim())
      errors.online_link = "Online link is required for online/hybrid events"
  }
  if (step === 4) {
    if (!form.max_capacity || Number(form.max_capacity) < 1) errors.max_capacity = "Enter a valid capacity"
    if (form.is_team_event) {
      if (!form.min_team_size || Number(form.min_team_size) < 1) errors.min_team_size = "Enter minimum team size"
      if (!form.max_team_size || Number(form.max_team_size) < 1) errors.max_team_size = "Enter maximum team size"
      if (form.min_team_size && form.max_team_size && Number(form.min_team_size) > Number(form.max_team_size))
        errors.max_team_size = "Max must be ≥ min team size"
    }
  }
  if (step === 5) {
    if (form.is_paid && (!form.entry_fee || Number(form.entry_fee) <= 0))
      errors.entry_fee = "Enter a valid entry fee"
  }
  return errors
}

// ── HELPERS ───────────────────────────────────────────────────

const fmtDT = iso => {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("en-IN", { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" })
}

// ── CURSOR ────────────────────────────────────────────────────

function Cursor() {
  const dot  = useRef(null)
  const ring = useRef(null)
  const pos  = useRef({ mx: 300, my: 300, rx: 300, ry: 300 })
  useEffect(() => {
    const mv = e => { pos.current.mx = e.clientX; pos.current.my = e.clientY }
    document.addEventListener("mousemove", mv)
    let raf
    const loop = () => {
      const p = pos.current
      p.rx += (p.mx - p.rx) * 0.11
      p.ry += (p.my - p.ry) * 0.11
      if (dot.current)  { dot.current.style.left  = p.mx + "px"; dot.current.style.top  = p.my + "px" }
      if (ring.current) { ring.current.style.left = p.rx + "px"; ring.current.style.top = p.ry + "px" }
      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => { document.removeEventListener("mousemove", mv); cancelAnimationFrame(raf) }
  }, [])
  return (
    <>
      <div id="cur-dot"  ref={dot}  />
      <div id="cur-ring" ref={ring} />
    </>
  )
}

// ── SMALL UI PIECES ───────────────────────────────────────────

function Field({ label, required, error, note, children, charCount, charMax }) {
  const overLimit = charCount !== undefined && charMax && charCount > charMax
  return (
    <div className="field">
      <label className="field-label">
        {label}{required && <span className="required">*</span>}
      </label>
      {children}
      {charCount !== undefined && charMax && (
        <div className={`char-count ${charCount > charMax * 0.9 ? overLimit ? "over" : "warn" : ""}`}>
          {charCount} / {charMax}
        </div>
      )}
      {error && <p className="field-error">{error}</p>}
      {note  && <p className="field-note">{note}</p>}
    </div>
  )
}

function Input({ error, className = "", ...props }) {
  return (
    <input
      className={`field-input ${error ? "error" : ""} ${className}`}
      {...props}
    />
  )
}

function Textarea({ error, className = "", ...props }) {
  return (
    <textarea
      className={`field-input field-textarea ${error ? "error" : ""} ${className}`}
      {...props}
    />
  )
}

function Select({ error, children, ...props }) {
  return (
    <select className={`field-input appearance-none ${error ? "error" : ""}`} {...props}>
      {children}
    </select>
  )
}

function Toggle({ on, onChange, label, desc, disabled = false }) {
  return (
    <div className={`toggle-row ${on ? "active" : ""} ${disabled ? "opacity-50" : ""}`}>
      <div>
        <p className="toggle-label">{label}</p>
        {desc && <p className="toggle-desc">{desc}</p>}
      </div>
      <button
        type="button"
        className={`toggle-switch ${on ? "on" : ""}`}
        onClick={() => !disabled && onChange(!on)}
        aria-pressed={on}
      />
    </div>
  )
}

function TagInput({ tags, onChange }) {
  const [input, setInput] = useState("")
  const ref = useRef(null)

  const add = useCallback(() => {
    const val = input.trim().toLowerCase().replace(/\s+/g, "-")
    if (val && !tags.includes(val) && tags.length < 10) {
      onChange([...tags, val])
      setInput("")
    }
  }, [input, tags, onChange])

  const remove = id => onChange(tags.filter(t => t !== id))

  return (
    <div className="tag-input-wrap" onClick={() => ref.current?.focus()}>
      {tags.map(t => (
        <span key={t} className="tag-chip">
          {t}
          <button type="button" className="tag-chip-remove" onClick={() => remove(t)}>✕</button>
        </span>
      ))}
      <input
        ref={ref}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add() }
          if (e.key === "Backspace" && !input && tags.length) remove(tags[tags.length - 1])
        }}
        onBlur={add}
        className="tag-input-field"
        placeholder={tags.length < 10 ? "Type and press Enter…" : "Max 10 tags"}
        disabled={tags.length >= 10}
      />
    </div>
  )
}

function UploadZone({ label, note, accept, value, onChange, icon = "📎" }) {
  const ref = useRef(null)
  return (
    <div>
      <label className="field-label">{label}</label>
      <div className={`upload-zone ${value ? "has-file" : ""}`} onClick={() => ref.current?.click()}>
        <div className="upload-icon">{value ? "✅" : icon}</div>
        <div className="upload-title">
          {value ? value.name || "File selected" : "Click to upload"}
        </div>
        <div className="upload-sub">{value ? "Click to replace" : note}</div>
        <button type="button" className="upload-btn" onClick={e => { e.stopPropagation(); ref.current?.click() }}>
          {value ? "Replace file" : "Choose file"}
        </button>
      </div>
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        style={{ display: "none" }}
        onChange={e => onChange(e.target.files[0] || null)}
      />
    </div>
  )
}

// ── STEP COMPONENTS ───────────────────────────────────────────

function Step1({ form, setForm, errors }) {
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <div className="step-enter">
      <div className="section-heading">
        <p className="section-step-label">Step 1 of 6</p>
        <h2 className="section-title">Basic <em>information.</em></h2>
        <p className="section-subtitle">Start with the core details — what your event is called and what kind of event it is.</p>
      </div>

      {/* Title */}
      <div className="flex flex-col gap-5">
        <Field label="Event Title" required error={errors.title} charCount={form.title.length} charMax={200}>
          <Input
            value={form.title}
            onChange={e => set("title", e.target.value)}
            placeholder="e.g. InnovateFest Hackathon 2025"
            maxLength={220}
            error={errors.title}
          />
        </Field>

        {/* Short description */}
        <Field label="Short Description" required error={errors.short_description}
          charCount={form.short_description.length} charMax={300}
          note="Shown on event cards and search results.">
          <Textarea
            value={form.short_description}
            onChange={e => set("short_description", e.target.value)}
            placeholder="A one-liner that tells students exactly what this event is about…"
            rows={3}
            maxLength={320}
            error={errors.short_description}
          />
        </Field>

        {/* Long description */}
        <Field label="Full Description" required error={errors.long_description}
          note="Shown on the event detail page. Supports plain text — be thorough.">
          <Textarea
            value={form.long_description}
            onChange={e => set("long_description", e.target.value)}
            placeholder="Cover what students will learn or experience, the agenda, eligibility, what to bring, prizes, etc."
            rows={6}
            error={errors.long_description}
            style={{ minHeight: "140px" }}
          />
        </Field>

        <div className="section-divider" />

        {/* Category */}
        <Field label="Event Category" required error={errors.category}>
          <div className="enum-grid">
            {EVENT_CATEGORIES.map(c => (
              <button
                key={c.value}
                type="button"
                onClick={() => set("category", c.value)}
                className={`enum-chip ${form.category === c.value ? `selected ${c.color}` : ""}`}
              >
                <span className="enum-chip-icon">{c.icon}</span>
                {c.label}
              </button>
            ))}
          </div>
        </Field>

        <div className="section-divider" />

        {/* Event type */}
        <Field label="Event Type" required note="Controls who can discover and register for this event.">
          <div className="card-grid card-grid-3">
            {EVENT_TYPES.map(t => (
              <div
                key={t.value}
                className={`option-card ${form.event_type === t.value ? "selected" : ""}`}
                onClick={() => set("event_type", t.value)}
              >
                <div className="oc-icon">{t.icon}</div>
                <div className="oc-title">{t.label}</div>
                <div className="oc-desc">{t.desc}</div>
              </div>
            ))}
          </div>
        </Field>

        <div className="section-divider" />

        {/* Mode */}
        <Field label="Event Mode" required note="Determines what venue / link fields you'll fill in the next steps.">
          <div className="card-grid card-grid-3">
            {EVENT_MODES.map(m => (
              <div
                key={m.value}
                className={`option-card ${form.mode === m.value ? "selected" : ""}`}
                onClick={() => set("mode", m.value)}
              >
                <div className="oc-icon">{m.icon}</div>
                <div className="oc-title">{m.label}</div>
                <div className="oc-desc">{m.desc}</div>
              </div>
            ))}
          </div>
        </Field>
      </div>
    </div>
  )
}

function Step2({ form, setForm, errors }) {
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <div className="step-enter">
      <div className="section-heading">
        <p className="section-step-label">Step 2 of 6</p>
        <h2 className="section-title">Date <em>& time.</em></h2>
        <p className="section-subtitle">Set when your event starts, ends and when registration closes.</p>
      </div>

      <div className="flex flex-col gap-5">
        {/* Start */}
        <Field label="Start Date & Time" required error={errors.start_datetime}>
          <Input
            type="datetime-local"
            value={form.start_datetime}
            onChange={e => set("start_datetime", e.target.value)}
            error={errors.start_datetime}
          />
        </Field>

        {/* End */}
        <Field label="End Date & Time" required error={errors.end_datetime}
          note="For multi-day events set the final day end time.">
          <Input
            type="datetime-local"
            value={form.end_datetime}
            onChange={e => set("end_datetime", e.target.value)}
            min={form.start_datetime}
            error={errors.end_datetime}
          />
        </Field>

        <div className="section-divider" />

        {/* Registration deadline */}
        <Field label="Registration Deadline" required error={errors.registration_deadline}
          note="Students cannot register after this date and time.">
          <Input
            type="datetime-local"
            value={form.registration_deadline}
            onChange={e => set("registration_deadline", e.target.value)}
            max={form.start_datetime}
            error={errors.registration_deadline}
          />
        </Field>

        {/* Duration display */}
        {form.start_datetime && form.end_datetime && (
          <div className="info-box blue">
            <p className="info-box-title">Event Duration</p>
            <p className="info-box-text">
              {(() => {
                const diff = (new Date(form.end_datetime) - new Date(form.start_datetime)) / 1000 / 60
                if (diff <= 0) return "Invalid — end is before start"
                const days = Math.floor(diff / 1440)
                const hrs  = Math.floor((diff % 1440) / 60)
                const mins = diff % 60
                return [days && `${days} day${days>1?"s":""}`, hrs && `${hrs} hr${hrs>1?"s":""}`, mins && `${mins} min`].filter(Boolean).join(", ")
              })()}
            </p>
          </div>
        )}

        {form.registration_deadline && form.start_datetime && (
          <div className="info-box green">
            <p className="info-box-title">Registration Window</p>
            <p className="info-box-text">
              Registration closes {fmtDT(form.registration_deadline)} — {(() => {
                const diff = (new Date(form.start_datetime) - new Date(form.registration_deadline)) / 1000 / 3600
                if (diff <= 0) return "deadline is after event start!"
                return `${Math.round(diff)} hours before event starts`
              })()}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function Step3({ form, setForm, errors }) {
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const needsVenue  = form.mode === "offline" || form.mode === "hybrid"
  const needsOnline = form.mode === "online"  || form.mode === "hybrid"

  return (
    <div className="step-enter">
      <div className="section-heading">
        <p className="section-step-label">Step 3 of 6</p>
        <h2 className="section-title">Venue <em>& location.</em></h2>
        <p className="section-subtitle">
          {form.mode === "offline" && "Physical venue details for your in-person event."}
          {form.mode === "online"  && "Provide the link where students will join online."}
          {form.mode === "hybrid"  && "Your event is hybrid — fill both venue and online link."}
        </p>
      </div>

      {/* Mode reminder */}
      <div className={`info-box ${form.mode === "online" ? "blue" : form.mode === "hybrid" ? "amber" : "green"} mb-6`}>
        <p className="info-box-title">
          {form.mode === "offline" ? "📍 Offline event" : form.mode === "online" ? "💻 Online event" : "⬡ Hybrid event"}
        </p>
        <p className="info-box-text">
          {form.mode === "offline" && "Fill in the venue name and address below."}
          {form.mode === "online"  && "Fill in the online meeting link below. Venue fields are not required."}
          {form.mode === "hybrid"  && "Fill in both sections — venue for in-person attendees and link for online."}
        </p>
      </div>

      <div className="flex flex-col gap-5">
        {/* Venue section */}
        {needsVenue && (
          <>
            <Field label="Venue Name" required={needsVenue} error={errors.venue_name}>
              <Input
                value={form.venue_name}
                onChange={e => set("venue_name", e.target.value)}
                placeholder="e.g. Innovation Hub, Block C"
                error={errors.venue_name}
              />
            </Field>
            <Field label="Venue Address / Directions"
              note="Full address or campus directions so students can find it easily.">
              <Textarea
                value={form.venue_address}
                onChange={e => set("venue_address", e.target.value)}
                placeholder="e.g. Ground Floor, Block C, R.V. College of Engineering, Mysuru Rd, Bengaluru 560059"
                rows={3}
              />
            </Field>
          </>
        )}

        {/* Online section */}
        {needsOnline && (
          <>
            {needsVenue && <div className="section-divider" />}
            <Field label="Online Meeting Link" required={needsOnline} error={errors.online_link}
              note="Zoom, Google Meet, MS Teams, or any video conferencing link.">
              <Input
                type="url"
                value={form.online_link}
                onChange={e => set("online_link", e.target.value)}
                placeholder="https://meet.google.com/xyz-abcd-123"
                error={errors.online_link}
              />
            </Field>
            <div className="info-box amber">
              <p className="info-box-title">Link visibility</p>
              <p className="info-box-text">The online link will only be shown to registered participants — not on the public event page.</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Step4({ form, setForm, errors }) {
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <div className="step-enter">
      <div className="section-heading">
        <p className="section-step-label">Step 4 of 6</p>
        <h2 className="section-title">Capacity <em>& teams.</em></h2>
        <p className="section-subtitle">Control how many students can register and set up team event rules.</p>
      </div>

      <div className="flex flex-col gap-5">
        {/* Max capacity */}
        <Field label="Maximum Capacity" required error={errors.max_capacity}
          note="Total number of seats available. Registration closes automatically when this is reached (unless waitlist is on).">
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              min="1"
              value={form.max_capacity}
              onChange={e => set("max_capacity", e.target.value)}
              placeholder="e.g. 300"
              error={errors.max_capacity}
            />
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-black/10">
              <span className="font-mono text-[0.62rem] text-black/30 uppercase tracking-wider">Registered</span>
              <span className="font-mono font-bold text-[0.88rem]">0 / {form.max_capacity || "—"}</span>
            </div>
          </div>
        </Field>

        <div className="section-divider" />

        {/* Waitlist */}
        <Toggle
          on={form.waitlist_enabled}
          onChange={v => set("waitlist_enabled", v)}
          label="Enable Waitlist"
          desc="Allow students to join a waitlist when capacity is full. They're notified if a spot opens."
        />

        <div className="section-divider" />

        {/* Team event toggle */}
        <Toggle
          on={form.is_team_event}
          onChange={v => set("is_team_event", v)}
          label="This is a Team Event"
          desc="Students register as teams instead of individuals. You'll set team size limits below."
        />

        {/* Team size — only shown if team event */}
        {form.is_team_event && (
          <div className="rounded-xl border border-black/10 p-5 bg-white flex flex-col gap-4">
            <p className="text-[0.82rem] font-semibold text-black/60">Team Size Configuration</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Minimum Team Size" required error={errors.min_team_size}>
                <Input
                  type="number"
                  min="1"
                  value={form.min_team_size}
                  onChange={e => set("min_team_size", e.target.value)}
                  placeholder="e.g. 2"
                  error={errors.min_team_size}
                />
              </Field>
              <Field label="Maximum Team Size" required error={errors.max_team_size}>
                <Input
                  type="number"
                  min={form.min_team_size || 1}
                  value={form.max_team_size}
                  onChange={e => set("max_team_size", e.target.value)}
                  placeholder="e.g. 4"
                  error={errors.max_team_size}
                />
              </Field>
            </div>
            {form.min_team_size && form.max_team_size && Number(form.min_team_size) <= Number(form.max_team_size) && (
              <div className="info-box green">
                <p className="info-box-title">Team configuration</p>
                <p className="info-box-text">
                  Teams of {form.min_team_size}–{form.max_team_size} members.
                  Maximum {form.max_capacity ? Math.floor(form.max_capacity / form.min_team_size) : "—"} teams can participate.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Step5({ form, setForm, errors }) {
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const CURRENCIES = ["INR", "USD", "EUR", "GBP", "SGD"]

  return (
    <div className="step-enter">
      <div className="section-heading">
        <p className="section-step-label">Step 5 of 6</p>
        <h2 className="section-title">Pricing <em>& extras.</em></h2>
        <p className="section-subtitle">Set entry fees, add tags for discoverability, and configure advanced options.</p>
      </div>

      <div className="flex flex-col gap-5">
        {/* Paid toggle */}
        <Toggle
          on={form.is_paid}
          onChange={v => set("is_paid", v)}
          label="Paid Event"
          desc="Charge an entry fee for registration. Free by default."
        />

        {/* Fee — only shown if paid */}
        {form.is_paid && (
          <div className="rounded-xl border border-black/10 p-5 bg-white">
            <p className="text-[0.82rem] font-semibold text-black/60 mb-4">Entry Fee Configuration</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Field label="Entry Fee" required error={errors.entry_fee}>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.entry_fee}
                    onChange={e => set("entry_fee", e.target.value)}
                    placeholder="e.g. 199"
                    error={errors.entry_fee}
                  />
                </Field>
              </div>
              <Field label="Currency">
                <Select value={form.currency} onChange={e => set("currency", e.target.value)}>
                  {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                </Select>
              </Field>
            </div>
            {form.entry_fee > 0 && (
              <div className="info-box amber" style={{ marginTop: "12px" }}>
                <p className="info-box-title">Payment notice</p>
                <p className="info-box-text">Entry fee is {form.currency} {Number(form.entry_fee).toFixed(2)} per participant{form.is_team_event ? " / team member" : ""}. Payment gateway configuration is done separately.</p>
              </div>
            )}
          </div>
        )}

        <div className="section-divider" />

        {/* Tags */}
        <Field label="Tags"
          note="Help students discover your event. Type and press Enter or comma to add. Max 10 tags.">
          <TagInput tags={form.tags} onChange={tags => set("tags", tags)} />
        </Field>

        <div className="section-divider" />

        {/* Multi-rounds */}
        <Toggle
          on={form.has_multi_rounds}
          onChange={v => set("has_multi_rounds", v)}
          label="Multi-Round Event"
          desc="Events like hackathons or competitions with preliminary, semi-final, and final rounds."
        />

        {form.has_multi_rounds && (
          <div className="info-box blue">
            <p className="info-box-title">Round management</p>
            <p className="info-box-text">You can configure individual rounds and their schedules from the Event Detail page after the event is created.</p>
          </div>
        )}

        <div className="section-divider" />

        {/* Featured */}
        <Toggle
          on={form.is_featured}
          onChange={v => set("is_featured", v)}
          label="Request Featured Listing"
          desc="Ask your College Admin to feature this event on the KNOT homepage. Subject to approval."
        />
      </div>
    </div>
  )
}

function Step6({ form, setForm }) {
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const cat = EVENT_CATEGORIES.find(c => c.value === form.category)
  const evtype = EVENT_TYPES.find(t => t.value === form.event_type)
  const mode   = EVENT_MODES.find(m => m.value === form.mode)

  return (
    <div className="step-enter">
      <div className="section-heading">
        <p className="section-step-label">Step 6 of 6</p>
        <h2 className="section-title">Media <em>& review.</em></h2>
        <p className="section-subtitle">Upload your event visuals and review everything before creating the event.</p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Media uploads */}
        <div className="grid grid-cols-3 gap-4">
          <UploadZone
            label="Event Banner"
            note="Landscape image · JPG / PNG · Max 5MB"
            accept="image/jpeg,image/png,image/webp"
            icon="🖼️"
            value={form.banner_url}
            onChange={f => set("banner_url", f)}
          />
          <UploadZone
            label="Event Poster"
            note="Portrait image · JPG / PNG · Max 5MB"
            accept="image/jpeg,image/png,image/webp"
            icon="🪄"
            value={form.poster_url}
            onChange={f => set("poster_url", f)}
          />
          <UploadZone
            label="Document / Brochure"
            note="Rules PDF, brochure · PDF · Max 10MB"
            accept="application/pdf"
            icon="📄"
            value={form.document_url}
            onChange={f => set("document_url", f)}
          />
        </div>

        <div className="section-divider" />

        {/* Live preview card */}
        <div>
          <p className="font-mono text-[0.58rem] font-bold tracking-[0.12em] uppercase text-black/35 mb-3">How it looks on the events feed</p>
          <div className="event-preview-card">
            <div className="preview-banner">
              <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.65))" }} />
              <div className="preview-banner-content">
                {cat && <span className="preview-tag">{cat.icon} {cat.label}</span>}
                <p className="preview-title">{form.title || "Your Event Title"}</p>
              </div>
            </div>
            <div className="preview-body">
              {[
                { l:"Date",    v: form.start_datetime ? fmtDT(form.start_datetime).split(",").slice(0,2).join(",") : "TBD" },
                { l:"Venue",   v: form.venue_name || (form.mode === "online" ? "Online" : "TBD") },
                { l:"Capacity",v: form.max_capacity ? `${form.max_capacity} seats` : "TBD" },
                { l:"Fee",     v: form.is_paid ? `${form.currency} ${form.entry_fee || "—"}` : "Free" },
              ].map(i => (
                <div key={i.l}>
                  <p className="pb-item-label">{i.l}</p>
                  <p className="pb-item-val">{i.v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Full review */}
        <div>
          <p className="font-mono text-[0.58rem] font-bold tracking-[0.12em] uppercase text-black/35 mb-4">Full Review</p>

          {/* Basic info */}
          <div className="review-section">
            <p className="review-section-title">Basic Info</p>
            <div className="review-grid">
              <div className="review-cell"><p className="rc-label">Title</p><p className="rc-val">{form.title || <span className="rc-val empty">—</span>}</p></div>
              <div className="review-cell"><p className="rc-label">Category</p><p className="rc-val">{cat ? `${cat.icon} ${cat.label}` : <span className="rc-val empty">—</span>}</p></div>
              <div className="review-cell"><p className="rc-label">Event Type</p><p className="rc-val">{evtype ? `${evtype.icon} ${evtype.label}` : "—"}</p></div>
              <div className="review-cell"><p className="rc-label">Mode</p><p className="rc-val">{mode ? `${mode.icon} ${mode.label}` : "—"}</p></div>
            </div>
            <div className="review-grid full mt-1">
              <div className="review-cell"><p className="rc-label">Short Description</p><p className="rc-val">{form.short_description || <span className="rc-val empty">—</span>}</p></div>
            </div>
          </div>

          {/* Schedule */}
          <div className="review-section">
            <p className="review-section-title">Schedule</p>
            <div className="review-grid three">
              <div className="review-cell"><p className="rc-label">Starts</p><p className="rc-val">{fmtDT(form.start_datetime)}</p></div>
              <div className="review-cell"><p className="rc-label">Ends</p><p className="rc-val">{fmtDT(form.end_datetime)}</p></div>
              <div className="review-cell"><p className="rc-label">Registration Closes</p><p className="rc-val">{fmtDT(form.registration_deadline)}</p></div>
            </div>
          </div>

          {/* Venue */}
          <div className="review-section">
            <p className="review-section-title">Venue & Location</p>
            <div className="review-grid">
              <div className="review-cell"><p className="rc-label">Venue Name</p><p className="rc-val">{form.venue_name || <span className="rc-val empty">—</span>}</p></div>
              <div className="review-cell"><p className="rc-label">Online Link</p><p className="rc-val">{form.online_link || <span className="rc-val empty">—</span>}</p></div>
            </div>
          </div>

          {/* Capacity */}
          <div className="review-section">
            <p className="review-section-title">Capacity & Teams</p>
            <div className="review-grid three">
              <div className="review-cell"><p className="rc-label">Capacity</p><p className="rc-val">{form.max_capacity || "—"}</p></div>
              <div className="review-cell"><p className="rc-label">Waitlist</p><p className="rc-val">{form.waitlist_enabled ? "Enabled" : "Disabled"}</p></div>
              <div className="review-cell">
                <p className="rc-label">Team Event</p>
                <p className="rc-val">
                  {form.is_team_event ? `Yes · ${form.min_team_size || "?"}–${form.max_team_size || "?"} members` : "No — individual"}
                </p>
              </div>
            </div>
          </div>

          {/* Extras */}
          <div className="review-section">
            <p className="review-section-title">Pricing & Extras</p>
            <div className="review-grid">
              <div className="review-cell"><p className="rc-label">Entry Fee</p><p className="rc-val">{form.is_paid ? `${form.currency} ${form.entry_fee}` : "Free"}</p></div>
              <div className="review-cell"><p className="rc-label">Multi-Round</p><p className="rc-val">{form.has_multi_rounds ? "Yes" : "No"}</p></div>
            </div>
            {form.tags.length > 0 && (
              <div className="review-grid full mt-1">
                <div className="review-cell">
                  <p className="rc-label">Tags</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {form.tags.map(t => <span key={t} className="pill pill-ink">{t}</span>)}
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

// ── MAIN COMPONENT ────────────────────────────────────────────

export default function CreateEventForm({ onSuccess, onCancel }) {
  const [step,   setStep]   = useState(1)
  const [form,   setForm]   = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [done,   setDone]   = useState(false)
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [organizerId, setOrganizerId] = useState(null)
  const [organizerLoading, setOrganizerLoading] = useState(true)
  const mainRef = useRef(null)
  const { user } = useUser()

  // Auto-save to localStorage
  useEffect(() => {
    const saved = localStorage.getItem("knot_create_event_draft")
    if (saved) {
      try {
        setForm(JSON.parse(saved))
      } catch (_e) {
        /* ignore invalid draft */
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("knot_create_event_draft", JSON.stringify(form))
  }, [form])

  useEffect(() => {
    let alive = true

    const loadOrganizer = async () => {
      try {
        setOrganizerLoading(true)
        const payload = await getMyOrganizer()
        const orgId = payload?.data?.id

        if (!alive) return
        setOrganizerId(orgId || null)
      } catch {
        if (alive) setOrganizerId(null)
      } finally {
        if (alive) setOrganizerLoading(false)
      }
    }

    loadOrganizer()

    return () => {
      alive = false
    }
  }, [])

  const scrollTop = () => mainRef.current?.scrollTo({ top: 0, behavior: "smooth" })

  const goNext = () => {
    const errs = validateStep(step, form)
    if (Object.keys(errs).length > 0) { setErrors(errs); scrollTop(); return }
    setErrors({})
    if (step < 6) { setStep(s => s + 1); scrollTop() }
    else setConfirmOpen(true)
  }

  const goPrev = () => {
    setErrors({})
    setStep(s => s - 1)
    scrollTop()
  }

  const goToStep = idx => {
    // Only allow going back or to already-passed steps
    if (idx < step) { setErrors({}); setStep(idx); scrollTop() }
  }

  const submit = async () => {
    try {
      setSubmitError("")

      if (organizerLoading) {
        setSubmitError("Loading your organizer account… please try again in a moment.")
        return
      }

      if (!organizerId) {
        setSubmitError("No active organizer account found for this user. Ask your college admin to activate your organizer account.")
        return
      }

      const collegeId = user?.college_id
      if (!collegeId) {
        setSubmitError("Your account is missing a college. Please contact support.")
        return
      }

      setSaving(true)

      const payload = {
        ...form,
        organizerId,
        collegeId,
        status: "approved",
      }

      const res = await createEvent(payload)
      setDone(true)
      localStorage.removeItem("knot_create_event_draft")
      onSuccess?.(res?.data)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to create event"
      setSubmitError(message)
    } finally {
      setSaving(false)
    }
  }

  const progressPct = ((step - 1) / (STEPS.length - 1)) * 100

  // ── RENDER ──────────────────────────────────────────────────

  if (done) {
    return (
      <div className="flex h-screen bg-[#F4EEE3] items-center justify-center">
        <Cursor />
        <div className="submit-success max-w-md">
          <div className="success-circle">✓</div>
          <h2 className="font-serif font-bold text-[2rem] tracking-[-0.035em] mb-3">
            Event created!
          </h2>
          <p className="text-[0.9rem] text-black/45 leading-relaxed mb-2">
            <strong className="text-black">{form.title}</strong> has been created successfully.
          </p>
          <p className="text-[0.85rem] text-black/35 mb-8">You can manage it from your organizer dashboard.</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setDone(false); setStep(1); setForm(EMPTY) }}
              className="px-6 py-2.5 rounded-full border border-black/20 text-[0.85rem] font-semibold text-black/40 hover:border-black hover:text-black transition-all"
            >
              Create another
            </button>
            <button
              onClick={() => onCancel?.()}
              className="px-6 py-2.5 rounded-full bg-[#141414] text-[#F4EEE3] text-[0.85rem] font-bold hover:bg-[#E8390C] transition-all"
            >
              Go to dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#F4EEE3] overflow-hidden">
      <Cursor />

      {/* ── LEFT RAIL ─────────────────────────────────────── */}
      <div className="steps-rail custom-scroll">
        {/* Logo */}
        <div className="rail-logo">
          <div className="rail-logo-sq">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="4" cy="4" r="2" fill="#141414"/>
              <circle cx="12" cy="4" r="2" fill="#141414"/>
              <circle cx="8" cy="12" r="2" fill="#141414"/>
              <line x1="4" y1="4" x2="12" y2="4" stroke="#141414" strokeWidth="1.5"/>
              <line x1="4" y1="4" x2="8" y2="12" stroke="#141414" strokeWidth="1.5"/>
              <line x1="12" y1="4" x2="8" y2="12" stroke="#141414" strokeWidth="1.5"/>
            </svg>
          </div>
          <span className="rail-logo-name">KNOT</span>
        </div>

        {/* Step list */}
        <div className="steps-list">
          {STEPS.map(s => {
            const state = step === s.id ? "active" : step > s.id ? "done" : ""
            return (
              <div
                key={s.id}
                className={`step-row ${state}`}
                onClick={() => goToStep(s.id)}
                style={{ cursor: s.id < step ? "none" : "default" }}
              >
                <div className="step-circle">
                  {step > s.id ? "✓" : s.id}
                </div>
                <div className="step-info">
                  <p className="step-num-label">Step {s.id}</p>
                  <p className="step-title">{s.label}</p>
                  <p className="step-desc">{s.desc}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Rail footer */}
        <div className="rail-footer">
          <div className="draft-pill">
            <span className="draft-dot" />
            Draft autosaved
          </div>
          <p className="text-[0.68rem] text-white/20 mt-2 leading-relaxed">
            You can return to this form — your progress is saved automatically in the browser.
          </p>
        </div>
      </div>

      {/* ── TOP ERROR (submit) ─────────────────────────────── */}
      {submitError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-4">
          <div className="px-5 py-3 rounded-full bg-[#141414] text-[#F4EEE3] text-[0.82rem] font-semibold shadow-xl">
            {submitError}
          </div>
        </div>
      )}

      {/* ── CONFIRM CREATE ────────────────────────────────── */}
      {confirmOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-5" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="w-full max-w-md rounded-2xl bg-[#F4EEE3] border border-black/10 shadow-xl p-6">
            <p className="font-mono text-[0.58rem] font-bold tracking-[0.12em] uppercase text-black/40 mb-2">Confirmation</p>
            <h3 className="font-serif font-bold text-[1.45rem] tracking-[-0.03em] mb-2">Create this event?</h3>
            <p className="text-[0.88rem] text-black/45 leading-relaxed mb-5">
              This will create <strong className="text-black">{form.title || "your event"}</strong> immediately.
            </p>
            <div className="flex gap-2">
              <button
                disabled={saving}
                onClick={() => setConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-full border border-black/20 text-[0.85rem] font-semibold text-black/40 hover:border-black hover:text-black transition-all disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                disabled={saving}
                onClick={async () => { setConfirmOpen(false); await submit() }}
                className="flex-1 py-2.5 rounded-full bg-[#141414] text-[#F4EEE3] text-[0.85rem] font-bold hover:bg-[#E8390C] transition-all disabled:opacity-60"
              >
                {saving ? "Creating…" : "Create Event"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN FORM ─────────────────────────────────────── */}
      <div className="form-main custom-scroll" ref={mainRef}>

        {/* Topbar */}
        <div className="form-topbar">
          <div className="flex items-center gap-2 text-[0.82rem] text-black/40">
            KNOT
            <span className="text-black/20">›</span>
            <span className="text-black font-semibold">Create Event</span>
            <span className="text-black/20">›</span>
            <span className="text-black/50">{STEPS[step - 1].label}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[0.6rem] text-black/30">{step} / {STEPS.length}</span>
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-4 py-1.5 rounded-full border border-black/15 text-[0.78rem] font-semibold text-black/40 hover:border-black/30 hover:text-black transition-all"
              >
                Save & Exit
              </button>
            )}
          </div>
          {/* Progress bar */}
          <div className="form-progress-bar" style={{ width: `${progressPct}%` }} />
        </div>

        {/* Form content */}
        <div className="form-content">
          {step === 1 && <Step1 form={form} setForm={setForm} errors={errors} />}
          {step === 2 && <Step2 form={form} setForm={setForm} errors={errors} />}
          {step === 3 && <Step3 form={form} setForm={setForm} errors={errors} />}
          {step === 4 && <Step4 form={form} setForm={setForm} errors={errors} />}
          {step === 5 && <Step5 form={form} setForm={setForm} errors={errors} />}
          {step === 6 && <Step6 form={form} setForm={setForm} />}
        </div>

        {/* Footer nav */}
        <div className="form-footer">
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button
                onClick={goPrev}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-black/20 text-[0.85rem] font-semibold text-black/45 hover:border-black hover:text-black transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Back
              </button>
            )}
            {step === 1 && onCancel && (
              <button
                onClick={onCancel}
                className="px-5 py-2.5 rounded-full border border-black/15 text-[0.85rem] font-semibold text-black/35 hover:text-black/60 transition-all"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Error summary */}
            {Object.keys(errors).length > 0 && (
              <p className="text-[0.78rem] text-[#E8390C] font-medium">
                Fix {Object.keys(errors).length} error{Object.keys(errors).length > 1 ? "s" : ""} to continue
              </p>
            )}

            <button
              onClick={goNext}
              disabled={saving}
              className={`flex items-center gap-2 px-7 py-2.5 rounded-full font-bold text-[0.88rem] transition-all hover:-translate-y-px ${
                saving
                  ? "bg-black/20 text-black/40 cursor-not-allowed"
                  : "bg-[#E8390C] text-white hover:bg-[#c42d08] hover:shadow-[0_6px_20px_rgba(232,57,12,.3)]"
              }`}
            >
              {saving ? (
                <>
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="20 8" strokeLinecap="round"/>
                  </svg>
                  Creating…
                </>
              ) : step < 6 ? (
                <>
                  Continue
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </>
              ) : (
                "Create Event →"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}