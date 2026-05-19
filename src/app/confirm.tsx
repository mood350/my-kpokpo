import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  View,
  useColorScheme,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link, useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { confirmEmail, resendConfirmation, ApiError } from '@/lib/api'
import { Colors, Spacing, Radius, Fonts } from '@/lib/theme'

const OTP_LENGTH = 6
const RESEND_COOLDOWN = 60

export default function ConfirmScreen() {
  const scheme = useColorScheme() ?? 'light'
  const c      = Colors[scheme]
  const styles = makeStyles(c)
  const router = useRouter()

  const params = useLocalSearchParams<{ email?: string; token?: string }>()
  const email  = params.email ?? ''
  const urlTok = params.token ?? ''

  const [digits,  setDigits]  = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [status,  setStatus]  = useState<'idle' | 'success'>('idle')

  const [resendBusy, setResendBusy] = useState(false)
  const [cooldown,   setCooldown]   = useState(0)
  const [resentMsg,  setResentMsg]  = useState<string | null>(null)
  const [focusedIdx, setFocusedIdx] = useState<number | null>(null)

  const inputs = useRef<(TextInput | null)[]>([])

  useEffect(() => {
    if (cooldown <= 0) return
    const id = setInterval(() => setCooldown(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [cooldown])

  useEffect(() => {
    if (urlTok && urlTok.length > 10) submit(urlTok)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlTok])

  async function submit(token: string) {
    setLoading(true); setError(null)
    try {
      await confirmEmail(token)
      setStatus('success')
    } catch (e) {
      if (e instanceof ApiError) setError(e.message)
      else                       setError('Impossible de contacter le serveur.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit() {
    const code = digits.join('')
    if (code.length < OTP_LENGTH) {
      setError('Saisissez les 6 chiffres du code.')
      return
    }
    await submit(code)
  }

  function handleChange(i: number, value: string) {
    const clean = value.replace(/\D/g, '').slice(0, 1)

    if (value.length > 1) {
      const pasted = value.replace(/\D/g, '').slice(0, OTP_LENGTH)
      if (pasted.length === OTP_LENGTH) {
        setDigits(pasted.split(''))
        inputs.current[OTP_LENGTH - 1]?.focus()
        return
      }
    }

    setDigits(prev => {
      const next = [...prev]
      next[i] = clean
      return next
    })
    if (clean && i < OTP_LENGTH - 1) {
      inputs.current[i + 1]?.focus()
    }
  }

  function handleKey(i: number, e: NativeSyntheticEvent<TextInputKeyPressEventData>) {
    if (e.nativeEvent.key === 'Backspace' && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus()
    }
  }

  async function handleResend() {
    if (!email || cooldown > 0 || resendBusy) return
    setResendBusy(true); setResentMsg(null); setError(null)
    try {
      await resendConfirmation(email)
      setResentMsg('Code renvoyé. Vérifiez votre boîte mail.')
      setCooldown(RESEND_COOLDOWN)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Échec de l’envoi.')
    } finally {
      setResendBusy(false)
    }
  }

  // ───────── Render: success ─────────
  if (status === 'success') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successWrap}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={32} color={c.success} />
          </View>
          <Text style={styles.eyebrow}>COMPTE ACTIVÉ</Text>
          <Text style={styles.titleCenter}>C&apos;est confirmé.</Text>
          <Text style={styles.subtitleCenter}>
            Votre compte MyKpokpo est actif. Vous pouvez maintenant vous connecter.
          </Text>
          <Pressable
            onPress={() => router.replace('/sign-in')}
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed ? styles.primaryBtnPressed : null,
              { alignSelf: 'stretch', marginTop: Spacing.lg },
            ]}
          >
            <Text style={styles.primaryBtnText}>Se connecter</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFF" />
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  // ───────── Render: auto-confirm spinner ─────────
  if (loading && urlTok && !digits.some(Boolean)) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successWrap}>
          <ActivityIndicator color={c.accent} size="large" />
          <Text style={styles.subtitleCenter}>Activation de votre compte…</Text>
        </View>
      </SafeAreaView>
    )
  }

  // ───────── Render: OTP form ─────────
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
          {/* ── Brand ── */}
          <View style={styles.brandRow}>
            <View style={styles.brandLogo}>
              <View style={styles.brandDot} />
            </View>
            <Text style={styles.brandWordmark}>MyKpokpo</Text>
          </View>

          {/* ── Hero ── */}
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>VÉRIFICATION</Text>
            <Text style={styles.title}>Confirmez{'\n'}votre email.</Text>
            <Text style={styles.subtitle}>
              Un code à 6 chiffres a été envoyé à{'\n'}
              <Text style={{ fontFamily: Fonts.bodySemibold, color: c.text }}>
                {email || 'votre adresse email'}
              </Text>.
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

            {/* OTP cells */}
            <View style={styles.otpRow}>
              {digits.map((d, i) => (
                <TextInput
                  key={i}
                  ref={el => { inputs.current[i] = el }}
                  value={d}
                  onChangeText={(v) => handleChange(i, v)}
                  onKeyPress={(e) => handleKey(i, e)}
                  keyboardType="number-pad"
                  maxLength={i === 0 ? OTP_LENGTH : 1}
                  textContentType="oneTimeCode"
                  autoComplete="sms-otp"
                  editable={!loading}
                  onFocus={() => setFocusedIdx(i)}
                  onBlur={()  => setFocusedIdx(null)}
                  style={[
                    styles.otpCell,
                    d            && styles.otpCellFilled,
                    focusedIdx === i && styles.otpCellFocused,
                  ]}
                  accessibilityLabel={`Chiffre ${i + 1}`}
                />
              ))}
            </View>

            <Pressable
              onPress={handleSubmit}
              disabled={loading || digits.join('').length < OTP_LENGTH}
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && !loading && digits.join('').length === OTP_LENGTH ? styles.primaryBtnPressed : null,
                (loading || digits.join('').length < OTP_LENGTH) ? styles.primaryBtnDisabled : null,
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text style={styles.primaryBtnText}>Vérifier</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFF" />
                </>
              )}
            </Pressable>
          </View>

          {/* Resend */}
          <View style={styles.footer}>
            <View style={styles.divider} />
            <Text style={styles.footerText}>Pas reçu ?</Text>
            <Pressable
              onPress={handleResend}
              disabled={!email || cooldown > 0 || resendBusy}
              hitSlop={10}
              style={({ pressed }) => pressed && { opacity: 0.7 }}
            >
              <Text
                style={[
                  styles.footerLink,
                  (cooldown > 0 || !email) && { color: c.textMuted },
                ]}
              >
                {resendBusy
                  ? 'Envoi…'
                  : cooldown > 0
                    ? `Renvoyer (${cooldown}s)`
                    : 'Renvoyer le code'}
              </Text>
            </Pressable>

            {resentMsg && (
              <Text style={styles.successHint}>{resentMsg}</Text>
            )}

            <Link href="/sign-in" asChild>
              <Pressable hitSlop={6} style={{ marginTop: Spacing.sm }}>
                <Text style={styles.muted}>Retour à la connexion</Text>
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
    titleCenter: {
      fontFamily: Fonts.displayItalic,
      fontSize: 44,
      lineHeight: 48,
      color: c.text,
      letterSpacing: -1,
      textAlign: 'center',
    },
    subtitle: {
      fontFamily: Fonts.body,
      fontSize: 15,
      lineHeight: 23,
      color: c.textSecondary,
      maxWidth: 360,
    },
    subtitleCenter: {
      fontFamily: Fonts.body,
      fontSize: 15,
      lineHeight: 23,
      color: c.textSecondary,
      textAlign: 'center',
      paddingHorizontal: Spacing.lg,
    },

    successWrap: {
      flex: 1,
      paddingHorizontal: Spacing.xl,
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.md,
    },
    successIcon: {
      width: 64, height: 64, borderRadius: 32,
      backgroundColor: c.successMuted,
      alignItems: 'center', justifyContent: 'center',
      marginBottom: Spacing.sm,
    },

    form: {
      gap: Spacing.lg,
      paddingTop: Spacing.sm,
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
    otpRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: Spacing.sm,
    },
    otpCell: {
      flex: 1,
      height: 60,
      borderRadius: Radius.md,
      borderWidth: 1, borderColor: c.border,
      backgroundColor: c.bgSurface,
      textAlign: 'center',
      fontFamily: Fonts.displayItalic,
      fontSize: 26,
      color: c.text,
    },
    otpCellFilled:  { borderColor: c.accent },
    otpCellFocused: { borderColor: c.accent, borderWidth: 2 },

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
    primaryBtnPressed:  { opacity: 0.88 },
    primaryBtnDisabled: { opacity: 0.55 },
    primaryBtnText: {
      fontFamily: Fonts.bodySemibold,
      fontSize: 15,
      color: '#FFFFFF',
      letterSpacing: 0.2,
    },

    footer: {
      alignItems: 'center',
      gap: Spacing.sm,
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
    successHint: {
      fontFamily: Fonts.body,
      fontSize: 12,
      color: c.success,
      textAlign: 'center',
      marginTop: Spacing.xs,
    },
    muted: {
      fontFamily: Fonts.body,
      fontSize: 13,
      color: c.textMuted,
    },
  })
}
