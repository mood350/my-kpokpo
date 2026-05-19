/**
 * Backend API client for the MyKpokpo mobile app (CLIENT role only).
 *
 * Set the URL via env: `EXPO_PUBLIC_API_URL` in .env (auto-loaded by Expo).
 * On native dev, point this to your dev machine's LAN IP (e.g. http://192.168.1.10:8080)
 * — localhost won't resolve from the emulator/device.
 */

const API = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080'

let currentToken: string | null = null

export function setAccessToken(token: string | null) {
  currentToken = token
}

export function getAccessToken(): string | null {
  return currentToken
}

function authHeaders(): Record<string, string> {
  return currentToken
    ? { Authorization: `Bearer ${currentToken}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' }
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown
): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: authHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 204) return undefined as T

  const data = await res.json().catch(() => ({})) as { message?: string; code?: string }

  if (!res.ok) {
    throw new ApiError(res.status, data.message ?? `Erreur ${res.status}`, data.code)
  }

  return data as T
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email:    string
  password: string
}

export interface AuthTokens {
  access_token:  string
  refresh_token: string
}

export interface RegisterClientRequest {
  firstname: string
  lastname:  string
  email:     string
  password:  string
}

export function login(req: LoginRequest): Promise<AuthTokens> {
  return request<AuthTokens>('POST', '/api/v1/auth/login', req)
}

export function registerClient(req: RegisterClientRequest): Promise<void> {
  return request<void>('POST', '/api/v1/auth/register', { ...req, role: 'CLIENT' })
}

// Backend accepts both: a 6-digit code (manually typed) and a long UUID (from a magic link).
export async function confirmEmail(token: string): Promise<void> {
  const res = await fetch(
    `${API}/api/v1/auth/confirm?token=${encodeURIComponent(token)}`,
    { method: 'GET' },
  )
  if (res.ok) return
  const body = await res.json().catch(() => ({})) as { message?: string; code?: string }
  throw new ApiError(res.status, body.message ?? 'Code invalide ou expiré.', body.code)
}

export async function resendConfirmation(email: string): Promise<void> {
  const res = await fetch(
    `${API}/api/v1/auth/resend-confirmation?email=${encodeURIComponent(email)}`,
    { method: 'POST' },
  )
  if (res.ok) return
  const body = await res.json().catch(() => ({})) as { message?: string; code?: string }
  throw new ApiError(res.status, body.message ?? 'Échec de l’envoi.', body.code)
}

// ─── User profile ─────────────────────────────────────────────────────────────

export interface UserProfile {
  id:         number
  firstName:  string
  lastName:   string
  email:      string
  role:       'GARAGISTE' | 'CLIENT' | 'ADMIN'
  garageName: string | null
  garageId:   number | null
}

export function fetchMe(): Promise<UserProfile> {
  return request<UserProfile>('GET', '/api/v1/users/me')
}

/** Enregistre / met à jour le push token Expo de l'utilisateur. `null` pour le retirer. */
export function updatePushToken(token: string | null): Promise<void> {
  return request<void>('PUT', '/api/v1/users/me/push-token', { token })
}

// ─── Vehicles ─────────────────────────────────────────────────────────────────

export type FuelType = 'ESSENCE' | 'DIESEL' | 'HYBRIDE' | 'ELECTRIQUE' | 'GPL'

export interface VehicleResponse {
  id:                          number
  licensePlate:                string
  brand:                       string
  model:                       string
  year:                        number
  fuelType:                    FuelType
  currentMileage:              number | null
  vin:                         string | null
  insuranceExpiry:             string | null  // YYYY-MM-DD
  technicalInspectionExpiry:   string | null
  nextServiceDate:             string | null  // YYYY-MM-DD
  nextServiceMileage:          number | null
  createdAt:                   string
}

export interface VehicleInput {
  licensePlate:                string
  brand:                       string
  model:                       string
  year:                        number
  fuelType:                    FuelType
  currentMileage?:             number | null
  vin?:                        string | null
  insuranceExpiry?:            string | null
  technicalInspectionExpiry?:  string | null
  nextServiceDate?:            string | null
  nextServiceMileage?:         number | null
}

export function fetchMyVehicles(): Promise<VehicleResponse[]> {
  return request<VehicleResponse[]>('GET', '/api/v1/vehicles')
}

export function createVehicle(v: VehicleInput): Promise<VehicleResponse> {
  return request<VehicleResponse>('POST', '/api/v1/vehicles', v)
}

export function updateVehicle(id: number, v: VehicleInput): Promise<VehicleResponse> {
  return request<VehicleResponse>('PUT', `/api/v1/vehicles/${id}`, v)
}

export function deleteVehicle(id: number): Promise<void> {
  return request<void>('DELETE', `/api/v1/vehicles/${id}`)
}

// ─── Garages (public listing) ─────────────────────────────────────────────────

export interface GaragePublic {
  id:          number
  name:        string
  city:        string | null
  address:     string | null
  phone:       string | null
  description: string | null
  verified:    boolean
}

export function fetchGarages(): Promise<GaragePublic[]> {
  return request<GaragePublic[]>('GET', '/api/v1/garages')
}

// ─── Appointments ─────────────────────────────────────────────────────────────

export type AppointmentStatus =
  'PENDING' | 'CONFIRMED' | 'REJECTED' | 'RESCHEDULED' | 'COMPLETED' | 'CANCELLED'

export interface AppointmentResponse {
  id:            number
  client:        { id: number; firstName: string; lastName: string; email: string }
  vehicle:       { id: number; licensePlate: string; brand: string; model: string }
  garage:        { id: number; name: string; city: string | null }
  requestedDate: string  // ISO datetime
  confirmedDate: string | null
  status:        AppointmentStatus
  clientNotes:   string | null
  garageNotes:   string | null
  createdAt:     string
}

export interface AppointmentInput {
  vehicleId:     number
  garageId:      number
  requestedDate: string  // ISO datetime (e.g. 2026-06-12T09:00:00)
  clientNotes?:  string
}

export function fetchMyAppointments(): Promise<AppointmentResponse[]> {
  return request<AppointmentResponse[]>('GET', '/api/v1/appointments/my')
}

export function createAppointment(a: AppointmentInput): Promise<AppointmentResponse> {
  return request<AppointmentResponse>('POST', '/api/v1/appointments', a)
}

export function cancelAppointment(id: number): Promise<AppointmentResponse> {
  return request<AppointmentResponse>('PUT', `/api/v1/appointments/${id}/cancel`)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const FUEL_LABELS: Record<FuelType, string> = {
  ESSENCE:    'Essence',
  DIESEL:     'Diesel',
  HYBRIDE:    'Hybride',
  ELECTRIQUE: 'Électrique',
  GPL:        'GPL',
}

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  PENDING:     'En attente',
  CONFIRMED:   'Confirmé',
  REJECTED:    'Refusé',
  RESCHEDULED: 'Reprogrammé',
  COMPLETED:   'Terminé',
  CANCELLED:   'Annulé',
}

// ─── Notifications ────────────────────────────────────────────────────────────

export interface NotificationResponse {
  id:           number
  type:         'IN_APP' | 'EMAIL' | 'SMS'
  title:        string
  message:      string
  isRead:       boolean
  channel:      string | null   // ex: 'service_reminder', 'maintenance_reminder', 'stock_alert'
  referenceId:  number | null
  sentAt:       string          // ISO datetime
  readAt:       string | null
}

export function fetchMyNotifications(): Promise<NotificationResponse[]> {
  return request<NotificationResponse[]>('GET', '/api/v1/notifications')
}

export function fetchUnreadCount(): Promise<{ unreadCount: number }> {
  return request<{ unreadCount: number }>('GET', '/api/v1/notifications/unread-count')
}

export function markNotificationRead(id: number): Promise<NotificationResponse> {
  return request<NotificationResponse>('PUT', `/api/v1/notifications/${id}/read`)
}

export function markAllNotificationsRead(): Promise<void> {
  return request<void>('PUT', '/api/v1/notifications/read-all')
}

// ─── Messaging ────────────────────────────────────────────────────────────────

export interface Conversation {
  id:              number
  garageId:        number
  garageName:      string
  clientId:        number
  clientFirstName: string
  clientLastName:  string
  clientEmail:     string
  lastMessage:     string | null
  unreadCount:     number
  updatedAt:       string
}

export interface Message {
  id:             number
  conversationId: number
  senderId:       number
  senderRole:     'GARAGISTE' | 'CLIENT'
  content:        string
  read:           boolean
  createdAt:      string
}

export function fetchMyConversations(): Promise<Conversation[]> {
  return request<Conversation[]>('GET', '/api/v1/messages/my/conversations')
}

export function getOrCreateConversation(garageId: number): Promise<Conversation> {
  return request<Conversation>('POST', `/api/v1/messages/garage/${garageId}/conversations`)
}

export function fetchMessages(conversationId: number): Promise<Message[]> {
  return request<Message[]>('GET', `/api/v1/messages/conversations/${conversationId}`)
}

export function sendMessage(conversationId: number, content: string): Promise<Message> {
  return request<Message>('POST', `/api/v1/messages/conversations/${conversationId}/send`, { content })
}

export function markConversationRead(conversationId: number): Promise<void> {
  return request<void>('PATCH', `/api/v1/messages/conversations/${conversationId}/read`)
}

// ─── Conseils ─────────────────────────────────────────────────────────────────

export interface ConseilResponse {
  id:         number
  title:      string
  content:    string
  category:   string | null
  authorName: string
  published:  boolean
  createdAt:  string
}

export function fetchConseils(): Promise<ConseilResponse[]> {
  return request<ConseilResponse[]>('GET', '/api/v1/conseils')
}
