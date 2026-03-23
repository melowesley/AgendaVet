import { isAdmin } from '@/lib/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const adminOk = await isAdmin()
  return NextResponse.json({ isAdmin: adminOk })
}
