const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

export function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' }
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { headers: authHeaders() })
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { message?: string }
    throw new Error(body.message ?? `Erreur ${res.status}`)
  }
  return res.json() as Promise<T>
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export interface KpiSummary {
  interventionsThisMonth: number
  interventionsTrend:     number | null
  revenueThisMonth:       number
  revenueTrend:           number | null
  pendingAppointments:    number
  stockAlerts:            number
}

export interface RevenuePoint {
  month: string
  total: number
}

export interface RecentIntervention {
  id:                  number
  vehicleLicensePlate: string
  vehicleBrand:        string
  vehicleModel:        string
  technicianId:        number | null
  technicianName:      string | null
  workDescription:     string | null
  status:              'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED'
  interventionDate:    string
  createdAt:           string
}

export interface TodayAppointment {
  id:            number
  client:        { id: number; firstName: string; lastName: string; email: string }
  vehicle:       { id: number; licensePlate: string; brand: string; model: string }
  requestedDate: string
  confirmedDate: string | null
  status:        'PENDING' | 'CONFIRMED' | 'REJECTED' | 'RESCHEDULED' | 'COMPLETED' | 'CANCELLED'
  clientNotes:   string | null
}

export interface CriticalStockItem {
  id:                number
  name:              string
  reference:         string
  category:          string
  currentStock:      number
  minStockThreshold: number
  unit:              string
  lowStock:          boolean
}

export interface DashboardData {
  kpi:                 KpiSummary
  revenueChart:        RevenuePoint[]
  recentInterventions: RecentIntervention[]
  todayAppointments:   TodayAppointment[]
  criticalStock:       CriticalStockItem[]
}

export function fetchDashboard(): Promise<DashboardData> {
  return get<DashboardData>('/api/v1/dashboard')
}

// ── User profile ──────────────────────────────────────────────────────────────

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
  return get<UserProfile>('/api/v1/users/me')
}

// ── Appointments ──────────────────────────────────────────────────────────────

export type AppointmentStatus =
  'PENDING' | 'CONFIRMED' | 'REJECTED' | 'RESCHEDULED' | 'COMPLETED' | 'CANCELLED'

export interface AppointmentResponse {
  id:            number
  client:        { id: number; firstName: string; lastName: string; email: string }
  vehicle:       { id: number; licensePlate: string; brand: string; model: string }
  garage:        { id: number; name: string; city: string }
  requestedDate: string
  confirmedDate: string | null
  status:        AppointmentStatus
  clientNotes:   string | null
  garageNotes:   string | null
  createdAt:     string
}

export function fetchAppointmentsByGarage(garageId: number): Promise<AppointmentResponse[]> {
  return get<AppointmentResponse[]>(`/api/v1/appointments/garage/${garageId}`)
}

// ── Interventions ─────────────────────────────────────────────────────────────

export type InterventionStatus = 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED'

export interface InterventionResponse {
  id:                     number
  appointmentId:          number | null
  vehicleId:              number
  vehicleLicensePlate:    string
  vehicleBrand:           string
  vehicleModel:           string
  garageId:               number
  garageName:             string
  technicianId:           number | null
  technicianName:         string | null
  status:                 InterventionStatus
  diagnosis:              string | null
  workDescription:        string | null
  interventionDate:       string
  mileageAtIntervention:  number | null
  laborCost:              number | null
  partsUsed:              Array<{ partId: number; partName: string; quantity: number; unitPrice: number }>
  totalPartsCost:         number
  createdAt:              string
  lastModifiedDate:       string
}

export function fetchInterventionsByGarage(garageId: number): Promise<InterventionResponse[]> {
  return get<InterventionResponse[]>(`/api/v1/interventions/garage/${garageId}`)
}

// ── Parts / Stock ─────────────────────────────────────────────────────────────

