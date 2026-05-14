export function ZenMascot({ mood = 'happy', size = 130 }: { mood?: 'happy' | 'thinking' | 'celebrate' | 'sad', size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 130 130" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="zen-bg" cx="50%" cy="40%">
          <stop offset="0%" stopColor="#ffb0d4" />
          <stop offset="60%" stopColor="#ff6eb4" />
          <stop offset="100%" stopColor="#b04880" />
        </radialGradient>
        <radialGradient id="zen-belly" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#fff5fa" />
          <stop offset="100%" stopColor="#ffd4e8" />
        </radialGradient>
      </defs>

      <ellipse cx="65" cy="118" rx="32" ry="3.5" fill="#000" opacity="0.35" />
      <path d="M 38 38 Q 28 22 36 30 Q 44 35 46 42 Z" fill="url(#zen-bg)" />
      <path d="M 92 38 Q 102 22 94 30 Q 86 35 84 42 Z" fill="url(#zen-bg)" />
      <ellipse cx="65" cy="68" rx="42" ry="44" fill="url(#zen-bg)" />
      <ellipse cx="65" cy="78" rx="26" ry="28" fill="url(#zen-belly)" />

      <circle cx="52" cy="58" r="11" fill="#fff" />
      <circle cx="78" cy="58" r="11" fill="#fff" />

      {mood === 'celebrate' ? (
        <>
          <path d="M 47 58 Q 52 53 57 58" stroke="#1a0a14" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M 73 58 Q 78 53 83 58" stroke="#1a0a14" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </>
      ) : mood === 'sad' ? (
        <>
          <circle cx="53" cy="61" r="5" fill="#1a0a14" />
          <circle cx="79" cy="61" r="5" fill="#1a0a14" />
        </>
      ) : (
        <>
          <g style={{ animation: 'zenBlink 4s infinite', transformOrigin: '53px 59px', transformBox: 'fill-box' }}>
            <circle cx="53" cy="59" r="6" fill="#1a0a14" />
            <circle cx="55" cy="56" r="2" fill="#fff" />
          </g>
          <g style={{ animation: 'zenBlink 4s infinite', transformOrigin: '79px 59px', transformBox: 'fill-box' }}>
            <circle cx="79" cy="59" r="6" fill="#1a0a14" />
            <circle cx="81" cy="56" r="2" fill="#fff" />
          </g>
        </>
      )}

      <path d="M 62 70 L 65 75 L 68 70 Z" fill="#ff6eb4" />

      {mood === 'celebrate' ? (
        <path d="M 53 78 Q 65 90 77 78" stroke="#1a0a14" strokeWidth="2" fill="none" strokeLinecap="round" />
      ) : mood === 'sad' ? (
        <path d="M 56 86 Q 65 80 74 86" stroke="#1a0a14" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      ) : mood === 'thinking' ? (
        <path d="M 58 82 L 72 82" stroke="#1a0a14" strokeWidth="1.8" strokeLinecap="round" />
      ) : (
        <path d="M 56 80 Q 65 86 74 80" stroke="#1a0a14" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      )}

      <circle cx="40" cy="76" r="4" fill="#ff8fc4" opacity="0.5" />
      <circle cx="90" cy="76" r="4" fill="#ff8fc4" opacity="0.5" />

      <g style={{ transformOrigin: '48px 98px', animation: mood === 'celebrate' ? 'zenWave 0.5s ease-in-out infinite' : 'zenWave 2s ease-in-out infinite' }}>
        <ellipse cx="42" cy="98" rx="6" ry="10" fill="url(#zen-bg)" transform="rotate(-20 42 98)" />
      </g>
      <ellipse cx="88" cy="98" rx="6" ry="10" fill="url(#zen-bg)" transform="rotate(20 88 98)" />
    </svg>
  )
}
