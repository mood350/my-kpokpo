# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

B2B2C SaaS — gestion de maintenance automobile pour le marché togolais/africain.
Stack : Java 21, Spring Boot 3.5, PostgreSQL 18, JWT (jjwt 0.12), Thymeleaf emails, Bucket4j rate limiting.
Projet académique — Licence Génie Logiciel, IPNET Institute of Technology, Lomé.

## Commands

```bash
# Compiler
mvn compile

# Démarrer (dev)
mvn spring-boot:run

# Build JAR
mvn package -DskipTests

# Tests
mvn test
mvn test -Dtest=NomDeLaClasseTest   # test unique
```

PostgreSQL doit tourner sur `localhost:5432`, base `kpokpo_db`, user `root / root`.
Le rôle `USER` doit exister en BDD avant le premier register :
```sql
INSERT INTO role (role_name, created_at) VALUES ('USER', NOW()) ON CONFLICT DO NOTHING;
```

## Package & URL

- Package racine : `com.mykpokpo.Backend`
- Tous les endpoints sont versionnés : `/api/v1/`
- Swagger UI : `http://localhost:8080/swagger-ui.html`

## Architecture

### Couches par module

Chaque module business suit la même structure plate (pas de sous-packages) :
```
<module>/
  <Entity>.java          — @Entity extend Listeners (audit createdAt/lastModifiedDate)
  <Entity>Repository.java
  <Entity>Request.java   — DTO entrant avec @Valid
  <Entity>Response.java  — record Java 21 avec factory from(Entity)
  <Entity>Service.java   — @Service, logique métier + vérification d'ownership
  <Entity>Controller.java — @RestController @RequestMapping("/api/v1/...")
```

Modules implémentés : `auth`, `vehicle`, `garage` (+ `WorkingHours`), `appointment`, `technician`, `parts`, `intervention`, `invoice`, `notification`, `report`.
Modules planifiés : aucun — backend complet.

### Classes transversales

| Fichier | Rôle |
|---|---|
| `utils/Listeners.java` | `@MappedSuperclass` avec `createdAt` + `lastModifiedDate` — toutes les entités en héritent |
| `exception/GlobalExceptionHandler.java` | `@RestControllerAdvice` — format uniforme `{code, message, details, path, timestamp}` |
| `config/SecurityConfig.java` | Chaîne de filtres Spring Security (STATELESS, JWT, CORS) |
| `config/BeansConfig.java` | `AuthenticationProvider`, `PasswordEncoder` (BCrypt 12), `AuthenticationManager` |
| `config/RateLimitFilter.java` | `@Order(1)` — token bucket Bucket4j par IP, avant Spring Security |
| `security/JwtAuthFilter.java` | Extrait le Bearer token, valide, popule le `SecurityContext` |
| `security/JwtService.java` | Génère/valide access token (15 min) + refresh token (7 jours) |

### Authentification & tokens

- Inscription : `enabled=false` jusqu'à confirmation email
- Token de confirmation : deux champs sur l'entité `Token` — `token` (OTP 6 chiffres, mobile) et `linkToken` (UUID, lien email desktop)
- `GET /api/v1/auth/confirm?token=` accepte les deux formats
- Détection nouvel appareil/IP au login → email d'alerte automatique

### Sécurité des données

- Services : vérification d'ownership via `findByIdAndOwner(id, user)` — retourne 404 en cas d'accès non autorisé (pas de 403, pour éviter la fuite d'existence)
- `@AuthenticationPrincipal User user` dans les controllers pour récupérer l'utilisateur courant
- Endpoints publics déclarés explicitement dans `SecurityConfig` ; tout le reste requiert un JWT

### Règles métier notables

- `Vehicle.licensePlate` est normalisée en majuscules au save
- Le kilométrage ne peut pas régresser (`updateMileage` lève `IllegalArgumentException`)
- Un user ne peut posséder qu'un seul garage (`existsByOwner` avant création)
- `WorkingHours` : `POST /{garageId}/working-hours` remplace tous les horaires existants (delete + insert)

### Réponse d'erreur standard

```json
{ "code": "ENTITY_NOT_FOUND", "message": "...", "details": {}, "path": "/api/v1/...", "timestamp": "..." }
```

Codes existants : `BAD_CREDENTIALS`, `USER_NOT_FOUND`, `ACCESS_DENIED`, `VALIDATION_ERROR`,
`ENTITY_NOT_FOUND`, `INVALID_JSON`, `INVALID_ARGUMENT`, `INTERNAL_ERROR`.

### Machine à états Appointment

```
PENDING → CONFIRMED (garage: /confirm)
PENDING → REJECTED  (garage: /reject)
PENDING → RESCHEDULED (garage: /reschedule)
CONFIRMED → COMPLETED (garage: /complete)
CONFIRMED → RESCHEDULED (garage: /reschedule)
PENDING | CONFIRMED → CANCELLED (client: /cancel)
```

Transitions invalides → `IllegalArgumentException` (400 INVALID_ARGUMENT).
Accès à un RDV d'un autre user → `EntityNotFoundException` (404, pas 403).
Pour ajouter un nouveau cas métier, lancer `IllegalArgumentException` ou `EntityNotFoundException` depuis le service — le handler existant les capte.

### Rate limiting

`RateLimitFilter` (Bucket4j, in-memory par IP) :
- Endpoints sensibles (`/auth/login`, `/auth/register`, `/auth/forgot-password`, `/auth/reset-password`) : `app.rate-limit.auth.capacity` req/min (défaut 10)
- Tout le reste : `app.rate-limit.api.capacity` req/min (défaut 100)
- Réponse 429 avec header `Retry-After: 60`

### Emails

`EmailService` envoie de manière `@Async` via Gmail SMTP.
Templates Thymeleaf dans `src/main/resources/templates/` :
`activate_account.html`, `welcome.html`, `reset_password.html`, `new_device_login.html`.
Variables injectées via `Map<String, Object> properties` passée à `emailService.sendEmail(...)`.

## Conventions

- DTOs de réponse = records Java 21 avec `static from(Entity e)`
- DTOs de requête = classes Lombok avec `@Valid` + contraintes Jakarta
- Pas d'interface Service séparée — `@Service` direct
- `@Transactional` uniquement sur les méthodes qui font plusieurs écritures
- Pas de `@Autowired` champ — injection constructeur via `@RequiredArgsConstructor`
- Propriétés custom préfixées `application.*` (JWT, mail) ou `app.*` (rate-limit)
