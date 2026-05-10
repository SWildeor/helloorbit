'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function SignUpPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const labelStyle = {
    display: 'block',
    fontSize: '12px',
    color: '#6B6860',
    marginBottom: '6px',
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
  }

  const inputStyle = {
    flex: 1,
    padding: '10px 0',
    borderTop: 'none',
    borderLeft: 'none',
    borderRight: 'none',
    borderBottom: 'none',
    backgroundColor: 'transparent',
    fontSize: '16px',
    color: '#1A1A18',
    outline: 'none',
    minWidth: 0,
  }

  const toggleStyle = {
    background: 'none',
    border: 'none',
    padding: '0',
    fontSize: '13px',
    color: '#A8A49C',
    cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
    flexShrink: 0,
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      const username = `Orbiter${Math.floor(10000 + Math.random() * 90000)}`

      const { error: insertError } = await supabase
        .from('users')
        .insert({ id: data.user.id, email: data.user.email, username })

      if (insertError) {
        setError(insertError.message)
        setLoading(false)
        return
      }

      router.push('/')
    }
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
        <p style={{ fontSize: '14px', color: '#6B6860', marginBottom: '40px' }}>
          Create your account
        </p>

        <form onSubmit={handleSignUp}>
          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Email</label>
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

          <div style={{ marginBottom: '8px' }}>
            <label style={labelStyle}>Password</label>
            <div style={{ display: 'flex', alignItems: 'center', borderBottom: '0.5px solid #A8A49C' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                style={inputStyle}
              />
              <button type="button" onClick={() => setShowPassword(v => !v)} style={toggleStyle}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <p style={{ fontSize: '13px', color: '#A8A49C', marginBottom: '24px' }}>
            Minimum 8 characters
          </p>

          <div style={{ marginBottom: '32px' }}>
            <label style={labelStyle}>Confirm password</label>
            <div style={{ display: 'flex', alignItems: 'center', borderBottom: '0.5px solid #A8A49C' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                style={inputStyle}
              />
              <button type="button" onClick={() => setShowConfirmPassword(v => !v)} style={toggleStyle}>
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && (
            <p style={{ fontSize: '14px', color: '#8A3A2A', marginBottom: '16px' }}>
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
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p style={{ marginTop: '24px', fontSize: '14px', color: '#6B6860', textAlign: 'center' }}>
          Already have an account?{' '}
          <a href="/auth/signin" style={{ color: '#1C3D2E' }}>Sign in</a>
        </p>
      </div>
    </main>
  )
}
