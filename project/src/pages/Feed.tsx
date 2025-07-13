import { useState, useEffect } from 'react'
import { MessageCircle, Heart, Clock, Filter, Award } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface ComplimentFeedItem {
  id: string
  message: string
  is_anonymous: boolean
  created_at: string
  from_user: {
    full_name: string
    organization: {
      name: string
      short_code: string
      color: string
    }
  } | null
  to_user: {
    full_name: string
    position: string
    organization: {
      name: string
      short_code: string
      color: string
    }
  }
}

interface Organization {
  id: string
  name: string
  short_code: string
  color: string
}

export function Feed() {
  const [compliments, setCompliments] = useState<ComplimentFeedItem[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrganizations()
    fetchCompliments()
  }, [selectedOrgId])

  const fetchOrganizations = async () => {
    const { data } = await supabase
      .from('organizations')
      .select('*')
      .order('name')

    if (data) {
      setOrganizations(data)
    }
  }

  const fetchCompliments = async () => {
    setLoading(true)

    try {
      let query = supabase
        .from('secure_compliments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      const { data, error } = await query

      if (error) throw error

        let filteredData = (data || []).map((compliment) => {
      if (compliment.is_anonymous) {
        return {
          ...compliment,
          from_user: null, // Remove identifying data
        };
      }
      return compliment;
    });
      // Filter by organization if selected

      if (selectedOrgId !== 'all') {
        filteredData = filteredData.filter((compliment) => {
          return compliment.to_user?.organization?.id === selectedOrgId
        })
      }

      setCompliments(filteredData)
    } catch (error) {
      console.error('Error fetching compliments:', error)
    } finally {
      setLoading(false)
    }
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
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours}h ago`
    } else {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days}d ago`
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-secondary-600 to-primary-600 bg-clip-text text-transparent">
            Feed
          </h1>
        </div>
        <p className="text-gray-600 text-lg">
          Watch the positive vibes flow through our tower ✨
        </p>
      </div>
      {/* Filter */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl border border-white/50 p-4 sm:p-8 mb-8 sm:mb-12">
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
            {/* Filter Header - Mobile Optimized */}
            <div className="flex items-center space-x-3 sm:space-x-4">
             <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-purple-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Filter className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-800">Filter Recognition</h3>
                <p className="text-xs sm:text-sm text-gray-600">Discover inspiring moments</p>
              </div>
            </div>
            
            {/* Filter Controls - Mobile Stack */}
            <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-4">
                    <select
            value={selectedOrgId}
            onChange={(e) => setSelectedOrgId(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Organizations</option>
           {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.short_code} {org.name}
                </option>
              ))}
          </select>
              
              <div className="bg-gradient-to-r from-indigo-100 to-purple-100 px-4 py-3 rounded-xl sm:rounded-2xl border border-indigo-200 w-full sm:w-auto">
                <div className="flex items-center justify-center sm:justify-start space-x-2">
                  <Award className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-semibold text-indigo-800">
                    {compliments.length} Recognition{compliments.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      {/* Feed */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading compliments...</p>
          </div>
        ) : compliments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No compliments yet
            </h3>
            <p className="text-gray-500 mb-4">
              Be the first to spread some positivity!
            </p>
            <a
              href="/give-compliment"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Heart className="w-4 h-4 mr-2" />
              Give a Compliment
            </a>
          </div>
        ) : (
          compliments.map((compliment) => (
            <div
              key={compliment.id}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start space-x-4">
                {/* Sender Avatar */}
                <div className="flex-shrink-0">
                  {compliment.is_anonymous ? (
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 text-sm font-medium">?</span>
                    </div>
                  ) : (
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-medium"
                      style={{ backgroundColor: compliment.from_user?.organization?.color }}
                    >
                      {compliment.from_user?.organization?.short_code}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-medium text-gray-900">
                      {compliment.is_anonymous
                        ? 'Someone'
                        : compliment.from_user?.full_name}
                    </span>
                    <span className="text-gray-500">complimented</span>
                    <div className="flex items-center space-x-1">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-medium"
                        style={{ backgroundColor: compliment.to_user.organization.color }}
                      >
                        {compliment.to_user.organization.short_code}
                      </div>
                      <span className="font-medium text-gray-900">
                        {compliment.to_user.full_name}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 mb-3">
                    <p className="text-gray-800 leading-relaxed">
                      "{compliment.message}"
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <span>
                        {compliment.to_user.position} at {compliment.to_user.organization.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{getTimeAgo(compliment.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load More */}
      {compliments.length >= 50 && (
        <div className="text-center mt-8">
          <button className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            Load More Compliments
          </button>
        </div>
      )}
    </div>
  )
}