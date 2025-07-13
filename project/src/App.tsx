import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { MockLayout } from './components/MockLayout'
import { Leaderboard } from './pages/Leaderboard'
import { Feed } from './pages/Feed'
import { GiveCompliment } from './pages/GiveCompliment'
import { AuthPage } from './components/AuthPage'
import { ConfessionRoom } from './pages/ConfessionRoom'
import { Profile } from './pages/Profile'

function AppContent() {
  const { isAuthenticated } = useAuth()
  return (
    <>
      {!isAuthenticated ? (
        <AuthPage />
      ) : (
          <MockLayout>
            <Routes>
              {!isAuthenticated ? (
                <>
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="*" element={<Navigate to="/auth" replace />} />
                </>
              ) : (
                <>
                  <Route path="/" element={<Leaderboard />} />
                  <Route path="/feed" element={<Feed />} />
                  <Route path="/give-compliment" element={<GiveCompliment />} />
                   <Route path="/confession-room" element={<ConfessionRoom />} />
                   <Route path="/profile" element={<Profile />} />
                  <Route path="/auth" element={<Navigate to="/feed" replace />} />
                  <Route path="*" element={<Navigate to="/feed" replace />} />
                </>
              )}
            </Routes>
          </MockLayout>
      )}
    </>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App