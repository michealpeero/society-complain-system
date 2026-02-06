import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Login user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, role } = body

    // Trim and validate required fields
    const trimmedEmail = email?.trim()
    const trimmedPassword = password?.trim()

    console.log('Login attempt:', {
      email: trimmedEmail,
      passwordLength: trimmedPassword?.length,
      role
    })

    if (!trimmedEmail || !trimmedPassword) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: trimmedEmail },
      include: {
        member: true,
        staff: true
      }
    })

    console.log('User found:', !!user)

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password. Please make sure you are using your complete email address (e.g., name@gmail.com)' },
        { status: 401 }
      )
    }

    console.log('Stored password:', user.password)
    console.log('Provided password:', trimmedPassword)
    console.log('Password match:', user.password === trimmedPassword)

    // Check password (in production, compare hashed passwords)
    if (user.password !== trimmedPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check role if specified
    if (role && user.role !== role) {
      return NextResponse.json(
        { error: `This account is not registered as ${role}` },
        { status: 403 }
      )
    }

    // Check if user is active
    if (user.status !== 'active') {
      return NextResponse.json(
        { error: 'This account is inactive' },
        { status: 403 }
      )
    }

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user

    console.log('Login successful for:', user.email)

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: userWithoutPassword
    })

  } catch (error) {
    console.error('Error logging in:', error)
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    )
  }
}
