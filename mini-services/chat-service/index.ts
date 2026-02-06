import { createServer } from 'http'
import { Server } from 'socket.io'

const httpServer = createServer()
const io = new Server(httpServer, {
  // DO NOT change the path, it is used by Caddy to forward the request to the correct port
  path: '/',
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000,
})

// Store online users
const onlineUsers = new Map<string, { userId: string; name: string; role: string; societyId: string }>()

interface SendMessageData {
  senderId: string
  senderName: string
  senderRole: string
  receiverId: string
  societyId: string
  content: string
  complaintId?: string
}

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`)

  // User joins with their info
  socket.on('user:join', (data: { userId: string; name: string; role: string; societyId: string }) => {
    const { userId, name, role, societyId } = data

    // Store user info
    onlineUsers.set(socket.id, { userId, name, role, societyId })

    // Join user's personal room for direct messages
    socket.join(userId)

    console.log(`User ${name} (${role}) joined - Online: ${onlineUsers.size}`)

    // Notify about online status
    io.emit('user:online', { userId, name, role, societyId })
  })

  // Send message to specific user (real-time delivery only)
  socket.on('message:send', (data: SendMessageData) => {
    const { senderId, senderName, senderRole, receiverId, societyId, content, complaintId } = data

    console.log(`Message: ${senderName} -> User(${receiverId}): ${content}`)

    // Send to receiver if online
    const receiverSocket = Array.from(onlineUsers.entries()).find(([_, user]) => user.userId === receiverId)

    if (receiverSocket) {
      io.to(receiverId).emit('message:receive', {
        content,
        senderId,
        senderName,
        senderRole,
        complaintId,
        timestamp: new Date().toISOString()
      })
    }

    // Send confirmation to sender
    socket.emit('message:sent', {
      receiverId,
      timestamp: new Date().toISOString()
    })
  })

  // Mark messages as read
  socket.on('messages:read', (data: { senderId: string; receiverId: string; societyId: string }) => {
    const { senderId, receiverId } = data

    console.log(`Messages marked as read: ${senderId} -> ${receiverId}`)

    // Notify sender that messages were read
    io.to(senderId).emit('messages:read-confirm', { receiverId })
  })

  // Get user info
  socket.on('user:info', (userId: string) => {
    const user = Array.from(onlineUsers.values()).find(u => u.userId === userId)
    if (user) {
      socket.emit('user:info-response', user)
    } else {
      socket.emit('user:info-response', null)
    }
  })

  // Disconnect
  socket.on('disconnect', () => {
    const user = onlineUsers.get(socket.id)

    if (user) {
      onlineUsers.delete(socket.id)
      console.log(`User ${user.name} disconnected - Online: ${onlineUsers.size}`)

      // Notify about offline status
      io.emit('user:offline', { userId: user.userId, societyId: user.societyId })
    } else {
      console.log(`User disconnected: ${socket.id}`)
    }
  })

  socket.on('error', (error) => {
    console.error(`Socket error (${socket.id}):`, error)
  })
})

const PORT = 3003
httpServer.listen(PORT, () => {
  console.log(`Chat service running on port ${PORT}`)
})

// Graceful shutdown
const shutdown = () => {
  console.log('Shutting down chat service...')
  httpServer.close(() => {
    console.log('Chat service closed')
    process.exit(0)
  })
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
