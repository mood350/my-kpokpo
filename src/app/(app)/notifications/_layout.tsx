import { Stack } from 'expo-router'
import { useColorScheme } from 'react-native'

import { Colors, Fonts } from '@/lib/theme'

export default function NotificationsStack() {
  const scheme = useColorScheme() ?? 'light'
  const c      = Colors[scheme]

  return (
    <Stack
      screenOptions={{
        headerStyle:    { backgroundColor: c.bgBase },
        headerTitleStyle: { fontFamily: Fonts.displayItalic, color: c.text, fontSize: 20 },
        headerTintColor: c.accent,
        headerShadowVisible: false,
        contentStyle:   { backgroundColor: c.bgBase },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Notifications' }} />
    </Stack>
  )
}
