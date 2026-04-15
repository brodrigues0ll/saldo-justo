import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import { jsonError } from '@/lib/api-helpers'

export async function POST(request) {
  const body = await request.json().catch(() => null)

  if (!body) return jsonError('Dados inválidos', 400)

  const { name, email, password } = body

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return jsonError('Nome deve ter pelo menos 2 caracteres', 422)
  }

  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return jsonError('Email inválido', 422)
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return jsonError('Senha deve ter pelo menos 6 caracteres', 422)
  }

  await connectDB()

  const existing = await User.findOne({ email: email.toLowerCase().trim() })
  if (existing) {
    return jsonError('Este email já está cadastrado', 409)
  }

  const hash = await bcrypt.hash(password, 12)

  await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: hash,
  })

  return NextResponse.json({ ok: true }, { status: 201 })
}
