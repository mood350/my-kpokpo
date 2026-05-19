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
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { fetchConseils, type ConseilResponse } from '@/lib/api'
import { Colors, Fonts, Radius, Spacing } from '@/lib/theme'

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function categoryColor(cat: string | null, c: typeof Colors.light) {
  const map: Record<string, string> = {
    'Moteur':            c.warning,
    'Freins':            c.danger,
    'Pneus':             c.success,
    'Carrosserie':       c.accent,
    'Électronique':      '#6366f1',
    'Entretien général': c.textSecondary,
  }
  return cat ? (map[cat] ?? c.accent) : c.accent
}

function ConseilCard({ item, c }: { item: ConseilResponse; c: typeof Colors.light }) {
  const [expanded, setExpanded] = useState(false)
  const styles = makeStyles(c)
  const color  = categoryColor(item.category, c)

  function toggle() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setExpanded(e => !e)
  }

  return (
    <Pressable
      onPress={toggle}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
    >
      {item.category && (
        <View style={[styles.categoryChip, { backgroundColor: `${color}18` }]}>
          <Text style={[styles.categoryText, { color }]}>{item.category}</Text>
        </View>
      )}

      <View style={styles.cardHeader}>
        <Text style={styles.title}>{item.title}</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={c.textMuted}
        />
      </View>

      {expanded && (
        <Text style={styles.content}>{item.content}</Text>
      )}

      <View style={styles.meta}>
        <Ionicons name="person-outline" size={11} color={c.textMuted} />
        <Text style={styles.metaText}>{item.authorName}</Text>
        <Text style={[styles.metaText, { color: c.border }]}>·</Text>
        <Text style={styles.metaText}>{formatDate(item.createdAt)}</Text>
      </View>
    </Pressable>
  )
}

export default function ConseillsScreen() {
  const scheme = useColorScheme() ?? 'light'
  const c      = Colors[scheme]
  const styles = makeStyles(c)

  const [conseils,   setConseils]   = useState<ConseilResponse[]>([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true)
    setError(null)
    try {
      const data = await fetchConseils()
      setConseils(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  function onRefresh() { setRefreshing(true); load(true) }

  if (loading) {
    return (
      <SafeAreaView style={styles.centered} edges={['bottom']}>
        <ActivityIndicator color={c.accent} />
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered} edges={['bottom']}>
        <Ionicons name="alert-circle-outline" size={40} color={c.danger} />
        <Text style={styles.errorText}>{error}</Text>
        <Pressable onPress={() => load()} style={styles.retryBtn}>
          <Text style={styles.retryText}>Réessayer</Text>
        </Pressable>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={conseils}
        keyExtractor={i => String(i.id)}
        renderItem={({ item }) => <ConseilCard item={item} c={c} />}
        contentContainerStyle={
          conseils.length === 0 ? styles.emptyContainer : styles.listContent
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.accent} />
        }
        ListHeaderComponent={
          <Text style={styles.subtitle}>
            Conseils d'entretien de vos garagistes pour garder votre véhicule en parfait état.
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="book-outline" size={52} color={c.textMuted} />
            <Text style={styles.emptyTitle}>Aucun conseil disponible</Text>
            <Text style={styles.emptySubtitle}>
              Revenez bientôt, vos garagistes publient régulièrement des conseils.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  )
}

function makeStyles(c: typeof Colors.light) {
  return StyleSheet.create({
    container:      { flex: 1, backgroundColor: c.bgBase },
    centered:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, backgroundColor: c.bgBase },
    listContent:    { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing['3xl'] },
    emptyContainer: { flexGrow: 1, padding: Spacing.lg },

    subtitle: {
      fontFamily: Fonts.body,
      fontSize:   13,
      color:      c.textMuted,
      lineHeight: 19,
      marginBottom: Spacing.md,
    },

    card: {
      backgroundColor: c.bgSurface,
      borderRadius:    Radius.lg,
      borderWidth:     1,
      borderColor:     c.border,
      padding:         Spacing.lg,
      gap:             Spacing.sm,
    },

    categoryChip: {
      alignSelf:    'flex-start',
      borderRadius: Radius.sm,
      paddingHorizontal: 8,
      paddingVertical:   2,
    },
    categoryText: {
      fontFamily:    Fonts.bodySemibold,
      fontSize:      10,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },

    cardHeader: {
      flexDirection:  'row',
      alignItems:     'flex-start',
      justifyContent: 'space-between',
      gap:            Spacing.sm,
    },
    title: {
      fontFamily: Fonts.bodySemibold,
      fontSize:   15,
      color:      c.text,
      flex:       1,
      lineHeight: 21,
    },
    content: {
      fontFamily: Fonts.body,
      fontSize:   13,
      color:      c.textSecondary,
      lineHeight: 20,
      paddingTop: Spacing.xs,
    },

    meta: {
      flexDirection: 'row',
      alignItems:    'center',
      gap:           4,
      marginTop:     Spacing.xs,
    },
    metaText: {
      fontFamily: Fonts.body,
      fontSize:   11,
      color:      c.textMuted,
    },

    empty: {
      flex:           1,
      alignItems:     'center',
      justifyContent: 'center',
      gap:            Spacing.md,
      paddingTop:     Spacing['3xl'],
    },
    emptyTitle:    { fontFamily: Fonts.bodySemibold, fontSize: 16, color: c.text, textAlign: 'center' },
    emptySubtitle: { fontFamily: Fonts.body, fontSize: 14, color: c.textMuted, textAlign: 'center', lineHeight: 20 },
    errorText:     { fontFamily: Fonts.body, fontSize: 14, color: c.textSecondary, textAlign: 'center' },
    retryBtn:      { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, backgroundColor: c.accentMuted, borderRadius: Radius.pill },
    retryText:     { fontFamily: Fonts.bodyMedium, fontSize: 14, color: c.accent },
  })
}
