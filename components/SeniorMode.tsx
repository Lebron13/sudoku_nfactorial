'use client'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function SeniorMode() {
  const [on, setOn] = useState(false)
  const pathname = usePathname()

  const isGamePage = pathname?.startsWith('/game') || pathname?.startsWith('/daily')

  useEffect(() => {
    if (!isGamePage) {
      document.documentElement.removeAttribute('data-senior')
      return
    }
    const saved = localStorage.getItem('zen_senior') === 'true'
    setOn(saved)
    if (saved) document.documentElement.setAttribute('data-senior', 'true')
    else document.documentElement.removeAttribute('data-senior')
  }, [isGamePage, pathname])

  const toggle = () => {
    const next = !on
    setOn(next)
    localStorage.setItem('zen_senior', String(next))
    if (next) document.documentElement.setAttribute('data-senior', 'true')
    else document.documentElement.removeAttribute('data-senior')
    if (next && 'speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance('Big and Clear mode on')
      u.rate = 0.85
      window.speechSynthesis.speak(u)
    }
  }

  if (!isGamePage) return null

  return (
    <button data-senior-toggle onClick={toggle} style={{
      position: 'fixed', top: 76, right: 16, zIndex: 70,
      padding: '8px 16px', borderRadius: 100,
      background: on ? 'rgba(255,110,180,0.15)' : 'rgba(10,10,10,0.9)',
      border: on ? '1px solid rgba(255,110,180,0.35)' : '1px solid rgba(255,255,255,0.15)',
      color: on ? '#ff6eb4' : 'rgba(255,255,255,0.7)',
      fontSize: 12, cursor: 'pointer',
      backdropFilter: 'blur(20px)',
      fontFamily: 'DM Sans, sans-serif',
      letterSpacing: '.04em', transition: 'all .2s',
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <span style={{ fontSize: 16 }}>👴</span>
      {on ? 'Big & Clear: ON' : 'Big & Clear'}
    </button>
  )
}

export const speakNumber = (num: number) => {
  if (document.documentElement.getAttribute('data-senior') !== 'true') return
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(String(num))
  u.rate = 0.85
  window.speechSynthesis.speak(u)
}
