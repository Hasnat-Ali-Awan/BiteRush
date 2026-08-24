import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import Icon from './Icon'

const PRESET_PHRASES = {
  customer: [
    "I'm waiting at the main entrance/gate.",
    'Please ring the bell when you arrive.',
    'Could you please include extra cutlery/napkins?',
    'Please leave the package by the door.',
    'Where are you right now?',
  ],
  rider: [
    "I have arrived at your delivery location.",
    "I'm on the way to you now (approx. 5 mins).",
    "I'm at the building lobby/gate.",
    "Could you please come outside to collect?",
    "Traffic is a bit heavy, will arrive shortly!",
  ],
  manager: [
    'Your order is freshly prepared and packed.',
    'The order is handed over to the rider.',
    'We have noted your special instructions!',
    'Let us know if you need anything else.',
  ],
}

function formatChatTime(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatChatDate(dateString) {
  if (!dateString) return ''
  const d = new Date(dateString)
  const today = new Date()
  if (d.toDateString() === today.toDateString()) return 'Today'
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function OrderChatModal({ orderId, orderNumber, onClose }) {
  const { user } = useAuth()
  const [chatData, setChatData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [inputText, setInputText] = useState('')
  const [sending, setSending] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  const [selectedPhotoFullscreen, setSelectedPhotoFullscreen] = useState(null)
  const [showPresets, setShowPresets] = useState(false)
  const [showMentionsPopup, setShowMentionsPopup] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [locating, setLocating] = useState(false)

  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const textareaRef = useRef(null)
  const lastMessageCountRef = useRef(0)

  const loadChat = useCallback(
    async (isBackground = false) => {
      if (!orderId) return
      if (!isBackground) setLoading(true)
      try {
        const data = await api.getOrderChat(orderId)
        setChatData(data)
        setError('')

        // Auto-scroll if new message arrived
        if (data.messages?.length !== lastMessageCountRef.current) {
          lastMessageCountRef.current = data.messages?.length || 0
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
          }, 100)
        }
      } catch (err) {
        if (!isBackground) {
          setError(err.message || 'Failed to load group chat')
        }
      } finally {
        if (!isBackground) setLoading(false)
      }
    },
    [orderId],
  )

  useEffect(() => {
    loadChat(false)
    const timer = setInterval(() => {
      loadChat(true)
    }, 2500)
    return () => clearInterval(timer)
  }, [loadChat])

  // Scroll to bottom on initial load
  useEffect(() => {
    if (!loading && chatData?.messages?.length) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
    }
  }, [loading])

  const myRole = chatData?.myRole || (user?.role === 'rider' ? 'rider' : user?.role === 'customer' ? 'customer' : 'manager')
  const isClosed = chatData?.isClosed || ['delivered', 'cancelled', 'rejected'].includes(chatData?.order?.status)

  // Mentions options
  const mentionOptions = [
    {
      id: 'customer',
      label: chatData?.participants?.customer?.name || 'Customer',
      role: 'Customer',
      tag: `@${chatData?.participants?.customer?.name?.split(' ')[0] || 'Customer'} (Customer)`,
    },
    {
      id: 'rider',
      label: chatData?.participants?.rider?.name || 'Assigned Rider',
      role: 'Rider',
      tag: chatData?.participants?.rider
        ? `@${chatData.participants.rider.name.split(' ')[0]} (Rider)`
        : '@Rider',
    },
    {
      id: 'manager',
      label: chatData?.participants?.manager?.name || 'Kitchen Manager',
      role: 'Manager',
      tag: '@Manager',
    },
  ]

  function handleInputChange(e) {
    const val = e.target.value
    setInputText(val)

    // Check if user is typing @ for mention autocomplete
    const lastAtPos = val.lastIndexOf('@')
    if (lastAtPos !== -1 && lastAtPos >= val.length - 15) {
      const query = val.slice(lastAtPos + 1).toLowerCase()
      setMentionQuery(query)
      setShowMentionsPopup(true)
    } else {
      setShowMentionsPopup(false)
    }
  }

  function insertMention(tag) {
    const lastAtPos = inputText.lastIndexOf('@')
    let next = ''
    if (lastAtPos !== -1) {
      next = inputText.slice(0, lastAtPos) + tag + ' '
    } else {
      next = inputText ? `${inputText} ${tag} ` : `${tag} `
    }
    setInputText(next)
    setShowMentionsPopup(false)
    textareaRef.current?.focus()
  }

  async function handleSendMessage(e) {
    e?.preventDefault()
    if (isClosed || sending || (!inputText.trim() && !imagePreview)) return

    setSending(true)
    setError('')
    try {
      let uploadedImageUrl = null
      if (imagePreview) {
        setUploadingImage(true)
        const uploadRes = await api.uploadOrderChatImage(orderId, imagePreview)
        uploadedImageUrl = uploadRes.imageUrl
      }

      // Extract mentions
      const detectedMentions = []
      if (inputText.includes('@Customer') || inputText.includes(chatData?.participants?.customer?.name || '')) {
        detectedMentions.push('customer')
      }
      if (inputText.includes('@Rider') || (chatData?.participants?.rider?.name && inputText.includes(chatData.participants.rider.name))) {
        detectedMentions.push('rider')
      }
      if (inputText.includes('@Manager')) {
        detectedMentions.push('manager')
      }

      await api.sendOrderChatMessage(orderId, {
        text: inputText.trim(),
        imageUrl: uploadedImageUrl,
        type: uploadedImageUrl ? 'image' : 'text',
        mentions: detectedMentions,
      })

      setInputText('')
      setImagePreview(null)
      setShowMentionsPopup(false)
      setShowPresets(false)
      await loadChat(true)
    } catch (err) {
      setError(err.message || 'Failed to send message')
    } finally {
      setSending(false)
      setUploadingImage(false)
    }
  }

  function handleImageSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 12 * 1024 * 1024) {
      setError('Image must be under 12MB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setImagePreview(reader.result)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  async function handleShareLocation() {
    if (isClosed || locating) return
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }

    setLocating(true)
    setError('')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            address: 'Live Shared GPS Location',
          }
          await api.sendOrderChatMessage(orderId, {
            text: '📍 Shared current GPS location',
            type: 'location',
            location: coords,
          })
          await loadChat(true)
        } catch (err) {
          setError(err.message || 'Failed to share location')
        } finally {
          setLocating(false)
        }
      },
      (err) => {
        setLocating(false)
        setError(err.message || 'Unable to access your GPS location')
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Render highlighted text with @mentions
  function renderMessageText(text) {
    if (!text) return null
    // Highlight @mentions
    const parts = text.split(/(@[\w\s()-]+(?:\s*\([^)]*\))?)/g)
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span
            key={index}
            className="inline-block font-bold text-blue-700 bg-blue-100/70 px-1.5 py-0.5 rounded text-[13px] mx-0.5"
          >
            {part}
          </span>
        )
      }
      return <span key={index}>{part}</span>
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-sm animate-fade-in">
      <div className="flex h-[92vh] max-h-[820px] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-[#0b141a] shadow-2xl ring-1 ring-white/10">
        
        {/* WHATSAPP STYLE GROUP HEADER */}
        <header className="flex items-center justify-between bg-[#1f2c34] px-4 py-3 text-white border-b border-[#2a3942]">
          <div className="flex items-center gap-3">
            {/* 3-PERSON AVATAR ICON */}
            <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-[#00a884] text-white shadow-inner font-bold">
              <span className="text-xl">👥</span>
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] text-white ring-2 ring-[#1f2c34]">
                3
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base leading-tight">
                  Order #{chatData?.order?.orderNumber || orderNumber || 'Group'}
                </h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    isClosed
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {isClosed ? 'Archived (Delivered/Closed)' : 'Live Delivery Chat'}
                </span>
              </div>
              <p className="text-xs text-[#8696a0] line-clamp-1 mt-0.5">
                <span className="text-[#00a884] font-medium">Customer</span>,{' '}
                <span className="text-[#53bdeb] font-medium">Rider</span>,{' '}
                <span className="text-[#f59e0b] font-medium">Manager</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#aebac1] hover:bg-[#374248] hover:text-white transition"
              title="Close chat"
            >
              ✕
            </button>
          </div>
        </header>

        {/* PARTICIPANTS STRIP */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-[#111b21] px-4 py-2 text-xs border-b border-[#222e35] text-[#8696a0]">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#00a884]"></span>
              <strong className="text-[#e9edef]">👤 Customer:</strong>{' '}
              {chatData?.participants?.customer?.name || 'Customer'}
            </span>
            <span className="flex items-center gap-1">
              <span
                className={`h-2 w-2 rounded-full ${
                  chatData?.participants?.rider ? 'bg-[#53bdeb]' : 'bg-gray-500'
                }`}
              ></span>
              <strong className="text-[#e9edef]">🛵 Rider:</strong>{' '}
              {chatData?.participants?.rider?.name || 'Awaiting Assignment'}
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#f59e0b]"></span>
              <strong className="text-[#e9edef]">🏪 Kitchen:</strong>{' '}
              {chatData?.participants?.manager?.name || 'Restaurant'}
            </span>
          </div>

          {chatData?.order?.total ? (
            <span className="font-bold text-[#00a884]">
              Rs. {Number(chatData.order.total).toLocaleString('en-PK')}
            </span>
          ) : null}
        </div>

        {/* CHAT MESSAGES BODY */}
        <div
          className="custom-scrollbar flex-1 overflow-y-auto p-4 space-y-3"
          style={{
            backgroundColor: '#0b141a',
            backgroundImage: `radial-gradient(#202c33 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
          }}
        >
          {loading && !chatData ? (
            <div className="flex h-full flex-col items-center justify-center text-[#8696a0]">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00a884] border-t-transparent"></div>
              <p className="mt-3 text-xs font-semibold">Connecting to order chatroom…</p>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
              {error}
            </div>
          ) : null}

          {/* DATE SEPARATOR */}
          <div className="my-2 flex justify-center">
            <span className="rounded-lg bg-[#182229] px-3 py-1 text-[11px] font-semibold text-[#8696a0] shadow-sm border border-[#222e35]">
              {formatChatDate(chatData?.messages?.[0]?.createdAt || new Date())}
            </span>
          </div>

          {/* MESSAGES LIST */}
          {chatData?.messages?.map((msg, index) => {
            const isMe = msg.senderId === user?.id || (myRole && msg.senderRole === myRole)
            const isSystem = msg.type === 'system' || msg.senderRole === 'system'

            if (isSystem) {
              return (
                <div key={msg.id || index} className="my-2 flex justify-center">
                  <div className="max-w-md rounded-lg bg-[#182229] px-3.5 py-1.5 text-center text-xs text-[#ffd279] shadow-sm border border-[#2a3942]/60">
                    <span className="mr-1.5">ℹ️</span>
                    <span>{msg.text}</span>
                  </div>
                </div>
              )
            }

            const roleBadgeColors = {
              customer: 'text-[#00a884] bg-[#00a884]/15',
              rider: 'text-[#53bdeb] bg-[#53bdeb]/15',
              manager: 'text-[#f59e0b] bg-[#f59e0b]/15',
            }

            const senderColor = {
              customer: 'text-[#00a884]',
              rider: 'text-[#53bdeb]',
              manager: 'text-[#f59e0b]',
            }

            return (
              <div
                key={msg.id || index}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`relative max-w-[85%] sm:max-w-[75%] rounded-2xl p-3 shadow-md ${
                    isMe
                      ? 'rounded-tr-none bg-[#005c4b] text-[#e9edef]'
                      : 'rounded-tl-none bg-[#202c33] text-[#e9edef]'
                  }`}
                >
                  {/* SENDER NAME & ROLE HEADER (FOR OTHERS) */}
                  {!isMe ? (
                    <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold">
                      <span className={senderColor[msg.senderRole] || 'text-[#00a884]'}>
                        {msg.senderName}
                      </span>
                      <span
                        className={`rounded-full px-1.5 py-0.2 text-[9px] uppercase font-semibold ${
                          roleBadgeColors[msg.senderRole] || ''
                        }`}
                      >
                        {msg.senderRole}
                      </span>
                    </div>
                  ) : (
                    <div className="mb-1 flex items-center justify-end gap-1.5 text-[10px] text-[#8696a0]">
                      <span className="font-semibold text-emerald-300">You ({myRole})</span>
                    </div>
                  )}

                  {/* IMAGE ATTACHMENT */}
                  {msg.imageUrl ? (
                    <div className="mb-2 overflow-hidden rounded-xl bg-black/40 border border-white/10">
                      <img
                        src={msg.imageUrl}
                        alt="Chat attachment"
                        className="max-h-60 w-full object-cover cursor-pointer hover:opacity-95 transition"
                        onClick={() => setSelectedPhotoFullscreen(msg.imageUrl)}
                      />
                      <div className="p-1.5 text-center text-[10px] text-[#8696a0]">
                        Click to enlarge image
                      </div>
                    </div>
                  ) : null}

                  {/* LOCATION ATTACHMENT */}
                  {msg.location ? (
                    <div className="mb-2 rounded-xl bg-[#111b21] p-3 text-xs border border-[#2a3942]">
                      <div className="flex items-center gap-2 text-red-400 font-bold">
                        <span className="text-lg">📍</span>
                        <span>Shared GPS Location</span>
                      </div>
                      <p className="mt-1 text-[11px] text-[#8696a0]">
                        Lat: {msg.location.lat?.toFixed(5)}, Lng: {msg.location.lng?.toFixed(5)}
                      </p>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${msg.location.lat},${msg.location.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#00a884] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#008f6f] transition"
                      >
                        <span>🗺️ Open in Google Maps</span>
                      </a>
                    </div>
                  ) : null}

                  {/* MESSAGE TEXT CONTENT */}
                  {msg.text ? (
                    <div className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                      {renderMessageText(msg.text)}
                    </div>
                  ) : null}

                  {/* TIMESTAMP & TICKS */}
                  <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-[#8696a0]">
                    <span>{formatChatTime(msg.createdAt)}</span>
                    {isMe ? <span className="text-[#53bdeb] font-bold">✓✓</span> : null}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* IMAGE PREVIEW DRAWER BEFORE SENDING */}
        {imagePreview ? (
          <div className="flex items-center justify-between bg-[#1f2c34] p-3 border-t border-[#2a3942]">
            <div className="flex items-center gap-3">
              <img
                src={imagePreview}
                alt="Selected"
                className="h-14 w-14 rounded-lg object-cover ring-1 ring-[#00a884]"
              />
              <div>
                <p className="text-xs font-bold text-white">Photo attached</p>
                <p className="text-[11px] text-[#8696a0]">Add a caption or send directly</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setImagePreview(null)}
              className="rounded-lg bg-red-500/20 px-2.5 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/30"
            >
              Remove
            </button>
          </div>
        ) : null}

        {/* PRESET PHRASES TRAY */}
        {showPresets && !isClosed ? (
          <div className="bg-[#1f2c34] p-3 border-t border-[#2a3942] animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#e9edef]">
                ⚡ Quick Responses ({myRole.toUpperCase()}):
              </span>
              <button
                type="button"
                onClick={() => setShowPresets(false)}
                className="text-xs text-[#8696a0] hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
              {(PRESET_PHRASES[myRole] || PRESET_PHRASES.customer).map((phrase, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setInputText((prev) => (prev ? `${prev} ${phrase}` : phrase))
                    setShowPresets(false)
                    textareaRef.current?.focus()
                  }}
                  className="rounded-full bg-[#2a3942] px-3 py-1.5 text-xs text-[#e9edef] hover:bg-[#00a884] hover:text-white transition"
                >
                  {phrase}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* MENTIONS POPUP MENU */}
        {showMentionsPopup && !isClosed ? (
          <div className="bg-[#1f2c34] p-2 border-t border-[#2a3942]">
            <p className="px-2 py-1 text-[11px] font-bold text-[#8696a0] uppercase">
              Mention a participant:
            </p>
            <div className="flex flex-col gap-1">
              {mentionOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => insertMention(opt.tag)}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-left text-xs text-[#e9edef] hover:bg-[#2a3942]"
                >
                  <span className="font-semibold">{opt.label}</span>
                  <span className="rounded-full bg-[#00a884]/20 px-2 py-0.5 text-[10px] text-[#00a884] font-bold">
                    {opt.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* INPUT ACTIONS FOOTER */}
        {isClosed ? (
          <footer className="bg-[#182229] p-4 text-center border-t border-[#222e35]">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#ffd279]">
              <span>🔒</span>
              <span>
                Order is <strong>{chatData?.closedReason || chatData?.order?.status || 'completed'}</strong>.
                Chat is archived in read-only mode.
              </span>
            </div>
            <p className="mt-1 text-[11px] text-[#8696a0]">
              All previous messages, images, and locations remain saved for your records.
            </p>
          </footer>
        ) : (
          <footer className="bg-[#1f2c34] p-2.5 sm:p-3 border-t border-[#2a3942]">
            {/* QUICK MENTION CHIPS */}
            <div className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-1 text-xs">
              <span className="text-[11px] text-[#8696a0] font-semibold flex items-center gap-1">
                <span>@</span> Mention:
              </span>
              {mentionOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => insertMention(opt.tag)}
                  className="rounded-full bg-[#2a3942] px-2.5 py-1 text-[11px] font-semibold text-[#e9edef] hover:bg-[#00a884] hover:text-white transition whitespace-nowrap"
                >
                  {opt.tag}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowPresets(!showPresets)}
                className="ml-auto rounded-full bg-[#2a3942] px-2.5 py-1 text-[11px] font-semibold text-[#ffd279] hover:bg-[#374248] transition whitespace-nowrap"
              >
                ⚡ Quick Replies
              </button>
            </div>

            <form onSubmit={handleSendMessage} className="flex items-end gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />

              {/* ATTACH PHOTO BUTTON */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-10 w-10 items-center justify-center rounded-full text-[#8696a0] hover:bg-[#2a3942] hover:text-[#00a884] transition"
                title="Send Photo"
              >
                📷
              </button>

              {/* SHARE GPS LOCATION BUTTON */}
              <button
                type="button"
                disabled={locating}
                onClick={handleShareLocation}
                className="flex h-10 w-10 items-center justify-center rounded-full text-[#8696a0] hover:bg-[#2a3942] hover:text-red-400 transition disabled:opacity-50"
                title="Share GPS Location"
              >
                {locating ? '⏳' : '📍'}
              </button>

              {/* TEXT INPUT FIELD */}
              <div className="flex-1 rounded-2xl bg-[#2a3942] px-4 py-2">
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message or @mention..."
                  rows={1}
                  className="w-full resize-none bg-transparent text-sm text-[#e9edef] placeholder-[#8696a0] outline-none"
                  style={{ maxHeight: '100px' }}
                />
              </div>

              {/* SEND BUTTON */}
              <button
                type="submit"
                disabled={sending || uploadingImage || (!inputText.trim() && !imagePreview)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00a884] text-white shadow-md hover:bg-[#008f6f] disabled:opacity-40 disabled:cursor-not-allowed transition"
                title="Send Message"
              >
                {sending ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  <span className="text-base font-bold">➤</span>
                )}
              </button>
            </form>
          </footer>
        )}

        {/* FULLSCREEN PHOTO LIGHTBOX MODAL */}
        {selectedPhotoFullscreen ? (
          <div
            className="fixed inset-0 z-60 flex flex-col items-center justify-center bg-black/90 p-4"
            onClick={() => setSelectedPhotoFullscreen(null)}
          >
            <div className="relative max-w-3xl max-h-[85vh]">
              <img
                src={selectedPhotoFullscreen}
                alt="Fullscreen"
                className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl"
              />
              <button
                type="button"
                onClick={() => setSelectedPhotoFullscreen(null)}
                className="absolute -top-4 -right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white text-black font-bold shadow-lg hover:bg-gray-200"
              >
                ✕
              </button>
            </div>
          </div>
        ) : null}

      </div>
    </div>
  )
}
