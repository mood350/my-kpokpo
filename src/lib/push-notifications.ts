/**
 * Push notifications setup for MyKpokpo (Expo).
 *
 * Nécessite l'installation de `expo-notifications` (paquet manquant dans
 * package.json — `npx expo install expo-notifications`).
 *
 * Flux :
 *   1. Au démarrage de la session, on appelle `registerForPushAsync()`
 *   2. Permission demandée à l'utilisateur (push système)
 *   3. Récupération du token Expo (`ExponentPushToken[xxx]`)
 *   4. Envoi du token au backend (`PUT /api/v1/users/me/push-token`)
 */

import { Platform } from 'react-native'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'

import { updatePushToken } from './api'

// ─── Behavior : afficher la notif même quand l'app est au premier plan ───────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList:   true,
    shouldPlaySound:  true,
    shouldSetBadge:   true,
    shouldShowAlert:  true,
  }),
})

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Demande la permission notifications, récupère le token Expo et l'envoie au
 * backend. Idempotent : on peut l'appeler à chaque login. Sans-effet sur le web
 * et sur les simulateurs iOS (pas de support push).
 */
export async function registerForPushAsync(): Promise<string | null> {
  // iOS Simulator et web : pas de push réel possible
  if (!Device.isDevice && Platform.OS === 'ios') {
    return null
  }

  // Android : créer un canal "default" obligatoire (sinon pas de son/affichage)
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name:        'Rappels MyKpokpo',
      importance:  Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor:  '#A8823E',
    })
  }

  // Permission
  const { status: existing } = await Notifications.getPermissionsAsync()
  let finalStatus = existing
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }
  if (finalStatus !== 'granted') {
    return null
  }

  // Récupération du token Expo (nécessite projectId en build natif)
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId
  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    )
    await sendTokenToBackend(token)
    return token
  } catch (e) {
    console.warn('Échec récupération Expo push token :', e)
    return null
  }
}

/**
 * Désactive la réception côté backend (à appeler au logout).
 * On envoie `token: null` pour effacer en BDD.
 */
export async function unregisterPushAsync(): Promise<void> {
  try { await sendTokenToBackend(null) } catch { /* silencieux */ }
}

// ─── Privé ───────────────────────────────────────────────────────────────────

async function sendTokenToBackend(token: string | null): Promise<void> {
  await updatePushToken(token)
}
