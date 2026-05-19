import { useState } from 'react'
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
import { useRouter, Stack } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import {
  createVehicle, ApiError,
  FUEL_LABELS,
  type FuelType,
  type VehicleInput,
} from '@/lib/api'
import { Colors, Spacing, Radius, Fonts } from '@/lib/theme'

const FUEL_TYPES: FuelType[] = ['ESSENCE', 'DIESEL', 'HYBRIDE', 'ELECTRIQUE', 'GPL']

export default function NewVehicleScreen() {
  const scheme = useColorScheme() ?? 'light'
  const c      = Colors[scheme]
  const styles = makeStyles(c)
  const router = useRouter()

  const [licensePlate, setLicensePlate]               = useState('')
  const [brand,        setBrand]                       = useState('')
  const [model,        setModel]                       = useState('')
  const [year,         setYear]                        = useState(String(new Date().getFullYear()))
  const [fuelType,     setFuelType]                    = useState<FuelType>('ESSENCE')
  const [mileage,      setMileage]                     = useState('')
  const [vin,          setVin]                         = useState('')
  const [insuranceExp, setInsuranceExp]                = useState('')
  const [ctExp,        setCtExp]                       = useState('')
  const [nextSrvDate,  setNextSrvDate]                 = useState('')
  const [nextSrvKm,    setNextSrvKm]                   = useState('')

  const [fuelPickerOpen, setFuelPickerOpen] = useState(false)
  const [saving,         setSaving]         = useState(false)
  const [error,          setError]          = useState<string | null>(null)
  const [focused,        setFocused]        = useState<string | null>(null)

  async function handleSubmit() {
    setError(null)

    if (!licensePlate.trim() || !brand.trim() || !model.trim() || !year) {
      setError('Plaque, marque, modèle et année sont obligatoires.')
      return
    }
    const yearNum = Number(year)
    if (!Number.isInteger(yearNum) || yearNum < 1900 || yearNum > 2100) {
      setError('Année invalide.')
      return
    }

    const payload: VehicleInput = {
      licensePlate: licensePlate.trim().toUpperCase(),
      brand:        brand.trim(),
      model:        model.trim(),
      year:         yearNum,
      fuelType,
      currentMileage:            mileage      ? Number(mileage) : null,
      vin:                       vin.trim()   || null,
      insuranceExpiry:           insuranceExp || null,
      technicalInspectionExpiry: ctExp        || null,
      nextServiceDate:           nextSrvDate  || null,
      nextServiceMileage:        nextSrvKm    ? Number(nextSrvKm) : null,
    }

    setSaving(true)
    try {
      await createVehicle(payload)
      router.back()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Impossible de contacter le serveur.')
    } finally {
      setSaving(false)
    }
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
                : <Text style={styles.saveBtn}>Enregistrer</Text>}
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

          {/* Identity */}
          <Section title="Identité">
            <Field
              label="Plaque d'immatriculation *"
              value={licensePlate}
              onChangeText={t => setLicensePlate(t.toUpperCase())}
              placeholder="AB 1234 CD"
              autoCapitalize="characters"
              focused={focused === 'plate'}
              onFocus={() => setFocused('plate')}
              onBlur={() => setFocused(null)}
              c={c} styles={styles} mono
            />
            <View style={styles.row}>
              <Field
                label="Marque *"
                value={brand}
                onChangeText={setBrand}
                placeholder="Toyota"
                focused={focused === 'brand'}
                onFocus={() => setFocused('brand')}
                onBlur={() => setFocused(null)}
                c={c} styles={styles} flex
              />
              <Field
                label="Modèle *"
                value={model}
                onChangeText={setModel}
                placeholder="Corolla"
                focused={focused === 'model'}
                onFocus={() => setFocused('model')}
                onBlur={() => setFocused(null)}
                c={c} styles={styles} flex
              />
            </View>
            <View style={styles.row}>
              <Field
                label="Année *"
                value={year}
                onChangeText={setYear}
                placeholder="2019"
                keyboardType="number-pad"
                focused={focused === 'year'}
                onFocus={() => setFocused('year')}
                onBlur={() => setFocused(null)}
                c={c} styles={styles} flex
              />

              {/* Fuel picker */}
              <View style={{ flex: 1, gap: Spacing.sm }}>
                <Text style={styles.label}>Carburant *</Text>
                <Pressable
                  onPress={() => setFuelPickerOpen(true)}
                  style={({ pressed }) => [
                    styles.input,
                    styles.inputAsButton,
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Text style={styles.inputAsButtonText}>{FUEL_LABELS[fuelType]}</Text>
                  <Ionicons name="chevron-down" size={16} color={c.textMuted} />
                </Pressable>
              </View>
            </View>
          </Section>

          {/* Detail */}
          <Section title="Détails (optionnel)">
            <Field
              label="Kilométrage"
              value={mileage}
              onChangeText={setMileage}
              placeholder="45000"
              keyboardType="number-pad"
              focused={focused === 'mileage'}
              onFocus={() => setFocused('mileage')}
              onBlur={() => setFocused(null)}
              c={c} styles={styles}
            />
            <Field
              label="Numéro VIN"
              value={vin}
              onChangeText={t => setVin(t.toUpperCase())}
              placeholder="1HGBH41JXMN109186"
              autoCapitalize="characters"
              focused={focused === 'vin'}
              onFocus={() => setFocused('vin')}
              onBlur={() => setFocused(null)}
              c={c} styles={styles} mono
            />
          </Section>

          <Section title="Échéances">
            <Field
              label="Expiration assurance"
              value={insuranceExp}
              onChangeText={setInsuranceExp}
              placeholder="AAAA-MM-JJ"
              keyboardType="numbers-and-punctuation"
              focused={focused === 'ins'}
              onFocus={() => setFocused('ins')}
              onBlur={() => setFocused(null)}
              c={c} styles={styles} mono
            />
            <Field
              label="Expiration contrôle technique"
              value={ctExp}
              onChangeText={setCtExp}
              placeholder="AAAA-MM-JJ"
              keyboardType="numbers-and-punctuation"
              focused={focused === 'ct'}
              onFocus={() => setFocused('ct')}
              onBlur={() => setFocused(null)}
              c={c} styles={styles} mono
            />
          </Section>

          <Section title="Prochain entretien (rappel)">
            <Field
              label="Date prévue"
              value={nextSrvDate}
              onChangeText={setNextSrvDate}
              placeholder="AAAA-MM-JJ"
              keyboardType="numbers-and-punctuation"
              focused={focused === 'srvDate'}
              onFocus={() => setFocused('srvDate')}
              onBlur={() => setFocused(null)}
              c={c} styles={styles} mono
            />
            <Field
              label="Kilométrage cible"
              value={nextSrvKm}
              onChangeText={setNextSrvKm}
              placeholder="55000"
              keyboardType="number-pad"
              focused={focused === 'srvKm'}
              onFocus={() => setFocused('srvKm')}
              onBlur={() => setFocused(null)}
              c={c} styles={styles}
            />
          </Section>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Fuel picker modal */}
      <Modal
        visible={fuelPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setFuelPickerOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setFuelPickerOpen(false)}>
          <Pressable style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Type de carburant</Text>
            {FUEL_TYPES.map(t => (
              <Pressable
                key={t}
                onPress={() => { setFuelType(t); setFuelPickerOpen(false) }}
                style={({ pressed }) => [
                  styles.modalRow,
                  pressed && { backgroundColor: c.bgElevated },
                ]}
              >
                <Text style={[
                  styles.modalRowText,
                  fuelType === t && { color: c.accent, fontFamily: Fonts.bodySemibold },
                ]}>
                  {FUEL_LABELS[t]}
                </Text>
                {fuelType === t && <Ionicons name="checkmark" size={18} color={c.accent} />}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  )
}

// ─── Components ───────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const scheme = useColorScheme() ?? 'light'
  const c      = Colors[scheme]
  const styles = makeStyles(c)
  return (
    <View style={{ gap: Spacing.md }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={{ gap: Spacing.md }}>{children}</View>
    </View>
  )
}

interface FieldProps {
  label: string
  value: string
  onChangeText: (s: string) => void
  placeholder: string
  autoCapitalize?: 'none' | 'sentences' | 'characters'
  keyboardType?: 'default' | 'number-pad' | 'numbers-and-punctuation'
  focused: boolean
  onFocus: () => void
  onBlur: () => void
  c: typeof Colors.light
  styles: ReturnType<typeof makeStyles>
  flex?: boolean
  mono?: boolean
}

function Field(props: FieldProps) {
  const { label, value, onChangeText, placeholder, autoCapitalize, keyboardType,
          focused, onFocus, onBlur, c, styles, flex, mono } = props
  return (
    <View style={{ gap: Spacing.sm, flex: flex ? 1 : undefined }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.textMuted}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        keyboardType={keyboardType}
        style={[styles.input, mono && styles.inputMono, focused && styles.inputFocused]}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </View>
  )
}

function makeStyles(c: typeof Colors.light) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bgBase },
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
      fontFamily: Fonts.body,
    },

    sectionTitle: {
      fontFamily: Fonts.bodySemibold,
      fontSize: 11, color: c.accent,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
    },
    row: { flexDirection: 'row', gap: Spacing.md },

    label: {
      fontFamily: Fonts.bodyMedium,
      fontSize: 11, color: c.textSecondary,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    input: {
      backgroundColor: c.bgSurface,
      borderRadius: Radius.md,
      borderWidth: 1, borderColor: c.border,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Platform.OS === 'ios' ? 14 : 10,
      fontFamily: Fonts.body,
      fontSize: 16, color: c.text,
    },
    inputMono: {
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      letterSpacing: 1,
      fontSize: 15,
    },
    inputFocused: { borderColor: c.accent },
    inputAsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    inputAsButtonText: {
      fontFamily: Fonts.body,
      fontSize: 16, color: c.text,
    },

    // Picker modal
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'flex-end',
    },
    modalSheet: {
      backgroundColor: c.bgSurface,
      borderTopLeftRadius: Radius.xl,
      borderTopRightRadius: Radius.xl,
      padding: Spacing.lg,
      paddingBottom: Spacing['2xl'],
      gap: Spacing.xs,
    },
    modalTitle: {
      fontFamily: Fonts.displayItalic,
      fontSize: 22, color: c.text,
      letterSpacing: -0.3,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
    },
    modalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      borderRadius: Radius.md,
    },
    modalRowText: {
      fontFamily: Fonts.body,
      fontSize: 16, color: c.text,
    },
  })
}
