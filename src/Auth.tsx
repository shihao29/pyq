import React, { useState, useRef } from 'react'
import { supabase, DEFAULT_AVATAR } from './lib/supabase'
import { useNavigate } from 'react-router-dom'
import imageCompression from 'browser-image-compression'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const compressed = await imageCompression(file, {
        maxWidthOrHeight: 800,
        maxSizeMB: 0.5,
      })
      setAvatarFile(compressed)
      const previewUrl = URL.createObjectURL(compressed)
      setAvatarPreview(previewUrl)
    } catch (err) {
      console.error('图片压缩失败:', err)
      setAvatarFile(file)
      const previewUrl = URL.createObjectURL(file)
      setAvatarPreview(previewUrl)
    }
  }

  const uploadAvatar = async (userId: string): Promise<string> => {
    if (!avatarFile) return DEFAULT_AVATAR

    const fileExt = avatarFile.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, avatarFile, { upsert: true })

    if (uploadError) {
      console.error('头像上传失败:', uploadError)
      return DEFAULT_AVATAR
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
    return data.publicUrl
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isLoginMode) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error
      } else {
        if (!avatarFile) {
          throw new Error('请上传头像后再注册')
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nickname: nickname
            }
          }
        })
        if (error) throw error

        if (data.user) {
          const avatarUrl = await uploadAvatar(data.user.id)

          await supabase
            .from('users')
            .update({ avatar_url: avatarUrl })
            .eq('id', data.user.id)
        }
      }

      navigate('/')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {isLoginMode ? '登录' : '注册'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleAuth}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {!isLoginMode && (
              <div className="flex flex-col items-center">
                <div
                  className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center cursor-pointer overflow-hidden border-2 border-dashed border-gray-300 hover:border-indigo-400 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="头像预览" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <span className="text-sm text-gray-500 mt-2">点击上传头像（必填）</span>
              </div>
            )}

            {!isLoginMode && (
              <div>
                <label htmlFor="nickname" className="block text-sm font-medium text-gray-700">
                  昵称
                </label>
                <div className="mt-1">
                  <input
                    id="nickname"
                    name="nickname"
                    type="text"
                    required
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="请输入昵称"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                邮箱
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="请输入邮箱"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                密码
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="请输入密码"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '处理中...' : (isLoginMode ? '登录' : '注册')}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsLoginMode(!isLoginMode)
                    setError('')
                  }}
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  {isLoginMode ? '没有账号？去注册' : '已有账号？去登录'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
