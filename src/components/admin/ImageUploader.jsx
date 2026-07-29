import { useState } from 'react'
import supabase from '../../lib/supabase'
import { Upload, X, Loader2, ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'

function compressImage(file, maxWidth = 800) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let { width, height } = img
      if (width > maxWidth) {
        height = (maxWidth / width) * height
        width = maxWidth
      }
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob((blob) => {
        resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' }))
        URL.revokeObjectURL(url)
      }, 'image/webp', 0.8)
    }
    img.src = url
  })
}

export default function ImageUploader({ onUpload, currentUrl }) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(currentUrl || '')

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    setUploading(true)
    setPreview(URL.createObjectURL(file))

    try {
      const compressed = await compressImage(file)
      const filePath = `public/${Date.now()}_${compressed.name}`
      const { error } = await supabase.storage.from('products').upload(filePath, compressed)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(filePath)
      setPreview(publicUrl)
      onUpload(publicUrl)
      toast.success('Image uploaded')
    } catch (err) {
      toast.error('Upload failed: ' + (err.message || 'unknown error'))
    }
    setUploading(false)
  }

  function handleRemove() {
    setPreview('')
    onUpload('')
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-400">Product Image</label>
      <div className="flex items-start gap-3">
        <div className="w-24 h-24 rounded-xl bg-[#334155] border border-[#475569] flex items-center justify-center overflow-hidden flex-shrink-0">
          {preview ? (
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon size={28} className="text-slate-500" />
          )}
        </div>
        <div className="flex-1">
          {uploading ? (
            <div className="flex items-center gap-2 text-sm text-[#F59E0B]">
              <Loader2 size={16} className="animate-spin" />
              Compressing & uploading...
            </div>
          ) : (
            <div className="flex gap-2">
              <label className="btn-secondary text-sm cursor-pointer inline-flex items-center gap-1">
                <Upload size={14} />
                {preview ? 'Change' : 'Upload from Gallery'}
                <input type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
              </label>
              {preview && (
                <button onClick={handleRemove} className="btn-danger text-sm flex items-center gap-1 cursor-pointer">
                  <X size={14} /> Remove
                </button>
              )}
            </div>
          )}
          <p className="text-xs text-slate-500 mt-2">Supports JPG, PNG, WEBP, GIF — auto-compressed</p>
        </div>
      </div>
    </div>
  )
}
