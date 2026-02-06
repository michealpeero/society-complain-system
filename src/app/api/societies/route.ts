import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET all societies
export async function GET() {
  try {
    const societies = await db.society.findMany({
      include: {
        members: true,
        events: true,
        notices: true,
        complaints: true,
        payments: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(societies)
  } catch (error) {
    console.error('Error fetching societies:', error)
    return NextResponse.json({ error: 'Failed to fetch societies' }, { status: 500 })
  }
}

// POST create new society
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, address, city, state, pincode } = body

    if (!name || !address || !city || !state || !pincode) {
      return NextResponse.json(
        { error: 'Missing required fields: name, address, city, state, pincode' },
        { status: 400 }
      )
    }

    const society = await db.society.create({
      data: {
        name,
        address,
        city,
        state,
        pincode
      }
    })

    return NextResponse.json(society, { status: 201 })
  } catch (error) {
    console.error('Error creating society:', error)
    return NextResponse.json({ error: 'Failed to create society' }, { status: 500 })
  }
}
