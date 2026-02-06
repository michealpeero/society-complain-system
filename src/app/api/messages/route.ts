import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { senderId, senderName, senderRole, receiverId, societyId, content, complaintId } = body

    console.log('=== Message Creation Attempt ===')
    console.log('Sender:', senderName, '(', senderRole, ')')
    console.log('Receiver:', receiverId)
    console.log('Content:', content?.substring(0, 50))

    // Validate required fields
    if (!senderId || !senderName || !senderRole || !receiverId || !societyId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create message
    const message = await db.message.create({
      data: {
        content,
        senderId,
        senderName,
        senderRole,
        receiverId,
        societyId,
        complaintId: complaintId || null,
        read: false
      }
    })

    console.log('Message created successfully:', message.id)

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        senderName: message.senderName,
        senderRole: message.senderRole,
        receiverId: message.receiverId,
        societyId: message.societyId,
        complaintId: message.complaintId,
        read: message.read,
        createdAt: message.createdAt
      }
    })
  } catch (error) {
    console.error('=== Message Creation Error ===')
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const otherUserId = searchParams.get('otherUserId')
    const societyId = searchParams.get('societyId')

    if (!userId || !otherUserId || !societyId) {
      return NextResponse.json(
        { error: 'userId, otherUserId, and societyId are required' },
        { status: 400 }
      )
    }

    // Get messages between two users (both directions)
    const messages = await db.message.findMany({
      where: {
        societyId,
        OR: [
          {
            AND: [
              { senderId: userId },
              { receiverId: otherUserId }
            ]
          },
          {
            AND: [
              { senderId: otherUserId },
              { receiverId: userId }
            ]
          }
        ]
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Mark received messages as read
    await db.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: userId,
        societyId,
        read: false
      },
      data: {
        read: true
      }
    })

    return NextResponse.json({
      success: true,
      messages
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}