export interface SparePartResponse {
  id:                number
  garageId:          number
  name:              string
  reference:         string
  category:          string
  brand:             string | null
  currentStock:      number
  minStockThreshold: number
  lowStock:          boolean
  purchasePrice:     number | null
  sellingPrice:      number | null
  unit:              string
  createdAt:         string
  lastModifiedDate:  string
}

export interface StockMovementResponse {
  id:           number
  partId:       number
  type:         'IN' | 'OUT' | 'ADJUSTMENT'
  quantity:     number
  reason:       string | null
  createdAt:    string
}

export function fetchPartsByGarage(garageId: number): Promise<SparePartResponse[]> {
  return get<SparePartResponse[]>(`/api/v1/parts/garage/${garageId}`)
}

export function fetchPartMovements(partId: number): Promise<StockMovementResponse[]> {
  return get<StockMovementResponse[]>(`/api/v1/parts/${partId}/movements`)
}

// ── Technicians ───────────────────────────────────────────────────────────────

export interface TechnicianResponse {
  id:        number
  userId:    number | null
  firstName: string
  lastName:  string
  email:     string | null
  garageId:  number
  specialty: string | null
  available: boolean
  createdAt: string
}

export function fetchTechniciansByGarage(garageId: number): Promise<TechnicianResponse[]> {
  return get<TechnicianResponse[]>(`/api/v1/technicians/garage/${garageId}`)
}

// ── Invoices ──────────────────────────────────────────────────────────────────

export type InvoiceType   = 'DEVIS' | 'FACTURE'
export type InvoiceStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'PAID' | 'CANCELLED'

export interface InvoiceLine {
  description: string
  quantity:    number
  unitPrice:   number
  totalHT:     number
}

export interface InvoiceResponse {
  id:                   number
  invoiceNumber:        string
  type:                 InvoiceType
  status:               InvoiceStatus
  garageId:             number
  garageName:           string
  clientId:             number
  clientName:           string
  clientEmail:          string
  vehicleId:            number | null
  vehicleLicensePlate:  string | null
  vehicleBrand:         string | null
  vehicleModel:         string | null
  interventionId:       number | null
  lines:                InvoiceLine[]
  totalHT:              number
  taxRate:              number
  totalTTC:             number
  issueDate:            string
  dueDate:              string | null
  createdAt:            string
  lastModifiedDate:     string
}

export function fetchInvoicesByGarage(garageId: number): Promise<InvoiceResponse[]> {
  return get<InvoiceResponse[]>(`/api/v1/invoices/garage/${garageId}`)
}

// ── Reports ───────────────────────────────────────────────────────────────────

export interface ReportDashboard {
  periodLabel:              string
  totalInterventions:       number
  completedInterventions:   number
  pendingAppointments:      number
  totalRevenueTTC:          number
  averageInterventionCost:  number
  stockAlerts:              number
  topTechnician:            string | null
  upcomingMaintenanceCount: number
}

export interface RevenueReport {
  startDate:        string
  endDate:          string
  totalRevenueHT:   number
  totalRevenueTTC:  number
  paidInvoiceCount: number
}

export interface TopService {
  description:  string
  usageCount:   number
  totalRevenue: number
}

export interface UpcomingMaintenance {
  vehicleId:                  number
  licensePlate:               string
  brand:                      string
  model:                      string
  ownerName:                  string
  ownerEmail:                 string
  insuranceExpiry:            string | null
  technicalInspectionExpiry:  string | null
}

export function fetchReportDashboard(garageId: number): Promise<ReportDashboard> {
  return get<ReportDashboard>(`/api/v1/reports/garage/${garageId}/dashboard`)
}

export function fetchReportRevenue(garageId: number): Promise<RevenueReport> {
  return get<RevenueReport>(`/api/v1/reports/garage/${garageId}/revenue`)
}

export function fetchTopServices(garageId: number): Promise<TopService[]> {
  return get<TopService[]>(`/api/v1/reports/garage/${garageId}/top-services`)
}

