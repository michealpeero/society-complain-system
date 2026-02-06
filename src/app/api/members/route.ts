import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET all members
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const societyId = searchParams.get('societyId')

    const where = societyId ? { societyId } : {}

    const members = await db.member.findMany({
      where,
      include: {
        society: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      members
    })
  } catch (error) {
    console.error('Error fetching members:', error)
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
  }
}

// POST create new member
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, flat, phone, email, status = 'active', societyId } = body

    if (!name || !flat || !phone || !societyId) {
      return NextResponse.json(
        { error: 'Missing required fields: name, flat, phone, societyId' },
        { status: 400 }
      )
    }

    const member = await db.member.create({
      data: {
        name,
        flat,
        phone,
        email,
        status,
        societyId
      }
    })

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error('Error creating member:', error)
    return NextResponse.json({ error: 'Failed to create member' }, { status: 500 })
  }
}
