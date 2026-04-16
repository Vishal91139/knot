export default function ModalWrap({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl p-6 border border-white/10"
        style={{ background: "#0D1526", animation: "fadeUp .3s ease both" }}>
        {children}
      </div>
    </div>
  )
}