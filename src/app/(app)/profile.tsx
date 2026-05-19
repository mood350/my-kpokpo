import { useEffect, useState } from 'react'
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
import { Ionicons } from '@expo/vector-icons'

import { fetchMe, ApiError, type UserProfile } from '@/lib/api'
import { useSession } from '@/lib/ctx'
import { Colors, Spacing, Radius, Fonts } from '@/lib/theme'

export default function ProfileScreen() {
  const scheme = useColorScheme() ?? 'light'
  const c      = Colors[scheme]
  const styles = makeStyles(c)
  const { signOut } = useSession()

  const [me,      setMe]      = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMe()
      .then(setMe)
      .catch(e => {
        if (e instanceof ApiError && e.status === 401) signOut()
      })
      .finally(() => setLoading(false))
  }, [signOut])

  function confirmLogout() {
    Alert.alert(
      'Se déconnecter',
      'Vous devrez ressaisir votre mot de passe pour revenir.',
      [
        { text: 'Annuler',     style: 'cancel' },
        { text: 'Déconnecter', style: 'destructive', onPress: signOut },
      ],
    )
  }

  const initials = me
    ? `${me.firstName[0] ?? ''}${me.lastName[0] ?? ''}`.toUpperCase()
    : '…'

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* ── Identity ── */}
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          {loading ? (
            <ActivityIndicator color={c.accent} style={{ marginTop: Spacing.md }} />
          ) : (
            <>
              <Text style={styles.fullName}>
                {me ? `${me.firstName} ${me.lastName}` : '—'}
              </Text>
              <Text style={styles.email}>{me?.email ?? ''}</Text>
            </>
          )}
        </View>

        {/* ── Account ── */}
        <View style={styles.section}>
          <Text style={styles.eyebrow}>COMPTE</Text>
          <View style={styles.card}>
            <Row icon="mail-outline" label="Email" value={me?.email ?? '—'} c={c} />
            <Separator c={c} />
            <Row icon="person-outline" label="Type de compte" value="Particulier" c={c} />
          </View>
        </View>

        {/* ── Sign out ── */}
        <Pressable
          onPress={confirmLogout}
          style={({ pressed }) => [
            styles.logoutBtn,
            pressed ? styles.logoutBtnPressed : null,
          ]}
        >
          <Ionicons name="log-out-outline" size={18} color={c.danger} />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  )
}

function Row({
  icon, label, value, c,
}: {
  icon:  keyof typeof Ionicons.glyphMap
  label: string
  value: string
  c:     typeof Colors.light
}) {
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
    }}>
      <View style={{
        width: 32, height: 32, borderRadius: Radius.md,
        backgroundColor: c.accentMuted,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Ionicons name={icon} size={16} color={c.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{
          fontFamily: Fonts.bodyMedium,
          fontSize: 11, color: c.textSecondary,
          letterSpacing: 0.8, textTransform: 'uppercase',
        }}>
          {label}
        </Text>
        <Text style={{
          fontFamily: Fonts.body,
          fontSize: 15, color: c.text,
          marginTop: 2,
        }}>
          {value}
        </Text>
      </View>
    </View>
  )
}

function Separator({ c }: { c: typeof Colors.light }) {
  return (
    <View style={{
      height: 1,
      backgroundColor: c.border,
      marginLeft: Spacing.lg + 32 + Spacing.md,
    }} />
  )
}

function makeStyles(c: typeof Colors.light) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bgBase },
    container: {
      padding: Spacing.xl,
      gap: Spacing['2xl'],
    },

    identity: {
      alignItems: 'center',
      gap: Spacing.sm,
      paddingTop: Spacing.lg,
    },
    avatar: {
      width: 88, height: 88, borderRadius: 44,
      backgroundColor: c.accentMuted,
      alignItems: 'center', justifyContent: 'center',
      marginBottom: Spacing.sm,
    },
    avatarText: {
      fontFamily: Fonts.displayItalic,
      fontSize: 32,
      color: c.accent,
    },
    fullName: {
      fontFamily: Fonts.displayItalic,
      fontSize: 26,
      color: c.text,
      letterSpacing: -0.4,
    },
    email: {
      fontFamily: Fonts.body,
      fontSize: 14, color: c.textSecondary,
    },

    section: { gap: Spacing.md },
    eyebrow: {
      fontFamily: Fonts.bodySemibold,
      fontSize: 11,
      color: c.accent,
      letterSpacing: 1.2,
      paddingHorizontal: Spacing.xs,
    },
    card: {
      backgroundColor: c.bgSurface,
      borderRadius: Radius.lg,
      borderWidth: 1, borderColor: c.border,
      overflow: 'hidden',
    },

    logoutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      backgroundColor: c.dangerMuted,
      borderRadius: Radius.md,
      paddingVertical: Spacing.md,
    },
    logoutBtnPressed: { opacity: 0.85 },
    logoutText: {
      fontFamily: Fonts.bodySemibold,
      fontSize: 15,
      color: c.danger,
    },
  })
}
