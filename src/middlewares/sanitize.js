// Plain-text sanitizer: strips HTML tags WITHOUT HTML-encoding entities.
// The previous sanitize-html approach encoded `&` as `&amp;`, which corrupted
// image URLs (e.g. `?w=900&q=80` -> `&amp;`) and any text containing ampersands.
// All output is rendered as text by React, so tag-stripping is sufficient here.
const TAG = /<\/?[a-z][^>]*>/gi

const stripTags = (value) => value.replace(TAG, '').trim()

export function sanitizeText(value) {
  if (typeof value === 'string') return stripTags(value)
  if (Array.isArray(value)) return value.map(sanitizeText)
  // Plain objects (e.g. jsonb career pathways / quiz questions) are sanitized recursively.
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, sanitizeText(nested)]))
  return value
}

export function sanitizeFields(fields) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, sanitizeText(value)]))
}
