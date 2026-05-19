import { Stack } from 'expo-router'
import { useColorScheme } from 'react-native'

import { Colors, Fonts } from '@/lib/theme'

export default function MessagesLayout() {
  const scheme = useColorScheme() ?? 'light'
  const c      = Colors[scheme]

  return (
    <Stack
      screenOptions={{
        headerStyle:       { backgroundColor: c.bgSurface },
        headerTitleStyle:  { fontFamily: Fonts.displayItalic, color: c.text, fontSize: 20 },
        headerShadowVisible: false,
        headerTintColor:   c.accent,
        contentStyle:      { backgroundColor: c.bgBase },
      }}
    >
      <Stack.Screen name="index"             options={{ title: 'Messages' }} />
      <Stack.Screen name="[conversationId]"  options={{ title: '' }} />
    </Stack>
  )
}
