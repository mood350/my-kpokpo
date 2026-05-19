import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import {
  ApiError,
  fetchMe,
  fetchMyAppointments,
  fetchMyVehicles,
  fetchUnreadCount,
  APPOINTMENT_STATUS_LABELS,
  type AppointmentResponse,
  type UserProfile,
  type VehicleResponse,
} from '@/lib/api'
import { useSession } from '@/lib/ctx'
import { Colors, Spacing, Radius, Fonts } from '@/lib/theme'

export default function HomeScreen() {
  const scheme = useColorScheme() ?? 'light'
  const c      = Colors[scheme]
  const styles = makeStyles(c)
  const router = useRouter()
  const { signOut } = useSession()

  const [me,         setMe]         = useState<UserProfile | null>(null)
  const [vehicles,   setVehicles]   = useState<VehicleResponse[]>([])
  const [appts,      setAppts]      = useState<AppointmentResponse[]>([])
  const [unread,     setUnread]     = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const [meRes, vRes, aRes, uRes] = await Promise.all([
        fetchMe(),
        fetchMyVehicles().catch(() => [] as VehicleResponse[]),
        fetchMyAppointments().catch(() => [] as AppointmentResponse[]),
        fetchUnreadCount().catch(() => ({ unreadCount: 0 })),
      ])
      setMe(meRes); setVehicles(vRes); setAppts(aRes); setUnread(uRes.unreadCount)
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) signOut()
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [signOut])

  useFocusEffect(useCallback(() => { load() }, [load]))

  function onRefresh() { setRefreshing(true); load() }

  // Stats
  const now = Date.now()
  const upcoming = appts
    .filter(a => new Date(a.requestedDate).getTime() >= now && a.status !== 'CANCELLED' && a.status !== 'REJECTED')
    .sort((a, b) => new Date(a.requestedDate).getTime() - new Date(b.requestedDate).getTime())
  const nextAppt = upcoming[0] ?? null
  const pending  = appts.filter(a => a.status === 'PENDING').length

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.accent} />
        }
      >

        {/* ── Greeting + bell ── */}
        <View style={styles.greetingRow}>
          <View style={styles.greeting}>
            {loading ? (
              <ActivityIndicator color={c.accent} />
            ) : (
              <>
                <Text style={styles.eyebrow}>BIENVENUE</Text>
                <Text style={styles.hello}>
                  Bonjour,{'\n'}
                  <Text style={{ color: c.accent }}>{me?.firstName ?? '—'}.</Text>
                </Text>
              </>
            )}
          </View>

          <Pressable
            onPress={() => router.push('/notifications')}
            hitSlop={8}
            style={({ pressed }) => [styles.bellBtn, pressed && { opacity: 0.7 }]}
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={22} color={c.text} />
            {unread > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>
                  {unread > 9 ? '9+' : unread}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* ── KPIs ── */}
        <View style={styles.kpiRow}>
          <KpiCard
            icon="car-sport-outline"
            value={String(vehicles.length)}
            label="Véhicules"
            onPress={() => router.push('/vehicles')}
            c={c}
            styles={styles}
          />
          <KpiCard
            icon="calendar-outline"
            value={String(upcoming.length)}
            label="À venir"
            onPress={() => router.push('/appointments')}
            c={c}
            styles={styles}
          />
          <KpiCard
            icon="hourglass-outline"
            value={String(pending)}
            label="En attente"
            onPress={() => router.push('/appointments')}
            c={c}
            styles={styles}
          />
        </View>

        {/* ── Next appointment ── */}
        {nextAppt ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PROCHAIN RENDEZ-VOUS</Text>
            <Pressable
              onPress={() => router.push('/appointments')}
              style={({ pressed }) => [styles.nextCard, pressed && { opacity: 0.92 }]}
            >
              <View style={styles.nextDate}>
                <Text style={styles.nextDay}>
                  {new Date(nextAppt.confirmedDate ?? nextAppt.requestedDate)
                    .toLocaleDateString('fr-FR', { day: '2-digit' })}
                </Text>
                <Text style={styles.nextMonth}>
                  {new Date(nextAppt.confirmedDate ?? nextAppt.requestedDate)
                    .toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')}
                </Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.nextGarage}>{nextAppt.garage.name}</Text>
                <Text style={styles.nextVehicle}>
                  {nextAppt.vehicle.brand} {nextAppt.vehicle.model} · {nextAppt.vehicle.licensePlate}
                </Text>
                <Text style={styles.nextTime}>
                  {new Date(nextAppt.confirmedDate ?? nextAppt.requestedDate)
                    .toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  {'  ·  '}
                  <Text style={{ color: c.accent, fontFamily: Fonts.bodySemibold }}>
                    {APPOINTMENT_STATUS_LABELS[nextAppt.status]}
                  </Text>
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
            </Pressable>
          </View>
        ) : !loading && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PROCHAIN RENDEZ-VOUS</Text>
            <Pressable
              onPress={() => router.push('/appointments/new')}
              style={({ pressed }) => [styles.emptyCta, pressed && { opacity: 0.9 }]}
            >
              <View style={styles.emptyCtaIcon}>
                <Ionicons name="add" size={20} color={c.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.emptyCtaTitle}>Prendre rendez-vous</Text>
                <Text style={styles.emptyCtaSub}>Demandez un créneau auprès d&apos;un garage</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={c.textMuted} />
            </Pressable>
          </View>
        )}

        {/* ── Quick actions ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RACCOURCIS</Text>
          <View style={styles.actionsRow}>
            <ActionTile
              icon="add-circle-outline"
              label="Ajouter un véhicule"
              onPress={() => router.push('/vehicles/new')}
              c={c} styles={styles}
            />
            <ActionTile
              icon="calendar-outline"
              label="Nouveau RDV"
              onPress={() => router.push('/appointments/new')}
              c={c} styles={styles}
            />
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

function KpiCard({
  icon, value, label, onPress, c, styles,
}: {
  icon: keyof typeof Ionicons.glyphMap
  value: string
  label: string
  onPress: () => void
  c: typeof Colors.light
  styles: ReturnType<typeof makeStyles>
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.kpiCard, pressed && { opacity: 0.88 }]}
    >
      <View style={styles.kpiIcon}>
        <Ionicons name={icon} size={16} color={c.accent} />
      </View>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </Pressable>
  )
}

function ActionTile({
  icon, label, onPress, c, styles,
}: {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  onPress: () => void
  c: typeof Colors.light
  styles: ReturnType<typeof makeStyles>
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.action, pressed && { opacity: 0.9 }]}
    >
      <View style={styles.actionIcon}>
        <Ionicons name={icon} size={20} color={c.accent} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  )
}

function makeStyles(c: typeof Colors.light) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bgBase },
    container: {
      padding: Spacing.xl,
      gap: Spacing.xl,
    },

    greetingRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.md,
      paddingTop: Spacing.md,
    },
    greeting: { gap: Spacing.sm, flex: 1 },
    bellBtn: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: c.bgSurface,
      borderWidth: 1, borderColor: c.border,
      alignItems: 'center', justifyContent: 'center',
      position: 'relative',
    },
    bellBadge: {
      position: 'absolute',
      top: -3, right: -3,
      minWidth: 18, height: 18, borderRadius: 9,
      backgroundColor: c.danger,
      paddingHorizontal: 4,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 2, borderColor: c.bgBase,
    },
    bellBadgeText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 10, color: '#FFF',
    },
    eyebrow: {
      fontFamily: Fonts.bodySemibold,
      fontSize: 11,
      color: c.accent,
      letterSpacing: 1.2,
    },
    hello: {
      fontFamily: Fonts.displayItalic,
      fontSize: 38,
      lineHeight: 44,
      color: c.text,
      letterSpacing: -0.8,
    },

    kpiRow: { flexDirection: 'row', gap: Spacing.md },
    kpiCard: {
      flex: 1,
      backgroundColor: c.bgSurface,
      borderRadius: Radius.lg,
      borderWidth: 1, borderColor: c.border,
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    kpiIcon: {
      width: 30, height: 30, borderRadius: Radius.md,
      backgroundColor: c.accentMuted,
      alignItems: 'center', justifyContent: 'center',
    },
    kpiValue: {
      fontFamily: Fonts.displayItalic,
      fontSize: 28,
      color: c.text,
      letterSpacing: -0.5,
    },
    kpiLabel: {
      fontFamily: Fonts.bodyMedium,
      fontSize: 11, color: c.textSecondary,
      letterSpacing: 0.4,
    },

    section: { gap: Spacing.md },
    sectionTitle: {
      fontFamily: Fonts.bodySemibold,
      fontSize: 11, color: c.textMuted,
      letterSpacing: 1.2,
      paddingHorizontal: Spacing.xs,
    },

    nextCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      backgroundColor: c.bgSurface,
      borderRadius: Radius.lg,
      borderWidth: 1, borderColor: c.border,
      padding: Spacing.lg,
    },
    nextDate: {
      width: 50,
      alignItems: 'center',
    },
    nextDay: {
      fontFamily: Fonts.displayItalic,
      fontSize: 30,
      color: c.accent,
      letterSpacing: -0.5,
      lineHeight: 32,
    },
    nextMonth: {
      fontFamily: Fonts.bodyMedium,
      fontSize: 11,
      color: c.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginTop: 2,
    },
    nextGarage: {
      fontFamily: Fonts.bodySemibold,
      fontSize: 15, color: c.text,
    },
    nextVehicle: {
      fontFamily: Fonts.body,
      fontSize: 12, color: c.textSecondary,
    },
    nextTime: {
      fontFamily: Fonts.body,
      fontSize: 12, color: c.textMuted,
      marginTop: 1,
    },

    emptyCta: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
      backgroundColor: c.bgSurface,
      borderRadius: Radius.lg,
      borderWidth: 1, borderColor: c.border,
      borderStyle: 'dashed',
      padding: Spacing.lg,
    },
    emptyCtaIcon: {
      width: 40, height: 40, borderRadius: Radius.md,
      backgroundColor: c.accentMuted,
      alignItems: 'center', justifyContent: 'center',
    },
    emptyCtaTitle: {
      fontFamily: Fonts.bodySemibold,
      fontSize: 15, color: c.text,
    },
    emptyCtaSub: {
      fontFamily: Fonts.body,
      fontSize: 12, color: c.textSecondary, marginTop: 1,
    },

    actionsRow: { flexDirection: 'row', gap: Spacing.md },
    action: {
      flex: 1,
      backgroundColor: c.bgSurface,
      borderRadius: Radius.lg,
      borderWidth: 1, borderColor: c.border,
      padding: Spacing.lg,
      gap: Spacing.sm,
      alignItems: 'flex-start',
    },
    actionIcon: {
      width: 38, height: 38, borderRadius: Radius.md,
      backgroundColor: c.accentMuted,
      alignItems: 'center', justifyContent: 'center',
    },
    actionLabel: {
      fontFamily: Fonts.bodySemibold,
      fontSize: 13, color: c.text,
    },
  })
}
