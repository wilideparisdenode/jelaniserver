// Convert a Supabase/PostgREST error into an Express error with an HTTP status.
const CODE_STATUS = { '23505': 409, '23503': 409, '23514': 400, '22P02': 400, PGRST116: 404 }

export function unwrap({ data, error }, notFoundMessage) {
  if (error) {
    const status = CODE_STATUS[error.code] ?? 500
    const message = error.code === '23505' ? 'That record already exists.'
      : error.code === '23503' ? 'This record is referenced by other data.'
      : error.code === 'PGRST116' ? (notFoundMessage || 'Not found.')
      : error.message
    throw Object.assign(new Error(message), { status })
  }
  if (data === null && notFoundMessage) throw Object.assign(new Error(notFoundMessage), { status: 404 })
  return data
}
