import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import {
  ApiError,
  deleteVehicle,
  fetchMyVehicles,
  FUEL_LABELS,
  type VehicleResponse,
} from '@/lib/api'
import { Colors, Spacing, Radius, Fonts } from '@/lib/theme'

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function expiryColor(iso: string | null, c: typeof Colors.light): string {
  if (!iso) return c.textMuted
  const diff = (new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  if (diff < 0)  return c.danger
  if (diff < 30) return c.warning
  return c.text
}

export default function VehicleDetailScreen() {
  const scheme = useColorScheme() ?? 'light'
  const c      = Colors[scheme]
  const styles = makeStyles(c)
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const vehicleId = Number(id)

  const [vehicle, setVehicle] = useState<VehicleResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    try {
      const list = await fetchMyVehicles()
      const v    = list.find(x => x.id === vehicleId)
      if (!v) { setError('Véhicule introuvable.'); return }
      setVehicle(v)
      setError(null)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [vehicleId])

  useEffect(() => { load() }, [load])

  function askDelete() {
    if (!vehicle) return
    Alert.alert(
      `Supprimer ${vehicle.brand} ${vehicle.model} ?`,
      'Cette action est irréversible. Les rendez-vous liés à ce véhicule resteront dans votre historique.',
      [
        { text: 'Annuler',   style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: doDelete },
      ],
    )
  }

  async function doDelete() {
    if (!vehicle) return
    setDeleting(true)
    try {
      await deleteVehicle(vehicle.id)
      router.back()
    } catch (e) {
      Alert.alert(
        'Suppression impossible',
        e instanceof ApiError ? e.message : 'Impossible de contacter le serveur.',
      )
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><ActivityIndicator color={c.accent} /></View>
      </SafeAreaView>
    )
  }

  if (error || !vehicle) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Ionicons name="alert-circle" size={32} color={c.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Stack.Screen options={{ title: vehicle.brand }} />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="car-sport" size={32} color={c.accent} />
          </View>
          <Text style={styles.heroTitle}>{vehicle.brand} {vehicle.model}</Text>
          <Text style={styles.heroSub}>{vehicle.year} · {FUEL_LABELS[vehicle.fuelType]}</Text>
          <View style={styles.heroPlate}>
            <Text style={styles.heroPlateText}>{vehicle.licensePlate}</Text>
          </View>
        </View>

        {/* Specs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CARACTÉRISTIQUES</Text>
          <View style={styles.card}>
            <Row icon="speedometer-outline" label="Kilométrage"
                 value={vehicle.currentMileage != null
                   ? vehicle.currentMileage.toLocaleString('fr-FR') + ' km'
                   : '—'} c={c} />
            <Separator c={c} />
            <Row icon="barcode-outline" label="Numéro VIN" value={vehicle.vin ?? '—'} mono c={c} />
          </View>
        </View>

        {/* Échéances */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ÉCHÉANCES</Text>
          <View style={styles.card}>
            <Row
              icon="shield-checkmark-outline"
              label="Assurance"
              value={fmtDate(vehicle.insuranceExpiry)}
              valueColor={expiryColor(vehicle.insuranceExpiry, c)}
              c={c}
            />
            <Separator c={c} />
            <Row
              icon="document-text-outline"
              label="Contrôle technique"
              value={fmtDate(vehicle.technicalInspectionExpiry)}
              valueColor={expiryColor(vehicle.technicalInspectionExpiry, c)}
              c={c}
            />
          </View>
        </View>

        {/* Prochain entretien */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PROCHAIN ENTRETIEN</Text>
          <View style={styles.card}>
            <Row
              icon="calendar-outline"
              label="Date prévue"
              value={fmtDate(vehicle.nextServiceDate)}
              valueColor={expiryColor(vehicle.nextServiceDate, c)}
              c={c}
            />
            <Separator c={c} />
            <Row
              icon="speedometer-outline"
              label="Kilométrage cible"
              value={vehicle.nextServiceMileage != null
                ? vehicle.nextServiceMileage.toLocaleString('fr-FR') + ' km'
                : '—'}
              c={c}
            />
          </View>
        </View>

        {/* Delete */}
        <Pressable
          onPress={askDelete}
          disabled={deleting}
          style={({ pressed }) => [
            styles.deleteBtn,
            pressed && { opacity: 0.85 },
            deleting && { opacity: 0.5 },
          ]}
        >
          {deleting
            ? <ActivityIndicator color={c.danger} />
            : (
              <>
                <Ionicons name="trash-outline" size={18} color={c.danger} />
                <Text style={styles.deleteBtnText}>Supprimer ce véhicule</Text>
              </>
            )}
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  )
}

function Row({
  icon, label, value, valueColor, mono, c,
}: {
  icon:  keyof typeof Ionicons.glyphMap
  label: string
  value: string
  valueColor?: string
  mono?: boolean
  c: typeof Colors.light
}) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
      paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    }}>
      <View style={{
        width: 32, height: 32, borderRadius: Radius.md,
        backgroundColor: c.accentMuted,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Ionicons name={icon} size={15} color={c.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{
          fontFamily: Fonts.bodyMedium,
          fontSize: 11, color: c.textSecondary,
          letterSpacing: 0.8, textTransform: 'uppercase',
        }}>{label}</Text>
        <Text style={{
          fontFamily: mono ? (process.env.EXPO_OS === 'ios' ? 'Menlo' : 'monospace') : Fonts.body,
          fontSize: 15, color: valueColor ?? c.text, marginTop: 2,
        }}>
          {value}
        </Text>
      </View>
    </View>
  )
}

function Separator({ c }: { c: typeof Colors.light }) {
  return <View style={{ height: 1, backgroundColor: c.border, marginLeft: Spacing.lg + 32 + Spacing.md }} />
}

function makeStyles(c: typeof Colors.light) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bgBase },
    center: {
      flex: 1, alignItems: 'center', justifyContent: 'center',
      padding: Spacing.xl, gap: Spacing.md,
    },
    container: {
      padding: Spacing.xl,
      gap: Spacing.xl,
      paddingBottom: Spacing['3xl'],
    },
    errorText: {
      fontFamily: Fonts.body,
      fontSize: 14, color: c.text, textAlign: 'center',
    },

    hero: {
      alignItems: 'center',
      gap: Spacing.sm,
      paddingTop: Spacing.lg,
    },
    heroIcon: {
      width: 80, height: 80, borderRadius: Radius.xl,
      backgroundColor: c.accentMuted,
      alignItems: 'center', justifyContent: 'center',
      marginBottom: Spacing.sm,
    },
    heroTitle: {
      fontFamily: Fonts.displayItalic,
      fontSize: 32, color: c.text,
      letterSpacing: -0.6,
      textAlign: 'center',
    },
    heroSub: {
      fontFamily: Fonts.body,
      fontSize: 14, color: c.textSecondary,
    },
    heroPlate: {
      backgroundColor: c.bgElevated,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      marginTop: Spacing.sm,
    },
    heroPlateText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 14,
      letterSpacing: 2,
      color: c.text,
    },

    section: { gap: Spacing.md },
    sectionTitle: {
      fontFamily: Fonts.bodySemibold,
      fontSize: 11, color: c.accent,
      letterSpacing: 1.2,
      paddingHorizontal: Spacing.xs,
    },
    card: {
      backgroundColor: c.bgSurface,
      borderRadius: Radius.lg,
      borderWidth: 1, borderColor: c.border,
      overflow: 'hidden',
    },

    deleteBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      backgroundColor: c.dangerMuted,
      borderRadius: Radius.md,
      paddingVertical: Spacing.md,
      marginTop: Spacing.sm,
    },
    deleteBtnText: {
      fontFamily: Fonts.bodySemibold,
      fontSize: 15, color: c.danger,
    },
  })
}
