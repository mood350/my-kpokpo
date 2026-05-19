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
import { Link } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { useSession } from '@/lib/ctx'
import { ApiError } from '@/lib/api'
import { Colors, Spacing, Radius, Fonts } from '@/lib/theme'

const ERROR_MAP: Record<string, string> = {
  BAD_CREDENTIALS:  'Email ou mot de passe incorrect.',
  USER_NOT_FOUND:   'Aucun compte associé à cet email.',
  ACCESS_DENIED:    'Compte non activé — vérifiez votre boîte mail.',
  VALIDATION_ERROR: 'Données invalides.',
  WRONG_ROLE:       'Cette application est réservée aux particuliers.',
}

export default function SignInScreen() {
  const scheme = useColorScheme() ?? 'light'
  const c      = Colors[scheme]
  const styles = makeStyles(c)

  const { signIn } = useSession()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const [emailFocus, setEmailFocus] = useState(false)
  const [pwdFocus,   setPwdFocus]   = useState(false)

  async function handleSubmit() {
    setError(null)
    if (!email.trim() || !password) {
      setError('Renseignez votre email et votre mot de passe.')
      return
    }
    setLoading(true)
    try {
      await signIn(email.trim(), password)
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
          {/* ── Brand mark ── */}
          <View style={styles.brandRow}>
            <View style={styles.brandLogo}>
              <View style={styles.brandDot} />
            </View>
            <Text style={styles.brandWordmark}>MyKpokpo</Text>
          </View>

          {/* ── Hero ── */}
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>CONNEXION</Text>
            <Text style={styles.title}>
              Bienvenue.
            </Text>
            <Text style={styles.subtitle}>
              Connectez-vous pour suivre l&apos;entretien de vos véhicules.
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

            {/* Email */}
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="vous@exemple.com"
                placeholderTextColor={c.textMuted}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                style={[styles.input, emailFocus && styles.inputFocused]}
                editable={!loading}
                onFocus={() => setEmailFocus(true)}
                onBlur={()  => setEmailFocus(false)}
              />
            </View>

            {/* Password */}
            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Mot de passe</Text>
              </View>
              <View style={[styles.inputWrap, pwdFocus && styles.inputFocused]}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={c.textMuted}
                  secureTextEntry={!showPwd}
                  autoComplete="current-password"
                  style={styles.inputBare}
                  editable={!loading}
                  onFocus={() => setPwdFocus(true)}
                  onBlur={()  => setPwdFocus(false)}
                />
                <Pressable
                  onPress={() => setShowPwd(s => !s)}
                  hitSlop={10}
                  style={styles.eyeBtn}
                  accessibilityLabel={showPwd ? 'Masquer' : 'Afficher'}
                >
                  <Ionicons
                    name={showPwd ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={c.textMuted}
                  />
                </Pressable>
              </View>
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
                  <Text style={styles.primaryBtnText}>Se connecter</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFF" />
                </>
              )}
            </Pressable>
          </View>

          {/* ── Footer ── */}
          <View style={styles.footer}>
            <View style={styles.divider} />
            <Text style={styles.footerText}>Pas encore de compte ?</Text>
            <Link href="/sign-up" asChild>
              <Pressable hitSlop={10} style={({ pressed }) => pressed && { opacity: 0.7 }}>
                <Text style={styles.footerLink}>Créer un compte</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function makeStyles(c: typeof Colors.light) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bgBase },
    container: {
      flexGrow: 1,
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing['2xl'],
    },

    // Brand
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingVertical: Spacing.sm,
    },
    brandLogo: {
      width: 30, height: 30, borderRadius: 7,
      backgroundColor: c.accentMuted,
      alignItems: 'center', justifyContent: 'center',
    },
    brandDot: {
      width: 9, height: 9, borderRadius: 4.5,
      backgroundColor: c.accent,
    },
    brandWordmark: {
      fontFamily: Fonts.displayItalic,
      fontSize: 18,
      color: c.text,
      letterSpacing: -0.2,
    },

    // Hero
    hero: {
      paddingTop: Spacing['3xl'],
      paddingBottom: Spacing['2xl'],
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
      fontSize: 56,
      lineHeight: 60,
      color: c.text,
      letterSpacing: -1.2,
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
      paddingTop: Spacing.md,
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
      color: c.danger,
      fontSize: 13,
      lineHeight: 19,
      fontFamily: Fonts.body,
    },
    field: { gap: Spacing.sm },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
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
    inputFocused: {
      borderColor: c.accent,
    },
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

    // Footer
    footer: {
      alignItems: 'center',
      gap: Spacing.md,
      paddingTop: Spacing['2xl'],
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
