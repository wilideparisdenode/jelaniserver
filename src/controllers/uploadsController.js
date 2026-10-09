import { supabase } from '../config/supabase.js'

// Uploads admin-selected images to a public Supabase Storage bucket and returns the URL
// to store on the course/post record. The bucket is created on first use.
const BUCKET = process.env.SUPABASE_MEDIA_BUCKET || 'media'
const MAX_BYTES = 5 * 1024 * 1024
const EXT = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
}

let bucketReady = false
async function ensureBucket() {
  if (bucketReady) return
  const { error } = await supabase.storage.getBucket(BUCKET)
  if (error) {
    const { error: createError } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: MAX_BYTES,
      allowedMimeTypes: Object.keys(EXT),
    })
    if (createError && !/already exists/i.test(createError.message)) throw createError
  }
  bucketReady = true
}

const safeFolder = (value) => String(value || 'media').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40) || 'media'

export async function uploadImage(req, res) {
  if (!req.file) return res.status(400).json({ error: { message: 'No file was uploaded.' } })
  const ext = EXT[req.file.mimetype]
  if (!ext) return res.status(400).json({ error: { message: 'Only PNG, JPEG, WebP, GIF, AVIF or SVG images are allowed.' } })

  await ensureBucket()
  const path = `${safeFolder(req.query.folder)}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, req.file.buffer, { contentType: req.file.mimetype, upsert: false })
  if (error) throw Object.assign(new Error(`Upload failed: ${error.message}`), { status: 500 })

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return res.status(201).json({ url: data.publicUrl, path })
}
