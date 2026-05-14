# README — Backend : Application de Gestion de Maintenance Automobile

## 📌 Contexte du projet

Application **B2B2C SaaS** de gestion de maintenance et de suivi technique automobile, conçue pour le marché togolais/africain. La plateforme connecte deux types d'utilisateurs :

- **Particuliers (B2C)** : Gérer leur(s) véhicule(s), prendre des rendez-vous, consulter l'historique des interventions.
- **Professionnels / Garages (B2B)** : Gérer leur atelier, leurs clients, leurs techniciens, leurs stocks de pièces, et émettre des devis/factures.

**Projet académique** — Licence Génie Logiciel, IPNET Institute of Technology, Lomé, Togo.
- Étudiant 1 : TANANKOUBOUSSI Prince
- Étudiant 2 : ALABA Micael
- Encadreur : M. SHABAN Abdoulatif

---

## 🛠️ Stack technique

| Couche | Technologie |
|---|---|
| Langage | Java 21 |
| Framework | Spring Boot 3.x |
| Sécurité | Spring Security + JWT (Bearer Token) |
| Base de données | PostgreSQL |
| ORM | Spring Data JPA / Hibernate |
| Migration BDD | Flyway |
| Envoi d'emails | JavaMailSender (SMTP) |
| SMS | Twilio (ou API SMS locale) |
| PDF (devis/factures) | iText ou OpenPDF |
| Upload fichiers | Spring Multipart → stockage local ou S3 |
| Documentation API | SpringDoc OpenAPI (Swagger UI) |
| Build | Maven |
| Déploiement cible | Render.com (PostgreSQL inclus) |

---

## 🏗️ Architecture générale

```
src/
└── main/
    ├── java/com/mykpokpo/Backend/
    │   ├── config/          # SecurityConfig, BeansConfig (CORS, JWT, BCrypt)
    │   ├── security/        # JwtService, JwtAuthFilter, UserDetailsServiceImpl
    │   ├── auth/            # AuthController, AuthenticationService, DTOs
    │   ├── user/            # User, UserRepository
    │   ├── role/            # Role, RoleRepository
    │   ├── token/           # Token (OTP + linkToken UUID), TokenRepository, TokenType
    │   ├── email/           # EmailService (Thymeleaf + SMTP), EmailTemplateName
    │   ├── exception/       # GlobalExceptionHandler
    │   ├── utils/           # Listeners (BaseEntity audit)
    │   ├── vehicle/         # Vehicle, VehicleRepository, VehicleService, VehicleController
    │   ├── garage/          # Garage, GarageRepository, GarageService, GarageController
    │   ├── appointment/     # Appointment, AppointmentService, AppointmentController
    │   ├── intervention/    # Intervention, InterventionService, InterventionController
    │   ├── technician/      # Technician, TechnicianService, TechnicianController
    │   ├── parts/           # SparePart, StockMovement, PartsService, PartsController
    │   ├── invoice/         # Invoice, InvoiceLine, InvoiceService, InvoiceController
    │   ├── notification/    # Notification, NotificationService, NotificationController
    │   └── report/          # ReportService, ReportController
    └── resources/
        ├── application.properties
        └── templates/       # Thymeleaf email : activate_account, welcome,
                             #   reset_password, new_device_login
```

---

## 👤 Rôles et authentification

### Rôles utilisateur

| Rôle (roleName en BDD) | Description |
|---|---|
| `USER` | Particulier : gère ses véhicules, prend des RDV |
| `GARAGE_ADMIN` | Propriétaire de garage : gère tout l'atelier |
| `TECHNICIAN` | Technicien : voit et met à jour ses interventions assignées |
| `ADMIN` | Administration plateforme |

> Les rôles sont stockés dans la table `role` et liés à `User` via `user_roles` (ManyToMany).
> Spring Security les lit via `getAuthorities()` → `SimpleGrantedAuthority(roleName)`.

### Flux d'authentification

