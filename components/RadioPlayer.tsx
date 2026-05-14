'use client'
import { useState, useEffect, useRef } from 'react'

const STATIONS = [
  {
    name: 'Lo-fi Beats', emoji: '🎧',
    url: 'https://ice1.somafm.com/groovesalad-128-mp3',
    color: '#ff6eb4'
  },
  {
    name: 'Chillout', emoji: '🌊',
    url: 'https://ice1.somafm.com/deepspaceone-128-mp3',
    color: '#6ab0ff'
  },
  {
    name: 'Ambient', emoji: '🌙',
    url: 'https://ice1.somafm.com/dronezone-128-mp3',
    color: '#b06aff'
  },
]

export default function RadioPlayer() {
  const [open, setOpen] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [station, setStation] = useState(0)
  const [volume, setVolume] = useState(0.5)
  const [error, setError] = useState('')
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const playingRef = useRef(false)
  const stationRef = useRef(0)
  const loadingRef = useRef(false)

  useEffect(() => {
    const a = new Audio()
    a.preload = 'none'
    a.crossOrigin = 'anonymous'
    audioRef.current = a

    let retryCount = 0

    const onError = () => {
      if (retryCount < 2 && playingRef.current) {
        retryCount++
        setTimeout(() => {
          if (audioRef.current && playingRef.current) {
            audioRef.current.src = STATIONS[stationRef.current].url + '?t=' + Date.now()
            audioRef.current.load()
            audioRef.current.play().catch(() => {})
          }
        }, 1500)
      } else {
        retryCount = 0
        setLoading(false)
        loadingRef.current = false
        setPlaying(false)
        playingRef.current = false
        setError('Stream lost — tap play to retry')
      }
    }

    const onPlaying = () => {
      retryCount = 0
      setLoading(false)
      loadingRef.current = false
      setError('')
      setPlaying(true)
      playingRef.current = true
    }

    const onWaiting = () => { setLoading(true); loadingRef.current = true }
    const onPause = () => { setPlaying(false); playingRef.current = false }
    const onCanPlay = () => { setLoading(false); loadingRef.current = false }

    a.addEventListener('waiting', onWaiting)
    a.addEventListener('playing', onPlaying)
    a.addEventListener('pause', onPause)
    a.addEventListener('error', onError)
    a.addEventListener('canplay', onCanPlay)

    const savedV = parseFloat(localStorage.getItem('zen_radio_vol') || '0.5')
    const savedS = parseInt(localStorage.getItem('zen_radio_station') || '0', 10)
    setVolume(savedV)
    a.volume = savedV
    if (savedS >= 0 && savedS < STATIONS.length) {
      setStation(savedS)
      stationRef.current = savedS
    }

    return () => {
      a.pause()
      a.src = ''
    }
  }, [])

  const togglePlay = async () => {
    const a = audioRef.current
    if (!a) return
    setError('')

    if (playing) {
      a.pause()
      a.src = ''
      a.load()
      setPlaying(false)
      playingRef.current = false
      setLoading(false)
      loadingRef.current = false
      return
    }

    setLoading(true)
    loadingRef.current = true
    setPlaying(false)
    playingRef.current = false

    a.pause()
    a.src = STATIONS[station].url + '?t=' + Date.now()
    a.load()

    const timeoutId = setTimeout(() => {
      if (loadingRef.current) {
        setLoading(false)
        loadingRef.current = false
        setError('Stream timeout — try another station')
        a.pause()
        a.src = ''
      }
    }, 10000)

    try {
      await a.play()
      clearTimeout(timeoutId)
    } catch (err: unknown) {
      clearTimeout(timeoutId)
      setLoading(false)
      loadingRef.current = false
      setPlaying(false)
      playingRef.current = false
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setError('Tap play to enable audio')
      } else {
        setError('Stream unavailable')
      }
    }
  }

  const switchStation = async (i: number) => {
    setStation(i)
    stationRef.current = i
    localStorage.setItem('zen_radio_station', String(i))
    setError('')

    const a = audioRef.current
    if (!a || !playing) return

    setLoading(true)
    loadingRef.current = true
    a.pause()
    a.src = STATIONS[i].url + '?t=' + Date.now()
    a.load()

    try {
      await a.play()
    } catch {
      setLoading(false)
      loadingRef.current = false
      setPlaying(false)
      playingRef.current = false
      setError('Stream unavailable')
    }
  }

  const onVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    setVolume(v)
    if (audioRef.current) audioRef.current.volume = v
    localStorage.setItem('zen_radio_vol', String(v))
  }

  // COLLAPSED
  if (!open) return (
    <button data-radio="button" onClick={() => setOpen(true)} style={{
      position: 'fixed', bottom: 28, left: 28, zIndex: 80,
      padding: '16px 24px', borderRadius: 100,
      background: 'rgba(12,12,12,0.95)',
      border: `1.5px solid ${playing ? STATIONS[station].color : 'rgba(255,255,255,0.2)'}`,
      backdropFilter: 'blur(24px)',
      boxShadow: playing
        ? `0 12px 40px ${STATIONS[station].color}33, 0 0 0 1px ${STATIONS[station].color}22`
        : '0 8px 24px rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', gap: 14,
      cursor: 'pointer', transition: 'all .3s',
      minWidth: 200,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        background: playing ? `${STATIONS[station].color}22` : 'rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {loading ? (
          <div style={{
            width: 20, height: 20, borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.2)',
            borderTopColor: STATIONS[station].color,
            animation: 'spin 0.7s linear infinite',
          }}/>
        ) : (
          <span style={{ fontSize: 20 }}>{STATIONS[station].emoji}</span>
        )}
      </div>
      <div style={{ textAlign: 'left' }}>
        <div style={{ fontSize: 14, color: '#fff', fontWeight: 400,
          fontFamily: 'DM Sans, sans-serif', lineHeight: 1.2, marginBottom: 3 }}>
          {loading ? 'Connecting...' : playing ? STATIONS[station].name : 'Lo-fi Radio'}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)',
          letterSpacing: '.04em', fontFamily: 'DM Sans, sans-serif' }}>
          {loading ? 'Please wait' : playing ? '♪ Now playing' : 'Tap to open'}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </button>
  )

  // EXPANDED
  return (
    <div data-radio="panel" style={{
      position: 'fixed', bottom: 28, left: 28, zIndex: 80,
      width: 320, borderRadius: 22,
      background: 'rgba(12,12,12,0.97)',
      border: '1px solid rgba(255,255,255,0.12)',
      backdropFilter: 'blur(40px)',
      boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
      overflow: 'hidden',
    }}>
      <div style={{
        height: 1,
        background: 'linear-gradient(90deg,transparent,#ff6eb4,#b06aff,#6ab0ff,transparent)',
        backgroundSize: '200% 100%',
        animation: 'iris 4s linear infinite',
      }}/>

      <div style={{
        padding: '18px 22px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 14, color: '#fff',
          fontFamily: 'DM Sans, sans-serif', fontWeight: 400 }}>
          ♪ Lo-fi Radio
        </div>
        <button onClick={() => setOpen(false)} style={{
          width: 30, height: 30, borderRadius: '50%', border: 'none',
          background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)',
          fontSize: 16, cursor: 'pointer',
        }}>×</button>
      </div>

      <div style={{ padding: '0 22px 16px', display: 'flex', gap: 8 }}>
        {STATIONS.map((s, i) => (
          <button key={i} onClick={() => switchStation(i)} style={{
            flex: 1, padding: '12px 4px', borderRadius: 14,
            border: station === i ? `1.5px solid ${s.color}` : '1px solid rgba(255,255,255,0.1)',
            background: station === i ? `${s.color}15` : 'rgba(255,255,255,0.04)',
            color: station === i ? '#fff' : 'rgba(255,255,255,0.45)',
            fontSize: 11, cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 5, transition: 'all .2s',
          }}>
            <span style={{ fontSize: 22 }}>{s.emoji}</span>
            <span>{s.name}</span>
          </button>
        ))}
      </div>

      <div style={{ padding: '0 22px 18px', display: 'flex', justifyContent: 'center' }}>
        <button onClick={togglePlay} style={{
          width: 72, height: 72, borderRadius: '50%',
          border: `1.5px solid ${playing ? STATIONS[station].color : 'rgba(255,255,255,0.2)'}`,
          background: playing ? `${STATIONS[station].color}15` : 'rgba(255,255,255,0.05)',
          color: '#fff', fontSize: 26, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: playing ? `0 0 30px ${STATIONS[station].color}40` : 'none',
          transition: 'all .3s',
        }}>
          {loading ? (
            <div style={{
              width: 26, height: 26, borderRadius: '50%',
              border: '2.5px solid rgba(255,255,255,0.15)',
              borderTopColor: STATIONS[station].color,
              animation: 'spin 0.7s linear infinite',
            }}/>
          ) : playing ? '⏸' : '▶'}
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '0 22px 14px',
          fontSize: 12, color: 'rgba(255,255,255,0.5)',
          fontFamily: 'DM Sans, sans-serif' }}>
          Connecting to stream...
        </div>
      )}

      {error && (
        <div style={{ textAlign: 'center', padding: '0 22px 14px',
          fontSize: 12, color: 'rgba(255,100,100,0.7)',
          fontFamily: 'DM Sans, sans-serif' }}>
          {error}
        </div>
      )}

      <div style={{ padding: '0 22px 22px',
        display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 16 }}>🔈</span>
        <input type="range" min="0" max="1" step="0.02"
          value={volume} onChange={onVolume}
          style={{ flex: 1, accentColor: STATIONS[station].color, height: 4 }}
        />
        <span style={{ fontSize: 16 }}>🔊</span>
      </div>

      <style>{`
        @keyframes iris{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
    </div>
  )
}
