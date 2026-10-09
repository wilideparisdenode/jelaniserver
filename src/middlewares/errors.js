export function notFound(req, res) {
  res.status(404).json({ error: { message: 'Route not found.' } })
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error)
  if (error?.name === 'MulterError') {
    const message = error.code === 'LIMIT_FILE_SIZE' ? 'Image is too large (maximum 5MB).' : 'Upload failed.'
    return res.status(400).json({ error: { message } })
  }
  const status = Number.isInteger(error.status) ? error.status : 500
  const message = status < 500 ? error.message : 'An unexpected server error occurred.'
  if (status >= 500) console.error(error)
  return res.status(status).json({ error: { message } })
}