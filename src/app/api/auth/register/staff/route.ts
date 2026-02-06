import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Register new staff
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, phone, role, department } = body

    // Validate required fields
    if (!name || !email || !password || !phone || !role || !department) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, password, phone, role, department' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Create or get default society
    let society = await db.society.findFirst()
    if (!society) {
      society = await db.society.create({
        data: {
          name: 'Default Society',
          address: 'Society Address',
          city: 'City',
          state: 'State',
          pincode: '123456'
        }
      })
    }

    // Create user
    const user = await db.user.create({
      data: {
        email,
        password, // In production, hash this password!
        name,
        phone,
        role: 'staff',
        societyId: society.id
      }
    })

    // Create staff profile
    const staff = await db.staff.create({
      data: {
        name,
        email,
        phone,
        role,
        department,
        societyId: society.id,
        userId: user.id
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Staff registered successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      staff
    }, { status: 201 })

  } catch (error) {
    console.error('Error registering staff:', error)
    return NextResponse.json(
      { error: 'Failed to register staff' },
      { status: 500 }
    )
  }
}
