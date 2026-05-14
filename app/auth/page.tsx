'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useLang } from '@/lib/i18n';

const irisStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: 1,
  background: 'linear-gradient(90deg, transparent, #ff6eb4, #b06aff, #6ab0ff, transparent)',
  backgroundSize: '200% 100%',
  animation: 'iris 4s linear infinite',
};

const inputBase: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: 12,
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  fontSize: 14,
  outline: 'none',
  fontFamily: 'var(--font-dm, DM Sans, sans-serif)',
  boxSizing: 'border-box',
  transition: 'border-color .2s',
};

export default function AuthPage() {
  const router = useRouter();
  const { t } = useLang();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'profile'>('email');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setStep('profile');
    });
  }, []);

  async function handleSignIn() {
    if (!email) return;
    setLoading(true);
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + '/auth/callback' },
    });
    setLoading(false);
    setSent(true);
  }

  async function handleSaveProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('profiles').upsert({
      id: user.id,
      display_name: name,
      city,
      updated_at: new Date().toISOString(),
    });
    router.push('/');
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '0 16px' }}>
      <div style={{ width: '100%', maxWidth: 400, borderRadius: 20, border: '1px solid var(--border-strong)', padding: 48, background: 'var(--bg-card)', position: 'relative', overflow: 'hidden' }}>
        <div style={irisStyle} />

        {/* Logo */}
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontFamily: 'var(--font-playfair, Playfair Display, serif)', fontSize: 22, color: 'var(--text)' }}>
            Zen<span style={{ color: 'rgba(255,110,180,0.8)' }}>✦</span>Sudoku
          </span>
        </div>

        {step === 'email' ? (
          <>
            <h1 style={{ fontFamily: 'var(--font-playfair, Playfair Display, serif)', fontSize: 28, fontWeight: 400, color: 'var(--text)', marginTop: 32, marginBottom: 8 }}>
              {t('auth_welcome')}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 300, margin: 0, fontFamily: 'var(--font-dm, DM Sans, sans-serif)' }}>
              {t('auth_subtitle')}
            </p>

            {/* Email input */}
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSignIn(); }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(255,110,180,0.4)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
              placeholder={t('auth_email_placeholder')}
              style={{ ...inputBase, marginTop: 28 }}
            />

            {/* Send button / success message */}
            {sent ? (
              <div style={{ marginTop: 12, padding: 14, textAlign: 'center', fontSize: 13, color: 'rgba(100,255,160,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'var(--font-dm, DM Sans, sans-serif)' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(100,255,160,0.8)', flexShrink: 0 }} />
                {t('auth_sent')}
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                disabled={loading || !email}
                onMouseEnter={e => { if (!loading && email) e.currentTarget.style.background = 'rgba(255,255,255,0.75)'; }}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.9)')}
                style={{ width: '100%', marginTop: 12, padding: 14, borderRadius: 100, background: 'rgba(255,255,255,0.9)', color: '#080808', fontSize: 14, border: 'none', cursor: loading || !email ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-dm, DM Sans, sans-serif)', fontWeight: 400, transition: 'background .2s', opacity: !email ? 0.6 : 1 }}
              >
                {loading ? t('auth_sending') : t('auth_send_link')}
              </button>
            )}

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0', fontFamily: 'var(--font-dm, DM Sans, sans-serif)' }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
              <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>{t('auth_or')}</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
            </div>

            {/* Google button — coming soon */}
            <div style={{
              width: '100%', padding: '13px', borderRadius: 100,
              border: '1px solid var(--border)',
              background: 'var(--bg-card)', color: 'rgba(255,255,255,0.35)',
              fontSize: 14, fontFamily: 'DM Sans, sans-serif', fontWeight: 300,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              cursor: 'not-allowed', userSelect: 'none',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" style={{ opacity: 0.4 }}>
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              </svg>
              {t('auth_google')}
              <span style={{
                fontSize: 10, padding: '2px 8px', borderRadius: 100,
                background: 'rgba(255,110,180,0.1)', color: 'rgba(255,110,180,0.7)',
                letterSpacing: '.06em', marginLeft: 4,
              }}>{t('auth_google_soon')}</span>
            </div>

            {/* Back link */}
            <div
              onClick={() => router.push('/')}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}
              style={{ fontSize: 12, color: 'var(--text-faint)', textAlign: 'center', marginTop: 24, cursor: 'pointer', fontFamily: 'var(--font-dm, DM Sans, sans-serif)', transition: 'color .2s' }}
            >
              {t('auth_back')}
            </div>
          </>
        ) : (
          <>
            <h1 style={{ fontFamily: 'var(--font-playfair, Playfair Display, serif)', fontSize: 28, fontWeight: 400, color: 'var(--text)', marginTop: 32, marginBottom: 8 }}>
              {t('auth_profile_title')}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 300, margin: 0, fontFamily: 'var(--font-dm, DM Sans, sans-serif)' }}>
              {t('auth_profile_sub')}
            </p>

            {/* Name input */}
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(255,110,180,0.4)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
              placeholder={t('auth_name')}
              style={{ ...inputBase, marginTop: 28 }}
            />

            {/* City input */}
            <input
              type="text"
              value={city}
              onChange={e => setCity(e.target.value)}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(255,110,180,0.4)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
              placeholder={t('auth_city')}
              style={{ ...inputBase, marginTop: 10 }}
            />

            {/* Save button */}
            <button
              onClick={handleSaveProfile}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.75)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.9)')}
              style={{ width: '100%', marginTop: 20, padding: 14, borderRadius: 100, background: 'rgba(255,255,255,0.9)', color: '#080808', fontSize: 14, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-dm, DM Sans, sans-serif)', fontWeight: 400, transition: 'background .2s' }}
            >
              {t('auth_start')}
            </button>

            {/* Skip link */}
            <div
              onClick={() => router.push('/')}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}
              style={{ fontSize: 12, color: 'var(--text-faint)', textAlign: 'center', marginTop: 16, cursor: 'pointer', fontFamily: 'var(--font-dm, DM Sans, sans-serif)', transition: 'color .2s' }}
            >
              {t('auth_skip')}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes iris {
          0%   { background-position: 0% 50% }
          50%  { background-position: 100% 50% }
          100% { background-position: 0% 50% }
        }
      `}</style>
    </div>
  );
}
