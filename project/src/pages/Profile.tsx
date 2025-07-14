import { useEffect, useState } from 'react'
import { User, Edit3, Save, X, Heart, Award, Calendar, Building2, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

export function Profile() {
  const { profile, refreshProfile } = useAuth()

  const [error, setError] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    full_name: profile?.full_name || '',
    position: profile?.position || '',
  });
  const [compliments, setCompliments] = useState<any[]>([]) // or strongly type later
  const [complimentCount, setComplimentCount] = useState(0)

  async function fetchUserCompliments(userId: string) {
    const { data, error, count } = await supabase
      .from('public_compliments_view')
      .select(`
    *
  `, { count: 'exact' })
      .eq('to_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching compliments:', error)
      return { data: [], count: 0 }
    }

    return { data: data ?? [], count: count ?? 0 }
  }

  useEffect(() => {
    if (profile?.id) {
      fetchUserCompliments(profile.id).then(({ data, count }) => {
        setCompliments(data)
        setComplimentCount(count)
      })
    }
  }, [profile])

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };


  const validatePassword = (password: string) => {
    const lengthCheck = password.length >= 8;
    const specialCharCheck = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const numberCheck = /\d/.test(password);
    return lengthCheck && specialCharCheck && numberCheck;
  };


  const handleSave = async () => {
    try {

      const { error: updateError } = await supabase
        .from('users')
        .update({
          full_name: editData.full_name,
          position: editData.position,
        })
        .eq('id', profile?.id);

      if (updateError) throw updateError;

      // Update password if entered
      if (newPassword.trim()) {

        const isValidPassword = validatePassword(newPassword.trim());

        if (!isValidPassword) {
          setError('Password must be at least 8 characters long and include a number and a special character.');
          return;
        }
        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword.trim(),

        });
        if (passwordError) throw passwordError;
        setPasswordChanged(true);
      }

      setError('');
      setIsEditing(false);
      setNewPassword('');
      await refreshProfile();
    } catch (error: any) { // Set the error message from Supabase error
      if (error?.message) {
        setError(error.message); // This will show in your custom error UI
      } else {
        setError('Error updating profile or password.');
      }
    }
  };


  const handleCancel = () => {
    setEditData({
      full_name: profile?.full_name || '',
      position: profile?.position || '',
    })
    setIsEditing(false)
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Profile not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-8 mb-8 border border-white/20">
        <div className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8">
          {/* Avatar */}
          <div className="relative">
            <div
              className="w-32 h-32 rounded-3xl flex items-center justify-center text-white text-4xl font-bold shadow-2xl"
              style={{ backgroundColor: profile.organization?.color }}
            >
              {profile.organization?.short_code}
            </div>
            {/* {isEditing && (
              <button className="absolute bottom-2 right-2 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-300">
              </button>
            )} */}
          </div>

          {/* Profile Info */}
          <div className="flex-1 text-center md:text-left">
            {isEditing ? (
              <div className="space-y-4">
                <label htmlFor="full-name" className="block text-sm text-gray-700 font-medium">
                  Full Name
                </label>
                <input
                  id="full-name"
                  type="text"
                  value={editData.full_name}
                  onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-800 shadow-sm transition-all duration-200"
                  placeholder="Enter your full name"
                />
                <label htmlFor="position" className="block text-sm text-gray-700 font-medium">
                  Position
                </label>
                <input
                  id="position"
                  type="text"
                  value={editData.position}
                  onChange={(e) => setEditData({ ...editData, position: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-800 shadow-sm transition-all duration-200"
                  placeholder="Your job title or role"
                />
                <div className="space-y-2 mt-6 relative">
                  <label className="block text-gray-600 text-sm">New Password</label>

                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (error) setError('');
                    }}
                    className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter new password"
                  />

                  {/* Eye Toggle Button */}
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-[42px] transform -translate-y-1/2 text-gray-400 "
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>

                  {/* Success Message */}
                  {passwordChanged && (
                    <p className="text-green-600 text-sm">Password updated successfully</p>
                  )}

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 mt-2 animate-slide-up">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        </div>
                        <p className="text-red-800 font-medium text-sm leading-relaxed">
                          {error}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

              </div>

            ) : (
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  {profile.full_name}
                </h1>
                <p className="text-xl text-gray-600 mb-2">{profile.position}</p>
              </div>
            )}

            <div className="flex items-center justify-center md:justify-start space-x-2 text-gray-500 mb-4">
              <Building2 className="w-4 h-4" />
              <span>{profile.organization?.name}</span>
            </div>

            <div className="flex items-center justify-center md:justify-start space-x-2 text-gray-400 mb-6">
              <span className="text-sm bg-gray-100 px-3 py-1 rounded-full">
                📧 {profile.email} (cannot be changed)
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 justify-center md:justify-start">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-2xl hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center space-x-2 bg-gray-500 text-white px-6 py-3 rounded-2xl hover:bg-gray-600 transition-all duration-300"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    if (profile) {
                      setEditData({
                        full_name: profile.full_name || '',
                        position: profile.position || '',
                      });
                      setIsEditing(true);
                    }
                  }}
                  className="flex items-center space-x-2 bg-gradient-to-r from-primary-500 to-purple-500 text-white px-6 py-3 rounded-2xl hover:from-primary-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-r from-primary-500 to-pink-500 rounded-3xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm font-medium">Total Love Received</p>
              <p className="text-3xl font-bold">{complimentCount}</p>

            </div>
            <Heart className="w-12 h-12 text-primary-200 animate-pulse" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-3xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Recent Compliments</p>
              <p className="text-3xl font-bold">{compliments.length}</p>
            </div>
            <Award className="w-12 h-12 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Member Since</p>
              <p className="text-lg font-bold">{new Date(profile.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</p>
            </div>
            <Calendar className="w-12 h-12 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Recent Compliments */}
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-8 border border-white/20">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
          <Heart className="w-6 h-6 text-primary-500" />
          <span>Recent Love Received</span>
        </h2>

        {compliments.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No compliments yet</p>
            <p className="text-gray-400">Start connecting with others to receive love!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {compliments.slice(0, 5).map((compliment) => (
              <div
                key={compliment.id}
                className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-2xl p-6 border border-primary-100"
              >
                <div className="flex items-start space-x-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg"
                    style={{ backgroundColor: compliment.from_organization_color || '#gray' }}
                  >
                    {compliment.from_organization_short_code || '?'}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-800 leading-relaxed mb-2">
                      "{compliment.message}"
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>
                        From: {compliment.is_anonymous ? 'Someone' : compliment.from_user_name}
                      </span>
                      <span>{new Date(compliment.created_at).toLocaleDateString()}</span>
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