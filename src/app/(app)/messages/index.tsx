import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useFocusEffect, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import {
  fetchMyConversations,
  fetchGarages,
  getOrCreateConversation,
  markConversationRead,
  type Conversation,
  type GaragePublic,
} from '@/lib/api'
import { Colors, Fonts, Radius, Spacing } from '@/lib/theme'

function relativeTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60)    return "À l'instant"
  if (diff < 3600)  return `${Math.floor(diff / 60)}min`
  if (diff < 86400) return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

export default function MessagesScreen() {
  const scheme = useColorScheme() ?? 'light'
  const c      = Colors[scheme]
  const styles = makeStyles(c)
  const router = useRouter()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading,       setLoading]       = useState(true)
  const [refreshing,    setRefreshing]    = useState(false)
  const [error,         setError]         = useState<string | null>(null)

  // Garage picker state
  const [pickerOpen,   setPickerOpen]   = useState(false)
  const [garages,      setGarages]      = useState<GaragePublic[]>([])
  const [loadingGarages, setLoadingGarages] = useState(false)
  const [starting,     setStarting]     = useState(false)

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true)
    setError(null)
    try {
      const data = await fetchMyConversations()
      setConversations(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  function onRefresh() { setRefreshing(true); load(true) }

  async function openGaragePicker() {
    setPickerOpen(true)
    if (garages.length > 0) return
    setLoadingGarages(true)
    try {
      const list = await fetchGarages()
      setGarages(list.filter(g => g.verified))
    } catch { /* ignore */ } finally {
      setLoadingGarages(false)
    }
  }

  async function handleSelectGarage(garage: GaragePublic) {
    setPickerOpen(false)
    setStarting(true)
    try {
      const conv = await getOrCreateConversation(garage.id)
      router.push(`/(app)/messages/${conv.id}`)
      await load(true)
    } catch { /* ignore */ } finally {
      setStarting(false)
    }
  }

  function handleOpen(conv: Conversation) {
    markConversationRead(conv.id).catch(() => null)
    router.push(`/(app)/messages/${conv.id}`)
  }

  function renderItem({ item }: { item: Conversation }) {
    const initials  = item.garageName.slice(0, 2).toUpperCase()
    const hasUnread = item.unreadCount > 0

    return (
      <Pressable
        onPress={() => handleOpen(item)}
        style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        <View style={styles.info}>
          <View style={styles.rowTop}>
            <Text style={[styles.garageName, hasUnread && styles.bold]} numberOfLines={1}>
              {item.garageName}
            </Text>
            <Text style={styles.time}>{relativeTime(item.updatedAt)}</Text>
          </View>
          <Text style={[styles.lastMsg, hasUnread && styles.lastMsgUnread]} numberOfLines={1}>
            {item.lastMessage ?? 'Démarrer la conversation'}
          </Text>
        </View>

        {hasUnread && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {item.unreadCount > 9 ? '9+' : item.unreadCount}
            </Text>
          </View>
        )}
      </Pressable>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Bouton "+" dans le header */}
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              onPress={openGaragePicker}
              hitSlop={10}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, paddingHorizontal: 4 })}
              accessibilityLabel="Nouveau message"
            >
              {starting
                ? <ActivityIndicator color={c.accent} size="small" />
                : <Ionicons name="create-outline" size={24} color={c.accent} />
              }
            </Pressable>
          ),
        }}
      />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={c.accent} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={40} color={c.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => load()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Réessayer</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={i => String(i.id)}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.accent} />
          }
          contentContainerStyle={
            conversations.length === 0 ? styles.emptyContainer : styles.listContent
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={52} color={c.textMuted} />
              <Text style={styles.emptyTitle}>Aucune conversation</Text>
              <Text style={styles.emptySubtitle}>
                Écrivez directement à un garage pour poser vos questions.
              </Text>
              <Pressable
                onPress={openGaragePicker}
                style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
              >
                <Ionicons name="create-outline" size={16} color="#fff" />
                <Text style={styles.primaryBtnText}>Écrire à un garage</Text>
              </Pressable>
            </View>
          }
        />
      )}

      {/* Sélecteur de garage */}
      <Modal
        visible={pickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setPickerOpen(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: c.bgSurface }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: c.text }]}>Choisir un garage</Text>

            {loadingGarages ? (
              <View style={{ padding: Spacing.xl }}>
                <ActivityIndicator color={c.accent} />
              </View>
            ) : garages.length === 0 ? (
              <Text style={[styles.emptySubtitle, { padding: Spacing.lg }]}>
                Aucun garage disponible pour le moment.
              </Text>
            ) : (
              <ScrollView style={{ maxHeight: 400 }}>
                {garages.map(g => (
                  <Pressable
                    key={g.id}
                    onPress={() => handleSelectGarage(g)}
                    style={({ pressed }) => [
                      styles.garageRow,
                      { borderBottomColor: c.border },
                      pressed && { backgroundColor: c.bgElevated },
                    ]}
                  >
                    <View style={[styles.garageAvatar, { backgroundColor: c.accentMuted }]}>
                      <Text style={[styles.avatarText, { color: c.accent }]}>
                        {g.name.slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.garageName, { color: c.text }]}>{g.name}</Text>
                      {g.city && (
                        <Text style={[styles.lastMsg, { color: c.textMuted }]}>{g.city}</Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={c.textMuted} />
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  )
}

function makeStyles(c: typeof Colors.light) {
  return StyleSheet.create({
    container:      { flex: 1, backgroundColor: c.bgBase },
    centered:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
    listContent:    { paddingVertical: Spacing.sm },
    emptyContainer: { flexGrow: 1 },

    row: {
      flexDirection:     'row',
      alignItems:        'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical:   Spacing.md,
      backgroundColor:   c.bgSurface,
      gap:               Spacing.md,
    },
    avatar: {
      width:           44,
      height:          44,
      borderRadius:    22,
      backgroundColor: c.accentMuted,
      alignItems:      'center',
      justifyContent:  'center',
      flexShrink:      0,
    },
    avatarText:    { fontFamily: Fonts.bodySemibold, fontSize: 15, color: c.accent },
    info:          { flex: 1, minWidth: 0 },
    rowTop:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
    garageName:    { fontFamily: Fonts.bodyMedium, fontSize: 14, color: c.text, flex: 1 },
    bold:          { fontFamily: Fonts.bodyBold },
    time:          { fontFamily: Fonts.body, fontSize: 11, color: c.textMuted, marginLeft: Spacing.sm },
    lastMsg:       { fontFamily: Fonts.body, fontSize: 13, color: c.textMuted },
    lastMsgUnread: { color: c.textSecondary, fontFamily: Fonts.bodyMedium },
    badge: {
      minWidth:          20,
      height:            20,
      borderRadius:      10,
      backgroundColor:   c.accent,
      alignItems:        'center',
      justifyContent:    'center',
      paddingHorizontal: 4,
      flexShrink:        0,
    },
    badgeText:  { color: '#fff', fontSize: 10, fontWeight: '700' },
    separator:  { height: 1, backgroundColor: c.border, marginLeft: 76 },

    empty: {
      flex:           1,
      alignItems:     'center',
      justifyContent: 'center',
      padding:        Spacing['2xl'],
      gap:            Spacing.md,
    },
    emptyTitle:    { fontFamily: Fonts.bodySemibold, fontSize: 16, color: c.text, textAlign: 'center' },
    emptySubtitle: { fontFamily: Fonts.body, fontSize: 14, color: c.textMuted, textAlign: 'center', lineHeight: 20 },
    primaryBtn: {
      flexDirection:     'row',
      alignItems:        'center',
      gap:               Spacing.sm,
      backgroundColor:   c.accent,
      borderRadius:      Radius.pill,
      paddingHorizontal: Spacing.xl,
      paddingVertical:   Spacing.md,
      marginTop:         Spacing.sm,
    },
    primaryBtnText: { fontFamily: Fonts.bodySemibold, fontSize: 14, color: '#fff' },
    errorText:      { fontFamily: Fonts.body, fontSize: 14, color: c.textSecondary, textAlign: 'center' },
    retryBtn:       { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, backgroundColor: c.accentMuted, borderRadius: Radius.pill },
    retryText:      { fontFamily: Fonts.bodyMedium, fontSize: 14, color: c.accent },

    // Garage picker
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    sheet: {
      borderTopLeftRadius:  Radius.xl,
      borderTopRightRadius: Radius.xl,
      paddingBottom:        Spacing['2xl'],
    },
    sheetHandle: {
      width:       36,
      height:      4,
      borderRadius: 2,
      backgroundColor: c.border,
      alignSelf:   'center',
      marginTop:   Spacing.sm,
      marginBottom: Spacing.sm,
    },
    sheetTitle: {
      fontFamily:        Fonts.displayItalic,
      fontSize:          22,
      letterSpacing:     -0.3,
      paddingHorizontal: Spacing.lg,
      paddingVertical:   Spacing.sm,
    },
    garageRow: {
      flexDirection:     'row',
      alignItems:        'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical:   Spacing.md,
      gap:               Spacing.md,
      borderBottomWidth: 1,
    },
    garageAvatar: {
      width:        40,
      height:       40,
      borderRadius: 20,
      alignItems:   'center',
      justifyContent: 'center',
      flexShrink:   0,
    },
  })
}