1. `POST /api/auth/register` — Inscription → email de confirmation envoyé (compte `enabled=false`)
2. `GET  /api/auth/confirm?token=<otp|uuid>` — Activation du compte (OTP 6 chiffres ou lien UUID)
3. `POST /api/auth/login` — Connexion → `access_token` (15 min) + `refresh_token` (7 jours)
4. `POST /api/auth/refresh-token` — Renouvellement de l'access token (Bearer refresh token)
5. `POST /api/auth/logout` — Efface le SecurityContext (le frontend supprime les tokens)
6. `POST /api/auth/forgot-password?email=` — Envoie un OTP de reset par email
7. `POST /api/auth/reset-password?token=&newPassword=` — Réinitialise le mot de passe

### Entité `User` (implémentée)

```java
Long id
String firstName
String lastName
String email           // unique, identifiant principal (= username JWT)
String password        // BCrypt strength 12
boolean enabled        // false jusqu'à confirmation email
boolean accountLocked
String lastKnownIp     // détection nouvel appareil
String lastKnownUserAgent
List<Role> roles       // ManyToMany → table user_roles
LocalDateTime createdAt
LocalDateTime lastModifiedDate
```

---

## 🚗 Module Véhicule (B2C)

### Entité `Vehicle`

```java
Long id
User owner             // @ManyToOne → User (CLIENT)
String licensePlate    // plaque d'immatriculation, unique par pays
String brand           // ex: Toyota, Peugeot, Mercedes
String model           // ex: Corolla, 308
Integer year
String fuelType        // ESSENCE, DIESEL, HYBRIDE, ELECTRIQUE
Integer currentMileage
String vin             // numéro de châssis, optionnel
LocalDate insuranceExpiry
LocalDate technicalInspectionExpiry
LocalDateTime createdAt
```

### Endpoints

| Méthode | URL | Accès | Description |
|---|---|---|---|
| `POST` | `/api/vehicles` | CLIENT | Ajouter un véhicule |
| `GET` | `/api/vehicles` | CLIENT | Lister ses véhicules |
| `GET` | `/api/vehicles/{id}` | CLIENT | Détail d'un véhicule |
| `PUT` | `/api/vehicles/{id}` | CLIENT | Modifier un véhicule |
| `DELETE` | `/api/vehicles/{id}` | CLIENT | Supprimer un véhicule |
| `PUT` | `/api/vehicles/{id}/mileage` | CLIENT | Mettre à jour le kilométrage |

---

## 🏪 Module Garage (B2B)

### Entité `Garage`

```java
Long id
User owner             // @OneToOne → User (GARAGE_ADMIN)
String name
String phone
String email
String address
String city
String country         // défaut: "Togo"
String description
String logoUrl
boolean isVerified     // validé par SUPER_ADMIN
Double latitude
Double longitude
LocalDateTime createdAt
```

### Entité `WorkingHours`

```java
Long id
Garage garage
DayOfWeek dayOfWeek    // MONDAY, TUESDAY, ...
LocalTime openTime
LocalTime closeTime
boolean isClosed       // fermé ce jour-là
```

### Endpoints Garage

| Méthode | URL | Accès | Description |
|---|---|---|---|
| `POST` | `/api/garages` | GARAGE_ADMIN | Créer son profil garage |
| `GET` | `/api/garages` | PUBLIC | Lister les garages (avec filtre ville) |
| `GET` | `/api/garages/{id}` | PUBLIC | Détail d'un garage |
| `PUT` | `/api/garages/{id}` | GARAGE_ADMIN | Modifier son garage |
| `POST` | `/api/garages/{id}/working-hours` | GARAGE_ADMIN | Définir les horaires |
| `GET` | `/api/garages/{id}/working-hours` | PUBLIC | Consulter les horaires |

---

## 📅 Module Rendez-vous (Appointment)

### Entité `Appointment`

