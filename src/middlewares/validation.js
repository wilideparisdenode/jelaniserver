import { validationResult } from 'express-validator'

export function validateRequest(req, res, next) {
  const result = validationResult(req)
  if (!result.isEmpty()) {
    return res.status(400).json({ error: { message: 'Please check the submitted fields.', details: result.array().map(({ path, msg }) => ({ field: path, message: msg })) } })
  }
  next()
}
