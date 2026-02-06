'use client'

import { MessageSquare, Send, Minimize2, Maximize2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useEffect } from 'react'

interface ChatDialogProps {
  chatOpen: boolean
  chatMinimized: boolean
  setChatMinimized: (minimized: boolean) => void
  setChatOpen: (open: boolean) => void
  selectedChatUser: any
  currentUser: any
  chatMessages: any[]
  newMessage: string
  setNewMessage: (message: string) => void
  sendMessage: () => void
  onlineUsers: Set<string>
  messagesEndRef: React.RefObject<HTMLDivElement>
  inputRef: React.RefObject<HTMLInputElement>
}

export function ChatDialog({
  chatOpen,
  chatMinimized,
  setChatMinimized,
  setChatOpen,
  selectedChatUser,
  currentUser,
  chatMessages,
  newMessage,
  setNewMessage,
  sendMessage,
  onlineUsers,
  messagesEndRef,
  inputRef
}: ChatDialogProps) {
  // Focus input when chat opens
  useEffect(() => {
    if (chatOpen && !chatMinimized && inputRef.current) {
      inputRef.current.focus()
    }
  }, [chatOpen, chatMinimized])

  if (!chatOpen || !currentUser) return null

  return (
    <div className={`fixed bottom-4 right-4 z-50 bg-white rounded-xl shadow-2xl border border-slate-200 ${chatMinimized ? 'w-80' : 'w-96'}`}>
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-4 rounded-t-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-5 w-5" />
          <div>
            <h3 className="font-semibold">
              {selectedChatUser ? selectedChatUser.name : 'Chat'}
            </h3>
            {selectedChatUser && (
              <p className="text-xs opacity-90">
                {onlineUsers.has(selectedChatUser.id) ? '🟢 Online' : '⚫ Offline'}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 h-8 w-8"
            onClick={() => setChatMinimized(!chatMinimized)}
          >
            {chatMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 h-8 w-8"
            onClick={() => setChatOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Chat Body */}
      {!chatMinimized && (
        <>
          {/* Messages Area */}
          <div className="h-96 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {chatMessages.length === 0 ? (
              <div className="text-center text-slate-500 py-8">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No messages yet</p>
                <p className="text-sm">Start a conversation!</p>
              </div>
            ) : (
              chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.senderId === currentUser.id
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white border border-slate-200 text-slate-900'
                    }`}
                  >
                    {msg.senderId !== currentUser.id && (
                      <p className="text-xs font-semibold text-emerald-600 mb-1">
                        {msg.senderName}
                      </p>
                    )}
                    <p className="text-sm break-words">{msg.content}</p>
                    <p className={`text-xs mt-1 ${msg.senderId === currentUser.id ? 'text-white/70' : 'text-slate-500'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-slate-200">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                className="flex-1"
                autoComplete="off"
              />
              <Button
                onClick={(e) => {
                  e.preventDefault()
                  sendMessage()
                }}
                disabled={!newMessage.trim()}
                className="bg-emerald-500 hover:bg-emerald-600"
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
