'use client'
import { useLang } from '@/lib/i18n'

export default function LangToggle() {
  const { lang, setLang } = useLang()

  return (
    <button
      data-toggle="lang"
      onClick={() => setLang(lang === 'en' ? 'ru' : 'en')}
      title={lang === 'en' ? 'Russian' : 'English'}
      style={{
        height: 34, padding: '0 14px', borderRadius: 100,
        background: 'rgba(0,0,0,0.04)',
        border: '1px solid rgba(0,0,0,0.12)',
        color: 'inherit',
        fontSize: 12, cursor: 'pointer',
        fontFamily: 'DM Sans, sans-serif',
        fontWeight: 500, letterSpacing: '.06em',
        display: 'flex', alignItems: 'center', gap: 4,
        transition: 'all .2s', flexShrink: 0,
      }}
    >
      {lang === 'en' ? 'EN' : 'RU'}
    </button>
  )
}
