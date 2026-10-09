import { matchedData } from 'express-validator'
import { supabase } from '../config/supabase.js'
import { sanitizeFields } from '../middlewares/sanitize.js'
import { unwrap } from './dbError.js'

// Builds list/create/update/remove handlers for a simple table.
//   table:   Supabase table name
//   options: { order: [column, {ascending}], publicFilter: {col: value}, select: string }
export function createCrud(table, { order = ['created_at', { ascending: false }], publicFilter, select = '*' } = {}) {
  return {
    listPublic: async (req, res) => {
      let query = supabase.from(table).select(select).order(...order)
      if (publicFilter) query = query.match(publicFilter)
      return res.json({ items: unwrap(await query) })
    },
    listAll: async (req, res) => {
      return res.json({ items: unwrap(await supabase.from(table).select(select).order(...order)) })
    },
    create: async (req, res) => {
      const input = sanitizeFields(matchedData(req, { locations: ['body'] }))
      return res.status(201).json({ item: unwrap(await supabase.from(table).insert(input).select(select).single()) })
    },
    update: async (req, res) => {
      const { id } = matchedData(req, { locations: ['params'] })
      const input = sanitizeFields(matchedData(req, { locations: ['body'] }))
      return res.json({ item: unwrap(await supabase.from(table).update(input).eq('id', id).select(select).single(), 'Not found.') })
    },
    remove: async (req, res) => {
      const { id } = matchedData(req, { locations: ['params'] })
      unwrap(await supabase.from(table).delete().eq('id', id))
      return res.status(204).end()
    },
  }
}
