import { useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
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
import { Link, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { registerClient, ApiError } from '@/lib/api'
import { Colors, Spacing, Radius, Fonts } from '@/lib/theme'

const ERROR_MAP: Record<string, string> = {
  VALIDATION_ERROR: 'Données invalides. Vérifiez les champs.',
  INVALID_ARGUMENT: 'Informations manquantes ou incorrectes.',
  EMAIL_TAKEN:      'Un compte existe déjà avec cet email.',
}

function passwordScore(pwd: string): number {
  if (!pwd) return 0
  let s = 0
  if (pwd.length >= 8)          s++
  if (/[A-Z]/.test(pwd))        s++
  if (/[0-9]/.test(pwd))        s++
  if (/[^A-Za-z0-9]/.test(pwd)) s++
  return s
}

const STRENGTH_LABEL = ['Trop court', 'Faible', 'Moyen', 'Fort', 'Excellent']

export default function SignUpScreen() {
  const scheme = useColorScheme() ?? 'light'
  const c      = Colors[scheme]
  const styles = makeStyles(c)
  const router = useRouter()

  const [firstName, setFirstName] = useState('')
  const [lastName,  setLastName]  = useState('')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [showPwd,   setShowPwd]   = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const [focused, setFocused] = useState<string | null>(null)

  const score = passwordScore(password)
  const scoreColor =
    score < 2 ? c.danger :
    score < 3 ? c.warning :
                c.success

  async function handleSubmit() {
    setError(null)
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      setError('Tous les champs sont obligatoires.')
      return
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    setLoading(true)
    try {
      const trimmedEmail = email.trim()
      await registerClient({
        firstname: firstName.trim(),
        lastname:  lastName.trim(),
        email:     trimmedEmail,
        password,
      })
      router.replace({ pathname: '/confirm', params: { email: trimmedEmail } })
    } catch (e) {
      if (e instanceof ApiError) setError(ERROR_MAP[e.code ?? ''] ?? e.message)
      else                       setError('Impossible de contacter le serveur.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Brand row with back arrow ── */}
          <View style={styles.topRow}>
            <Link href="/sign-in" asChild>
              <Pressable hitSlop={12} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={22} color={c.textSecondary} />
              </Pressable>
            </Link>
            <View style={styles.brandRow}>
              <View style={styles.brandLogo}>
                <View style={styles.brandDot} />
              </View>
              <Text style={styles.brandWordmark}>MyKpokpo</Text>
            </View>
            <View style={styles.backBtn} />
          </View>

          {/* ── Hero ── */}
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>ESPACE PARTICULIER</Text>
            <Text style={styles.title}>Créer{'\n'}mon compte.</Text>
            <Text style={styles.subtitle}>
              Centralisez vos véhicules, prenez rendez-vous et consultez votre historique d&apos;entretien.
            </Text>
          </View>

          {/* ── Form ── */}
          <View style={styles.form}>
            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={15} color={c.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Name row */}
            <View style={styles.row}>
              <Field
                label="Prénom"
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Kofi"
                autoComplete="given-name"
                focused={focused === 'first'}
                onFocus={() => setFocused('first')}
                onBlur={() => setFocused(null)}
                disabled={loading}
                c={c}
                styles={styles}
                style={{ flex: 1 }}
              />
              <Field
                label="Nom"
                value={lastName}
                onChangeText={setLastName}
                placeholder="Mensah"
                autoComplete="family-name"
                focused={focused === 'last'}
                onFocus={() => setFocused('last')}
                onBlur={() => setFocused(null)}
                disabled={loading}
                c={c}
                styles={styles}
                style={{ flex: 1 }}
              />
            </View>

            {/* Email */}
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="vous@exemple.com"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              focused={focused === 'email'}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
              disabled={loading}
              c={c}
              styles={styles}
            />

            {/* Password */}
            <View style={styles.field}>
              <Text style={styles.label}>Mot de passe</Text>
              <View style={[styles.inputWrap, focused === 'pwd' && styles.inputFocused]}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="8 caractères minimum"
                  placeholderTextColor={c.textMuted}
                  secureTextEntry={!showPwd}
                  autoComplete="new-password"
                  style={styles.inputBare}
                  editable={!loading}
                  onFocus={() => setFocused('pwd')}
                  onBlur={() => setFocused(null)}
                />
                <Pressable
                  onPress={() => setShowPwd(s => !s)}
                  hitSlop={10}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showPwd ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={c.textMuted}
                  />
                </Pressable>
              </View>

              {password.length > 0 && (
                <View style={styles.strengthWrap}>
                  <View style={styles.strengthBars}>
                    {[0, 1, 2, 3].map(i => (
                      <View
                        key={i}
                        style={[
                          styles.strengthBar,
                          { backgroundColor: i < score ? scoreColor : c.border },
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={[styles.strengthLabel, { color: scoreColor }]}>
                    {STRENGTH_LABEL[score]}
                  </Text>
                </View>
              )}
            </View>

            {/* Submit */}
            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && !loading ? styles.primaryBtnPressed : null,
                loading ? styles.primaryBtnDisabled : null,
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text style={styles.primaryBtnText}>Créer mon compte</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFF" />
                </>
              )}
            </Pressable>

            <Text style={styles.legal}>
              En créant un compte, vous acceptez nos Conditions d&apos;utilisation et notre Politique de confidentialité.
            </Text>
          </View>

          {/* ── Footer ── */}
          <View style={styles.footer}>
            <View style={styles.divider} />
            <Text style={styles.footerText}>Déjà un compte ?</Text>
            <Link href="/sign-in" asChild>
              <Pressable hitSlop={10} style={({ pressed }) => pressed && { opacity: 0.7 }}>
                <Text style={styles.footerLink}>Se connecter</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

// ─── Field helper (réutilisé pour les champs simples) ────────────────────────

interface FieldProps {
  label:           string
  value:           string
  onChangeText:    (s: string) => void
  placeholder:     string
  autoCapitalize?: 'none' | 'sentences'
  autoComplete?:   'given-name' | 'family-name' | 'email' | 'off'
  keyboardType?:   'default' | 'email-address'
  focused:         boolean
  onFocus:         () => void
  onBlur:          () => void
  disabled:        boolean
  c:               typeof Colors.light
  styles:          ReturnType<typeof makeStyles>
  style?:          object
}

function Field(props: FieldProps) {
  const { label, value, onChangeText, placeholder, autoCapitalize,
          autoComplete, keyboardType, focused, onFocus, onBlur,
          disabled, c, styles, style } = props
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.textMuted}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        autoComplete={autoComplete}
        keyboardType={keyboardType}
        style={[styles.input, focused && styles.inputFocused]}
        editable={!disabled}
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
      flexGrow: 1,
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.sm,
      paddingBottom: Spacing['2xl'],
    },

    // Top row (back + brand)
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.sm,
    },
    backBtn: {
      width: 40, height: 40,
      alignItems: 'center', justifyContent: 'center',
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    brandLogo: {
      width: 26, height: 26, borderRadius: 6,
      backgroundColor: c.accentMuted,
      alignItems: 'center', justifyContent: 'center',
    },
    brandDot: {
      width: 8, height: 8, borderRadius: 4,
      backgroundColor: c.accent,
    },
    brandWordmark: {
      fontFamily: Fonts.displayItalic,
      fontSize: 16,
      color: c.text,
      letterSpacing: -0.2,
    },

    // Hero
    hero: {
      paddingTop: Spacing.xl,
      paddingBottom: Spacing.xl,
      gap: Spacing.md,
    },
    eyebrow: {
      fontFamily: Fonts.bodySemibold,
      fontSize: 11,
      color: c.accent,
      letterSpacing: 1.2,
    },
    title: {
      fontFamily: Fonts.displayItalic,
      fontSize: 48,
      lineHeight: 52,
      color: c.text,
      letterSpacing: -1.1,
    },
    subtitle: {
      fontFamily: Fonts.body,
      fontSize: 15,
      lineHeight: 23,
      color: c.textSecondary,
      maxWidth: 340,
    },

    // Form
    form: {
      gap: Spacing.lg,
      paddingTop: Spacing.sm,
    },
    row: { flexDirection: 'row', gap: Spacing.md },
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
      color: c.danger,
      fontSize: 13,
      lineHeight: 19,
      fontFamily: Fonts.body,
    },
    field: { gap: Spacing.sm },
    label: {
      fontFamily: Fonts.bodySemibold,
      fontSize: 11,
      color: c.textSecondary,
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    input: {
      backgroundColor: c.bgSurface,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Platform.OS === 'ios' ? 14 : 10,
      fontFamily: Fonts.body,
      fontSize: 16,
      color: c.text,
    },
    inputFocused: { borderColor: c.accent },
    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.bgSurface,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: Spacing.lg,
    },
    inputBare: {
      flex: 1,
      paddingVertical: Platform.OS === 'ios' ? 14 : 10,
      fontFamily: Fonts.body,
      fontSize: 16,
      color: c.text,
    },
    eyeBtn: {
      paddingHorizontal: Spacing.sm,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Password strength
    strengthWrap: { gap: Spacing.xs, marginTop: Spacing.xs },
    strengthBars: { flexDirection: 'row', gap: 4 },
    strengthBar: { flex: 1, height: 3, borderRadius: 2 },
    strengthLabel: {
      fontFamily: Fonts.bodyMedium,
      fontSize: 11,
      letterSpacing: 0.4,
    },

    // Button
    primaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      backgroundColor: c.accent,
      borderRadius: Radius.md,
      paddingVertical: 16,
      marginTop: Spacing.sm,
    },
    primaryBtnPressed: { opacity: 0.88 },
    primaryBtnDisabled: { opacity: 0.55 },
    primaryBtnText: {
      fontFamily: Fonts.bodySemibold,
      fontSize: 15,
      color: '#FFFFFF',
      letterSpacing: 0.2,
    },
    legal: {
      fontFamily: Fonts.body,
      fontSize: 11,
      color: c.textMuted,
      textAlign: 'center',
      lineHeight: 17,
      paddingHorizontal: Spacing.md,
    },

    // Footer
    footer: {
      alignItems: 'center',
      gap: Spacing.md,
      paddingTop: Spacing.xl,
    },
    divider: {
      width: 32,
      height: 1,
      backgroundColor: c.border,
      marginBottom: Spacing.sm,
    },
    footerText: {
      fontFamily: Fonts.body,
      fontSize: 13,
      color: c.textMuted,
    },
    footerLink: {
      fontFamily: Fonts.bodySemibold,
      fontSize: 14,
      color: c.accent,
    },
  })
}
