import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET single complaint
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const complaint = await db.complaint.findUnique({
      where: { id: params.id },
      include: {
        society: true,
        member: true
      }
    })

    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 })
    }

    return NextResponse.json(complaint)
  } catch (error) {
    console.error('Error fetching complaint:', error)
    return NextResponse.json({ error: 'Failed to fetch complaint' }, { status: 500 })
  }
}

// PUT update complaint
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { title, description, status } = body

    const complaint = await db.complaint.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(status && { status })
      }
    })

    return NextResponse.json(complaint)
  } catch (error) {
    console.error('Error updating complaint:', error)
    return NextResponse.json({ error: 'Failed to update complaint' }, { status: 500 })
  }
}

// DELETE complaint
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.complaint.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Complaint deleted successfully' })
  } catch (error) {
    console.error('Error deleting complaint:', error)
    return NextResponse.json({ error: 'Failed to delete complaint' }, { status: 500 })
  }
}

// PATCH update complaint status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json(
        { error: 'Missing required field: status' },
        { status: 400 }
      )
    }

    const complaint = await db.complaint.update({
      where: { id: params.id },
      data: { status }
    })

    return NextResponse.json(complaint)
  } catch (error) {
    console.error('Error updating complaint status:', error)
    return NextResponse.json({ error: 'Failed to update complaint status' }, { status: 500 })
  }
}
