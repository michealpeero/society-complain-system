import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const staffId = searchParams.get('staffId')

    if (!staffId) {
      return NextResponse.json(
        { error: 'staffId is required' },
        { status: 400 }
      )
    }

    // Get staff and user info
    const staff = await db.staff.findUnique({
      where: { id: staffId },
      include: {
        user: true
      }
    })

    if (!staff) {
      return NextResponse.json(
        { error: 'Staff not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      staffUser: {
        id: staff.user.id,
        name: staff.user.name,
        email: staff.user.email,
        phone: staff.user.phone,
        role: staff.user.role,
        staff: {
          id: staff.id,
          role: staff.role,
          department: staff.department
        }
      }
    })
  } catch (error) {
    console.error('Error fetching staff user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch staff user' },
      { status: 500 }
    )
  }
}
