export default function Select({ options }) {
  return (
    <select className="w-full px-3 py-2.5 rounded-lg text-[0.875rem] text-[#E8E4DC] bg-white/5 border border-white/10 focus:border-[#F0A500] transition-colors mb-3 appearance-none">
      <option value="" disabled selected className="bg-[#0D1526]">Select...</option>
      {options.map(o => <option key={o} className="bg-[#0D1526]">{o}</option>)}
    </select>
  )
}