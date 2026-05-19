import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import {
  ApiError,
  fetchMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationResponse,
} from '@/lib/api'
import { useSession } from '@/lib/ctx'
import { Colors, Spacing, Radius, Fonts } from '@/lib/theme'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60)       return 'À l’instant'
  if (diff < 3600)     return `il y a ${Math.floor(diff / 60)} min`
  if (diff < 86_400)   return `il y a ${Math.floor(diff / 3600)} h`
  if (diff < 604_800)  return `il y a ${Math.floor(diff / 86_400)} j`
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

const CHANNEL_META: Record<string, { icon: keyof typeof Ionicons.glyphMap; tint: 'accent' | 'warning' | 'danger' | 'success' }> = {
  service_reminder:     { icon: 'construct-outline',         tint: 'accent' },
  maintenance_reminder: { icon: 'shield-checkmark-outline',  tint: 'warning' },
  stock_alert:          { icon: 'cube-outline',              tint: 'danger' },
  default:              { icon: 'notifications-outline',     tint: 'accent' },
}

function metaFor(channel: string | null) {
  return CHANNEL_META[channel ?? ''] ?? CHANNEL_META.default
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const scheme = useColorScheme() ?? 'light'
  const c      = Colors[scheme]
  const styles = makeStyles(c)
  const { signOut } = useSession()

  const [items,      setItems]      = useState<NotificationResponse[]>([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const list = await fetchMyNotifications()
      setItems(list)
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) signOut()
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [signOut])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const unreadCount = items.filter(n => !n.isRead).length

  async function handleMarkRead(id: number) {
    // Optimistic update
    setItems(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    try {
      await markNotificationRead(id)
    } catch { /* on garde l'optimistic */ }
  }

  async function handleMarkAllRead() {
    setItems(prev => prev.map(n => ({ ...n, isRead: true })))
    try { await markAllNotificationsRead() } catch { /* ignore */ }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <Stack.Screen
        options={{
          title: 'Notifications',
          headerRight: () =>
            unreadCount > 0 ? (
              <Pressable
                onPress={handleMarkAllRead}
                hitSlop={8}
                style={({ pressed }) => ({ paddingHorizontal: 4, opacity: pressed ? 0.6 : 1 })}
              >
                <Text style={{ fontFamily: Fonts.bodySemibold, fontSize: 14, color: c.accent }}>
                  Tout marquer lu
                </Text>
              </Pressable>
            ) : null,
        }}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={c.accent} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="notifications-off-outline" size={32} color={c.accent} />
          </View>
          <Text style={styles.emptyTitle}>Tout est calme.</Text>
          <Text style={styles.emptyBody}>
            Nous vous notifierons des échéances de vos véhicules et de l&apos;avancée de vos rendez-vous.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={n => String(n.id)}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} tintColor={c.accent} />
          }
          renderItem={({ item }) => (
            <NotifRow notif={item} onPress={() => !item.isRead && handleMarkRead(item.id)} c={c} />
          )}
        />
      )}
    </SafeAreaView>
  )
}

function NotifRow({
  notif, onPress, c,
}: {
  notif: NotificationResponse
  onPress: () => void
  c: typeof Colors.light
}) {
  const styles = makeStyles(c)
  const meta = metaFor(notif.channel)
  const tintMap = {
    accent:  { bg: c.accentMuted,  color: c.accent  },
    warning: { bg: c.warningMuted, color: c.warning },
    danger:  { bg: c.dangerMuted,  color: c.danger  },
    success: { bg: c.successMuted, color: c.success },
  } as const
  const tint = tintMap[meta.tint]

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !notif.isRead && styles.rowUnread,
        pressed && { opacity: 0.92 },
      ]}
    >
      <View style={[styles.icon, { backgroundColor: tint.bg }]}>
        <Ionicons name={meta.icon} size={18} color={tint.color} />
      </View>

      <View style={{ flex: 1, gap: 2 }}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, !notif.isRead && { fontFamily: Fonts.bodySemibold }]}>
            {notif.title}
          </Text>
          {!notif.isRead && <View style={[styles.unreadDot, { backgroundColor: c.accent }]} />}
        </View>
        <Text style={styles.message} numberOfLines={3}>{notif.message}</Text>
        <Text style={styles.time}>{timeAgo(notif.sentAt)}</Text>
      </View>
    </Pressable>
  )
}

function makeStyles(c: typeof Colors.light) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bgBase },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    listContent: {
      padding: Spacing.lg,
      paddingBottom: Spacing['2xl'],
    },

    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.md,
      backgroundColor: c.bgSurface,
      borderRadius: Radius.lg,
      borderWidth: 1, borderColor: c.border,
      padding: Spacing.lg,
    },
    rowUnread: {
      backgroundColor: c.bgSurface,
      borderColor: c.accent,
    },
    icon: {
      width: 38, height: 38, borderRadius: Radius.md,
      alignItems: 'center', justifyContent: 'center',
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    title: {
      flex: 1,
      fontFamily: Fonts.bodyMedium,
      fontSize: 15,
      color: c.text,
    },
    unreadDot: {
      width: 8, height: 8, borderRadius: 4,
    },
    message: {
      fontFamily: Fonts.body,
      fontSize: 13,
      color: c.textSecondary,
      lineHeight: 19,
    },
    time: {
      fontFamily: Fonts.body,
      fontSize: 11,
      color: c.textMuted,
      marginTop: 2,
    },

    emptyState: {
      flex: 1, alignItems: 'center', justifyContent: 'center',
      padding: Spacing.xl, gap: Spacing.md,
    },
    emptyIcon: {
      width: 64, height: 64, borderRadius: Radius.lg,
      backgroundColor: c.accentMuted,
      alignItems: 'center', justifyContent: 'center',
      marginBottom: Spacing.sm,
    },
    emptyTitle: {
      fontFamily: Fonts.displayItalic,
      fontSize: 28, color: c.text,
      letterSpacing: -0.5,
    },
    emptyBody: {
      fontFamily: Fonts.body,
      fontSize: 14, color: c.textSecondary,
      textAlign: 'center', lineHeight: 21,
      maxWidth: 320,
    },
  })
}
