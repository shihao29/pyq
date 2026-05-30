import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import imageCompression from 'browser-image-compression'
import { X, Loader2 } from 'lucide-react'

export default function PublishMoment() {
  const [content, setContent] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [publishing, setPublishing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const handleSelectImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newFiles: File[] = []
    const newPreviews: string[] = []

    Array.from(files).forEach(file => {
      if (selectedFiles.length + newFiles.length >= 9) return
      newFiles.push(file)
      newPreviews.push(URL.createObjectURL(file))
    })

    setSelectedFiles(prev => [...prev, ...newFiles].slice(0, 9))
    setPreviews(prev => [...prev, ...newPreviews].slice(0, 9))

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveImage = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => {
      const url = prev[index]
      if (url) URL.revokeObjectURL(url)
      return prev.filter((_, i) => i !== index)
    })
  }

  const compressImage = async (file: File): Promise<File> => {
    try {
      return await imageCompression(file, {
        maxWidthOrHeight: 1200,
        maxSizeMB: 1,
      })
    } catch (err) {
      console.error('图片压缩失败:', err)
      return file
    }
  }

  const uploadImage = async (file: File): Promise<string> => {
    const compressed = await compressImage(file)
    const fileExt = compressed.name.split('.').pop()
    const fileName = `moments/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(fileName, compressed)

    if (uploadError) throw uploadError

    const { data } = supabase.storage.from('photos').getPublicUrl(fileName)
    return data.publicUrl
  }

  const handlePublish = async () => {
    if (!content.trim() && selectedFiles.length === 0) return
    if (publishing) return

    setPublishing(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/login')
        return
      }

      let imageUrls: string[] = []
      if (selectedFiles.length > 0) {
        imageUrls = await Promise.all(selectedFiles.map(file => uploadImage(file)))
      }

      const now = new Date()
      const displayTime = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

      const { error: insertError } = await supabase
        .from('moments')
        .insert({
          author_id: user.id,
          content: content.trim(),
          image_urls: imageUrls,
          display_time: displayTime,
        })

      if (insertError) throw insertError

      navigate('/')
    } catch (err) {
      console.error('发布失败:', err)
      alert('发布失败，请重试')
    } finally {
      setPublishing(false)
    }
  }

  const canPublish = (content.trim().length > 0 || selectedFiles.length > 0) && !publishing

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 sticky top-0 z-50 bg-[#f7f7f7]">
        <button
          onClick={() => navigate('/')}
          className="text-[#333] text-[16px] font-medium"
        >
          取消
        </button>
        <span className="text-[17px] font-semibold text-[#333]">发表朋友圈</span>
        <button
          onClick={handlePublish}
          disabled={!canPublish}
          className={`px-4 py-1.5 rounded-md text-[14px] font-medium transition-colors ${
            canPublish
              ? 'bg-[#07c160] text-white active:bg-[#06ad56]'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {publishing ? (
            <span className="flex items-center">
              <Loader2 size={14} className="animate-spin mr-1" />
              发表中
            </span>
          ) : (
            '发表'
          )}
        </button>
      </div>

      <div className="flex-1 px-4 py-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="这一刻的想法..."
          className="w-full min-h-[150px] text-[16px] leading-relaxed resize-none focus:outline-none placeholder-gray-400"
          maxLength={2000}
          autoFocus
        />

        <div className="grid grid-cols-3 gap-2 mt-4">
          {previews.map((preview, index) => (
            <div key={index} className="relative aspect-square rounded-md overflow-hidden bg-gray-100">
              <img
                src={preview}
                alt={`预览 ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => handleRemoveImage(index)}
                className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center"
              >
                <X size={14} className="text-white" />
              </button>
            </div>
          ))}

          {selectedFiles.length < 9 && (
            <div
              className="aspect-square rounded-md border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-xs text-gray-400 mt-1">{selectedFiles.length}/9</span>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleSelectImages}
        />
      </div>

      <div className="px-4 py-3 border-t border-gray-100 text-[13px] text-gray-400 text-right">
        {content.length}/2000
      </div>
    </div>
  )
}
