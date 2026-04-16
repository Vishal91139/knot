export default function Field({ label, placeholder, type = "text", note, textarea, children }) {
  const cls = "w-full px-3 py-2.5 rounded-lg text-[0.875rem] text-[#E8E4DC] placeholder-[#3A4455] bg-white/5 border border-white/10 focus:border-[#F0A500] transition-colors"
  return (
    <div className="mb-3">
      <label className="block text-xs font-semibold text-[#7A8494] uppercase tracking-wider mb-1.5">{label}</label>
      {children
        ? children
        : textarea
          ? <textarea className={cls + " resize-none min-h-[80px]"} placeholder={placeholder} />
          : <input type={type} className={cls} placeholder={placeholder} />
      }
      {note && <p className="text-xs text-[#3A4455] mt-1">{note}</p>}
    </div>
  )
}