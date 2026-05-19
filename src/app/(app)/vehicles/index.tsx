import { useCallback, useEffect, useState } from 'react'
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
import { useRouter, useFocusEffect, Stack } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import {
  fetchMyVehicles, ApiError,
  FUEL_LABELS,
  type VehicleResponse,
} from '@/lib/api'
import { useSession } from '@/lib/ctx'
import { Colors, Spacing, Radius, Fonts } from '@/lib/theme'

function formatMileage(km: number | null): string {
  if (km == null) return '—'
  return km.toLocaleString('fr-FR') + ' km'
}

function expiryStatus(iso: string | null): 'ok' | 'soon' | 'expired' | 'none' {
  if (!iso) return 'none'
  const diff = (new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  if (diff < 0)  return 'expired'
  if (diff < 30) return 'soon'
  return 'ok'
}

export default function VehiclesListScreen() {
  const scheme = useColorScheme() ?? 'light'
  const c      = Colors[scheme]
  const styles = makeStyles(c)
  const router = useRouter()
  const { signOut } = useSession()

  const [vehicles,    setVehicles]    = useState<VehicleResponse[]>([])
  const [loading,     setLoading]     = useState(true)
  const [refreshing,  setRefreshing]  = useState(false)
  const [fetchError,  setFetchError]  = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const list = await fetchMyVehicles()
      setVehicles(list)
      setFetchError(null)
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) { signOut(); return }
      setFetchError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [signOut])

  // Reload every time the screen gains focus (e.g. after creating a vehicle).
  useFocusEffect(useCallback(() => { load() }, [load]))

  function onRefresh() { setRefreshing(true); load() }

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              onPress={() => router.push('/vehicles/new')}
              hitSlop={10}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, paddingHorizontal: 4 })}
              accessibilityLabel="Ajouter un véhicule"
            >
              <Ionicons name="add" size={26} color={c.accent} />
            </Pressable>
          ),
        }}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={c.accent} />
        </View>
      ) : fetchError ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle" size={32} color={c.danger} />
          <Text style={styles.errorText}>{fetchError}</Text>
          <Pressable onPress={load} style={styles.ghostBtn}>
            <Text style={styles.ghostBtnText}>Réessayer</Text>
          </Pressable>
        </View>
      ) : vehicles.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="car-sport-outline" size={32} color={c.accent} />
          </View>
          <Text style={styles.emptyTitle}>Aucun véhicule.</Text>
          <Text style={styles.emptyBody}>
            Ajoutez votre premier véhicule pour suivre son entretien et prendre rendez-vous.
          </Text>
          <Pressable
            onPress={() => router.push('/vehicles/new')}
            style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.88 }]}
          >
            <Ionicons name="add" size={18} color="#FFF" />
            <Text style={styles.primaryBtnText}>Ajouter un véhicule</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={v => String(v.id)}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.accent} />
          }
          renderItem={({ item }) => (
            <VehicleCard vehicle={item} c={c} onPress={() => router.push(`/vehicles/${item.id}`)} />
          )}
        />
      )}
    </SafeAreaView>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function VehicleCard({
  vehicle: v, c, onPress,
}: {
  vehicle: VehicleResponse
  c:       typeof Colors.light
  onPress: () => void
}) {
  const styles = makeStyles(c)

  const insStatus = expiryStatus(v.insuranceExpiry)
  const ctStatus  = expiryStatus(v.technicalInspectionExpiry)

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] }]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.carIcon}>
          <Ionicons name="car-sport" size={20} color={c.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.brandModel}>{v.brand} {v.model}</Text>
          <Text style={styles.year}>{v.year} · {FUEL_LABELS[v.fuelType]}</Text>
        </View>
        <View style={styles.plate}>
          <Text style={styles.plateText}>{v.licensePlate}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.footerItem}>
          <Text style={styles.footerLabel}>KILOMÉTRAGE</Text>
          <Text style={styles.footerValue}>{formatMileage(v.currentMileage)}</Text>
        </View>

        <View style={styles.footerDivider} />

        <ExpiryChip label="Assurance" status={insStatus} c={c} />
        <ExpiryChip label="C.T." status={ctStatus} c={c} />
      </View>
    </Pressable>
  )
}

function ExpiryChip({
  label, status, c,
}: {
  label: string
  status: 'ok' | 'soon' | 'expired' | 'none'
  c: typeof Colors.light
}) {
  const config = {
    ok:      { bg: c.successMuted, color: c.success, icon: 'checkmark-circle' as const },
    soon:    { bg: c.warningMuted, color: c.warning, icon: 'time' as const            },
    expired: { bg: c.dangerMuted,  color: c.danger,  icon: 'alert-circle' as const   },
    none:    { bg: c.bgElevated,   color: c.textMuted, icon: 'help-circle' as const  },
  }[status]

  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: config.bg,
      borderRadius: Radius.sm,
      paddingHorizontal: 8, paddingVertical: 4,
    }}>
      <Ionicons name={config.icon} size={11} color={config.color} />
      <Text style={{
        fontFamily: Fonts.bodyMedium,
        fontSize: 11, color: config.color,
      }}>
        {label}
      </Text>
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
    carIcon: {
      width: 44, height: 44, borderRadius: Radius.md,
      backgroundColor: c.accentMuted,
      alignItems: 'center', justifyContent: 'center',
    },
    brandModel: {
      fontFamily: Fonts.displayItalic,
      fontSize: 20,
      color: c.text,
      letterSpacing: -0.3,
    },
    year: {
      fontFamily: Fonts.body,
      fontSize: 12, color: c.textSecondary,
      marginTop: 1,
    },
    plate: {
      backgroundColor: c.bgElevated,
      borderRadius: Radius.sm,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
    },
    plateText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 12,
      letterSpacing: 1,
      color: c.text,
    },

    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      flexWrap: 'wrap',
    },
    footerItem: { gap: 1 },
    footerLabel: {
      fontFamily: Fonts.bodyMedium,
      fontSize: 9, color: c.textMuted,
      letterSpacing: 0.8,
    },
    footerValue: {
      fontFamily: Fonts.bodySemibold,
      fontSize: 13, color: c.text,
    },
    footerDivider: {
      width: 1, height: 22, backgroundColor: c.border,
      marginHorizontal: Spacing.xs,
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
      paddingHorizontal: Spacing.lg,
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