```java
Long id
User client            // @ManyToOne → User (CLIENT)
Vehicle vehicle        // @ManyToOne → Vehicle
Garage garage          // @ManyToOne → Garage
LocalDateTime requestedDate
LocalDateTime confirmedDate  // null jusqu'à confirmation
AppointmentStatus status     // PENDING, CONFIRMED, REJECTED, RESCHEDULED, COMPLETED, CANCELLED
String clientNotes
String garageNotes
LocalDateTime createdAt
LocalDateTime updatedAt
```

### Statuts et transitions

```
PENDING → CONFIRMED → COMPLETED
       → REJECTED
       → RESCHEDULED → CONFIRMED → COMPLETED
CLIENT peut → CANCELLED (si PENDING ou CONFIRMED)
```

### Endpoints

| Méthode | URL | Accès | Description |
|---|---|---|---|
| `POST` | `/api/appointments` | CLIENT | Demander un RDV |
| `GET` | `/api/appointments/my` | CLIENT | Mes RDV |
| `GET` | `/api/appointments/garage/{garageId}` | GARAGE_ADMIN | RDV du garage |
| `PUT` | `/api/appointments/{id}/confirm` | GARAGE_ADMIN | Confirmer |
| `PUT` | `/api/appointments/{id}/reject` | GARAGE_ADMIN | Refuser |
| `PUT` | `/api/appointments/{id}/reschedule` | GARAGE_ADMIN | Proposer autre créneau |
| `PUT` | `/api/appointments/{id}/cancel` | CLIENT | Annuler |
| `GET` | `/api/appointments/{id}` | CLIENT / GARAGE_ADMIN | Détail |

---

## 🔧 Module Intervention

### Entité `Intervention`

```java
Long id
Appointment appointment  // @OneToOne, peut être null (walk-in)
Vehicle vehicle
Garage garage
Technician assignedTechnician  // @ManyToOne
String diagnosis
String workDescription
InterventionStatus status  // IN_PROGRESS, COMPLETED, ON_HOLD
LocalDate interventionDate
Integer mileageAtIntervention
BigDecimal laborCost
List<InterventionPart> partsUsed  // @OneToMany
LocalDateTime createdAt
LocalDateTime updatedAt
```

### Entité `InterventionPart`

```java
Long id
Intervention intervention
SparePart sparePart
Integer quantity
BigDecimal unitPrice   // prix au moment de l'intervention (snapshot)
```

### Endpoints

| Méthode | URL | Accès | Description |
|---|---|---|---|
| `POST` | `/api/interventions` | GARAGE_ADMIN | Créer une intervention |
| `GET` | `/api/interventions/garage/{garageId}` | GARAGE_ADMIN | Toutes les interventions |
| `GET` | `/api/interventions/vehicle/{vehicleId}` | CLIENT / GARAGE_ADMIN | Historique véhicule |
| `PUT` | `/api/interventions/{id}` | GARAGE_ADMIN | Modifier |
| `PUT` | `/api/interventions/{id}/status` | GARAGE_ADMIN / TECHNICIAN | Changer statut |
| `POST` | `/api/interventions/{id}/parts` | GARAGE_ADMIN | Ajouter pièces utilisées |

---

## 👨‍🔧 Module Technicien

### Entité `Technician`

```java
Long id
User user              // @OneToOne → User (TECHNICIAN)
Garage garage          // @ManyToOne → Garage
String specialty       // ex: "Moteur", "Carrosserie", "Électronique"
boolean isAvailable
LocalDateTime createdAt
```

### Endpoints

| Méthode | URL | Accès | Description |
|---|---|---|---|
| `POST` | `/api/technicians` | GARAGE_ADMIN | Ajouter un technicien |
| `GET` | `/api/technicians/garage/{garageId}` | GARAGE_ADMIN | Techniciens du garage |
| `PUT` | `/api/technicians/{id}` | GARAGE_ADMIN | Modifier |
| `DELETE` | `/api/technicians/{id}` | GARAGE_ADMIN | Retirer |
| `GET` | `/api/technicians/{id}/interventions` | TECHNICIAN | Mes interventions |

---

## 📦 Module Stock de pièces détachées

### Entité `SparePart`

