import { useEffect, useRef, useState } from 'react'
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'

import { fetchMyConversations } from '@/lib/api'
import { Colors } from '@/lib/theme'

const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 49 : 56
const POLL_INTERVAL  = 30_000

export default function ChatBubble() {
  const scheme  = useColorScheme() ?? 'light'
  const c       = Colors[scheme]
  const insets  = useSafeAreaInsets()
  const router  = useRouter()

  const [unread, setUnread] = useState(0)
  const scale = useRef(new Animated.Value(1)).current

  const bottomOffset = TAB_BAR_HEIGHT + insets.bottom + 16

  useEffect(() => {
    let mounted = true

    async function poll() {
      try {
        const convs = await fetchMyConversations()
        if (mounted) setUnread(convs.reduce((s, c) => s + c.unreadCount, 0))
      } catch { /* ignore */ }
    }

    poll()
    const id = setInterval(poll, POLL_INTERVAL)
    return () => { mounted = false; clearInterval(id) }
  }, [])

  function handlePress() {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.88, duration: 90, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
    ]).start()
    router.navigate('/(app)/messages')
  }

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { bottom: bottomOffset, transform: [{ scale }] },
      ]}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={handlePress}
        style={[styles.bubble, { backgroundColor: c.accent }]}
        accessibilityLabel="Ouvrir la messagerie"
        accessibilityRole="button"
      >
        <Ionicons name="chatbubble-ellipses" size={26} color="#fff" />

        {unread > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unread > 9 ? '9+' : unread}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    position:  'absolute',
    right:     20,
    zIndex:    999,
    elevation: 8,
  },
  bubble: {
    width:        58,
    height:       58,
    borderRadius: 29,
    alignItems:   'center',
    justifyContent: 'center',
    shadowColor:  '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius:  8,
    elevation:    8,
  },
  badge: {
    position:        'absolute',
    top:             -4,
    right:           -4,
    minWidth:        20,
    height:          20,
    borderRadius:    10,
    backgroundColor: '#D64045',
    alignItems:      'center',
    justifyContent:  'center',
    paddingHorizontal: 4,
    borderWidth:     2,
    borderColor:     '#fff',
  },
  badgeText: {
    color:      '#fff',
    fontSize:   10,
    fontWeight: '700',
    lineHeight: 14,
  },
})
