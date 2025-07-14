import React, { useState } from 'react'
import { Building2, Mail, User, Briefcase, Sparkles, Lock, Eye, EyeOff, AlertCircle, EggFried, CheckCircle, ArrowLeft } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

interface Organization {
  id: string
  name: string
  short_code: string
  color: string
}

export function AuthPage() {
  const [currentView, setCurrentView] = useState<'auth' | 'forgot-password' | 'reset-success'>('auth')
  const [isSignUp, setIsSignUp] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    organization_id: '',
    position: '',
  })
  const [error, setError] = useState('')


  const { signInWithEmail, signUpWithEmail } = useAuth()
  const [successMessage, setSuccessMessage] = useState('')

  React.useEffect(() => {
    fetchOrganizations()
  }, [])

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev)
  }

  const fetchOrganizations = async () => {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching organizations:', data)
    } else {
      setOrganizations(data || [])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isSignUp) {
        const { error } = await signUpWithEmail(
          formData.email,
          formData.password,
          {
            full_name: formData.full_name,
            organization_id: formData.organization_id,
            position: formData.position,
          }
        )

        if (error) {
          throw error
        } else {
          setSuccessMessage('Signup successful! Please check your email to verify your account.')

          setTimeout(() => {
            setSuccessMessage('')
          }, 5000)
        }
      } else {
        const { error } = await signInWithEmail(formData.email, formData.password)
        if (error) {
          setError('Incorrect password. Please check your password and try again.')
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(error.message);
      }
    }
    finally {
      setLoading(false)
    }
  }


  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // console.log('Sending password reset email to:', resetEmail)
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      // console.log('Reset password response:', { error })
      if (error) throw error

      setCurrentView('reset-success')
    } catch (error: any) {
      setError(error.message)
      console.error('Error sending reset email:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })



  }

  const handleBackToLogin = () => {
    setCurrentView('auth')
    setResetEmail('')
    setError('')
    setSuccessMessage('')
  }

  // Forgot Password View
  if (currentView === 'forgot-password') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-100 via-secondary-50 to-purple-100 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-20 h-20 bg-accent-300 rounded-full opacity-20 animate-float"></div>
          <div className="absolute top-40 right-20 w-16 h-16 bg-primary-300 rounded-full opacity-30 animate-float" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-20 left-20 w-12 h-12 bg-purple-300 rounded-full opacity-25 animate-float" style={{ animationDelay: '4s' }}></div>
          <div className="absolute bottom-40 right-10 w-24 h-24 bg-secondary-300 rounded-full opacity-20 animate-float" style={{ animationDelay: '1s' }}></div>
        </div>
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-primary-500 to-purple-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl animate-pulse-slow">
              <EggFried className="w-10 h-10 text-white animate-wiggle" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h1>
            <p className="text-gray-600">We'll send you a reset link</p>
          </div>

          {/* Reset Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <button
              onClick={handleBackToLogin}
              className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Login</span>
            </button>

            {error && (
              <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => {
                      setResetEmail(e.target.value)
                      if (error) setError('')
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder="Enter your email address"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !resetEmail.trim()}
                className="w-full bg-gradient-to-r from-primary-500 to-purple-500 text-white py-4 px-6 rounded-xl hover:from-primary-600 hover:to-purple-600 focus:ring-4 focus:ring-primary-200 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 shadow-lg"

              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Remember your password?{' '}
                <button
                  onClick={handleBackToLogin}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Sign in here
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Reset Success View
  if (currentView === 'reset-success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-100 via-secondary-50 to-purple-100 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-20 h-20 bg-accent-300 rounded-full opacity-20 animate-float"></div>
          <div className="absolute top-40 right-20 w-16 h-16 bg-primary-300 rounded-full opacity-30 animate-float" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-20 left-20 w-12 h-12 bg-purple-300 rounded-full opacity-25 animate-float" style={{ animationDelay: '4s' }}></div>
          <div className="absolute bottom-40 right-10 w-24 h-24 bg-secondary-300 rounded-full opacity-20 animate-float" style={{ animationDelay: '1s' }}></div>
        </div>
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Check Your Email!
            </h1>

            <p className="text-gray-600 mb-6 leading-relaxed">
              We've sent a password reset link to <strong>{resetEmail}</strong>
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800 text-sm">
                <strong>Next steps:</strong><br />
                1. Check your email inbox<br />
                2. Click the reset link<br />
                3. Create a new password<br />
                4. Sign in with your new password
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleBackToLogin}
                className="w-full bg-gradient-to-r from-primary-500 to-purple-500 text-white py-4 px-6 rounded-xl hover:from-primary-600 hover:to-purple-600 focus:ring-4 focus:ring-primary-200 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 shadow-lg"

              >
                Back to Login
              </button>

              <button
                onClick={() => {
                  setCurrentView('forgot-password')
                  setError('')
                }}
                className="w-full text-gray-600 hover:text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors text-sm"
              >
                Resend Email
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-6">
              Didn't receive the email? Check your spam folder.
            </p>
          </div>
        </div>
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-100 via-secondary-50 to-purple-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 bg-accent-300 rounded-full opacity-20 animate-float"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-primary-300 rounded-full opacity-30 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 left-20 w-12 h-12 bg-purple-300 rounded-full opacity-25 animate-float" style={{ animationDelay: '4s' }}></div>
        <div className="absolute bottom-40 right-10 w-24 h-24 bg-secondary-300 rounded-full opacity-20 animate-float" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-primary-500 to-purple-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl animate-pulse-slow">
            <EggFried className="w-10 h-10 text-white animate-wiggle" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent mb-3">
            TowerKudos
          </h1>
          <p className="text-gray-600 text-lg">Where connections bloom 🌸</p>
          <p className="text-sm text-gray-500 mt-2">Connect • Appreciate • Celebrate</p>
        </div>

        {/* Auth Form */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
          <div className="mb-6">
            <div className="flex rounded-2xl bg-gradient-to-r from-gray-100 to-gray-50 p-1">
              <button
                type="button"
                onClick={() => setIsSignUp(false)}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${!isSignUp
                  ? 'bg-white text-gray-900 shadow-lg transform scale-105'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setIsSignUp(true)}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${isSignUp
                  ? 'bg-white text-gray-900 shadow-lg transform scale-105'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                Join Us
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-2xl p-4 animate-slide-up">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="text-red-800 font-medium text-sm leading-relaxed">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="mt-6 bg-green-50 border-2 border-green-200 rounded-2xl p-4 animate-slide-up">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-green-800 font-medium text-sm leading-relaxed">
                    We’ve sent you a verification email. ✉️ Please check your inbox.
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name ✨
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 bg-white/50"
                      placeholder="Your awesome name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Tribe 🏢
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      name="organization_id"
                      value={formData.organization_id}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 appearance-none bg-white/50"
                      required
                    >
                      <option value="">Choose your tribe</option>
                      {organizations.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.short_code} {org.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What You Do 💼
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="position"
                      value={formData.position}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 bg-white/50"
                      placeholder="Your superpower role"
                      required
                    />
                  </div>
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email 📧
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 bg-white/50"
                  placeholder="your.email@company.com"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password 🔐
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />

                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 bg-white/50"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />

                {/* Toggle visibility icon */}
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {!isSignUp && (
              <div className="text-right mt-2">
                <button
                  type="button"
                  onClick={() => setCurrentView('forgot-password')}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Forgot password?
                </button>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-500 to-purple-500 text-white py-4 px-6 rounded-xl hover:from-primary-600 hover:to-purple-600 focus:ring-4 focus:ring-primary-200 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 shadow-lg"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Creating magic...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Sparkles className="w-5 h-5" />
                  <span>{isSignUp ? 'Join the Community' : 'Enter the Tower'}</span>
                </div>
              )}
            </button>
          </form>
        </div>
        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          🏢 Exclusive access for tower residents only
        </p>
      </div>
    </div>
  )
}