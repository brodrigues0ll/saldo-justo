import { NextResponse } from 'next/server'

export function jsonOk(data, status = 200) {
  return NextResponse.json(data, { status })
}

export function jsonError(message, status = 400) {
  return NextResponse.json({ error: message }, { status })
}
