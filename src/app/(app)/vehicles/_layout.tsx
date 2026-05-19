import { Stack } from 'expo-router'
import { useColorScheme } from 'react-native'

import { Colors, Fonts } from '@/lib/theme'

export default function VehiclesStack() {
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
      <Stack.Screen name="index" options={{ title: 'Véhicules' }} />
      <Stack.Screen
        name="new"
        options={{
          title: 'Nouveau véhicule',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{ title: 'Véhicule' }}
      />
    </Stack>
  )
}
