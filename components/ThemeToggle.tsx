'use client'
import { useState, useEffect } from 'react'

const applyLightTheme = () => {
  document.querySelectorAll<HTMLElement>('*').forEach((el) => {
    if (el.tagName === 'VIDEO' || el.tagName === 'SVG' || el.closest('svg')) return
    if (el.closest('[data-hero]')) return
    if (el.closest('[data-mosaic-cell]')) return
    if (el.closest('[data-radio]')) return
    if (el.closest('[data-coach]')) return

    const inline = el.getAttribute('style') || ''
    if (!inline) return

    let updated = inline

    if (!el.dataset.origStyle) el.dataset.origStyle = inline

    // Invert white text variants
    updated = updated.replace(/color:\s*#fff(?:fff)?/gi, 'color: #1c1a18')
    updated = updated.replace(/color:\s*rgba\(255,\s*255,\s*255,\s*0?\.9[5]?\)/gi, 'color: rgba(28,26,24,0.9)')
    updated = updated.replace(/color:\s*rgba\(255,\s*255,\s*255,\s*0?\.8[5]?\)/gi, 'color: rgba(28,26,24,0.85)')
    updated = updated.replace(/color:\s*rgba\(255,\s*255,\s*255,\s*0?\.7[5]?\)/gi, 'color: rgba(28,26,24,0.7)')
    updated = updated.replace(/color:\s*rgba\(255,\s*255,\s*255,\s*0?\.6[5]?\)/gi, 'color: rgba(28,26,24,0.65)')
    updated = updated.replace(/color:\s*rgba\(255,\s*255,\s*255,\s*0?\.55?\)/gi, 'color: rgba(28,26,24,0.55)')
    updated = updated.replace(/color:\s*rgba\(255,\s*255,\s*255,\s*0?\.4[5]?\)/gi, 'color: rgba(28,26,24,0.5)')
    updated = updated.replace(/color:\s*rgba\(255,\s*255,\s*255,\s*0?\.35?\)/gi, 'color: rgba(28,26,24,0.4)')
    updated = updated.replace(/color:\s*rgba\(255,\s*255,\s*255,\s*0?\.2[58]?\)/gi, 'color: rgba(28,26,24,0.35)')
    updated = updated.replace(/color:\s*rgba\(255,\s*255,\s*255,\s*0?\.1[58]?\)/gi, 'color: rgba(28,26,24,0.25)')

    // Invert dark backgrounds
    updated = updated.replace(/background:\s*#080808/gi, 'background: #faf8f4')
    updated = updated.replace(/background:\s*#0a0a0a/gi, 'background: #faf8f4')
    updated = updated.replace(/background:\s*#0f0f0f/gi, 'background: #ffffff')
    updated = updated.replace(/background:\s*#111/gi, 'background: #ffffff')

    // Translucent white card backgrounds → cream
    updated = updated.replace(/background:\s*rgba\(255,\s*255,\s*255,\s*0?\.02[5]?\)/gi, 'background: #f0ede6')
    updated = updated.replace(/background:\s*rgba\(255,\s*255,\s*255,\s*0?\.0[3-5]\)/gi, 'background: #ebe7de')
    updated = updated.replace(/background:\s*rgba\(255,\s*255,\s*255,\s*0?\.0[6-8]\)/gi, 'background: #e3dfd5')
    updated = updated.replace(/background:\s*rgba\(255,\s*255,\s*255,\s*0?\.1\)/gi, 'background: #dcd7cd')

    // White primary buttons → dark
    if (/background:\s*rgba\(255,\s*255,\s*255,\s*0?\.9[02-5]?\)/i.test(inline)) {
      updated = updated.replace(/background:\s*rgba\(255,\s*255,\s*255,\s*0?\.9[02-5]?\)/gi, 'background: #1c1a18')
      updated += '; color: #ffffff'
    }

    // Pink accent slightly darker
    updated = updated.replace(/color:\s*#ff6eb4/gi, 'color: #c2185b')
    updated = updated.replace(/color:\s*rgba\(255,\s*110,\s*180/gi, 'color: rgba(194,24,91')

    // White borders → dark borders
    updated = updated.replace(/border:\s*1px\s*solid\s*rgba\(255,\s*255,\s*255,\s*0?\.0[5-8]\)/gi, 'border: 1px solid rgba(0,0,0,0.12)')
    updated = updated.replace(/border:\s*1px\s*solid\s*rgba\(255,\s*255,\s*255,\s*0?\.1[0-2]\)/gi, 'border: 1px solid rgba(0,0,0,0.15)')
    updated = updated.replace(/border:\s*1px\s*solid\s*rgba\(255,\s*255,\s*255,\s*0?\.1[5-8]\)/gi, 'border: 1px solid rgba(0,0,0,0.18)')
    updated = updated.replace(/border:\s*1px\s*solid\s*rgba\(255,\s*255,\s*255,\s*0?\.2/gi, 'border: 1px solid rgba(0,0,0,0.2')

    if (updated !== inline) el.setAttribute('style', updated)
  })
}

const restoreDarkTheme = () => {
  document.querySelectorAll<HTMLElement>('[data-orig-style]').forEach((el) => {
    const orig = el.dataset.origStyle
    if (orig !== undefined) {
      el.setAttribute('style', orig)
      delete el.dataset.origStyle
    }
  })
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const saved = (localStorage.getItem('zen_theme') as 'dark' | 'light') || 'dark'
    setTheme(saved)
    document.documentElement.setAttribute('data-theme', saved)
    if (saved === 'light') {
      setTimeout(applyLightTheme, 50)
      setTimeout(applyLightTheme, 300)
      setTimeout(applyLightTheme, 1000)
    }
  }, [])

  useEffect(() => {
    if (theme !== 'light') return
    const observer = new MutationObserver(() => {
      applyLightTheme()
    })
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [theme])

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('zen_theme', next)
    document.documentElement.setAttribute('data-theme', next)
    if (next === 'light') {
      setTimeout(applyLightTheme, 0)
      setTimeout(applyLightTheme, 200)
    } else {
      restoreDarkTheme()
    }
  }

  return (
    <button
      data-toggle="theme"
      onClick={toggle}
      title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
      style={{
        width: 34, height: 34, borderRadius: '50%',
        background: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        border: theme === 'dark' ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.18)',
        color: theme === 'dark' ? '#ffffff' : '#1c1a18',
        fontSize: 15, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all .2s', flexShrink: 0,
      }}
    >
      {theme === 'dark' ? '☀' : '☾'}
    </button>
  )
}
