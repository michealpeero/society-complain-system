import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Register new resident
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, phone, flat, block } = body

    console.log('=== Registration Attempt ===')
    console.log('Received data:', body)
    console.log('Fields check:', {
      name: !!name,
      email: !!email,
      password: !!password,
      phone: !!phone,
      flat: !!flat,
      block: !!block
    })

    // Validate required fields
    if (!name || !email || !password || !phone || !flat || !block) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, password, phone, flat, block' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      console.log('User already exists with email:', email)
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
      console.log('Created new society:', society.id)
    } else {
      console.log('Using existing society:', society.id)
    }

    // Create user
    const user = await db.user.create({
      data: {
        email,
        password, // In production, hash this password!
        name,
        phone,
        role: 'resident',
        societyId: society.id
      }
    })

    console.log('Created user:', user.id)

    // Create member profile
    const member = await db.member.create({
      data: {
        name,
        email,
        phone,
        flat: `${block}-${flat}`,
        societyId: society.id,
        userId: user.id
      }
    })

    console.log('Created member:', member.id)
    console.log('=== Registration Successful ===')

    return NextResponse.json({
      success: true,
      message: 'Resident registered successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      member
    }, { status: 201 })

  } catch (error) {
    console.error('=== Registration Error ===')
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Failed to register resident' },
      { status: 500 }
    )
  }
}
