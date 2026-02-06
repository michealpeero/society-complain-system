import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userIds = searchParams.get('ids')

    if (!userIds) {
      return NextResponse.json(
        { error: 'ids parameter is required' },
        { status: 400 }
      )
    }

    const idArray = userIds.split(',')

    // Fetch users with their member or staff info
    const users = await db.user.findMany({
      where: {
        id: { in: idArray }
      },
      include: {
        member: true,
        staff: true
      }
    })

    // Format user data
    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      member: user.member ? {
        id: user.member.id,
        flat: user.member.flat
      } : null,
      staff: user.staff ? {
        id: user.staff.id,
        role: user.staff.role,
        department: user.staff.department
      } : null
    }))

    return NextResponse.json({
      success: true,
      users: formattedUsers
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
