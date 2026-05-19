// ─────────────────────────────────────────────────────────────────────────────
// Types alignés sur les records Java du backend
// Les enums sont en MAJUSCULES pour coller aux valeurs sérialisées par Spring
// ─────────────────────────────────────────────────────────────────────────────

/** InterventionStatus.java */
export type InterventionStatus = 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED'

/** AppointmentStatus.java */
export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'RESCHEDULED'
  | 'COMPLETED'
  | 'CANCELLED'

// ─────────────────────────────────────────────────────────────────────────────
// Constantes du garage de démonstration
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_GARAGE_ID   = 1
export const MOCK_GARAGE_NAME = 'Garage Auto-Élite Lomé'

// ─────────────────────────────────────────────────────────────────────────────
// KPI Dashboard
// Aligné sur DashboardResponse.java :
//   totalInterventions, pendingAppointments, totalRevenueTTC, stockAlerts
// ─────────────────────────────────────────────────────────────────────────────

export type KpiColorVariant = 'accent' | 'success' | 'warning' | 'danger'
export type KpiIconType = 'interventions' | 'revenue' | 'appointments' | 'stock'

export interface KpiData {
  id: string
  label: string
  value: string           // valeur déjà formatée pour l'affichage
  rawValue: number        // valeur brute (calculs, comparaisons)
  trend: number | null    // % de variation (null = pas de tendance pour ce KPI)
  subLabel: string        // ligne sous la tendance
  iconType: KpiIconType
  colorVariant: KpiColorVariant
}

