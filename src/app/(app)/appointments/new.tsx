import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import {
  ApiError,
  createAppointment,
  fetchGarages,
  fetchMyVehicles,
  type GaragePublic,
  type VehicleResponse,
} from '@/lib/api'
import { Colors, Spacing, Radius, Fonts } from '@/lib/theme'

// ─── Date helpers ────────────────────────────────────────────────────────────

function pad(n: number) { return String(n).padStart(2, '0') }
function toISODate(d: Date)   { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }
function fmtDateLong(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })
}

function nextSevenDays(): string[] {
  const out: string[] = []
  const now = new Date()
  for (let i = 0; i < 14; i++) {
    const d = new Date(now)
    d.setDate(now.getDate() + i)
    out.push(toISODate(d))
  }
  return out
}

const HOURS = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00']

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function NewAppointmentScreen() {
  const scheme = useColorScheme() ?? 'light'
  const c      = Colors[scheme]
  const styles = makeStyles(c)
  const router = useRouter()

  const [vehicles, setVehicles] = useState<VehicleResponse[]>([])
  const [garages,  setGarages]  = useState<GaragePublic[]>([])
  const [loadingLists, setLoadingLists] = useState(true)
  const [loadError,    setLoadError]    = useState<string | null>(null)

  const [vehicleId, setVehicleId] = useState<number | null>(null)
  const [garageId,  setGarageId]  = useState<number | null>(null)
  const [date,      setDate]      = useState<string>(toISODate(new Date(Date.now() + 86_400_000))) // tomorrow
  const [time,      setTime]      = useState<string>('09:00')
  const [notes,     setNotes]     = useState<string>('')

  const [vehiclePickerOpen, setVehiclePickerOpen] = useState(false)
  const [garagePickerOpen,  setGaragePickerOpen]  = useState(false)
  const [datePickerOpen,    setDatePickerOpen]    = useState(false)
  const [timePickerOpen,    setTimePickerOpen]    = useState(false)

  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)
  const [notesFocus, setNotesFocus] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetchMyVehicles().catch(() => [] as VehicleResponse[]),
      fetchGarages().catch(() => [] as GaragePublic[]),
    ])
      .then(([v, g]) => {
        if (cancelled) return
        setVehicles(v)
        setGarages(g.filter(x => x.verified))
        if (v.length === 1) setVehicleId(v[0].id)
        if (g.length === 1) setGarageId(g[0].id)
      })
      .catch(e => { if (!cancelled) setLoadError(e instanceof Error ? e.message : 'Erreur de chargement') })
      .finally(() => { if (!cancelled) setLoadingLists(false) })
    return () => { cancelled = true }
  }, [])

  const selectedVehicle = vehicles.find(v => v.id === vehicleId) ?? null
  const selectedGarage  = garages.find(g => g.id === garageId) ?? null

  async function handleSubmit() {
    setError(null)
    if (!vehicleId || !garageId) {
      setError('Sélectionnez un véhicule et un garage.'); return
    }
    setSaving(true)
    try {
      await createAppointment({
        vehicleId,
        garageId,
        requestedDate: `${date}T${time}:00`,
        clientNotes: notes.trim() || undefined,
      })
      router.back()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Impossible de contacter le serveur.')
    } finally {
      setSaving(false)
    }
  }

  if (loadingLists) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><ActivityIndicator color={c.accent} /></View>
      </SafeAreaView>
    )
  }

  if (loadError) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Ionicons name="alert-circle" size={32} color={c.danger} />
          <Text style={styles.errorText}>{loadError}</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (vehicles.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Ionicons name="car-sport-outline" size={36} color={c.accent} />
          <Text style={styles.emptyTitle}>Aucun véhicule.</Text>
          <Text style={styles.errorText}>
            Ajoutez d&apos;abord un véhicule pour pouvoir prendre rendez-vous.
          </Text>
          <Pressable
            onPress={() => { router.back(); setTimeout(() => router.push('/vehicles/new'), 100) }}
            style={styles.primaryBtn}
          >
            <Text style={styles.primaryBtnText}>Ajouter un véhicule</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              onPress={handleSubmit}
              disabled={saving}
              hitSlop={10}
              style={({ pressed }) => ({ opacity: saving ? 0.5 : pressed ? 0.6 : 1 })}
            >
              {saving
                ? <ActivityIndicator color={c.accent} />
                : <Text style={styles.saveBtn}>Demander</Text>}
            </Pressable>
          ),
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={15} color={c.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Vehicle picker */}
          <Section title="Véhicule">
            <PickerButton
              onPress={() => setVehiclePickerOpen(true)}
              label={selectedVehicle
                ? `${selectedVehicle.brand} ${selectedVehicle.model}`
                : 'Sélectionner un véhicule'}
              sublabel={selectedVehicle?.licensePlate}
              icon="car-sport-outline"
              placeholder={!selectedVehicle}
              c={c}
              styles={styles}
            />
          </Section>

          {/* Garage picker */}
          <Section title="Garage">
            <PickerButton
              onPress={() => setGaragePickerOpen(true)}
              label={selectedGarage ? selectedGarage.name : 'Sélectionner un garage'}
              sublabel={selectedGarage?.city ?? undefined}
              icon="business-outline"
              placeholder={!selectedGarage}
              c={c}
              styles={styles}
            />
          </Section>

          {/* Date + time */}
          <Section title="Date et heure souhaitées">
            <View style={styles.row}>
              <View style={{ flex: 1.5 }}>
                <PickerButton
                  onPress={() => setDatePickerOpen(true)}
                  label={fmtDateLong(date)}
                  icon="calendar-outline"
                  c={c}
                  styles={styles}
                />
              </View>
              <View style={{ flex: 1 }}>
                <PickerButton
                  onPress={() => setTimePickerOpen(true)}
                  label={time}
                  icon="time-outline"
                  c={c}
                  styles={styles}
                />
              </View>
            </View>
          </Section>

          {/* Notes */}
          <Section title="Notes (optionnel)">
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Détaillez la prestation souhaitée (vidange, freins…)"
              placeholderTextColor={c.textMuted}
              multiline
              numberOfLines={4}
              style={[styles.textarea, notesFocus && styles.inputFocused]}
              onFocus={() => setNotesFocus(true)}
              onBlur={() => setNotesFocus(false)}
            />
          </Section>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Pickers ── */}
      <BottomSheet
        visible={vehiclePickerOpen}
        title="Choisir un véhicule"
        onClose={() => setVehiclePickerOpen(false)}
        c={c}
      >
        {vehicles.map(v => (
          <SheetRow
            key={v.id}
            label={`${v.brand} ${v.model}`}
            sublabel={`${v.year} · ${v.licensePlate}`}
            selected={v.id === vehicleId}
            onPress={() => { setVehicleId(v.id); setVehiclePickerOpen(false) }}
            c={c}
          />
        ))}
      </BottomSheet>

      <BottomSheet
        visible={garagePickerOpen}
        title="Choisir un garage"
        onClose={() => setGaragePickerOpen(false)}
        c={c}
      >
        {garages.length === 0 ? (
          <Text style={{ padding: Spacing.lg, color: c.textMuted, fontFamily: Fonts.body }}>
            Aucun garage disponible pour le moment.
          </Text>
        ) : garages.map(g => (
          <SheetRow
            key={g.id}
            label={g.name}
            sublabel={g.city ?? undefined}
            selected={g.id === garageId}
            onPress={() => { setGarageId(g.id); setGaragePickerOpen(false) }}
            c={c}
          />
        ))}
      </BottomSheet>

      <BottomSheet
        visible={datePickerOpen}
        title="Choisir une date"
        onClose={() => setDatePickerOpen(false)}
        c={c}
      >
        {nextSevenDays().map(d => (
          <SheetRow
            key={d}
            label={fmtDateLong(d)}
            selected={d === date}
            onPress={() => { setDate(d); setDatePickerOpen(false) }}
            c={c}
          />
        ))}
      </BottomSheet>

      <BottomSheet
        visible={timePickerOpen}
        title="Choisir une heure"
        onClose={() => setTimePickerOpen(false)}
        c={c}
      >
        {HOURS.map(h => (
          <SheetRow
            key={h}
            label={h}
            selected={h === time}
            onPress={() => { setTime(h); setTimePickerOpen(false) }}
            c={c}
          />
        ))}
      </BottomSheet>
    </SafeAreaView>
  )
}

