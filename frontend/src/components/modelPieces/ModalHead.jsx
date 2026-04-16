export default function ModalHead({ onClose, title, sub, linkText, onLink }) {
  return (
    <div className="flex justify-between items-start mb-5">
      <div>
        <h3 className="font-display text-xl text-[#E8E4DC] font-bold mb-0.5">{title}</h3>
        {sub && (
          <p className="text-sm text-[#7A8494]">
            {sub}
            {linkText && <button className="text-[#F0A500] hover:underline ml-0.5" onClick={onLink}>{linkText}</button>}
          </p>
        )}
      </div>
      <button onClick={onClose}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-[#7A8494] hover:text-[#E8E4DC] hover:bg-white/8 transition-all text-lg">
        ✕
      </button>
    </div>
  )
}