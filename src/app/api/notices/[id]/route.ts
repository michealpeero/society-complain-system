import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET single notice
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const notice = await db.notice.findUnique({
      where: { id: params.id },
      include: {
        society: true
      }
    })

    if (!notice) {
      return NextResponse.json({ error: 'Notice not found' }, { status: 404 })
    }

    return NextResponse.json(notice)
  } catch (error) {
    console.error('Error fetching notice:', error)
    return NextResponse.json({ error: 'Failed to fetch notice' }, { status: 500 })
  }
}

// PUT update notice
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { title, description, priority } = body

    const notice = await db.notice.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(priority && { priority })
      }
    })

    return NextResponse.json(notice)
  } catch (error) {
    console.error('Error updating notice:', error)
    return NextResponse.json({ error: 'Failed to update notice' }, { status: 500 })
  }
}

// DELETE notice
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.notice.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Notice deleted successfully' })
  } catch (error) {
    console.error('Error deleting notice:', error)
    return NextResponse.json({ error: 'Failed to delete notice' }, { status: 500 })
  }
}
