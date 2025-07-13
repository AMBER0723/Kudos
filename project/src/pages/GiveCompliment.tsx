import { useState, useEffect } from 'react'
import { Heart, Send, CheckCircle, Building2, Search, Sparkles, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { checkComplimentWithAI, enhanceComplimentWithAI } from '../lib/gemini'

interface Organization {
  id: string
  name: string
  short_code: string
  color: string
}

interface User {
  id: string
  full_name: string
  position: string
  organization: {
    name: string
    short_code: string
    color: string
  }
}

export function GiveCompliment() {
  const { profile } = useAuth()
  const [step, setStep] = useState<'org' | 'user' | 'compliment' | 'success'>('org')
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [selectedOrg, setSelectedOrg] = useState<string>('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [message, setMessage] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [loading, setLoading] = useState(false)
  const [enhancedMessage, setEnhancedMessage] = useState('')
  const [enhancing, setEnhancing] = useState(false)
  const [alert, setAlert] = useState('');


  useEffect(() => {
    fetchOrganizations()
  }, [])

  useEffect(() => {
    if (profile?.id && selectedOrg) {
      fetchUsers()
    }
  }, [profile?.id, selectedOrg])




  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(user =>
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.position.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredUsers(filtered)
    } else {
      setFilteredUsers(users)
    }
  }, [searchTerm, users])

  const fetchOrganizations = async () => {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('name')

    if (error) {
    } else {
      setOrganizations(data)
    }
  }


  const fetchUsers = async () => {
    if (!profile?.id || !selectedOrg) {
      console.warn('Profile ID or selectedOrg is undefined. Skipping fetch.')
      return
    }

    const { data, error } = await supabase
      .from('users')
      .select(`
      id,
      full_name,
      position,
      organization:organizations(
        name,
        short_code,
        color
      )
    `)
      .eq('organization_id', selectedOrg)
      .neq('id', profile.id) // Now guaranteed to be defined


    if (error) {
      return
    }

    const mappedUsers = data.map(user => ({
      ...user,
      organization: Array.isArray(user.organization) ? user.organization[0] : user.organization // Ensure organization is a single object,
    }))
    setUsers(mappedUsers)
    setFilteredUsers(mappedUsers)
  }



  const enhanceMessage = async () => {
    setEnhancing(true)
    try {
      const enhanced = await enhanceComplimentWithAI(message)

      if (enhanced === 'INAPPROPRIATE_CONTENT') {
        setAlert('The compliment may not be appropriate. Please revise it.')
      } else {
        setMessage(enhanced)
      }
    } catch (error) {
      setAlert('Failed to enhance the compliment. Please try again.')
    }
    setEnhancing(false)
  }

  const submitCompliment = async () => {
    if (!selectedUser || !message.trim()) return

    setLoading(true)
    setAlert('') // Clear any previous alerts

    try {
      const baseText = enhancedMessage || message.trim()
      const enhanced = await checkComplimentWithAI(baseText)

      if (!enhanced || enhanced === "INAPPROPRIATE_CONTENT") {
        setAlert("Your compliment was flagged as inappropriate. Please revise it before submitting.")
        return
      }

      const { error } = await supabase
        .from('compliments')
        .insert({
          from_user_id: profile?.id,
          to_user_id: selectedUser.id,
          message: enhanced,
          is_anonymous: isAnonymous,
          is_moderated: true,
        })

      if (error) throw error

      setStep('success')
    } catch (error) {
      console.error('Error submitting compliment:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setStep('org')
    setSelectedOrg('')
    setSelectedUser(null)
    setSearchTerm('')
    setMessage('')
    setEnhancedMessage('')
    setIsAnonymous(false)
  }

  const renderStepContent = () => {
    switch (step) {
      case 'org':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Heart className="w-16 h-16 text-accent-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Give a Compliment
              </h2>
              <p className="text-gray-600">
                First, select which organization your recipient belongs to
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => {
                    setSelectedOrg(org.id)
                    setStep('user')
                  }}
                  className="p-6 border-2 border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-all group"
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold mx-auto mb-3 group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: org.color }}
                  >
                    {org.short_code}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{org.name}</h3>
                  <p className="text-sm text-gray-500">Organization {org.short_code}</p>
                </button>
              ))}
            </div>
          </div>
        )

      case 'user':
        const selectedOrgData = organizations.find(org => org.id === selectedOrg)
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: selectedOrgData?.color }}
                >
                  {selectedOrgData?.short_code}
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  Select from {selectedOrgData?.name}
                </h2>
              </div>

              <div className="relative max-w-md mx-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search colleagues..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    setSelectedUser(user)
                    setStep('compliment')
                  }}
                  className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium"
                      style={{ backgroundColor: user.organization.color }}
                    >
                      {user.organization.short_code}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{user.full_name}</p>
                      <p className="text-sm text-gray-500">{user.position}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p>No colleagues found matching your search.</p>
              </div>
            )}

            <div className="flex justify-center">
              <button
                onClick={() => setStep('org')}
                className="px-4 py-2 text-primary-600 hover:text-primary-700 font-medium"
              >
                ← Back to Organizations
              </button>
            </div>
          </div>
        )

      case 'compliment':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Write Your Compliment
              </h2>
              <div className="flex items-center justify-center space-x-3 text-gray-600 bg-gradient-to-r from-primary-50 to-purple-50 rounded-2xl p-4">
                <span className="text-lg">To:</span>
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg"
                  style={{ backgroundColor: selectedUser?.organization.color }}
                >
                  {selectedUser?.organization.short_code}
                </div>
                <span className="font-bold text-lg">{selectedUser?.full_name}</span>
              </div>
            </div>

            {alert && (
              <div className="mb-6 bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4 animate-slide-up">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-red-800 font-medium text-sm leading-relaxed">
                      {alert}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share what makes this person awesome..."
                className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                maxLength={500}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">
                  {message.length}/500 characters
                </span>
                <button
                  onClick={enhanceMessage}
                  disabled={!message.trim() || enhancing}
                  className="flex items-center space-x-1 text-xs text-accent-600 hover:text-accent-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{enhancing ? 'Enhancing...' : 'Enhance with AI'}</span>
                </button>
              </div>
            </div>

            {enhancedMessage && (
              <div className="bg-accent-50 border border-accent-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Sparkles className="w-4 h-4 text-accent-600" />
                  <span className="text-sm font-medium text-accent-800">
                    AI Enhanced Version:
                  </span>
                </div>
                <p className="text-gray-700 mb-3">{enhancedMessage}</p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setMessage(enhancedMessage)}
                    className="text-xs bg-accent-100 text-accent-800 px-3 py-1 rounded-full hover:bg-accent-200 transition-colors"
                  >
                    Use This Version
                  </button>
                  <button
                    onClick={() => setEnhancedMessage('')}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-3 bg-gray-50 rounded-2xl p-4">
              <input
                type="checkbox"
                id="anonymous"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="anonymous" className="text-sm text-gray-700 font-medium">
                Send anonymously (be a secret admirer) 🕵️
              </label>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setStep('user')}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={submitCompliment}
                disabled={!message.trim() || loading}
                className="flex-1 bg-gradient-to-r from-primary-500 to-purple-500  text-white py-2 px-4 rounded-lg hover:from-primary-700 hover:to-secondary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Compliment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )

      case 'success':
        return (
          <div className="text-center space-y-6">
            <div className="animate-bounce-gentle">
              <CheckCircle className="w-20 h-20 text-success-500 mx-auto" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Compliment Sent! 🎉
              </h2>
              <p className="text-gray-600">
                Your kind words have been delivered to {selectedUser?.full_name}.
                Keep spreading positivity!
              </p>
            </div>

            <div className="bg-success-50 border border-success-200 rounded-lg p-4">
              <p className="text-success-800 text-sm">
                <strong>Tip:</strong> Regular appreciation boosts team morale and creates
                a positive work environment for everyone.
              </p>
            </div>

            <button
              onClick={resetForm}
              className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3 px-6 rounded-lg hover:from-primary-700 hover:to-secondary-700 transition-all font-medium"
            >
              Give Another Compliment
            </button>
          </div>
        )
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        {renderStepContent()}
      </div>
    </div>
  )
}