```java
Long id
Garage garage
String name
String reference       // code pièce
String category        // ex: "Filtres", "Freins", "Pneumatiques"
String brand
Integer currentStock
Integer minStockThreshold  // seuil d'alerte stock critique
BigDecimal purchasePrice
BigDecimal sellingPrice
String unit            // "pièce", "litre", "kg"
LocalDateTime createdAt
LocalDateTime updatedAt
```

### Entité `StockMovement`

```java
Long id
SparePart sparePart
MovementType type      // IN (entrée), OUT (sortie), ADJUSTMENT
Integer quantity
String reason          // ex: "Achat fournisseur", "Utilisé intervention #42"
Long referenceId       // id de l'intervention associée (optionnel)
LocalDateTime movedAt
User createdBy
```

### Endpoints

| Méthode | URL | Accès | Description |
|---|---|---|---|
| `POST` | `/api/parts` | GARAGE_ADMIN | Ajouter une pièce |
| `GET` | `/api/parts/garage/{garageId}` | GARAGE_ADMIN | Liste du stock |
| `GET` | `/api/parts/garage/{garageId}/low-stock` | GARAGE_ADMIN | Pièces sous seuil |
| `PUT` | `/api/parts/{id}` | GARAGE_ADMIN | Modifier |
| `POST` | `/api/parts/{id}/movements` | GARAGE_ADMIN | Entrée/sortie stock |
| `GET` | `/api/parts/{id}/movements` | GARAGE_ADMIN | Historique mouvements |

---

## 🧾 Module Devis / Factures

### Entité `Invoice`

```java
Long id
Garage garage
Vehicle vehicle
User client
Intervention intervention  // @OneToOne, optionnel
InvoiceType type           // DEVIS, FACTURE
InvoiceStatus status       // DRAFT, SENT, ACCEPTED, REJECTED, PAID
List<InvoiceLine> lines    // @OneToMany
BigDecimal totalHT
BigDecimal taxRate         // ex: 0.18 pour 18%
BigDecimal totalTTC
String invoiceNumber       // auto-généré: FAC-2025-0001
LocalDate issueDate
LocalDate dueDate
String pdfUrl              // lien vers le PDF généré
LocalDateTime createdAt
```

### Entité `InvoiceLine`

```java
Long id
Invoice invoice
String description
Integer quantity
BigDecimal unitPrice
BigDecimal totalPrice      // quantity * unitPrice
```

### Endpoints

| Méthode | URL | Accès | Description |
|---|---|---|---|
| `POST` | `/api/invoices` | GARAGE_ADMIN | Créer devis/facture |
| `GET` | `/api/invoices/garage/{garageId}` | GARAGE_ADMIN | Toutes les factures |
| `GET` | `/api/invoices/client` | CLIENT | Mes factures |
| `GET` | `/api/invoices/{id}` | CLIENT / GARAGE_ADMIN | Détail |
| `PUT` | `/api/invoices/{id}/status` | GARAGE_ADMIN | Changer statut |
| `GET` | `/api/invoices/{id}/pdf` | CLIENT / GARAGE_ADMIN | Télécharger le PDF |
| `POST` | `/api/invoices/{id}/convert` | GARAGE_ADMIN | Convertir devis → facture |

---

## 🔔 Module Notifications

### Entité `Notification`

```java
Long id
User recipient
NotificationType type      // EMAIL, SMS, IN_APP
String title
String message
boolean isRead
LocalDateTime sentAt
LocalDateTime readAt
String channel             // "appointment", "maintenance_reminder", "stock_alert"
```

### Déclencheurs automatiques (planifiés avec `@Scheduled`)

| Déclencheur | Délai | Canal |
|---|---|---|
| RDV confirmé | Immédiat | EMAIL + IN_APP |
| RDV refusé | Immédiat | EMAIL + IN_APP |
| Assurance expirante | J-30, J-7 | EMAIL + SMS |
| Contrôle technique expirant | J-30, J-7 | EMAIL + SMS |
| Vidange recommandée (kilométrage) | Au passage du seuil | IN_APP |
| Stock pièce sous seuil | Immédiat | IN_APP (GARAGE_ADMIN) |

