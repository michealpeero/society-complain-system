'use client'

import { useState, useEffect, useRef } from 'react'
import { Building2, Users, Shield, ArrowRight, CheckCircle, LogIn, Upload, X, Plus, MessageSquare, Send } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ChatDialog } from '@/components/ChatDialog'
import { io, Socket } from 'socket.io-client'

export default function Home() {
  const [currentView, setCurrentView] = useState<'home' | 'resident-register' | 'staff-register' | 'admin-dashboard' | 'resident-dashboard' | 'staff-dashboard' | 'complaints-list'>('home')
  const [adminCredentials, setAdminCredentials] = useState({ email: '', password: '' })
  const [residentData, setResidentData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    flat: '',
    block: ''
  })
  const [staffData, setStaffData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: '',
    department: ''
  })
  const [residentLoginCredentials, setResidentLoginCredentials] = useState({ email: '', password: '' })
  const [staffLoginCredentials, setStaffLoginCredentials] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [residentShowLogin, setResidentShowLogin] = useState(false)
  const [staffShowLogin, setStaffShowLogin] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [complaintData, setComplaintData] = useState({
    title: '',
    description: '',
    category: '',
    preferredStaffId: ''
  })
  const [complaintPhotos, setComplaintPhotos] = useState<File[]>([])
  const [userComplaints, setUserComplaints] = useState<any[]>([])
  const [staffComplaints, setStaffComplaints] = useState<any[]>([])
  const [staffPhotos, setStaffPhotos] = useState<Record<string, File[]>>({})
  const [loadingComplaints, setLoadingComplaints] = useState(false)
  const [staffList, setStaffList] = useState<any[]>([])
  const [loadingStaff, setLoadingStaff] = useState(false)
  const [selectedStaffForChat, setSelectedStaffForChat] = useState<any>(null)
  const [adminComplaints, setAdminComplaints] = useState<any[]>([])
  const [totalResidents, setTotalResidents] = useState(0)
  const [totalStaff, setTotalStaff] = useState(0)
  const [pendingRequests, setPendingRequests] = useState(0)

  // Chat state
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMinimized, setChatMinimized] = useState(false)
  const [selectedChatUser, setSelectedChatUser] = useState<any>(null)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [conversations, setConversations] = useState<any[]>([])
  const [socket, setSocket] = useState<Socket | null>(null)
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleAdminLogin = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: adminCredentials.email,
          password: adminCredentials.password,
          role: 'admin'
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setCurrentView('admin-dashboard')
        alert('Admin login successful!')
      } else {
        alert(data.error || 'Login failed! Try: admin@society.com / admin123')
      }
    } catch (error) {
      alert('Login failed! Try: admin@society.com / admin123')
    } finally {
      setLoading(false)
    }
  }

  const handleResidentRegister = async () => {
    if (!residentData.name) {
      alert('Please enter your name')
      return
    }
    if (!residentData.email) {
      alert('Please enter your email')
      return
    }
    if (!residentData.password) {
      alert('Please enter a password')
      return
    }
    if (!residentData.phone) {
      alert('Please enter your phone number')
      return
    }
    if (!residentData.flat) {
      alert('Please enter your flat number')
      return
    }
    if (!residentData.block) {
      alert('Please enter your block number')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/auth/register/resident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(residentData)
      })

      const data = await response.json()

      if (response.ok && data.success) {
        alert(`Resident registered successfully!\n\nLogin Email: ${residentData.email}\nPassword: ${residentData.password}\n\nUse this complete email address to login.`)
        setResidentData({ name: '', email: '', phone: '', flat: '', block: '', password: '' })
        setCurrentView('home')
      } else {
        alert(data.error || 'Registration failed')
      }
    } catch (error) {
      alert('Registration failed! Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResidentLogin = async () => {
    if (!residentLoginCredentials.email || !residentLoginCredentials.password) {
      alert('Please enter email and password')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: residentLoginCredentials.email,
          password: residentLoginCredentials.password,
          role: 'resident'
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        alert('Resident login successful!')
        setCurrentUser(data.user)
        setResidentLoginCredentials({ email: '', password: '' })
        setCurrentView('resident-dashboard')
      } else {
        alert(data.error || 'Login failed')
      }
    } catch (error) {
      alert('Login failed! Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleFetchComplaints = async () => {
    if (!currentUser || !currentUser.member) {
      alert('User information not found')
      return
    }

    setLoadingComplaints(true)
    try {
      const response = await fetch(`/api/complaints?memberId=${currentUser.member.id}&societyId=${currentUser.societyId}`)
      const data = await response.json()

      if (response.ok && data.success) {
        setUserComplaints(data.complaints)
        setCurrentView('complaints-list')
      } else {
        alert(data.error || 'Failed to fetch complaints')
      }
    } catch (error) {
      alert('Failed to fetch complaints! Please try again.')
    } finally {
      setLoadingComplaints(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'closed':
        return 'bg-gray-100 text-gray-800 border-gray-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return '⏳'
      case 'in-progress':
        return '🔄'
      case 'resolved':
        return '✅'
      case 'rejected':
        return '❌'
      case 'closed':
        return '🔒'
      default:
        return '📋'
    }
  }

  // Fetch staff complaints when staff dashboard is loaded
  useEffect(() => {
    if (currentView === 'staff-dashboard' && currentUser?.staff) {
      handleFetchStaffComplaints()
    }
  }, [currentView])

  const handleStaffRegister = async () => {
    if (!staffData.password) {
      alert('Please enter a password')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/auth/register/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffData)
      })

      const data = await response.json()

      if (response.ok && data.success) {
        alert(`Staff registered successfully!\n\nLogin Email: ${staffData.email}\nPassword: ${staffData.password}\n\nUse this complete email address to login.`)
        setStaffData({ name: '', email: '', phone: '', role: '', department: '', password: '' })
        setCurrentView('home')
      } else {
        alert(data.error || 'Registration failed')
      }
    } catch (error) {
      alert('Registration failed! Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleStaffLogin = async () => {
    if (!staffLoginCredentials.email || !staffLoginCredentials.password) {
      alert('Please enter email and password')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: staffLoginCredentials.email,
          password: staffLoginCredentials.password,
          role: 'staff'
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setCurrentUser({ ...data.user, staff: data.user.staff })
        alert('Staff login successful!')
        setStaffLoginCredentials({ email: '', password: '' })
        setCurrentView('staff-dashboard')
      } else {
        alert(data.error || 'Login failed')
      }
    } catch (error) {
      alert('Login failed! Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleComplaintSubmit = async () => {
    if (!complaintData.title || !complaintData.description || !complaintData.category) {
      alert('Please fill in all fields')
      return
    }

    if (!currentUser || !currentUser.member) {
      alert('User information not found')
      return
    }

    setLoading(true)
    try {
      // Upload photos if any
      const photoUrls: string[] = []
      
      if (complaintPhotos.length > 0) {
        for (const photo of complaintPhotos) {
          const formData = new FormData()
          formData.append('file', photo)
          
          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          })
          
          const uploadData = await uploadResponse.json()
          if (uploadData.success) {
            photoUrls.push(uploadData.url)
          }
        }
      }

      // Create complaint
      const response = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: complaintData.title,
          description: complaintData.description,
          category: complaintData.category,
          photos: photoUrls,
          memberId: currentUser.member.id,
          societyId: currentUser.societyId,
          submitter: currentUser.name,
          preferredStaffId: complaintData.preferredStaffId || null
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        alert('Complaint submitted successfully!')
        setComplaintData({ title: '', description: '', category: '', preferredStaffId: '' })
        setComplaintPhotos([])
        setStaffList([])
        setSelectedStaffForChat(null)
      } else {
        alert(data.error || 'Failed to submit complaint')
      }
    } catch (error) {
      alert('Failed to submit complaint! Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    if (complaintPhotos.length + files.length > 5) {
      alert('Maximum 5 photos allowed')
      return
    }
    
    setComplaintPhotos([...complaintPhotos, ...files])
  }

  const removePhoto = (index: number) => {
    setComplaintPhotos(complaintPhotos.filter((_, i) => i !== index))
  }

  const handleFetchStaffComplaints = async () => {
    if (!currentUser || !currentUser.staff) {
      return
    }

    setLoadingComplaints(true)
    try {
      const response = await fetch(
        `/api/complaints?societyId=${currentUser.societyId}&category=${currentUser.staff.role}`
      )

      const data = await response.json()

      if (response.ok && data.success) {
        setStaffComplaints(data.complaints)
      } else {
        alert(data.error || 'Failed to fetch complaints')
      }
    } catch (error) {
      alert('Failed to fetch complaints! Please try again.')
    } finally {
      setLoadingComplaints(false)
    }
  }

  const handleStaffPhotoUpload = (complaintId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    if (staffPhotos[complaintId]?.length + files.length > 5) {
      alert('Maximum 5 photos allowed')
      return
    }
    
    setStaffPhotos(prev => ({
      ...prev,
      [complaintId]: [...(prev[complaintId] || []), ...files]
    }))

    // Clear input to allow re-selecting same files
    e.target.value = ''
  }

  const removeStaffPhoto = (complaintId: string, index: number) => {
    setStaffPhotos(prev => ({
      ...prev,
      [complaintId]: prev[complaintId]?.filter((_, i) => i !== index) || []
    }))
  }

  const handleUploadStaffPhotos = async (complaintId: string) => {
    const photos = staffPhotos[complaintId] || []
    
    if (photos.length === 0) {
      alert('Please select at least one photo')
      return
    }

    try {
      // Upload all photos
      const photoUrls: string[] = []
      
      for (const photo of photos) {
        const formData = new FormData()
        formData.append('file', photo)
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })
        
        const uploadData = await uploadResponse.json()
        if (uploadData.success) {
          photoUrls.push(uploadData.url)
        }
      }

      // Update complaint with staff photos
      const response = await fetch('/api/complaints', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaintId,
          status: 'in-progress',
          staffId: currentUser?.staff?.id,
          staffName: currentUser?.staff?.name,
          staffPhotos: photoUrls
        })
      })

      const data = await response.json()

      if (data.success) {
        // Clear photos
        setStaffPhotos(prev => ({ ...prev, [complaintId]: [] }))
        // Refresh complaints
        handleFetchStaffComplaints()
        alert('✅ Photos uploaded successfully!')
      } else {
        alert('❌ Failed to upload photos')
      }
    } catch (error) {
      alert('❌ Failed to upload photos!')
    }
  }

  const handleUpdateComplaintStatus = async (complaintId: string, newStatus: string) => {
    try {
      const requestData = {
        complaintId,
        status: newStatus,
        // Pass staff ID and name if status is in-progress
        ...(newStatus === 'in-progress' && currentUser?.staff ? {
          staffId: currentUser.staff.id,
          staffName: currentUser.staff.name
        } : {})
      }

      const response = await fetch('/api/complaints', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })

      const data = await response.json()

      if (data.success) {
        // Refresh complaints list
        handleFetchStaffComplaints()
        
        // Show alert when staff takes the complaint
        if (newStatus === 'in-progress' && currentUser?.staff) {
          alert(`✅ ${currentUser.staff.name} ne yeh complaint le li hai!`)
        } else {
          alert('✅ Complaint status updated successfully!')
        }
      } else {
        alert('❌ Failed to update status')
      }
    } catch (error) {
      alert('❌ Failed to update status!')
    }
  }

  const handleFetchStaffByCategory = async (category: string) => {
    if (!category || !currentUser?.societyId) {
      setStaffList([])
      return
    }

    setLoadingStaff(true)
    try {
      const response = await fetch(
        `/api/staff?societyId=${currentUser.societyId}&category=${category}`
      )
      const data = await response.json()

      if (response.ok && data.success) {
        setStaffList(data.staff || [])
      } else {
        setStaffList([])
      }
    } catch (error) {
      console.error('Error fetching staff:', error)
      setStaffList([])
    } finally {
      setLoadingStaff(false)
    }
  }

  // Chat Dialog Component
  // Chat functions
  useEffect(() => {
    if (currentUser && (currentUser.member || currentUser.staff)) {
      // Connect to chat service
      const socketInstance = io('/?XTransformPort=3003')

      socketInstance.on('connect', () => {
        console.log('Connected to chat service')

        // Join with user info
        socketInstance.emit('user:join', {
          userId: currentUser.id,
          name: currentUser.name,
          role: currentUser.role,
          societyId: currentUser.societyId
        })
      })

      // Listen for incoming messages
      socketInstance.on('message:receive', (data) => {
        if (selectedChatUser && data.senderId === selectedChatUser.id) {
          setChatMessages(prev => [...prev, data])
        }
        // Refresh conversations
        fetchConversations()
      })

      // Listen for online users
      socketInstance.on('user:online', (data) => {
        setOnlineUsers(prev => new Set(prev).add(data.userId))
      })

      socketInstance.on('user:offline', (data) => {
        setOnlineUsers(prev => {
          const newSet = new Set(prev)
          newSet.delete(data.userId)
          return newSet
        })
      })

      setSocket(socketInstance)

      // Fetch conversations
      fetchConversations()

      return () => {
        socketInstance.disconnect()
      }
    }
  }, [currentUser])

  const handleFetchAdminComplaints = async () => {
    setLoadingComplaints(true)
    try {
      const response = await fetch('/api/complaints?societyId=default-society')
      const data = await response.json()

      if (response.ok && data.success) {
        setAdminComplaints(data.complaints || [])
        // Count pending requests
        const pending = (data.complaints || []).filter((c: any) => c.status === 'pending').length
        setPendingRequests(pending)
      }
    } catch (error) {
      console.error('Error fetching complaints:', error)
      alert('Failed to fetch complaints')
    } finally {
      setLoadingComplaints(false)
    }
  }

  const handleFetchAdminStats = async () => {
    try {
      // Fetch total residents
      const residentsRes = await fetch('/api/members?societyId=default-society')
      const residentsData = await residentsRes.json()
      if (residentsData.success) {
        setTotalResidents(residentsData.members?.length || 0)
      }

      // Fetch total staff
      const staffRes = await fetch('/api/staff?societyId=default-society')
      const staffData = await staffRes.json()
      if (staffData.success) {
        setTotalStaff(staffData.staff?.length || 0)
      }

      // Fetch complaints for pending count
      const complaintsRes = await fetch('/api/complaints?societyId=default-society')
      const complaintsData = await complaintsRes.json()
      if (complaintsData.success) {
        const pending = (complaintsData.complaints || []).filter((c: any) => c.status === 'pending').length
        setPendingRequests(pending)
        setAdminComplaints(complaintsData.complaints || [])
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error)
    }
  }

  const handleCloseComplaint = async (complaintId: string) => {
    try {
      const response = await fetch('/api/complaints', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaintId,
          status: 'closed'
        })
      })

      const data = await response.json()

      if (data.success) {
        alert('Complaint closed successfully!')
        handleFetchAdminComplaints()
      } else {
        alert('Failed to close complaint')
      }
    } catch (error) {
      alert('Failed to close complaint')
    }
  }

  useEffect(() => {
    // Scroll to bottom of messages
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // Fetch admin complaints
  useEffect(() => {
    if (currentView === 'admin-dashboard') {
      handleFetchAdminStats()
    }
  }, [currentView])

  const fetchConversations = async () => {
    if (!currentUser || !currentUser.societyId) return

    try {
      const response = await fetch(
        `/api/messages/conversations?userId=${currentUser.id}&societyId=${currentUser.societyId}`
      )
      const data = await response.json()

      if (data.success) {
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    }
  }

  const fetchChatMessages = async (otherUserId: string) => {
    if (!currentUser || !currentUser.societyId) return

    try {
      const response = await fetch(
        `/api/messages?userId=${currentUser.id}&otherUserId=${otherUserId}&societyId=${currentUser.societyId}`
      )
      const data = await response.json()

      if (data.success) {
        setChatMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const openChat = (user: any) => {
    console.log('Opening chat with user:', user)
    console.log('Current user:', currentUser)
    setSelectedChatUser(user)
    setChatOpen(true)
    setChatMinimized(false)
    fetchChatMessages(user.id)
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChatUser || !currentUser) return

    const messageData = {
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      receiverId: selectedChatUser.id,
      societyId: currentUser.societyId,
      content: newMessage.trim()
    }

    try {
      // Save to database via API
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData)
      })

      const data = await response.json()

      if (data.success) {
        // Send via socket for real-time delivery
        socket?.emit('message:send', messageData)

        // Add to local messages
        setChatMessages(prev => [...prev, data.message])
        setNewMessage('')

        // Refresh conversations
        fetchConversations()
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    }
  }

  const openChatWithStaff = async (staffId: string, staffName: string, userId?: string) => {
    try {
      console.log('Opening chat with staff:', staffId, staffName, userId)

      // If userId is provided, open chat directly
      if (userId) {
        openChat({
          id: userId,
          name: staffName,
          role: 'staff',
          department: ''
        })
        return
      }

      // Otherwise, fetch user details
      const response = await fetch(`/api/staff-user?staffId=${staffId}`)
      const data = await response.json()

      console.log('Staff user data:', data)

      if (data.success && data.staffUser) {
        const staffUser = data.staffUser
        openChat({
          id: staffUser.id,
          name: staffUser.name,
          role: staffUser.staff?.role || 'staff',
          department: staffUser.staff?.department || ''
        })
      } else {
        alert('Could not find staff user')
      }
    } catch (error) {
      console.error('Error opening chat:', error)
      alert('Failed to open chat')
    }
  }

  // Home Page
  if (currentView === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-2 rounded-lg">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Society Management System</h1>
                <p className="text-xs text-slate-500">Register to get started</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-slate-900 mb-4">
                Welcome to Society Portal
              </h2>
              <p className="text-lg text-slate-600">
                Choose your registration type to get started
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Resident Registration Card */}
              <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-emerald-500 group cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-emerald-100 dark:bg-emerald-900 p-3 rounded-full group-hover:bg-emerald-500 transition-colors">
                      <Users className="h-8 w-8 text-emerald-600 dark:text-emerald-400 group-hover:text-white" />
                    </div>
                    <CardTitle className="text-2xl">Resident</CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    Register as a society resident to access resident features
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {['View notices & announcements', 'Register complaints', 'Track maintenance requests', 'Access community events'].map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-slate-600">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => setCurrentView('resident-register')}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 group-hover:shadow-lg mb-3"
                    size="lg"
                  >
                    Register as Resident
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <LogIn className="mr-2 h-4 w-4" />
                        Login as Resident
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="text-2xl">Resident Login</DialogTitle>
                        <DialogDescription>
                          Enter your credentials to access your resident account
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label htmlFor="resident-login-email">Email</Label>
                          <Input
                            id="resident-login-email"
                            type="email"
                            placeholder="e.g., name@gmail.com"
                            value={residentLoginCredentials.email}
                            onChange={(e) => setResidentLoginCredentials({ ...residentLoginCredentials, email: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="resident-login-password">Password</Label>
                          <Input
                            id="resident-login-password"
                            type="password"
                            placeholder="Enter password"
                            value={residentLoginCredentials.password}
                            onChange={(e) => setResidentLoginCredentials({ ...residentLoginCredentials, password: e.target.value })}
                          />
                        </div>
                        <Button
                          onClick={handleResidentLogin}
                          className="w-full bg-emerald-500 hover:bg-emerald-600"
                          size="lg"
                          disabled={loading}
                        >
                          {loading ? 'Logging in...' : 'Login'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              {/* Staff Registration Card */}
              <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-500 group cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full group-hover:bg-blue-500 transition-colors">
                      <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400 group-hover:text-white" />
                    </div>
                    <CardTitle className="text-2xl">Society Staff</CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    Register as society staff to manage operations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {['Manage complaints', 'Update status of requests', 'Access work orders', 'Report maintenance'].map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-slate-600">
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => setCurrentView('staff-register')}
                    className="w-full bg-blue-500 hover:bg-blue-600 group-hover:shadow-lg mb-3"
                    size="lg"
                  >
                    Register as Staff
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <LogIn className="mr-2 h-4 w-4" />
                        Login as Staff
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="text-2xl">Staff Login</DialogTitle>
                        <DialogDescription>
                          Enter your credentials to access your staff account
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label htmlFor="staff-login-email">Email</Label>
                          <Input
                            id="staff-login-email"
                            type="email"
                            placeholder="e.g., name@gmail.com"
                            value={staffLoginCredentials.email}
                            onChange={(e) => setStaffLoginCredentials({ ...staffLoginCredentials, email: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="staff-login-password">Password</Label>
                          <Input
                            id="staff-login-password"
                            type="password"
                            placeholder="Enter password"
                            value={staffLoginCredentials.password}
                            onChange={(e) => setStaffLoginCredentials({ ...staffLoginCredentials, password: e.target.value })}
                          />
                        </div>
                        <Button
                          onClick={handleStaffLogin}
                          className="w-full bg-blue-500 hover:bg-blue-600"
                          size="lg"
                          disabled={loading}
                        >
                          {loading ? 'Logging in...' : 'Login'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </div>

            {/* Admin Login Section */}
            <div className="text-center">
              <p className="text-slate-600 mb-4">
                Are you an administrator?
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="lg">
                    <Shield className="mr-2 h-4 w-4" />
                    Admin Login
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-2xl">Admin Login</DialogTitle>
                    <DialogDescription>
                      Enter your admin credentials to access to system dashboard
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="admin-email">Email</Label>
                      <Input
                        id="admin-email"
                        type="email"
                        placeholder="admin@society.com"
                        value={adminCredentials.email}
                        onChange={(e) => setAdminCredentials({ ...adminCredentials, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="admin-password">Password</Label>
                      <Input
                        id="admin-password"
                        type="password"
                        placeholder="Enter password"
                        value={adminCredentials.password}
                        onChange={(e) => setAdminCredentials({ ...adminCredentials, password: e.target.value })}
                      />
                    </div>
                    <Button
                      onClick={handleAdminLogin}
                      className="w-full bg-emerald-500 hover:bg-emerald-600"
                      size="lg"
                      disabled={loading}
                    >
                      {loading ? 'Logging in...' : 'Login as Admin'}
                    </Button>
                    <p className="text-xs text-slate-500 text-center">
                      Demo: admin@society.com / admin123
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <p className="text-sm text-slate-500 text-center">
              © 2025 Society Management System. All rights reserved.
            </p>
          </div>
        </footer>

        {/* Chat Dialog */}
        {chatOpen && (
          <ChatDialog
            chatOpen={chatOpen}
            chatMinimized={chatMinimized}
            setChatMinimized={setChatMinimized}
            setChatOpen={setChatOpen}
            selectedChatUser={selectedChatUser}
            currentUser={currentUser}
            chatMessages={chatMessages}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            sendMessage={sendMessage}
            onlineUsers={onlineUsers}
            messagesEndRef={messagesEndRef}
            inputRef={inputRef}
          />
        )}
      </div>
    )
  }

  // Resident Registration Page
  if (currentView === 'resident-register') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
        <header className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Button
              variant="ghost"
              onClick={() => setCurrentView('home')}
            >
              <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
              Back to Home
            </Button>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="bg-emerald-100 dark:bg-emerald-900 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <CardTitle className="text-2xl">Resident Registration</CardTitle>
              <CardDescription>
                Fill in your details to register as a resident
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="resident-name">Full Name</Label>
                  <Input
                    id="resident-name"
                    placeholder="Enter your full name"
                    value={residentData.name}
                    onChange={(e) => setResidentData({ ...residentData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="resident-email">Email</Label>
                  <Input
                    id="resident-email"
                    type="email"
                    placeholder="Enter your email"
                    value={residentData.email}
                    onChange={(e) => setResidentData({ ...residentData, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="resident-phone">Phone Number</Label>
                  <Input
                    id="resident-phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={residentData.phone}
                    onChange={(e) => setResidentData({ ...residentData, phone: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="resident-block">Block</Label>
                    <Input
                      id="resident-block"
                      placeholder="A"
                      value={residentData.block}
                      onChange={(e) => setResidentData({ ...residentData, block: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="resident-flat">Flat Number</Label>
                    <Input
                      id="resident-flat"
                      placeholder="101"
                      value={residentData.flat}
                      onChange={(e) => setResidentData({ ...residentData, flat: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="resident-password">Password</Label>
                  <Input
                    id="resident-password"
                    type="password"
                    placeholder="Create a password"
                    value={residentData.password}
                    onChange={(e) => setResidentData({ ...residentData, password: e.target.value })}
                  />
                </div>
                <Button
                  onClick={handleResidentRegister}
                  className="w-full bg-emerald-500 hover:bg-emerald-600"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? 'Registering...' : 'Register as Resident'}
                </Button>

                {/* Login Section */}
                <div className="mt-8 pt-8 border-t border-slate-200">
                  <p className="text-sm font-semibold text-slate-700 mb-4">Already have an account?</p>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <LogIn className="mr-2 h-4 w-4" />
                        Login as Resident
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="text-2xl">Resident Login</DialogTitle>
                        <DialogDescription>
                          Enter your credentials to access your resident account
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label htmlFor="resident-login-email">Email</Label>
                          <Input
                            id="resident-login-email"
                            type="email"
                            placeholder="e.g., name@gmail.com"
                            value={residentLoginCredentials.email}
                            onChange={(e) => setResidentLoginCredentials({ ...residentLoginCredentials, email: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="resident-login-password">Password</Label>
                          <Input
                            id="resident-login-password"
                            type="password"
                            placeholder="Enter password"
                            value={residentLoginCredentials.password}
                            onChange={(e) => setResidentLoginCredentials({ ...residentLoginCredentials, password: e.target.value })}
                          />
                        </div>
                        <Button
                          onClick={handleResidentLogin}
                          className="w-full bg-emerald-500 hover:bg-emerald-600"
                          size="lg"
                          disabled={loading}
                        >
                          {loading ? 'Logging in...' : 'Login'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>

        <footer className="bg-white border-t border-slate-200 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <p className="text-sm text-slate-500 text-center">
              © 2025 Society Management System. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    )
  }

  // Staff Registration Page
  if (currentView === 'staff-register') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
        <header className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Button
              variant="ghost"
              onClick={() => setCurrentView('home')}
            >
              <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
              Back to Home
            </Button>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-2xl">Staff Registration</CardTitle>
              <CardDescription>
                Fill in your details to register as society staff
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="staff-name">Full Name</Label>
                  <Input
                    id="staff-name"
                    placeholder="Enter your full name"
                    value={staffData.name}
                    onChange={(e) => setStaffData({ ...staffData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="staff-email">Email</Label>
                  <Input
                    id="staff-email"
                    type="email"
                    placeholder="Enter your email"
                    value={staffData.email}
                    onChange={(e) => setStaffData({ ...staffData, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="staff-phone">Phone Number</Label>
                  <Input
                    id="staff-phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={staffData.phone}
                    onChange={(e) => setStaffData({ ...staffData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="staff-role">Role</Label>
                  <Input
                    id="staff-role"
                    placeholder="e.g., Security, Maintenance, Housekeeping"
                    value={staffData.role}
                    onChange={(e) => setStaffData({ ...staffData, role: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="staff-department">Department</Label>
                  <Input
                    id="staff-department"
                    placeholder="e.g., Operations, Maintenance"
                    value={staffData.department}
                    onChange={(e) => setStaffData({ ...staffData, department: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="staff-password">Password</Label>
                  <Input
                    id="staff-password"
                    type="password"
                    placeholder="Create a password"
                    value={staffData.password}
                    onChange={(e) => setStaffData({ ...staffData, password: e.target.value })}
                  />
                </div>
                <Button
                  onClick={handleStaffRegister}
                  className="w-full bg-blue-500 hover:bg-blue-600"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? 'Registering...' : 'Register as Staff'}
                </Button>

                {/* Login Section */}
                <div className="mt-8 pt-8 border-t border-slate-200">
                  <p className="text-sm font-semibold text-slate-700 mb-4">Already have an account?</p>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <LogIn className="mr-2 h-4 w-4" />
                        Login as Staff
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="text-2xl">Staff Login</DialogTitle>
                        <DialogDescription>
                          Enter your credentials to access your staff account
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label htmlFor="staff-login-email">Email</Label>
                          <Input
                            id="staff-login-email"
                            type="email"
                            placeholder="e.g., name@gmail.com"
                            value={staffLoginCredentials.email}
                            onChange={(e) => setStaffLoginCredentials({ ...staffLoginCredentials, email: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="staff-login-password">Password</Label>
                          <Input
                            id="staff-login-password"
                            type="password"
                            placeholder="Enter your password"
                            value={staffLoginCredentials.password}
                            onChange={(e) => setStaffLoginCredentials({ ...staffLoginCredentials, password: e.target.value })}
                          />
                        </div>
                        <Button
                          onClick={handleStaffLogin}
                            className="w-full bg-blue-500 hover:bg-blue-600"
                            size="lg"
                            disabled={loading}
                          >
                            {loading ? 'Logging in...' : 'Login'}
                          </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>

        <footer className="bg-white border-t border-slate-200 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <p className="text-sm text-slate-500 text-center">
              © 2025 Society Management System. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    )
  }

  // Resident Dashboard
  if (currentView === 'resident-dashboard') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
        <header className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-2 rounded-lg">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Resident Dashboard</h1>
                  <p className="text-xs text-slate-500">Welcome, {currentUser?.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="relative"
                  onClick={() => {
                    if (conversations.length > 0) {
                      openChat(conversations[0])
                    } else {
                      alert('No conversations yet. Chat with staff from your complaints!')
                    }
                  }}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Messages
                  {conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0) > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0)}
                    </span>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentUser(null)
                    setCurrentView('home')
                  }}
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-8">
          <div className="max-w-3xl mx-auto">
            {/* Action Buttons */}
            <div className="flex gap-4 mb-6">
              <Button
                onClick={() => setCurrentView('resident-dashboard')}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                size="lg"
              >
                File New Complaint
              </Button>
              <Button
                onClick={handleFetchComplaints}
                variant="outline"
                className="flex-1"
                size="lg"
                disabled={loadingComplaints}
              >
                {loadingComplaints ? 'Loading...' : 'My Complaints'}
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">File a Complaint</CardTitle>
                <CardDescription>
                  Submit a complaint about maintenance or other issues
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Title Field */}
                <div>
                  <Label htmlFor="complaint-title">Complaint Title *</Label>
                  <Input
                    id="complaint-title"
                    placeholder="Enter complaint title (e.g., Water leakage in kitchen)"
                    value={complaintData.title}
                    onChange={(e) => setComplaintData({ ...complaintData, title: e.target.value })}
                    className="mt-2"
                  />
                </div>

                {/* Category Dropdown */}
                <div>
                  <Label htmlFor="complaint-category">Category *</Label>
                  <Select
                    value={complaintData.category}
                    onValueChange={(value) => {
                      setComplaintData({ ...complaintData, category: value, preferredStaffId: '' })
                      handleFetchStaffByCategory(value)
                    }}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plumber">Plumber</SelectItem>
                      <SelectItem value="electrician">Electrician</SelectItem>
                      <SelectItem value="water">Water Supply</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="internet">Internet</SelectItem>
                      <SelectItem value="cleaning">Cleaning</SelectItem>
                      <SelectItem value="elevator">Elevator</SelectItem>
                      <SelectItem value="parking">Parking</SelectItem>
                      <SelectItem value="garden">Garden</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Staff Selection Dropdown */}
                {complaintData.category && (
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Label htmlFor="preferred-staff">Preferred Staff (Optional)</Label>
                        <Select
                          value={complaintData.preferredStaffId}
                          onValueChange={(value) => {
                            const selectedStaff = staffList.find(s => s.id === value)
                            setSelectedStaffForChat(selectedStaff || null)
                            setComplaintData({ ...complaintData, preferredStaffId: value })
                          }}
                          disabled={loadingStaff || staffList.length === 0}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder={loadingStaff ? 'Loading staff...' : staffList.length === 0 ? 'No staff available' : 'Select preferred staff'} />
                          </SelectTrigger>
                          <SelectContent>
                            {staffList.length === 0 && !loadingStaff && (
                              <div className="px-3 py-2 text-sm text-slate-500">
                                No active staff available for this category
                              </div>
                            )}
                            {staffList.map((staff) => (
                              <SelectItem key={staff.id} value={staff.id}>
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                                  <span>{staff.name}</span>
                                  {staff.department && (
                                    <span className="text-xs text-slate-500">({staff.department})</span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {selectedStaffForChat && (
                        <div className="mt-6">
                          <Button
                            type="button"
                            onClick={() => {
                              console.log('Chat button clicked!', selectedStaffForChat)
                              openChatWithStaff(selectedStaffForChat.id, selectedStaffForChat.name, selectedStaffForChat.userId)
                            }}
                            className="bg-green-500 hover:bg-green-600"
                            size="sm"
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Chat
                          </Button>
                        </div>
                      )}
                    </div>
                    {staffList.length > 0 && (
                      <p className="text-xs text-slate-500 mt-1">
                        Select a specific staff member if you have a preference, then click Chat to talk directly!
                      </p>
                    )}
                  </div>
                )}

                {/* Description Field */}
                <div>
                  <Label htmlFor="complaint-description">Description *</Label>
                  <Textarea
                    id="complaint-description"
                    placeholder="Provide detailed description of the issue..."
                    value={complaintData.description}
                    onChange={(e) => setComplaintData({ ...complaintData, description: e.target.value })}
                    className="mt-2 min-h-[150px]"
                  />
                </div>

                {/* Photo Upload Section */}
                <div>
                  <Label>Photos (Maximum 5)</Label>
                  <div className="mt-2 space-y-3">
                    {complaintPhotos.length < 5 && (
                      <div>
                        <Input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handlePhotoUpload}
                          className="hidden"
                          id="photo-upload"
                        />
                        <Label
                          htmlFor="photo-upload"
                          className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-lg p-6 cursor-pointer hover:border-emerald-500 hover:bg-slate-50 transition-colors"
                        >
                          <Upload className="h-5 w-5 text-slate-500" />
                          <span className="text-slate-600">
                            Click to upload photos ({complaintPhotos.length}/5)
                          </span>
                        </Label>
                      </div>
                    )}

                    {/* Display uploaded photos */}
                    {complaintPhotos.length > 0 && (
                      <div className="grid grid-cols-5 gap-3">
                        {complaintPhotos.map((photo, index) => (
                          <div key={index} className="relative group">
                            <div className="aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                              <img
                                src={URL.createObjectURL(photo)}
                                alt={`Photo ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <button
                              onClick={() => removePhoto(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleComplaintSubmit}
                  className="w-full bg-emerald-500 hover:bg-emerald-600"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Submit Complaint'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <p className="text-sm text-slate-500 text-center">
              © 2025 Society Management System. All rights reserved.
            </p>
          </div>
        </footer>

        {/* Chat Dialog */}
        {chatOpen && (
          <ChatDialog
            chatOpen={chatOpen}
            chatMinimized={chatMinimized}
            setChatMinimized={setChatMinimized}
            setChatOpen={setChatOpen}
            selectedChatUser={selectedChatUser}
            currentUser={currentUser}
            chatMessages={chatMessages}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            sendMessage={sendMessage}
            onlineUsers={onlineUsers}
            messagesEndRef={messagesEndRef}
            inputRef={inputRef}
          />
        )}
      </div>
    )
  }

  // Complaints List View
  if (currentView === 'complaints-list') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
        <header className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-2 rounded-lg">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">My Complaints</h1>
                  <p className="text-xs text-slate-500">Track your complaints</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setCurrentView('resident-dashboard')}
              >
                <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
                Back to Dashboard
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-8">
          <div className="max-w-5xl mx-auto">
            {userComplaints.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">No Complaints Yet</h3>
                  <p className="text-slate-600 mb-6">You haven't filed any complaints yet.</p>
                  <Button
                    onClick={() => setCurrentView('resident-dashboard')}
                    className="bg-emerald-500 hover:bg-emerald-600"
                    size="lg"
                  >
                    File Your First Complaint
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {userComplaints.map((complaint) => (
                  <Card key={complaint.id} className="hover:shadow-lg transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-slate-900 mb-2">
                            {complaint.title}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-slate-600 mb-3 flex-wrap">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(complaint.status)}`}>
                              {getStatusIcon(complaint.status)} {complaint.status}
                            </span>
                            <span>•</span>
                            <span>{complaint.date}</span>
                            <span>•</span>
                            <span className="capitalize">{complaint.category}</span>
                          </div>

                          {/* Assigned Staff Info */}
                          {complaint.assignedStaffName && (
                            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <p className="text-sm font-semibold text-blue-900 mb-1">
                                Assigned Staff: {complaint.assignedStaffName}
                              </p>
                              {complaint.assignedAt && (
                                <p className="text-xs text-blue-700">
                                  Assigned on: {new Date(complaint.assignedAt).toLocaleDateString()}
                                </p>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="mt-2 bg-white hover:bg-blue-50 border-blue-300 text-blue-700"
                                onClick={() => {
                                  if (complaint.assignedStaffId) {
                                    openChatWithStaff(complaint.assignedStaffId, complaint.assignedStaffName)
                                  }
                                }}
                              >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Chat with Staff
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-slate-700 mb-4 whitespace-pre-wrap">
                        {complaint.description}
                      </p>

                      {complaint.photos && complaint.photos.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-semibold text-slate-700 mb-2">Attached Photos:</p>
                          <div className="flex gap-2 flex-wrap">
                            {complaint.photos.map((photo: string, index: number) => (
                              <div
                                key={index}
                                className="w-20 h-20 rounded-lg overflow-hidden border border-slate-200 bg-slate-100"
                              >
                                <img
                                  src={photo}
                                  alt={`Complaint photo ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="text-xs text-slate-500 pt-3 border-t border-slate-200">
                        Complaint ID: {complaint.id}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <p className="text-sm text-slate-500 text-center">
              © 2025 Society Management System. All rights reserved.
            </p>
          </div>
        </footer>

        {/* Chat Dialog */}
        {chatOpen && (
          <ChatDialog
            chatOpen={chatOpen}
            chatMinimized={chatMinimized}
            setChatMinimized={setChatMinimized}
            setChatOpen={setChatOpen}
            selectedChatUser={selectedChatUser}
            currentUser={currentUser}
            chatMessages={chatMessages}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            sendMessage={sendMessage}
            onlineUsers={onlineUsers}
            messagesEndRef={messagesEndRef}
            inputRef={inputRef}
          />
        )}
      </div>
    )
  }

  // Staff Dashboard
  if (currentView === 'staff-dashboard') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
        <header className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-lg">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Staff Dashboard</h1>
                  <p className="text-xs text-slate-500">
                    Welcome, {currentUser?.name} • {currentUser?.staff?.role}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="relative"
                  onClick={() => {
                    if (conversations.length > 0) {
                      openChat(conversations[0])
                    } else {
                      alert('No conversations yet. Residents will contact you through their complaints!')
                    }
                  }}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Messages
                  {conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0) > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0)}
                    </span>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentUser(null)
                    setCurrentView('home')
                  }}
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-8">
          <div className="max-w-5xl mx-auto">
            {/* Header Section */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                {currentUser?.staff?.role} Complaints
              </h2>
              <p className="text-slate-600">
                Manage and update complaints related to {currentUser?.staff?.role} department
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-slate-600">Total</p>
                  <p className="text-3xl font-bold text-slate-900">{staffComplaints.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-slate-600">Pending</p>
                  <p className="text-3xl font-bold text-yellow-500">
                    {staffComplaints.filter(c => c.status === 'pending').length}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-slate-600">In Progress</p>
                  <p className="text-3xl font-bold text-blue-500">
                    {staffComplaints.filter(c => c.status === 'in-progress').length}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-slate-600">Resolved</p>
                  <p className="text-3xl font-bold text-green-500">
                    {staffComplaints.filter(c => c.status === 'resolved').length}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Refresh Button */}
            <div className="mb-6">
              <Button
                onClick={handleFetchStaffComplaints}
                variant="outline"
                disabled={loadingComplaints}
              >
                {loadingComplaints ? 'Loading...' : 'Refresh Complaints'}
              </Button>
            </div>

            {/* Complaints List */}
            {staffComplaints.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">No Complaints Found</h3>
                  <p className="text-slate-600">
                    There are no {currentUser?.staff?.role} complaints at the moment.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {staffComplaints.map((complaint) => (
                  <Card key={complaint.id} className="hover:shadow-lg transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-slate-900 mb-2">
                            {complaint.title}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-slate-600 mb-3 flex-wrap">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(complaint.status)}`}>
                              {getStatusIcon(complaint.status)} {complaint.status}
                            </span>
                            <span>•</span>
                            <span>{complaint.date}</span>
                            <span>•</span>
                            <span className="font-medium">{complaint.member?.name}</span>
                            <span>•</span>
                            <span className="text-xs bg-slate-100 px-2 py-1 rounded">
                              {complaint.member?.flat}
                            </span>
                          </div>

                          {/* Assigned Staff Info */}
                          {complaint.assignedStaffName && (
                            <div className="mt-2 flex items-center gap-2">
                              {complaint.assignedStaffId === currentUser?.staff?.id ? (
                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
                                  👤 Assigned to You
                                </span>
                              ) : (
                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-300">
                                  🔒 Assigned to {complaint.assignedStaffName}
                                </span>
                              )}
                              {complaint.assignedAt && (
                                <span className="text-xs text-slate-500">
                                  on {new Date(complaint.assignedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="text-slate-700 mb-4 whitespace-pre-wrap">
                        {complaint.description}
                      </p>

                      {complaint.photos && complaint.photos.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-semibold text-slate-700 mb-2">Attached Photos (Resident):</p>
                          <div className="flex gap-2 flex-wrap">
                            {complaint.photos.map((photo: string, index: number) => (
                              <div
                                key={index}
                                className="w-24 h-24 rounded-lg overflow-hidden border border-slate-200 bg-slate-100"
                              >
                                <img
                                  src={photo}
                                  alt={`Complaint photo ${index + 1}`}
                                  className="w-full h-full object-cover cursor-pointer"
                                  onClick={() => window.open(photo, '_blank')}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Staff Photo Upload Section */}
                      <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="text-sm font-semibold text-slate-700 mb-2">
                          📷 Upload Work Photos (Max 5)
                        </p>
                        
                        {/* Upload Button */}
                        {staffPhotos[complaint.id]?.length < 5 && (
                          <div className="mb-3">
                            <Input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) => handleStaffPhotoUpload(complaint.id, e)}
                              className="hidden"
                              id={`staff-photo-upload-${complaint.id}`}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full"
                              onClick={() => {
                                document.getElementById(`staff-photo-upload-${complaint.id}`)?.click()
                              }}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Click to upload work photos ({staffPhotos[complaint.id]?.length || 0}/5)
                            </Button>
                          </div>
                        )}

                        {/* Display Selected Photos */}
                        {staffPhotos[complaint.id] && staffPhotos[complaint.id].length > 0 && (
                          <div className="mb-3 grid grid-cols-5 gap-2">
                            {staffPhotos[complaint.id].map((photo, index) => (
                              <div key={index} className="relative group">
                                <div className="aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                                  <img
                                    src={URL.createObjectURL(photo)}
                                    alt={`Work photo ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <button
                                  onClick={() => removeStaffPhoto(complaint.id, index)}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Upload Button */}
                        {staffPhotos[complaint.id] && staffPhotos[complaint.id].length > 0 && (
                          <Button
                            onClick={() => handleUploadStaffPhotos(complaint.id)}
                            size="sm"
                            className="bg-blue-500 hover:bg-blue-600 text-white w-full"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Photos
                          </Button>
                        )}

                        {/* Display Already Uploaded Staff Photos */}
                        {complaint.staffPhotos && complaint.staffPhotos.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-semibold text-slate-600 mb-2">Uploaded Work Photos:</p>
                            <div className="flex gap-2 flex-wrap">
                              {complaint.staffPhotos.map((photo: string, index: number) => (
                                <div
                                  key={index}
                                  className="w-20 h-20 rounded-lg overflow-hidden border border-green-200 bg-green-50"
                                >
                                  <img
                                    src={photo}
                                    alt={`Work photo ${index + 1}`}
                                    className="w-full h-full object-cover cursor-pointer"
                                    onClick={() => window.open(photo, '_blank')}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Status Update Actions */}
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        {complaint.assignedStaffName && complaint.assignedStaffId !== currentUser?.staff?.id ? (
                          <div className="mb-2 text-xs text-slate-500 italic">
                            ℹ️ This complaint is currently assigned to {complaint.assignedStaffName}
                          </div>
                        ) : null}
                        <p className="text-sm font-semibold text-slate-700 mb-2">Update Status:</p>
                        <div className="flex flex-wrap gap-2">
                          {complaint.status !== 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-yellow-50 hover:bg-yellow-100 border-yellow-300 text-yellow-800"
                              onClick={() => handleUpdateComplaintStatus(complaint.id, 'pending')}
                            >
                              ⏳ Pending
                            </Button>
                          )}
                          {complaint.status !== 'in-progress' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-800"
                              onClick={() => handleUpdateComplaintStatus(complaint.id, 'in-progress')}
                              disabled={complaint.assignedStaffId && complaint.assignedStaffId !== currentUser?.staff?.id}
                            >
                              🔄 In Progress
                              {complaint.status !== 'in-progress' && complaint.assignedStaffId && complaint.assignedStaffId !== currentUser?.staff?.id && (
                                <span className="ml-1 text-xs text-slate-500">(Already assigned)</span>
                              )}
                            </Button>
                          )}
                          {complaint.status !== 'resolved' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-green-50 hover:bg-green-100 border-green-300 text-green-800"
                              onClick={() => handleUpdateComplaintStatus(complaint.id, 'resolved')}
                            >
                              ✅ Resolved
                            </Button>
                          )}
                          {complaint.status !== 'rejected' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-red-50 hover:bg-red-100 border-red-300 text-red-800"
                              onClick={() => handleUpdateComplaintStatus(complaint.id, 'rejected')}
                            >
                              ❌ Rejected
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-slate-500 pt-3 border-t border-slate-200 mt-4">
                        Complaint ID: {complaint.id} • Submitted by: {complaint.submitter}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <p className="text-sm text-slate-500 text-center">
              © 2025 Society Management System. All rights reserved.
            </p>
          </div>
        </footer>

        {/* Chat Dialog */}
        {chatOpen && (
          <ChatDialog
            chatOpen={chatOpen}
            chatMinimized={chatMinimized}
            setChatMinimized={setChatMinimized}
            setChatOpen={setChatOpen}
            selectedChatUser={selectedChatUser}
            currentUser={currentUser}
            chatMessages={chatMessages}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            sendMessage={sendMessage}
            onlineUsers={onlineUsers}
            messagesEndRef={messagesEndRef}
            inputRef={inputRef}
          />
        )}
      </div>
    )
  }

  // Admin Dashboard
  if (currentView === 'admin-dashboard') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
        <header className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-2 rounded-lg">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Admin Dashboard</h1>
                  <p className="text-xs text-slate-500">System Overview</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setCurrentView('home')}
              >
                Logout
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-slate-900 mb-4">
                Welcome, Admin!
              </h2>
              <p className="text-lg text-slate-600">
                You now have full access to the system. Tell me what you want to see here next!
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Total Residents</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-emerald-500">{totalResidents}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Total Staff</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-blue-500">{totalStaff}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Pending Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-orange-500">{pendingRequests}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="p-6">
              <CardHeader>
                <CardTitle>All Complaints</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingComplaints ? (
                  <p className="text-center text-slate-500">Loading...</p>
                ) : adminComplaints.length === 0 ? (
                  <p className="text-center text-slate-500">No complaints yet</p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {adminComplaints.map((complaint: any) => (
                      <div key={complaint.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900">{complaint.title}</h4>
                            <p className="text-sm text-slate-600">{complaint.submitter}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-700">
                              {complaint.status}
                            </span>
                            {complaint.status === 'resolved' && (
                              <Button
                                size="sm"
                                onClick={() => handleCloseComplaint(complaint.id)}
                                className="bg-emerald-500 hover:bg-emerald-600"
                              >
                                Close
                              </Button>
                            )}
                          </div>
                        </div>
                        {complaint.assignedStaffName && (
                          <p className="text-sm text-blue-600">Assigned to: {complaint.assignedStaffName}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>

        <footer className="bg-white border-t border-slate-200 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <p className="text-sm text-slate-500 text-center">
              © 2025 Society Management System. All rights reserved.
            </p>
          </div>
        </footer>

        {/* Chat Dialog */}
        {chatOpen && (
          <ChatDialog
            chatOpen={chatOpen}
            chatMinimized={chatMinimized}
            setChatMinimized={setChatMinimized}
            setChatOpen={setChatOpen}
            selectedChatUser={selectedChatUser}
            currentUser={currentUser}
            chatMessages={chatMessages}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            sendMessage={sendMessage}
            onlineUsers={onlineUsers}
            messagesEndRef={messagesEndRef}
            inputRef={inputRef}
          />
        )}
      </div>
    )
  }

  return null
}
