export default function Topbar({ page, onToast }) {
  const PAGE_LABELS = {
    overview:"Overview", events:"Events", organizers:"Organizers",
    faculty:"Faculty", students:"Students", coordinators:"Coordinators", profile:"My Profile",
  }
  return (
    <header className="flex-shrink-0 flex items-center justify-between px-8 h-[58px] bg-[#F4EEE3]/93 backdrop-blur-md border-b border-black/10 sticky top-0 z-20">
      <div className="flex items-center gap-2 text-[0.82rem] text-black/40">
        KNOT <span className="text-black/20">›</span>
        <span className="text-[#141414] font-semibold">{PAGE_LABELS[page] || page}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative w-9 h-9 rounded-full bg-[#EAE1D0] border border-black/10 flex items-center justify-center text-black/40 hover:border-black/20 transition-all">
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#E8390C] border border-[#F4EEE3]" />
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 2a4 4 0 00-4 4c0 3-1.5 4-1.5 4h11S12 9 12 6a4 4 0 00-4-4zM6.5 12a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.3"/></svg>
        </div>
        <span className="text-[0.75rem] text-black/30 font-mono">RVCE</span>
      </div>
    </header>
  )
}