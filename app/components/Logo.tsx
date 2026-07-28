import Link from 'next/link'

export default function Logo({ isLight = true }: { isLight?: boolean }) {
  const textColor = isLight ? "text-ink" : "text-white"
  const hoverColor = isLight ? "group-hover:text-rose-muted" : "group-hover:text-rose-300"
  
  return (
    <Link href="/" className="flex items-center gap-2.5 group transition-opacity">
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={`w-5 h-5 transition-colors ${textColor} ${hoverColor}`}
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
      <span className={`font-sans font-bold tracking-[0.15em] uppercase text-xs mt-[2px] transition-colors ${textColor} ${hoverColor}`}>
        Her Safety
      </span>
    </Link>
  )
}
