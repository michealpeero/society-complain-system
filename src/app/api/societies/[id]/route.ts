import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET single society
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const society = await db.society.findUnique({
      where: { id: params.id },
      include: {
        members: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        events: {
          orderBy: {
            date: 'asc'
          }
        },
        notices: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        complaints: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        payments: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!society) {
      return NextResponse.json({ error: 'Society not found' }, { status: 404 })
    }

    return NextResponse.json(society)
  } catch (error) {
    console.error('Error fetching society:', error)
    return NextResponse.json({ error: 'Failed to fetch society' }, { status: 500 })
  }
}

// PUT update society
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, address, city, state, pincode } = body

    const society = await db.society.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(address && { address }),
        ...(city && { city }),
        ...(state && { state }),
        ...(pincode && { pincode })
      }
    })

    return NextResponse.json(society)
  } catch (error) {
    console.error('Error updating society:', error)
    return NextResponse.json({ error: 'Failed to update society' }, { status: 500 })
  }
}

// DELETE society
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.society.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Society deleted successfully' })
  } catch (error) {
    console.error('Error deleting society:', error)
    return NextResponse.json({ error: 'Failed to delete society' }, { status: 500 })
  }
}
