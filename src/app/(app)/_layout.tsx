import { View } from 'react-native'
import { Tabs } from 'expo-router'
import { useColorScheme } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { Colors, Fonts } from '@/lib/theme'
import ChatBubble from '@/components/ChatBubble'

export default function AppTabsLayout() {
  const scheme = useColorScheme() ?? 'light'
  const c      = Colors[scheme]

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerStyle:      { backgroundColor: c.bgBase, borderBottomColor: c.border },
          headerTitleStyle: { fontFamily: Fonts.displayItalic, color: c.text, fontSize: 20 },
          headerShadowVisible: false,
          tabBarStyle:      { backgroundColor: c.bgSurface, borderTopColor: c.border },
          tabBarActiveTintColor:   c.accent,
          tabBarInactiveTintColor: c.textMuted,
          tabBarLabelStyle: { fontFamily: Fonts.bodyMedium, fontSize: 11 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Accueil',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="vehicles"
          options={{
            title: 'Véhicules',
            headerShown: false,
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'car-sport' : 'car-sport-outline'} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="appointments"
          options={{
            title: 'Rendez-vous',
            headerShown: false,
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="conseils"
          options={{
            title: 'Conseils',
            headerShown: false,
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'book' : 'book-outline'} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profil',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
            ),
          }}
        />
        {/* Routes sans onglet dans la tab bar */}
        <Tabs.Screen name="notifications" options={{ href: null, headerShown: false }} />
        <Tabs.Screen name="messages"      options={{ href: null, headerShown: false }} />
      </Tabs>

      {/* Bulle de messagerie flottante */}
      <ChatBubble />
    </View>
  )
}
