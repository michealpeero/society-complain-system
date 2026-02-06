import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET all payments
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const societyId = searchParams.get('societyId')
    const memberId = searchParams.get('memberId')
    const status = searchParams.get('status')

    const where: any = {}
    if (societyId) where.societyId = societyId
    if (memberId) where.memberId = memberId
    if (status) where.status = status

    const payments = await db.payment.findMany({
      where,
      include: {
        society: true,
        member: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(payments)
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}

// POST create new payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, type = 'Maintenance', date, status = 'paid', societyId, memberId } = body

    if (!amount || !societyId || !memberId) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, societyId, memberId' },
        { status: 400 }
      )
    }

    const payment = await db.payment.create({
      data: {
        amount: parseFloat(amount),
        type,
        date: date || new Date().toISOString().split('T')[0],
        status,
        societyId,
        memberId
      }
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 })
  }
}
