// Turn arbitrary text into a URL-safe slug: lowercase, accents stripped, non-alphanumerics
// collapsed to single hyphens. Used to auto-generate course ids and category slugs.
export function slugify(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}
