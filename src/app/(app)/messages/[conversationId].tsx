import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect, useLocalSearchParams, useNavigation } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import {
  fetchMessages,
  fetchMyConversations,
  markConversationRead,
  sendMessage,
  type Message,
} from '@/lib/api'
import { Colors, Fonts, Radius, Spacing } from '@/lib/theme'

const POLL_INTERVAL = 5_000

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export default function ChatScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>()
  const convId    = Number(conversationId)
  const scheme    = useColorScheme() ?? 'light'
  const c         = Colors[scheme]
  const styles    = makeStyles(c)
  const navigation = useNavigation()

  const [messages,  setMessages]  = useState<Message[]>([])
  const [input,     setInput]     = useState('')
  const [sending,   setSending]   = useState(false)
  const [myUserId,  setMyUserId]  = useState<number | null>(null)
  const listRef = useRef<FlatList>(null)

  // Fetch conversation list to set header title with garage name
  useEffect(() => {
    fetchMyConversations()
      .then(convs => {
        const conv = convs.find(c => c.id === convId)
        if (conv) navigation.setOptions({ title: conv.garageName })
      })
      .catch(() => null)
  }, [convId, navigation])

  // Fetch current user ID to determine message alignment
  useEffect(() => {
    import('@/lib/api').then(({ fetchMe }) =>
      fetchMe().then(me => setMyUserId(me.id)).catch(() => null)
    )
  }, [])

  const loadMessages = useCallback(async () => {
    try {
      const data = await fetchMessages(convId)
      setMessages(data)
    } catch { /* ignore */ }
  }, [convId])

  useFocusEffect(useCallback(() => {
    let active = true

    loadMessages()
    markConversationRead(convId).catch(() => null)

    const id = setInterval(() => { if (active) loadMessages() }, POLL_INTERVAL)
    return () => { active = false; clearInterval(id) }
  }, [convId, loadMessages]))

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80)
    }
  }, [messages.length])

  async function handleSend() {
    const content = input.trim()
    if (!content || sending) return
    setSending(true)
    setInput('')
    try {
      await sendMessage(convId, content)
      await loadMessages()
    } catch { /* ignore */ } finally {
      setSending(false)
    }
  }

  function renderMessage({ item, index }: { item: Message; index: number }) {
    const isOwn    = item.senderId === myUserId
    const prevItem = messages[index - 1]
    const showTime = !prevItem ||
      new Date(item.createdAt).getTime() - new Date(prevItem.createdAt).getTime() > 5 * 60_000

    return (
      <View>
        {showTime && (
          <Text style={styles.timeSeparator}>{formatTime(item.createdAt)}</Text>
        )}
        <View style={[styles.msgRow, isOwn ? styles.msgRowOwn : styles.msgRowOther]}>
          <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
            <Text style={[styles.msgText, isOwn && styles.msgTextOwn]}>
              {item.content}
            </Text>
          </View>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.kbView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Liste des messages */}
        {messages.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="chatbubble-outline" size={44} color={c.textMuted} />
            <Text style={styles.emptyText}>Commencez la conversation !</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={m => String(m.id)}
            renderItem={renderMessage}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        {/* Zone de saisie */}
        <View style={[styles.inputBar, { borderTopColor: c.border }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Écrire un message…"
            placeholderTextColor={c.textMuted}
            multiline
            style={[styles.input, { borderColor: c.border, backgroundColor: c.bgElevated, color: c.text }]}
            returnKeyType="send"
            blurOnSubmit={false}
          />
          <Pressable
            onPress={handleSend}
            disabled={!input.trim() || sending}
            style={[styles.sendBtn, { backgroundColor: c.accent, opacity: !input.trim() || sending ? 0.45 : 1 }]}
            accessibilityLabel="Envoyer"
          >
            {sending
              ? <ActivityIndicator color="#fff" size="small" />
              : <Ionicons name="send" size={18} color="#fff" />
            }
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function makeStyles(c: typeof Colors.light) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bgBase },
    kbView:    { flex: 1 },
    listContent: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: 2 },

    timeSeparator: {
      textAlign:  'center',
      fontSize:   11,
      color:      c.textMuted,
      fontFamily: Fonts.body,
      marginVertical: Spacing.sm,
    },

    msgRow:      { marginVertical: 2 },
    msgRowOwn:   { alignItems: 'flex-end' },
    msgRowOther: { alignItems: 'flex-start' },

    bubble: {
      maxWidth:     '75%',
      paddingHorizontal: Spacing.md,
      paddingVertical:   Spacing.sm,
      borderRadius: Radius.lg,
    },
    bubbleOwn: {
      backgroundColor: c.accent,
      borderBottomRightRadius: Radius.sm,
    },
    bubbleOther: {
      backgroundColor: c.bgElevated,
      borderBottomLeftRadius: Radius.sm,
    },
    msgText:     { fontFamily: Fonts.body, fontSize: 14, color: c.text, lineHeight: 20 },
    msgTextOwn:  { color: '#fff' },

    empty: {
      flex:           1,
      alignItems:     'center',
      justifyContent: 'center',
      gap:            Spacing.md,
    },
    emptyText: {
      fontFamily: Fonts.body,
      fontSize:   14,
      color:      c.textMuted,
    },

    inputBar: {
      flexDirection:  'row',
      alignItems:     'flex-end',
      padding:        Spacing.md,
      gap:            Spacing.sm,
      borderTopWidth: 1,
      backgroundColor: c.bgSurface,
    },
    input: {
      flex:          1,
      maxHeight:     120,
      paddingHorizontal: Spacing.md,
      paddingVertical:   Platform.OS === 'ios' ? 10 : 6,
      fontSize:      14,
      fontFamily:    Fonts.body,
      borderWidth:   1,
      borderRadius:  Radius.xl,
      lineHeight:    20,
    },
    sendBtn: {
      width:         42,
      height:        42,
      borderRadius:  21,
      alignItems:    'center',
      justifyContent: 'center',
      flexShrink:    0,
    },
  })
}
