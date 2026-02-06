import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const societyId = searchParams.get('societyId')
    const category = searchParams.get('category')

    if (!societyId) {
      return NextResponse.json(
        { success: false, error: 'Society ID is required' },
        { status: 400 }
      )
    }

    // Build the where clause
    const whereClause: any = {
      societyId,
      status: 'active'
    }

    // If category is specified, filter by role
    if (category) {
      whereClause.role = category
    }

    // Fetch staff based on filters
    const staff = await db.staff.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      staff: staff.map(s => ({
        id: s.id,
        userId: s.user.id,
        name: s.name,
        role: s.role,
        department: s.department,
        email: s.user.email,
        phone: s.user.phone,
        joinDate: s.joinDate
      }))
    })
  } catch (error) {
    console.error('Error fetching staff:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch staff' },
      { status: 500 }
    )
  }
}