export function fetchUpcomingMaintenance(garageId: number): Promise<UpcomingMaintenance[]> {
  return get<UpcomingMaintenance[]>(`/api/v1/reports/garage/${garageId}/upcoming-maintenance`)
}

// ── Admin SaaS Stats ──────────────────────────────────────────────────────────

export interface RecentGarageInfo {
  id:        number
  name:      string
  city:      string
  ownerName: string
  verified:  boolean
  createdAt: string
}

export interface AdminStats {
  totalGarages:          number
  verifiedGarages:       number
  newGaragesThisMonth:   number
  totalGaragistes:       number
  totalClients:          number
  newGaragistesThisMonth: number
  totalInterventions:    number
  interventionsThisMonth: number
  mrrFcfa:               number
  totalRevenueFcfa:      number
  recentGarages:         RecentGarageInfo[]
}

export function fetchAdminStats(): Promise<AdminStats> {
  return get<AdminStats>('/api/v1/admin/stats')
}

export interface AdminGarage {
  id:         number
  name:       string
  city:       string
  phone:      string | null
  email:      string | null
  address:    string | null
  ownerName:  string
  ownerEmail: string
  verified:   boolean
  createdAt:  string | null
}

export interface AdminUser {
  id:         number
  firstName:  string
  lastName:   string
  email:      string
  role:       string
  enabled:    boolean
  createdAt:  string | null
  garageName: string | null
}

export function fetchAdminGarages(): Promise<AdminGarage[]> {
  return get<AdminGarage[]>('/api/v1/admin/garages')
}

export async function toggleGarageVerify(id: number): Promise<AdminGarage> {
  const res = await fetch(`${API}/api/v1/admin/garages/${id}/verify`, {
    method: 'PATCH', headers: authHeaders(),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { message?: string }
    throw new Error(body.message ?? `Erreur ${res.status}`)
  }
  return res.json() as Promise<AdminGarage>
}

export function fetchAdminUsers(): Promise<AdminUser[]> {
  return get<AdminUser[]>('/api/v1/admin/users')
}

// ── Garage / Settings ─────────────────────────────────────────────────────────

export interface GarageResponse {
  id:          number
  name:        string
  phone:       string | null
  email:       string | null
  address:     string | null
  city:        string | null
  country:     string | null
  description: string | null
  logoUrl:     string | null
  verified:    boolean
  latitude:    number | null
  longitude:   number | null
  createdAt:   string
}

export interface WorkingHoursResponse {
  id:        number
  dayOfWeek: string
  openTime:  string | null
  closeTime: string | null
  closed:    boolean
}

export function fetchGarage(garageId: number): Promise<GarageResponse> {
  return get<GarageResponse>(`/api/v1/garages/${garageId}`)
}

export function fetchWorkingHours(garageId: number): Promise<WorkingHoursResponse[]> {
  return get<WorkingHoursResponse[]>(`/api/v1/garages/${garageId}/working-hours`)
}

// ── Messaging ─────────────────────────────────────────────────────────────────

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

export function fetchConversations(garageId: number): Promise<Conversation[]> {
  return get<Conversation[]>(`/api/v1/messages/garage/${garageId}/conversations`)
}

export function fetchMessages(conversationId: number): Promise<Message[]> {
  return get<Message[]>(`/api/v1/messages/conversations/${conversationId}`)
}

export async function sendMessage(conversationId: number, content: string): Promise<Message> {
  const res = await fetch(`${API}/api/v1/messages/conversations/${conversationId}/send`, {
    method:  'POST',
    headers: authHeaders(),
    body:    JSON.stringify({ content }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { message?: string }
    throw new Error(body.message ?? `Erreur ${res.status}`)
  }
  return res.json() as Promise<Message>
}

export async function markConversationRead(conversationId: number): Promise<void> {
  await fetch(`${API}/api/v1/messages/conversations/${conversationId}/read`, {
    method:  'PATCH',
    headers: authHeaders(),
  })
}
