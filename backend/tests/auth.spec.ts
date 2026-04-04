import request from 'supertest'
import express from 'express'
import authRouter from '../src/routes/auth'
import bodyParser from 'body-parser'

const app = express()
app.use(bodyParser.json())
app.use('/api/auth', authRouter)

describe('Auth endpoints', () => {
  test('register without referral returns 201 and referral_code', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Test', email: `test+${Date.now()}@example.test`, password: 'pass123' })
    expect(res.status).toBe(201)
    expect(res.body.user.referral_code).toBeDefined()
  })
})
