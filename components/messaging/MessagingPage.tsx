'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MessageSquare, Send, Search } from 'lucide-react'
import {
  fetchConversations,
  fetchMessages,
  sendMessage,
  markConversationRead,
  fetchMe,
  type Conversation,
  type Message,
} from '@/lib/api'

function formatTime(iso: string): string {
  const d   = new Date(iso)
  const now = new Date()
  const diff = (now.getTime() - d.getTime()) / 1000
  if (diff < 60)    return "À l'instant"
  if (diff < 3600)  return `${Math.floor(diff / 60)}min`
  if (diff < 86400) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

export default function MessagingPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConv,    setActiveConv]    = useState<Conversation | null>(null)
  const [messages,      setMessages]      = useState<Message[]>([])
  const [input,         setInput]         = useState('')
  const [search,        setSearch]        = useState('')
  const [garageId,      setGarageId]      = useState<number | null>(null)
  const [loading,       setLoading]       = useState(true)
  const [sending,       setSending]       = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollRef        = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    fetchMe().then(p => setGarageId(p.garageId)).catch(() => null)
  }, [])

  const loadConversations = useCallback(async () => {
    if (!garageId) return
    try {
      const data = await fetchConversations(garageId)
      setConversations(data)
    } catch {
      // backend may not have endpoint yet
    } finally {
      setLoading(false)
    }
  }, [garageId])

  useEffect(() => {
    if (garageId) loadConversations()
  }, [garageId, loadConversations])

  const loadMessages = useCallback(async (convId: number) => {
    try {
      const data = await fetchMessages(convId)
      setMessages(data)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (!activeConv) return
    loadMessages(activeConv.id)
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(() => {
      loadMessages(activeConv.id)
      loadConversations()
    }, 5000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [activeConv, loadMessages, loadConversations])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSelectConv(conv: Conversation) {
    setActiveConv(conv)
    setMessages([])
    await markConversationRead(conv.id).catch(() => null)
    setConversations(prev =>
      prev.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c)
    )
  }

  async function handleSend() {
    if (!input.trim() || !activeConv || sending) return
    setSending(true)
    try {
      await sendMessage(activeConv.id, input.trim())
      setInput('')
      await loadMessages(activeConv.id)
      await loadConversations()
    } catch {
      // ignore
    } finally {
      setSending(false)
    }
  }

  const filtered    = conversations.filter(c =>
    `${c.clientFirstName} ${c.clientLastName}`.toLowerCase().includes(search.toLowerCase())
  )
  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0)

  return (
    <div style={{
      display:         'flex',
      flex:            1,
      minHeight:       0,
      borderRadius:    'var(--radius-card)',
      overflow:        'hidden',
      border:          '1px solid var(--border)',
      backgroundColor: 'var(--bg-surface)',
    }}>

      {/* ── Panneau gauche : liste des conversations ── */}
      <div style={{
        width:       300,
        minWidth:    300,
        borderRight: '1px solid var(--border)',
        display:     'flex',
        flexDirection: 'column',
      }}>
        {/* En-tête */}
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <MessageSquare size={15} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              Messages
            </span>
            {totalUnread > 0 && (
              <span style={{
                marginLeft:      4,
                backgroundColor: 'var(--accent)',
                color:           '#fff',
                fontSize:        10,
                fontWeight:      600,
                borderRadius:    10,
                padding:         '1px 6px',
              }}>
                {totalUnread}
              </span>
            )}
          </div>
          {/* Recherche */}
          <div style={{ position: 'relative' }}>
            <Search size={12} style={{
              position:  'absolute',
              left:      10,
              top:       '50%',
              transform: 'translateY(-50%)',
              color:     'var(--text-muted)',
              pointerEvents: 'none',
            }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un client…"
              style={{
                width:           '100%',
                paddingLeft:     30,
                paddingRight:    10,
                paddingTop:      7,
                paddingBottom:   7,
                fontSize:        12,
                border:          '1px solid var(--border)',
                borderRadius:    6,
                backgroundColor: 'var(--bg-elevated)',
                color:           'var(--text-primary)',
                outline:         'none',
                boxSizing:       'border-box',
              }}
            />
          </div>
        </div>

        {/* Liste */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <p style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Chargement…
            </p>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <MessageSquare size={28} strokeWidth={1} style={{ color: 'var(--text-muted)' }} />
              <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
                {search ? 'Aucun résultat' : 'Aucune conversation'}
              </p>
            </div>
          ) : (
            filtered.map(conv => {
              const isActive = activeConv?.id === conv.id
              const name     = `${conv.clientFirstName} ${conv.clientLastName}`
              const initials = `${conv.clientFirstName[0]}${conv.clientLastName[0]}`.toUpperCase()
              return (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConv(conv)}
                  style={{
                    display:         'flex',
                    alignItems:      'center',
                    gap:             10,
                    width:           '100%',
                    padding:         '10px 14px',
                    textAlign:       'left',
                    border:          'none',
                    borderLeft:      `3px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
                    cursor:          'pointer',
                    backgroundColor: isActive ? 'var(--accent-muted)' : 'transparent',
                    transition:      'background-color 150ms ease',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-elevated)' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  {/* Avatar */}
                  <span style={{
                    width:           36,
                    height:          36,
                    borderRadius:    '50%',
                    backgroundColor: 'var(--accent-muted)',
                    color:           'var(--accent)',
                    fontSize:        12,
                    fontWeight:      600,
                    display:         'flex',
                    alignItems:      'center',
                    justifyContent:  'center',
                    flexShrink:      0,
                  }}>
                    {initials}
                  </span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <span style={{
                        fontSize:      13,
                        fontWeight:    conv.unreadCount > 0 ? 600 : 400,
                        color:         'var(--text-primary)',
                        overflow:      'hidden',
                        textOverflow:  'ellipsis',
                        whiteSpace:    'nowrap',
                      }}>
                        {name}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0, marginLeft: 4 }}>
                        {formatTime(conv.updatedAt)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        fontSize:     12,
                        color:        conv.unreadCount > 0 ? 'var(--text-secondary)' : 'var(--text-muted)',
                        overflow:     'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace:   'nowrap',
                        flex:         1,
                      }}>
                        {conv.lastMessage ?? 'Démarrer la conversation'}
                      </span>
                      {conv.unreadCount > 0 && (
                        <span style={{
                          backgroundColor: 'var(--accent)',
                          color:           '#fff',
                          fontSize:        10,
                          fontWeight:      600,
                          borderRadius:    10,
                          padding:         '1px 5px',
                          marginLeft:      4,
                          flexShrink:      0,
                        }}>
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* ── Panneau droit : fenêtre de chat ── */}
      {activeConv ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* En-tête client */}
          <div style={{
            padding:         '12px 20px',
            borderBottom:    '1px solid var(--border)',
            display:         'flex',
            alignItems:      'center',
            gap:             12,
            backgroundColor: 'var(--bg-surface)',
            flexShrink:      0,
          }}>
            <span style={{
              width:           36,
              height:          36,
              borderRadius:    '50%',
              backgroundColor: 'var(--accent-muted)',
              color:           'var(--accent)',
              fontSize:        12,
              fontWeight:      600,
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              flexShrink:      0,
            }}>
              {`${activeConv.clientFirstName[0]}${activeConv.clientLastName[0]}`.toUpperCase()}
            </span>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                {`${activeConv.clientFirstName} ${activeConv.clientLastName}`}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                {activeConv.clientEmail}
              </p>
            </div>
          </div>

          {/* Zone messages */}
          <div style={{
            flex:          1,
            overflowY:     'auto',
            padding:       '16px 20px',
            display:       'flex',
            flexDirection: 'column',
            gap:           6,
          }}>
            {messages.length === 0 ? (
              <div style={{
                flex:            1,
                display:         'flex',
                flexDirection:   'column',
                alignItems:      'center',
                justifyContent:  'center',
                gap:             8,
                color:           'var(--text-muted)',
              }}>
                <MessageSquare size={32} strokeWidth={1} />
                <p style={{ fontSize: 13 }}>Aucun message. Commencez la conversation !</p>
              </div>
            ) : (
              messages.map(msg => {
                const isOwn = msg.senderRole === 'GARAGISTE'
                return (
                  <div
                    key={msg.id}
                    style={{
                      display:       'flex',
                      flexDirection: isOwn ? 'row-reverse' : 'row',
                      gap:           8,
                      alignItems:    'flex-end',
                    }}
                  >
                    <div style={{
                      maxWidth:        '70%',
                      backgroundColor: isOwn ? 'var(--accent)' : 'var(--bg-elevated)',
                      color:           isOwn ? '#fff' : 'var(--text-primary)',
                      padding:         '8px 12px',
                      borderRadius:    isOwn ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                      fontSize:        13,
                      lineHeight:      1.5,
                      wordBreak:       'break-word',
                    }}>
                      {msg.content}
                      <div style={{
                        fontSize:   10,
                        color:      isOwn ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)',
                        marginTop:  4,
                        textAlign:  isOwn ? 'right' : 'left',
                      }}>
                        {formatTime(msg.createdAt)}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Zone de saisie */}
          <div style={{
            padding:         '12px 20px',
            borderTop:       '1px solid var(--border)',
            display:         'flex',
            gap:             10,
            alignItems:      'flex-end',
            backgroundColor: 'var(--bg-surface)',
            flexShrink:      0,
          }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="Écrire un message… (Entrée pour envoyer)"
              rows={1}
              style={{
                flex:            1,
                resize:          'none',
                padding:         '8px 12px',
                fontSize:        13,
                border:          '1px solid var(--border)',
                borderRadius:    8,
                backgroundColor: 'var(--bg-elevated)',
                color:           'var(--text-primary)',
                outline:         'none',
                lineHeight:      1.5,
                maxHeight:       120,
                overflowY:       'auto',
                fontFamily:      'inherit',
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              title="Envoyer"
              aria-label="Envoyer le message"
              style={{
                display:         'flex',
                alignItems:      'center',
                justifyContent:  'center',
                width:           38,
                height:          38,
                borderRadius:    8,
                border:          'none',
                backgroundColor: 'var(--accent)',
                color:           '#fff',
                cursor:          !input.trim() || sending ? 'not-allowed' : 'pointer',
                opacity:         !input.trim() || sending ? 0.5 : 1,
                flexShrink:      0,
                transition:      'opacity 150ms ease',
              }}
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      ) : (
        <div style={{
          flex:           1,
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          justifyContent: 'center',
          gap:            12,
          color:          'var(--text-muted)',
        }}>
          <MessageSquare size={44} strokeWidth={1} />
          <p style={{ fontSize: 14 }}>Sélectionnez une conversation</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            ou attendez qu'un client vous contacte
          </p>
        </div>
      )}
    </div>
  )
}
