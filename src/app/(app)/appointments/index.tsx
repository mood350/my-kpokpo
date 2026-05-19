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
import { Stack, useFocusEffect, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import {
  fetchMyAppointments, ApiError,
  APPOINTMENT_STATUS_LABELS,
  type AppointmentResponse,
  type AppointmentStatus,
} from '@/lib/api'
import { useSession } from '@/lib/ctx'
import { Colors, Spacing, Radius, Fonts } from '@/lib/theme'

function formatDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso)
  return {
    date: d.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'short' }),
    time: d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
  }
}

function statusStyle(s: AppointmentStatus, c: typeof Colors.light) {
  const map: Record<AppointmentStatus, { bg: string; color: string; icon: keyof typeof Ionicons.glyphMap }> = {
    PENDING:     { bg: c.warningMuted, color: c.warning, icon: 'time-outline'       },
    CONFIRMED:   { bg: c.successMuted, color: c.success, icon: 'checkmark-circle'   },
    REJECTED:    { bg: c.dangerMuted,  color: c.danger,  icon: 'close-circle'       },
    RESCHEDULED: { bg: c.accentMuted,  color: c.accent,  icon: 'calendar-outline'   },
    COMPLETED:   { bg: c.accentMuted,  color: c.accent,  icon: 'flag-outline'       },
    CANCELLED:   { bg: c.bgElevated,   color: c.textMuted, icon: 'ban-outline'      },
  }
  return map[s]
}

export default function AppointmentsListScreen() {
  const scheme = useColorScheme() ?? 'light'
  const c      = Colors[scheme]
  const styles = makeStyles(c)
  const router = useRouter()
  const { signOut } = useSession()

  const [appts,      setAppts]      = useState<AppointmentResponse[]>([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const list = await fetchMyAppointments()
      setAppts(list)
      setFetchError(null)
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) { signOut(); return }
      setFetchError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [signOut])

  useFocusEffect(useCallback(() => { load() }, [load]))

  function onRefresh() { setRefreshing(true); load() }

  // Split upcoming / past
  const now = Date.now()
  const upcoming = appts.filter(a => new Date(a.requestedDate).getTime() >= now)
  const past     = appts.filter(a => new Date(a.requestedDate).getTime() <  now)

  type Section = { title: string; data: AppointmentResponse[] }
  const sections: Section[] = []
  if (upcoming.length) sections.push({ title: 'À venir', data: upcoming })
  if (past.length)     sections.push({ title: 'Passés',  data: past     })

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              onPress={() => router.push('/appointments/new')}
              hitSlop={10}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, paddingHorizontal: 4 })}
              accessibilityLabel="Nouveau rendez-vous"
            >
              <Ionicons name="add" size={26} color={c.accent} />
            </Pressable>
          ),
        }}
      />

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={c.accent} /></View>
      ) : fetchError ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle" size={32} color={c.danger} />
          <Text style={styles.errorText}>{fetchError}</Text>
          <Pressable onPress={load} style={styles.ghostBtn}>
            <Text style={styles.ghostBtnText}>Réessayer</Text>
          </Pressable>
        </View>
      ) : appts.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="calendar-outline" size={32} color={c.accent} />
          </View>
          <Text style={styles.emptyTitle}>Aucun rendez-vous.</Text>
          <Text style={styles.emptyBody}>
            Prenez rendez-vous avec un garage pour faire entretenir l&apos;un de vos véhicules.
          </Text>
          <Pressable
            onPress={() => router.push('/appointments/new')}
            style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.88 }]}
          >
            <Ionicons name="add" size={18} color="#FFF" />
            <Text style={styles.primaryBtnText}>Nouveau rendez-vous</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={s => s.title}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.accent} />
          }
          renderItem={({ item }) => (
            <View style={{ gap: Spacing.md, marginBottom: Spacing.xl }}>
              <Text style={styles.sectionTitle}>{item.title.toUpperCase()}</Text>
              {item.data.map(appt => (
                <AppointmentCard key={appt.id} appt={appt} c={c} />
              ))}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  )
}

