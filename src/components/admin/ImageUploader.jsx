import { useState } from 'react'
import supabase from '../../lib/supabase'
import { Upload, X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

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

    const filePath = `public/${Date.now()}_${file.name}`
    const { error } = await supabase.storage.from('products').upload(filePath, file)

    if (error) {
      toast.error('Upload failed: ' + error.message)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(filePath)
    setPreview(publicUrl)
    setUploading(false)
    onUpload(publicUrl)
    toast.success('Image uploaded')
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
            <Upload size={24} className="text-slate-500" />
          )}
        </div>
        <div className="flex-1">
          {uploading ? (
            <div className="flex items-center gap-2 text-sm text-[#F59E0B]">
              <Loader2 size={16} className="animate-spin" />
              Uploading...
            </div>
          ) : (
            <div className="flex gap-2">
              <label className="btn-secondary text-sm cursor-pointer inline-flex items-center gap-1">
                <Upload size={14} />
                {preview ? 'Change' : 'Upload'}
                <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
              </label>
              {preview && (
                <button onClick={handleRemove} className="btn-danger text-sm flex items-center gap-1 cursor-pointer">
                  <X size={14} /> Remove
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
