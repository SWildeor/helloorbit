'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function SignInPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Update last login
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', user.id)
    }

    router.push('/')
  }

  return (
    <main style={{
      minHeight: '100vh',
      backgroundColor: '#F7F5F0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '0 24px' }}>
        <h1 style={{
          fontFamily: 'DM Serif Display, serif',
          fontSize: '32px',
          color: '#1A1A18',
          marginBottom: '8px',
          fontWeight: 'normal',
        }}>
          Hello Orbit
        </h1>
        <p style={{
          fontSize: '14px',
          color: '#6B6860',
          marginBottom: '40px',
        }}>
          Sign in to your account
        </p>

        <form onSubmit={handleSignIn}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              color: '#6B6860',
              marginBottom: '6px',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 0',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                borderBottom: '0.5px solid #A8A49C',
                backgroundColor: 'transparent',
                fontSize: '16px',
                color: '#1A1A18',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              color: '#6B6860',
              marginBottom: '6px',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 0',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                borderBottom: '0.5px solid #A8A49C',
                backgroundColor: 'transparent',
                fontSize: '16px',
                color: '#1A1A18',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <p style={{
              fontSize: '14px',
              color: '#c0392b',
              marginBottom: '16px',
            }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: '#1C3D2E',
              color: '#F7F5F0',
              border: 'none',
              borderRadius: '2px',
              fontSize: '14px',
              letterSpacing: '0.05em',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p style={{
          marginTop: '24px',
          fontSize: '14px',
          color: '#6B6860',
          textAlign: 'center',
        }}>
          Don't have an account?{' '}
          <a href="/auth/signup" style={{ color: '#1C3D2E' }}>
            Create one
          </a>
        </p>
      </div>
    </main>
  )
}