// ─── Components ──────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const scheme = useColorScheme() ?? 'light'
  const c      = Colors[scheme]
  const styles = makeStyles(c)
  return (
    <View style={{ gap: Spacing.sm }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  )
}

function PickerButton({
  onPress, label, sublabel, icon, placeholder, c, styles,
}: {
  onPress: () => void
  label: string
  sublabel?: string
  icon: keyof typeof Ionicons.glyphMap
  placeholder?: boolean
  c: typeof Colors.light
  styles: ReturnType<typeof makeStyles>
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.picker, pressed && { opacity: 0.85 }]}
    >
      <View style={styles.pickerIcon}>
        <Ionicons name={icon} size={18} color={c.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.pickerLabel, placeholder && { color: c.textMuted, fontFamily: Fonts.body }]}>
          {label}
        </Text>
        {sublabel && <Text style={styles.pickerSublabel}>{sublabel}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={16} color={c.textMuted} />
    </Pressable>
  )
}

function BottomSheet({
  visible, title, onClose, children, c,
}: {
  visible: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
  c: typeof Colors.light
}) {
  const styles = makeStyles(c)
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose}>
        <Pressable style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>{title}</Text>
          <ScrollView style={{ maxHeight: 380 }}>{children}</ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

function SheetRow({
  label, sublabel, selected, onPress, c,
}: {
  label: string
  sublabel?: string
  selected: boolean
  onPress: () => void
  c: typeof Colors.light
}) {
  const styles = makeStyles(c)
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.sheetRow, pressed && { backgroundColor: c.bgElevated }]}
    >
      <View style={{ flex: 1 }}>
        <Text style={[
          styles.sheetRowLabel,
          selected && { color: c.accent, fontFamily: Fonts.bodySemibold },
        ]}>
          {label}
        </Text>
        {sublabel && <Text style={styles.sheetRowSublabel}>{sublabel}</Text>}
      </View>
      {selected && <Ionicons name="checkmark" size={18} color={c.accent} />}
    </Pressable>
  )
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
    saveBtn: {
      fontFamily: Fonts.bodySemibold,
      fontSize: 15, color: c.accent,
    },

    errorBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.sm,
      backgroundColor: c.dangerMuted,
      borderRadius: Radius.md,
      padding: Spacing.md,
    },
    errorText: {
      flex: 1,
      color: c.danger, fontSize: 13, lineHeight: 19,
      fontFamily: Fonts.body, textAlign: 'center',
    },
    emptyTitle: {
      fontFamily: Fonts.displayItalic,
      fontSize: 24, color: c.text,
      letterSpacing: -0.4,
    },

    sectionTitle: {
      fontFamily: Fonts.bodySemibold,
      fontSize: 11, color: c.accent,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
    },
    row: { flexDirection: 'row', gap: Spacing.md },

    picker: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      backgroundColor: c.bgSurface,
      borderRadius: Radius.md,
      borderWidth: 1, borderColor: c.border,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
    },
    pickerIcon: {
      width: 36, height: 36, borderRadius: Radius.sm,
      backgroundColor: c.accentMuted,
      alignItems: 'center', justifyContent: 'center',
    },
    pickerLabel: {
      fontFamily: Fonts.bodySemibold,
      fontSize: 15, color: c.text,
    },
    pickerSublabel: {
      fontFamily: Fonts.body,
      fontSize: 12, color: c.textMuted,
      marginTop: 1,
    },

    textarea: {
      backgroundColor: c.bgSurface,
      borderRadius: Radius.md,
      borderWidth: 1, borderColor: c.border,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      fontFamily: Fonts.body,
      fontSize: 15, color: c.text,
      minHeight: 96,
      textAlignVertical: 'top',
    },
    inputFocused: { borderColor: c.accent },

    primaryBtn: {
      backgroundColor: c.accent,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
      marginTop: Spacing.md,
    },
    primaryBtnText: {
      fontFamily: Fonts.bodySemibold,
      fontSize: 15, color: '#FFF', textAlign: 'center',
    },

    sheetBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: c.bgSurface,
      borderTopLeftRadius: Radius.xl,
      borderTopRightRadius: Radius.xl,
      paddingBottom: Spacing.xl,
    },
    sheetHandle: {
      width: 36, height: 4, borderRadius: 2,
      backgroundColor: c.border,
      alignSelf: 'center',
      marginTop: Spacing.sm, marginBottom: Spacing.sm,
    },
    sheetTitle: {
      fontFamily: Fonts.displayItalic,
      fontSize: 22, color: c.text,
      letterSpacing: -0.3,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
    },
    sheetRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
    },
    sheetRowLabel: {
      fontFamily: Fonts.body,
      fontSize: 16, color: c.text,
    },
    sheetRowSublabel: {
      fontFamily: Fonts.body,
      fontSize: 12, color: c.textMuted,
      marginTop: 1,
    },
  })
}