### Endpoints

| Méthode | URL | Accès | Description |
|---|---|---|---|
| `GET` | `/api/notifications` | Authentifié | Mes notifications |
| `PUT` | `/api/notifications/{id}/read` | Authentifié | Marquer lue |
| `PUT` | `/api/notifications/read-all` | Authentifié | Tout marquer lu |
| `GET` | `/api/notifications/unread-count` | Authentifié | Nombre non lues |

---

## 📊 Module Rapports et Statistiques (B2B)

### Endpoints

| Méthode | URL | Accès | Description |
|---|---|---|---|
| `GET` | `/api/reports/garage/{id}/dashboard` | GARAGE_ADMIN | KPIs du tableau de bord |
| `GET` | `/api/reports/garage/{id}/revenue` | GARAGE_ADMIN | Chiffre d'affaires (période) |
| `GET` | `/api/reports/garage/{id}/interventions` | GARAGE_ADMIN | Stats interventions |
| `GET` | `/api/reports/garage/{id}/top-services` | GARAGE_ADMIN | Services les plus demandés |
| `GET` | `/api/reports/garage/{id}/upcoming-maintenance` | GARAGE_ADMIN | Clients avec entretiens proches |

### Exemple de réponse `/dashboard`

```json
{
  "periodLabel": "Mai 2025",
  "totalInterventions": 42,
  "completedInterventions": 38,
  "pendingAppointments": 5,
  "totalRevenueTTC": 1250000,
  "averageInterventionCost": 29761,
  "stockAlerts": 3,
  "topTechnician": "Koami AGBA",
  "upcomingMaintenanceCount": 12
}
```

---

## 🗄️ Schéma base de données — Relations clés

```
User (1) ──── (1) Garage
User (1) ──── (N) Vehicle
Garage (1) ── (N) Technician ←── User
Garage (1) ── (N) SparePart
Garage (1) ── (N) WorkingHours
Vehicle (N) ─ (N) Garage  [via Appointment / Intervention]
Appointment (1) ─── (1) Intervention
Intervention (N) ── (N) SparePart  [via InterventionPart]
Intervention (1) ── (1) Invoice
Invoice (1) ─── (N) InvoiceLine
User (1) ───── (N) Notification
```

---

## ⚙️ Configuration `application.properties`

```properties
# Serveur
server.port=8080

# Base de données
spring.datasource.url=jdbc:postgresql://localhost:5432/kpokpo_db
spring.datasource.username=root
spring.datasource.password=root
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

# JWT — generer la cle avec : openssl rand -base64 64
application.security.jwt.secret-key=<base64_secret>
application.security.jwt.expiration=900000            # 15 min
application.security.jwt.refresh-token-expiration=604800000  # 7 jours

# Mail (Gmail SMTP + App Password)
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=<gmail>
spring.mail.password=<app_password>
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
application.mail.from=no-reply@kpokpo.com

# URL du frontend pour le lien d'activation email
application.mailing.frontend.activation-url=http://localhost:3000/activate

# Twilio (SMS) — a venir
twilio.account-sid=${TWILIO_ACCOUNT_SID}
twilio.auth-token=${TWILIO_AUTH_TOKEN}
twilio.phone-number=${TWILIO_PHONE_NUMBER}

# Upload fichiers
app.upload.dir=./uploads
spring.servlet.multipart.max-file-size=5MB
```

---

## 🔐 Règles de sécurité Spring Security

```
PUBLIC          : /api/auth/**
                  GET /api/garages, GET /api/garages/{id}
                  /swagger-ui/**, /v3/api-docs/**

hasRole(ADMIN)  : /api/admin/**

Authentifie     : tout le reste (JWT Bearer token obligatoire)

CLIENT          : /api/vehicles/**, /api/appointments/my, POST /api/appointments,
                  /api/notifications/**, GET /api/invoices/client

GARAGE_ADMIN    : /api/interventions/**, /api/parts/**, /api/technicians/**,
                  /api/invoices/garage/**, /api/reports/**,
                  PUT /api/appointments/{id}/confirm|reject|reschedule

TECHNICIAN      : GET /api/interventions/**, PUT /api/interventions/{id}/status

ADMIN           : tout
```

