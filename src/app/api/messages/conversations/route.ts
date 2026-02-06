import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const societyId = searchParams.get('societyId')

    if (!userId || !societyId) {
      return NextResponse.json(
        { error: 'userId and societyId are required' },
        { status: 400 }
      )
    }

    // Get all messages where user is sender or receiver
    const messages = await db.message.findMany({
      where: {
        societyId,
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Extract unique conversation partners
    const partners = new Map<string, any>()

    for (const message of messages) {
      const partnerId = message.senderId === userId ? message.receiverId : message.senderId
      const partnerName = message.senderId === userId ? '' : message.senderName
      const partnerRole = message.senderId === userId ? '' : message.senderRole

      if (!partners.has(partnerId)) {
        partners.set(partnerId, {
          id: partnerId,
          name: partnerName,
          role: partnerRole,
          lastMessage: message.content,
          lastMessageTime: message.createdAt,
          unreadCount: 0
        })
      }

      // Count unread messages (messages received from this partner)
      if (message.receiverId === userId && !message.read) {
        const partner = partners.get(partnerId)
        if (partner) {
          partner.unreadCount++
        }
      }
    }

    // Convert to array and sort by last message time
    const conversations = Array.from(partners.values()).sort(
      (a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    )

    return NextResponse.json({
      success: true,
      conversations
    })
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}
