import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET all notices
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const societyId = searchParams.get('societyId')
    const priority = searchParams.get('priority')

    const where: any = {}
    if (societyId) where.societyId = societyId
    if (priority) where.priority = priority

    const notices = await db.notice.findMany({
      where,
      include: {
        society: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(notices)
  } catch (error) {
    console.error('Error fetching notices:', error)
    return NextResponse.json({ error: 'Failed to fetch notices' }, { status: 500 })
  }
}

// POST create new notice
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, priority = 'medium', societyId } = body

    if (!title || !description || !societyId) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, societyId' },
        { status: 400 }
      )
    }

    const notice = await db.notice.create({
      data: {
        title,
        description,
        priority,
        date: new Date().toISOString().split('T')[0],
        societyId
      }
    })

    return NextResponse.json(notice, { status: 201 })
  } catch (error) {
    console.error('Error creating notice:', error)
    return NextResponse.json({ error: 'Failed to create notice' }, { status: 500 })
  }
}
