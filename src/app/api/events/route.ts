import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET all events
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const societyId = searchParams.get('societyId')
    const status = searchParams.get('status')

    const where: any = {}
    if (societyId) where.societyId = societyId
    if (status) where.status = status

    const events = await db.event.findMany({
      where,
      include: {
        society: true
      },
      orderBy: {
        date: 'asc'
      }
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}

// POST create new event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, date, time, location, description, status = 'upcoming', societyId } = body

    if (!title || !date || !time || !location || !societyId) {
      return NextResponse.json(
        { error: 'Missing required fields: title, date, time, location, societyId' },
        { status: 400 }
      )
    }

    const event = await db.event.create({
      data: {
        title,
        date,
        time,
        location,
        description,
        status,
        societyId
      }
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}
