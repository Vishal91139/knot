export default function SuccessState({ title, sub, onClose, teal }) {
  const accent = teal ? "#00BFA5" : "#F0A500"
  return (
    <div className="text-center py-6">
      <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl mx-auto mb-4"
        style={{ background: `${accent}20`, border: `1px solid ${accent}40`, color: accent }}>
        ✓
      </div>
      <h3 className="font-display text-xl font-bold text-[#E8E4DC] mb-2">{title}</h3>
      <p className="text-sm text-[#7A8494] leading-relaxed mb-5 max-w-xs mx-auto">{sub}</p>
      <button onClick={onClose}
        className="text-sm text-[#7A8494] hover:text-[#E8E4DC] transition-colors border border-white/10 px-4 py-2 rounded-lg">
        Close
      </button>
    </div>
  )
}