> Configuration dans `SecurityConfig.java` — STATELESS (pas de session), CORS configuré pour
> `localhost:3000`, `localhost:4200`, `localhost:8000`.

---

## 📐 Conventions de code

### Nommage des packages
`com.mykpokpo.Backend.<module>` — ex: `com.mykpokpo.Backend.vehicle`, `com.mykpokpo.Backend.appointment`

### Structure par module
Chaque module contient :
- `NomEntite.java` — entité JPA avec `@Entity`
- `NomEntiteDTO.java` / `NomEntiteRequest.java` / `NomEntiteResponse.java`
- `NomEntiteRepository.java` — interface JPA
- `NomEntiteService.java` — interface
- `NomEntiteServiceImpl.java` — implémentation avec `@Service @Transactional`
- `NomEntiteController.java` — `@RestController @RequestMapping`

### Réponse API standardisée

```java
// ApiResponse<T>
{
  "success": true,
  "message": "Véhicule créé avec succès",
  "data": { ... }
}

// PageResponse<T> (pour les listes paginées)
{
  "success": true,
  "data": [ ... ],
  "page": 0,
  "size": 10,
  "totalElements": 42,
  "totalPages": 5
}

// Erreur (GlobalExceptionHandler)
{
  "success": false,
  "message": "Véhicule introuvable",
  "errors": { "vehicleId": "La ressource avec l'id 5 n'existe pas" }
}
```

### Codes HTTP utilisés
- `200 OK` — lecture réussie
- `201 Created` — création réussie
- `204 No Content` — suppression réussie
- `400 Bad Request` — validation échouée
- `401 Unauthorized` — token absent ou invalide
- `403 Forbidden` — rôle insuffisant
- `404 Not Found` — ressource introuvable
- `409 Conflict` — conflit (ex: email déjà utilisé)

---

## 🚀 Ordre de génération recommandé

Générer les modules dans cet ordre pour respecter les dépendances :

1. `common/` — BaseEntity, ApiResponse, GlobalExceptionHandler, enums
2. `auth/` + `user/` — User, JWT, AuthController
3. `vehicle/` — Vehicle, endpoints CRUD
4. `garage/` — Garage, WorkingHours
5. `technician/` — Technician
6. `parts/` — SparePart, StockMovement
7. `appointment/` — Appointment avec machine à états
8. `intervention/` — Intervention, InterventionPart
9. `invoice/` — Invoice, InvoiceLine, génération PDF
10. `notification/` — Notification, scheduler
11. `report/` — ReportService, agrégations SQL
12. `db/migration/` — Scripts Flyway consolidés

---

## 📝 Notes pour Claude

- **Toujours générer les fichiers complets**, sans troncature ni `// ... reste du code`.
- Utiliser **Java 21** avec les records là où c'est pertinent (DTOs).
- Les **entités héritent de `BaseEntity`** (id, createdAt, updatedAt avec `@MappedSuperclass`).
- **Valider les DTOs** avec `@Valid` + annotations Jakarta Validation (`@NotBlank`, `@Email`, `@Min`, etc.).
- **Pas de `@Autowired` sur les champs** — injecter par constructeur uniquement.
- Les **services vérifient l'appartenance des ressources** (un client ne peut pas voir les véhicules d'un autre).
- **Toujours tester la compilation mentalement** avant de générer (imports, types, cohérence).
- Pour chaque endpoint, préciser le **DTO en entrée** et le **DTO en sortie** dans les commentaires Javadoc.
- Les **migrations Flyway** sont nommées `V{n}__{description}.sql` et ne sont jamais modifiées après exécution.# my-kpokpo
