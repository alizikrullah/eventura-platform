import { Request, Response } from 'express'
import * as authService from '../services/authService'

export async function register(req: Request, res: Response) {
  try {
    const payload = req.body
    const result = await authService.register(payload)
    return res.status(201).json(result)
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Bad Request' })
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body
    const result = await authService.login(email, password)
    return res.json(result)
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Bad Request' })
  }
}
