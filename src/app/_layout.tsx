import { useEffect } from 'react'
import { Stack, useRouter } from 'expo-router'
import { ActivityIndicator, View, useColorScheme } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import * as Notifications from 'expo-notifications'
import {
  useFonts,
  Fraunces_400Regular_Italic,
  Fraunces_500Medium_Italic,
} from '@expo-google-fonts/fraunces'
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans'

import { SessionProvider, useSession } from '@/lib/ctx'
import { Colors } from '@/lib/theme'

function RootNavigator() {
  const { session, isLoading } = useSession()
  const scheme = useColorScheme() ?? 'light'
  const c      = Colors[scheme]
  const router = useRouter()

  // Listener : tap sur une notification push → navigation contextuelle
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as Record<string, unknown>
      if (!session) return
      if (data?.channel === 'message') {
        router.push('/(app)/messages')
      } else if (data?.channel === 'appointment') {
        router.push('/(app)/appointments')
      } else {
        router.push('/(app)/notifications')
      }
    })
    return () => sub.remove()
  }, [session, router])

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bgBase }}>
        <ActivityIndicator color={c.accent} />
      </View>
    )
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bgBase } }}>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="sign-up" />
        <Stack.Screen name="confirm" />
      </Stack.Protected>
    </Stack>
  )
}

export default function RootLayout() {
  const scheme = useColorScheme() ?? 'light'
  const c      = Colors[scheme]

  const [fontsLoaded] = useFonts({
    Fraunces_400Regular_Italic,
    Fraunces_500Medium_Italic,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  })

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bgBase }}>
        <ActivityIndicator color={c.accent} />
      </View>
    )
  }

  return (
    <SessionProvider>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <RootNavigator />
    </SessionProvider>
  )
}
