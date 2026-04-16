import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { code } = await req.json()
  if (code === process.env.TEACHER_PASSWORD) {
    return NextResponse.json({ valid: true })
  }
  return NextResponse.json({ valid: false })
}
