import { useState, useEffect } from 'react'
import { Heart, Medal, Award, TrendingUp, Users, Trophy, Crown, Zap, Snail } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

interface LeaderboardUser {
  id: string
  full_name: string
  position: string
  organization: {
    id: string
    name: string
    short_code: string
    color: string
  }
  compliment_count: number
  recent_compliments: Array<{
    message: string
    is_anonymous: boolean
    created_at: string
    from_user: {
      id: string
      full_name: string
      position: string
      organization: {
        id: string
        name: string
        short_code: string
        color: string
      } | null
    } | null
  }>
}

interface Organization {
  id: string
  name: string
  short_code: string
  color: string
}

export function Leaderboard() {
  const { profile } = useAuth()
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState<string>('all')
  const [timeFrame, setTimeFrame] = useState<'week' | 'month' | 'all'>('month')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrganizations()
    fetchLeaderboard()
  }, [selectedOrgId, timeFrame])

  const fetchOrganizations = async () => {
    const { data } = await supabase
      .from('organizations')
      .select('*')
      .order('name')

    // console.log('Fetched organizations:', data)

    if (data) {
      setOrganizations(data)
    }
  }

  const fetchLeaderboard = async () => {
    setLoading(true)
  try {
      let query = supabase
        .from('users')
        .select(`
        id,
        full_name,
        position,
        organization:organizations(
          id,
          name,
          short_code,
          color
        )
      `)

      if (selectedOrgId !== 'all') {
        query = query.eq('organization_id', selectedOrgId)
      }

      const { data: users } = await query

      if (!users) return

      // Get compliment counts for each user
      const usersWithCounts = await Promise.all(
        users.map(async (user) => {
          let complimentQuery = supabase
            .from('public_compliments_view')
            .select(` 
            *
          `, { count: 'exact' })
            .eq('to_user_id', user.id)
//  console.log('Fetching compliments for user:', complimentQuery) 

          // Apply time filter
          if (timeFrame === 'week') {
            const weekAgo = new Date()
            weekAgo.setDate(weekAgo.getDate() - 7)
            complimentQuery = complimentQuery.gte('created_at', weekAgo.toISOString())
          } else if (timeFrame === 'month') {
            const monthAgo = new Date()
            monthAgo.setMonth(monthAgo.getMonth() - 1)
            complimentQuery = complimentQuery.gte('created_at', monthAgo.toISOString())
          }

          const { data: compliments, count } = await complimentQuery
            .order('created_at', { ascending: false })
            .limit(3)

          // console.log('Fetched compliments for user:', compliments)

          return {
            ...user,
            // Fix: Extract single organization object from array
             organization: Array.isArray(user.organization) ? user.organization[0] : user.organization,
          compliment_count: count || 0,
          recent_compliments: (compliments || []).map(compliment => ({
            id: compliment.id,
            message: compliment.message,
            created_at: compliment.created_at,
            is_anonymous: compliment.is_anonymous,
            is_moderated: compliment.is_moderated,
            // Structure the from_user object for consistency with your existing UI
            from_user: compliment.from_user_name ? {
              id: compliment.from_user_id,
              full_name: compliment.from_user_name,
              position: compliment.from_user_position,
              organization: compliment.from_organization_name ? {
                id: compliment.from_organization_id,
                name: compliment.from_organization_name,
                short_code: compliment.from_organization_short_code,
                color: compliment.from_organization_color
              } : null
            } : null
            }))
          }
        })
      )

      // Sort by compliment count
      const sortedUsers = usersWithCounts
        .sort((a, b) => b.compliment_count - a.compliment_count)
        .slice(0, 20) // Top 20

      // console.log('Sorted leaderboard data:', sortedUsers)
      setLeaderboardData(sortedUsers)
    } catch (error) {
      // console.error('Error fetching leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRankBadge = (index: number) => {
    if (index === 0) return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
    if (index === 1) return 'bg-gradient-to-r from-gray-300 to-gray-400 text-white'
    if (index === 2) return 'bg-gradient-to-r from-orange-400 to-orange-500 text-white'
    return 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700'
  }

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="w-6 h-6 text-yellow-500" />
      case 1:
        return <Medal className="w-6 h-6 text-gray-400" />
      case 2:
        return <Award className="w-6 h-6 text-amber-600" />
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-500">#{index + 1}</span>
    }
  }

  const getTimeFrameLabel = () => {
    switch (timeFrame) {
      case 'week': return 'This Week'
      case 'month': return 'This Month'
      case 'all': return 'All Time'
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
            Leaderboard
          </h1>
        </div>
        <p className="text-gray-600 text-lg">
          Celebrating the most loved colleagues in our tower 💖
        </p>

        {/* Quote of the Day Section */}
        <div className="mt-6 max-w-2xl mx-auto bg-pink-50 border-l-4 border-pink-400 p-4 rounded-lg shadow-sm">
          <p className="text-sm text-pink-700 italic">
            “In tech, “working remotely” just means crying in a different room. 💻😭” – Admin
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-6 mb-8 border border-white/20">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>Organization</span>
            </label>
            <select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/50 transition-all duration-300"
            >
              <option value="all">All Organizations 🌈</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.short_code} {org.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
              <TrendingUp className="w-4 h-4" />
              <span>Time Period</span>
            </label>
            <select
              value={timeFrame}
              onChange={(e) => setTimeFrame(e.target.value as any)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/50 transition-all duration-300"
            >
              <option value="week">This Week 📅</option>
              <option value="month">This Month 🗓️</option>
              <option value="all">All Time ⭐</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-r from-primary-500 to-pink-500 rounded-3xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm font-medium">Active Members</p>
              <p className="text-3xl font-bold">{leaderboardData.length}</p>
              <p className="text-primary-200 text-xs">Spreading love ✨</p>
            </div>
            <Users className="w-12 h-12 text-primary-200 animate-float" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-secondary-500 to-purple-500 rounded-3xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-secondary-100 text-sm font-medium">Total Love {getTimeFrameLabel()}</p>
              <p className="text-3xl font-bold">
                {leaderboardData.reduce((sum, user) => sum + user.compliment_count, 0)}
              </p>
              <p className="text-secondary-200 text-xs">Compliments shared 💕</p>
            </div>
            <Heart className="w-12 h-12 text-secondary-200 animate-pulse" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-accent-500 to-orange-500 rounded-3xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-accent-100 text-sm font-medium">Top Star</p>
              <p className="text-xl font-bold">
                {leaderboardData[0]?.full_name || 'Loading...'}
              </p>
              <p className="text-accent-200 text-xs">Most appreciated 🌟</p>
            </div>
            <Crown className="w-12 h-12 text-accent-200 animate-bounce" />
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl overflow-hidden border border-white/20">
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-purple-50">
          <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <Zap className="w-5 h-5 text-accent-500" />
            <span>Top Stars - {getTimeFrameLabel()}</span>
          </h2>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-500 text-lg">Loading the love...</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {leaderboardData.map((user, index) => (
              <div
                key={user.id}
                className={`p-6 hover:bg-gradient-to-r hover:from-primary-50 hover:to-purple-50 transition-all duration-300 ${user.id === profile?.id ? 'bg-gradient-to-r from-primary-100 to-purple-100 border-l-4 border-primary-500' : ''
                  } ${index < 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : ''}`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                  {/* Rank */}
                  <div className="flex-shrink-0 flex flex-col items-center">
                    {getRankIcon(index)}
                    {index < 3 && (
                      <div className={`mt-2 px-2 py-1 rounded-full text-xs font-bold ${getRankBadge(index)}`}>
                        {index === 0 ? 'STAR' : index === 1 ? 'RISING' : 'LOVED'}
                      </div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-4 mb-2">
                      <div
                        className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-white text-lg font-bold shadow-lg transform hover:scale-110 transition-all duration-300"
                        style={{ backgroundColor: user.organization.color }}
                      >
                        {user.organization.short_code}
                      </div>
                      <div>
                        <p className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                          <span>{user.full_name}</span>
                          {user.id === profile?.id && (
                            <span className="text-xs bg-gradient-to-r from-primary-500 to-purple-500 text-white px-3 py-1 rounded-full">
                              That's You! 🎉
                            </span>
                          )}
                          {index === 0 && <Crown className="w-5 h-5 text-yellow-500" />}
                        </p>
                        <p className="text-sm text-gray-600 font-medium">
                          {user.position} • {user.organization.name}
                        </p>
                      </div>
                    </div>

                    {/* Recent Compliments */}
                    {user.recent_compliments.length > 0 && (
                      <div className="mt-4 bg-white/50 rounded-xl p-3 sm:p-4 border border-gray-100 text-sm sm:text-xs">
                        <p className="text-xs text-gray-500 mb-2 font-medium flex items-center space-x-1">
                          <span>Latest Tarif:</span>
                          <span className="text-sm text-gray-700 leading-relaxed">
                            {user.recent_compliments[0].message.slice(0, 20)}...
                          </span>
                        </p>
                        <p className="text-xs text-gray-500 mt-2 flex items-center space-x-1">
                          <span>—</span>
                          <span className="font-medium">{user.recent_compliments[0].is_anonymous
                            ? "Someone"
                            : user.recent_compliments[0].from_user?.full_name}
                          </span>
                          <Snail className="w-3 h-3 text-red-400 " />
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Compliment Count */}
                  <div className="text-center">
                    <div className="bg-gradient-to-r from-primary-500 to-purple-500 text-white rounded-2xl p-4 shadow-lg">
                      <p className="text-3xl font-bold">
                        {user.compliment_count}
                      </p>
                      <p className="text-xs opacity-90">
                        recognition{user.compliment_count !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}