function AppointmentCard({ appt, c }: { appt: AppointmentResponse; c: typeof Colors.light }) {
  const styles = makeStyles(c)
  const date = appt.confirmedDate ?? appt.requestedDate
  const { date: dateStr, time: timeStr } = formatDateTime(date)
  const sStyle = statusStyle(appt.status, c)

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.dateBlock}>
          <Text style={styles.dateDay}>{timeStr}</Text>
          <Text style={styles.dateMonth}>{dateStr}</Text>
        </View>

        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.garage}>{appt.garage.name}</Text>
          {appt.garage.city && (
            <Text style={styles.city}>
              <Ionicons name="location-outline" size={11} color={c.textMuted} />
              {' '}{appt.garage.city}
            </Text>
          )}
        </View>

        <View style={[styles.statusChip, { backgroundColor: sStyle.bg }]}>
          <Ionicons name={sStyle.icon} size={11} color={sStyle.color} />
          <Text style={[styles.statusText, { color: sStyle.color }]}>
            {APPOINTMENT_STATUS_LABELS[appt.status]}
          </Text>
        </View>
      </View>

      <View style={styles.vehicleRow}>
        <Ionicons name="car-sport-outline" size={14} color={c.textSecondary} />
        <Text style={styles.vehicleText}>
          {appt.vehicle.brand} {appt.vehicle.model}
          <Text style={{ color: c.textMuted }}>  ·  {appt.vehicle.licensePlate}</Text>
        </Text>
      </View>

      {(appt.clientNotes || appt.garageNotes) && (
        <View style={styles.notes}>
          {appt.clientNotes && (
            <Text style={styles.notesText}>
              <Text style={styles.notesLabel}>Vous : </Text>
              {appt.clientNotes}
            </Text>
          )}
          {appt.garageNotes && (
            <Text style={styles.notesText}>
              <Text style={[styles.notesLabel, { color: c.accent }]}>Garage : </Text>
              {appt.garageNotes}
            </Text>
          )}
        </View>
      )}
    </View>
  )
}

function makeStyles(c: typeof Colors.light) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bgBase },
    center: {
      flex: 1, alignItems: 'center', justifyContent: 'center',
      padding: Spacing.xl, gap: Spacing.md,
    },
    errorText: {
      fontFamily: Fonts.body,
      fontSize: 14, color: c.text, textAlign: 'center',
    },
    listContent: {
      padding: Spacing.lg,
      paddingBottom: Spacing['2xl'],
    },

    sectionTitle: {
      fontFamily: Fonts.bodySemibold,
      fontSize: 11, color: c.textMuted,
      letterSpacing: 1.2,
    },

    card: {
      backgroundColor: c.bgSurface,
      borderRadius: Radius.lg,
      borderWidth: 1, borderColor: c.border,
      padding: Spacing.lg,
      gap: Spacing.md,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    dateBlock: {
      width: 56,
      gap: 1,
    },
    dateDay: {
      fontFamily: Fonts.displayItalic,
      fontSize: 20,
      color: c.text,
      letterSpacing: -0.3,
    },
    dateMonth: {
      fontFamily: Fonts.bodyMedium,
      fontSize: 11,
      color: c.textSecondary,
      textTransform: 'capitalize',
    },
    garage: {
      fontFamily: Fonts.bodySemibold,
      fontSize: 15, color: c.text,
    },
    city: {
      fontFamily: Fonts.body,
      fontSize: 12, color: c.textMuted,
    },
    statusChip: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: 8, paddingVertical: 4,
      borderRadius: Radius.sm,
    },
    statusText: {
      fontFamily: Fonts.bodyMedium,
      fontSize: 11,
    },

    vehicleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingTop: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    vehicleText: {
      fontFamily: Fonts.body,
      fontSize: 13, color: c.text,
    },

    notes: { gap: 4 },
    notesText: {
      fontFamily: Fonts.body,
      fontSize: 12, color: c.textSecondary, lineHeight: 18,
    },
    notesLabel: {
      fontFamily: Fonts.bodySemibold,
      color: c.text,
    },

    // Empty
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
    primaryBtn: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      backgroundColor: c.accent,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
      marginTop: Spacing.md,
    },
    primaryBtnText: {
      fontFamily: Fonts.bodySemibold,
      fontSize: 15, color: '#FFF',
    },
    ghostBtn: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      borderWidth: 1, borderColor: c.border,
      borderRadius: Radius.md,
    },
    ghostBtnText: {
      fontFamily: Fonts.bodyMedium,
      fontSize: 14, color: c.textSecondary,
    },
  })
}
