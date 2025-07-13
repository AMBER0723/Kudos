import { useState, useEffect } from 'react'
import { MessageSquare, Send, Clock, Eye, EyeOff, Sparkles } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

interface Confession {
  id: string
  message: string
  created_at: string
  expires_at: string
  author_id: string
  is_own: boolean
}

export function ConfessionRoom() {
  const { profile } = useAuth()
  const [confessions, setConfessions] = useState<Confession[]>([])
  const [newConfession, setNewConfession] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchConfessions()
  }, [])
  
  const fetchConfessions = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('confessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      const confessionsWithOwnership = data.map((confession: any) => ({
        ...confession,
        is_own: confession.author_id === profile?.id
      }))

      setConfessions(confessionsWithOwnership)
    } catch (error) {
      console.error('Error fetching confessions:', error)
    } finally {
      setLoading(false)
    }
  }

 const submitConfession = async () => {
    if (!newConfession.trim() || submitting) return

    try {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
      const { data, error } = await supabase
        .from('confessions')
        .insert({
          message: newConfession,
          author_id: profile?.id,
          expires_at: expiresAt
        })
         .select() // 👈 this ensures Supabase returns the inserted row
  .single()

      if (error) throw error

      setConfessions([data, ...confessions])
      setNewConfession('')
    } catch (error) {
      console.error('Error submitting confession:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date()
    const expires = new Date(expiresAt)
    const diff = expires.getTime() - now.getTime()
    
    if (diff <= 0) return 'Expired'
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m left`
    }
    return `${minutes}m left`
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return 'just now'
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes}m ago`
    } else {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours}h ago`
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {'Gossip | Confession Room'}
            </h1>
        </div>
        <p className="text-gray-600 text-lg">
          Share your secret thoughts anonymously • Confessions disappear after 24 hours ⏰
        </p>
      </div>

      {/* New Confession */}
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-8 mb-8 border border-white/20">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          <span>Share Your Secret</span>
        </h2>
        
        <div className="space-y-4">
          <textarea
            value={newConfession}
            onChange={(e) => setNewConfession(e.target.value)}
            placeholder="What's on your mind? Share your secret thoughts...😶‍🌫️"
            className="w-full h-32 p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none bg-white/50 transition-all duration-300"
            maxLength={500}
          />
          
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span className="bg-purple-100 px-3 py-1 rounded-full">
                {newConfession.length}/500 characters
              </span>
              <div className="flex items-center space-x-1">
                <EyeOff className="w-4 h-4" />
                <span>Anonymous & disappears in 24h</span>
              </div>
            </div>
            
            <button
              onClick={submitConfession}
              disabled={!newConfession.trim() || submitting}
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 shadow-lg"
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Confess</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Confessions Feed */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
          <MessageSquare className="w-6 h-6 text-purple-500" />
          <span>Recent Confessions</span>
        </h2>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-500 text-lg">Loading confessions...</p>
          </div>
        ) : confessions.length === 0 ? (
          <div className="text-center py-12 bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20">
            <MessageSquare className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              No confessions yet! 🤫
            </h3>
            <p className="text-gray-500 text-lg">
              Be the first to share your secret thoughts!
            </p>
          </div>
        ) : (
          confessions.map((confession, index) => (
            <div
              key={confession?.id}
              className={`bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-6 border border-white/20 transition-all duration-300 hover:shadow-2xl 
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start space-x-4">
                {/* Anonymous Avatar */}
                <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-lg">🤫</span>
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="font-bold text-gray-900">Anonymous</span>
                    {confession?.is_own && (
                      <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-medium">
                        Your confession
                      </span>
                    )}
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-5 mb-4 border border-purple-100">
                    <p className="text-gray-800 leading-relaxed text-lg">
                      {confession?.message}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{getTimeAgo(confession?.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 bg-orange-100 text-orange-700 px-3 py-1 rounded-full">
                      <Eye className="w-3 h-3" />
                      <span className="font-medium">{getTimeRemaining(confession?.expires_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Info Card */}
      <div className="mt-8 bg-gradient-to-r from-purple-100 to-pink-100 rounded-3xl p-6 border border-purple-200">
        <div className="flex items-center space-x-3 mb-3">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="font-bold text-purple-800">How it works</h3>
        </div>
        <ul className="text-purple-700 space-y-1 text-sm">
          <li>• All confessions are completely anonymous</li>
          <li>• Confessions automatically disappear after 24 hours</li>
          <li>• Share your thoughts, feelings, or secrets safely</li>
          <li>• Be kind and respectful to others</li>
        </ul>
      </div>
    </div>
  )
}