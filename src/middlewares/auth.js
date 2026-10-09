import { supabase } from '../config/supabase.js'

const unauthorized = (res) => res.status(401).json({ error: { message: 'Authentication required.' } })

// Verifies a Supabase Auth access token and attaches req.user = { id, email, role, fullName }.
export async function requireUser(req, res, next) {
  const token = req.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!token) return unauthorized(res)

  try {
    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data?.user) return unauthorized(res)

    const { data: profile } = await supabase.from('profiles').select('role, full_name, phone').eq('id', data.user.id).maybeSingle()
    req.user = {
      id: data.user.id,
      email: data.user.email,
      role: profile?.role ?? 'student',
      fullName: profile?.full_name ?? null,
      phone: profile?.phone ?? null,
    }
    next()
  } catch (error) {
    next(error)
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (req.user?.role !== role) return res.status(403).json({ error: { message: 'You do not have access to this resource.' } })
    next()
  }
}

// Admin gate: valid Supabase session AND profiles.role = 'admin'.
export const requireAdmin = [requireUser, requireRole('admin')]
