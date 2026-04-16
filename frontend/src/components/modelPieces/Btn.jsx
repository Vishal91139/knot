export default function Btn({ children, onClick, amber, teal }) {
  const bg = amber ? "bg-[#F0A500] hover:bg-[#FFB820] text-[#080D18]"
           : teal  ? "bg-[#00BFA5] hover:bg-[#00D4B8] text-[#080D18]"
           : "bg-white/10 hover:bg-white/15 text-[#E8E4DC]"
  return (
    <button onClick={onClick}
      className={`w-full py-3 rounded-xl font-semibold text-[0.9rem] mt-1 transition-all active:scale-[0.98] ${bg}`}>
      {children}
    </button>
  )
}