export const kpiData: KpiData[] = [
  {
    id: 'interventions',
    label: 'Interventions',
    value: '42',
    rawValue: 42,
    trend: 12,
    subLabel: 'ce mois',
    iconType: 'interventions',
    colorVariant: 'accent',
  },
  {
    id: 'revenue',
    label: "Chiffre d'affaires",
    value: '1 250 000',
    rawValue: 1_250_000,
    trend: 8,
    subLabel: 'FCFA ce mois',
    iconType: 'revenue',
    colorVariant: 'success',
  },
  {
    id: 'appointments',
    label: 'RDV en attente',
    value: '5',
    rawValue: 5,
    trend: -2,
    subLabel: 'à confirmer',
    iconType: 'appointments',
    colorVariant: 'warning',
  },
  {
    id: 'stock',
    label: 'Alertes stock',
    value: '3',
    rawValue: 3,
    trend: null,          // pas de variation pertinente sur les alertes
    subLabel: 'pièces sous seuil',
    iconType: 'stock',
    colorVariant: 'danger',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Chiffre d'affaires mensuel — 12 derniers mois (Juin 2025 → Mai 2026)
// Utilisé par le AreaChart Recharts.
// Source backend : GET /api/v1/reports/garage/{id}/revenue?startDate=&endDate=
// Note : l'endpoint agrège sur une période → 12 appels parallèles nécessaires
//        pour obtenir ce tableau. Les mocks évitent cela pendant le dev.
// ─────────────────────────────────────────────────────────────────────────────

export interface RevenueDataPoint {
  mois: string   // étiquette axe X
  ca: number     // totalRevenueTTC en FCFA (BigDecimal sérialisé en number)
}

export const revenueData: RevenueDataPoint[] = [
  { mois: 'Juin',  ca: 1_080_000 },
  { mois: 'Juil',  ca:   920_000 },
  { mois: 'Août',  ca:   875_000 },
  { mois: 'Sep',   ca: 1_140_000 },
  { mois: 'Oct',   ca: 1_390_000 },
  { mois: 'Nov',   ca: 1_620_000 },
  { mois: 'Déc',   ca: 1_480_000 },
  { mois: 'Jan',   ca:   980_000 },
  { mois: 'Fév',   ca: 1_060_000 },
  { mois: 'Mar',   ca: 1_310_000 },
  { mois: 'Avr',   ca: 1_175_000 },
  { mois: 'Mai',   ca: 1_250_000 },
]

// ─────────────────────────────────────────────────────────────────────────────
// Activité récente — 5 dernières interventions
// Aligné sur InterventionResponse.java
// technicianColor : couleur unique par technicien pour l'avatar (cercle initiales)
// ─────────────────────────────────────────────────────────────────────────────

export interface RecentActivity {
  id: number
  vehicleLicensePlate: string
  vehicleBrand: string
  vehicleModel: string
  technicianId: number
  technicianName: string
  technicianInitials: string
  technicianColor: string
  workDescription: string
  status: InterventionStatus
  createdAt: string           // ISO 8601 — LocalDateTime sérialisé par Jackson
}

export const recentActivity: RecentActivity[] = [
  {
    id: 101,
    vehicleLicensePlate: 'TG-3847-A',
    vehicleBrand: 'Toyota',
    vehicleModel: 'Corolla',
    technicianId: 1,
    technicianName: 'Koffi Agbodjan',
    technicianInitials: 'KA',
    technicianColor: '#4F7CAC',
    workDescription: 'Vidange + remplacement filtres',
    status: 'COMPLETED',
    createdAt: '2026-05-14T09:15:00',
  },
  {
    id: 102,
    vehicleLicensePlate: 'TG-1204-B',
    vehicleBrand: 'Peugeot',
    vehicleModel: '206',
    technicianId: 2,
    technicianName: 'Mawuli Dossou',
    technicianInitials: 'MD',
    technicianColor: '#8B6B4A',
    workDescription: 'Remplacement plaquettes de frein avant',
    status: 'IN_PROGRESS',
    createdAt: '2026-05-14T08:40:00',
  },
  {
    id: 103,
    vehicleLicensePlate: 'TG-6591-C',
    vehicleBrand: 'Renault',
    vehicleModel: 'Clio',
    technicianId: 1,
    technicianName: 'Koffi Agbodjan',
    technicianInitials: 'KA',
    technicianColor: '#4F7CAC',
    workDescription: 'Révision 30 000 km',
    status: 'COMPLETED',
    createdAt: '2026-05-13T16:20:00',
  },
  {
    id: 104,
    vehicleLicensePlate: 'TG-0823-D',
    vehicleBrand: 'Hyundai',
    vehicleModel: 'i10',
    technicianId: 3,
    technicianName: 'Sénam Akplé',
    technicianInitials: 'SA',
    technicianColor: '#4A7A5A',
    workDescription: 'Diagnostic moteur — voyant allumé',
    status: 'ON_HOLD',
    createdAt: '2026-05-13T14:05:00',
  },
  {
    id: 105,
    vehicleLicensePlate: 'TG-5110-A',
    vehicleBrand: 'Kia',
    vehicleModel: 'Picanto',
    technicianId: 2,
    technicianName: 'Mawuli Dossou',
    technicianInitials: 'MD',
    technicianColor: '#8B6B4A',
    workDescription: 'Remplacement batterie 60 Ah',
    status: 'COMPLETED',
    createdAt: '2026-05-13T11:30:00',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// RDV du jour — 14 mai 2026
// Aligné sur AppointmentResponse.java (client, vehicle, requestedDate, status)
// ─────────────────────────────────────────────────────────────────────────────

export interface TodayAppointment {
  id: number
  client: {
    id: number
    firstName: string
    lastName: string
  }
  vehicle: {
    id: number
    licensePlate: string
    brand: string
    model: string
  }
  requestedDate: string        // ISO 8601
  confirmedDate: string | null // null si pas encore confirmé
  status: AppointmentStatus
  clientNotes: string | null
}

export const todayAppointments: TodayAppointment[] = [
  {
    id: 201,
    client: { id: 11, firstName: 'Ayélé', lastName: 'Mensah' },
    vehicle: { id: 31, licensePlate: 'TG-2290-B', brand: 'Toyota', model: 'RAV4' },
    requestedDate: '2026-05-14T08:00:00',
    confirmedDate: '2026-05-14T08:00:00',
    status: 'CONFIRMED',
    clientNotes: 'Révision annuelle + vérification climatisation',
  },
  {
    id: 202,
    client: { id: 12, firstName: 'Edem', lastName: 'Kpodo' },
    vehicle: { id: 32, licensePlate: 'TG-4471-C', brand: 'Nissan', model: 'Micra' },
    requestedDate: '2026-05-14T10:30:00',
    confirmedDate: null,
    status: 'PENDING',
    clientNotes: 'Bruit suspect au démarrage côté droit',
  },
  {
    id: 203,
    client: { id: 13, firstName: 'Akosua', lastName: 'Tossou' },
    vehicle: { id: 33, licensePlate: 'TG-8803-A', brand: 'Honda', model: 'CR-V' },
    requestedDate: '2026-05-14T14:00:00',
    confirmedDate: '2026-05-14T14:00:00',
    status: 'CONFIRMED',
    clientNotes: null,
  },
  {
    id: 204,
    client: { id: 14, firstName: 'Yao', lastName: 'Amouzou' },
    vehicle: { id: 34, licensePlate: 'TG-1657-D', brand: 'Mercedes', model: 'Classe C' },
    requestedDate: '2026-05-14T16:30:00',
    confirmedDate: null,
    status: 'PENDING',
    clientNotes: 'Vidange + contrôle freins avant départ longue route',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Stock critique — pièces dont currentStock <= minStockThreshold
// Aligné sur SparePartResponse.java
// lowStock est un champ calculé côté backend (currentStock <= minStockThreshold)
// Le ratio currentStock / minStockThreshold alimente la barre de progression
// ─────────────────────────────────────────────────────────────────────────────

export interface CriticalStockItem {
  id: number
  name: string
  reference: string
  category: string
  currentStock: number
  minStockThreshold: number
  unit: string
  lowStock: true           // toujours true dans cette liste (filtre /low-stock)
}

export const criticalStock: CriticalStockItem[] = [
  {
    id: 301,
    name: 'Filtre à huile universel',
    reference: 'FH-OEM-4521',
    category: 'Filtration',
    currentStock: 2,
    minStockThreshold: 10,
    unit: 'pièce',
    lowStock: true,
  },
  {
    id: 302,
    name: 'Plaquettes de frein avant',
    reference: 'PF-BREMBO-A34',
    category: 'Freinage',
    currentStock: 1,
    minStockThreshold: 6,
    unit: 'jeu',
    lowStock: true,
  },
  {
    id: 303,
    name: 'Courroie de distribution',
    reference: 'CD-GATES-T083',
    category: 'Moteur',
    currentStock: 3,
    minStockThreshold: 5,
    unit: 'pièce',
    lowStock: true,
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Utilitaire — formatage FCFA
// ─────────────────────────────────────────────────────────────────────────────

export function formatFCFA(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(value)
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilitaire — heure relative (ex: "il y a 2h", "il y a 5 min")
// ─────────────────────────────────────────────────────────────────────────────

export function relativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1)  return "à l'instant"
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24)   return `il y a ${hours}h`
  const days = Math.floor(hours / 24)
  return `il y a ${days}j`
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilitaire — formatage heure (ex: "08:00")
// ─────────────────────────────────────────────────────────────────────────────

export function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
