import MessagingPage from '@/components/messaging/MessagingPage'

export default function MessagesPage() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3, margin: 0 }}>
          Messagerie
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
          Échangez directement avec vos clients
        </p>
      </div>
      <MessagingPage />
    </div>
  )
}
