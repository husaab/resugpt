import { NextRequest, NextResponse } from 'next/server'

const PISTON_URL = process.env.PISTON_API_URL || 'http://localhost:2000/api/v2/execute'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const pistonRes = await fetch(PISTON_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await pistonRes.json()
    return NextResponse.json(data, { status: pistonRes.status })
  } catch {
    return NextResponse.json(
      { message: 'Code execution service unavailable' },
      { status: 502 }
    )
  }
}
