import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Heart, MessageCircle, Users, LogOut, Award, Sparkles, EggFried } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

interface MockLayoutProps {
  children: React.ReactNode
}

export function MockLayout({ children }: MockLayoutProps) {
  const { profile, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

 const handleSignOut = async () => {
  const { error } = await signOut()
  if (!error) {
    navigate('/auth')
  } else {
    console.error('Navigation skipped due to sign-out error.')
  }
}

  const navItems = [
    { path: '/', icon: Heart, label: 'Leaderboard', color: 'text-primary-600' },
    { path: '/feed', icon: MessageCircle, label: 'Feed', color: 'text-secondary-600' },
    { path: '/give-compliment', icon: Award, label: 'Give Love', color: 'text-purple-600' },
    { path: '/confession-room', icon: Users, label: 'Confession', color: 'text-orange-600' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-purple-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <EggFried className="w-6 h-6 text-white animate-pulse" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
                  TowerKudos
                </span>
                <div className="text-xs text-gray-500">Connection Hub</div>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-r from-primary-100 to-purple-100 text-primary-700 shadow-lg transform scale-105'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? item.color : ''}`} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {profile && (
                // <div className="flex items-center space-x-3">
                //   <div className="text-right hidden sm:block">
                //     <p className="text-sm font-medium text-gray-900 flex items-center space-x-1">
                //       <span>{profile.full_name}</span>
                //       <Sparkles className="w-3 h-3 text-accent-500" />
                //     </p>
                //     <p className="text-xs text-gray-500">
                //       {profile.organization?.name}
                //     </p>
                //   </div>
                //   <div
                //     className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-lg font-bold shadow-lg transform hover:scale-110 transition-all duration-300"
                //     style={{ backgroundColor: profile.organization?.color }}
                //   >
                //     {profile.organization?.short_code}
                //   </div>
                // </div>
                <div className="flex items-center space-x-3">
                  <Link 
                    to="/profile"
                    className="flex items-center space-x-3 hover:bg-gray-100/50 rounded-2xl p-2 transition-all duration-300 group"
                  >
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-medium text-gray-900 flex items-center space-x-1 group-hover:text-primary-600 transition-colors">
                        <span>{profile.full_name}</span>
                        <Sparkles className="w-3 h-3 text-accent-500" />
                      </p>
                      <p className="text-xs text-gray-500">
                        {profile.organization?.name}
                      </p>
                    </div>
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-lg font-bold shadow-lg transform group-hover:scale-110 transition-all duration-300"
                      style={{ backgroundColor: profile.organization?.color }}
                    >
                      {profile.organization?.short_code}
                    </div>
                  </Link>
                </div>
              )}
              <button
                onClick={handleSignOut}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-xl hover:bg-gray-100/50"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="md:hidden bg-white/90 backdrop-blur-lg border-t border-gray-200 fixed bottom-0 left-0 right-0 z-50 shadow-2xl">
        <div className="flex justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center p-3 rounded-2xl transition-all duration-300 ${
                  isActive
                    ? 'text-primary-600 transform scale-110'
                    : 'text-gray-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs mt-1 font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="pb-20 md:pb-0">
        {children}
      </main>
    </div>
  )
}