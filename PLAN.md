# PLAN.md — SAM : Service d'Accès Médical
> MVP étudiant — données 100 % fictives

---

## 1. Architecture générale

```
sam-mvp/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Layout public (login, register)
│   │   ├── login/
│   │   └── register/
│   ├── (patient)/                # Layout espace patient
│   │   └── patient/
│   │       ├── dashboard/
│   │       ├── dossier/
│   │       │   └── edit/
│   │       ├── historique/
│   │       └── qr-code/
│   ├── (hopital)/                # Layout espace personnel hospitalier
│   │   └── hopital/
│   │       ├── dashboard/
│   │       ├── recherche/
│   │       ├── scan/
│   │       └── patient/
│   │           └── [id]/
│   │               ├── page.tsx  # Fiche patient
│   │               ├── valider/  # IAO validation
│   │               └── passage/ # Enregistrement passage
│   └── (admin)/                  # Layout espace admin hôpital
│       └── admin/
│           ├── dashboard/
│           ├── personnel/
│           └── audit/
├── api/                          # Route handlers Next.js
│   ├── auth/[...nextauth]/
│   ├── patients/
│   │   ├── route.ts
│   │   ├── search/route.ts
│   │   └── [id]/
│   │       ├── route.ts
│   │       ├── record/route.ts
│   │       ├── qr/route.ts
│   │       └── emergency-access/route.ts
│   ├── visits/route.ts
│   ├── staff/route.ts
│   └── audit/route.ts
├── components/                   # Composants réutilisables
│   ├── ui/                       # Boutons, inputs, cards, badges
│   ├── patient/                  # Formulaire dossier, QR code
│   ├── hopital/                  # Recherche, fiche, scan
│   └── admin/                    # Tableaux, audit
├── lib/
│   ├── auth.ts                   # Configuration NextAuth
│   ├── prisma.ts                 # Singleton Prisma
│   ├── permissions.ts            # Matrice des droits
│   └── fuzzy-search.ts           # Recherche tolérante
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/
│   └── uploads/                  # Photos patients (local)
└── middleware.ts                 # Protection des routes par rôle
```

**Stack :**
- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** (tablette-first, gros boutons, contrastes forts)
- **Prisma** ORM + **SQLite** (aucune configuration externe)
- **NextAuth.js v5** — sessions JWT, middleware de protection
- **bcryptjs** — hachage des mots de passe
- **qrcode** + **html5-qrcode** — génération et scan QR
- **Fuse.js** — recherche fuzzy tolérante aux accents / fautes
- **Jest** + **Playwright** — tests unitaires et E2E

---

## 2. Schéma de base de données (Prisma)

```prisma
// Établissements (hôpitaux, cliniques, urgences)
model Hospital {
  id            String    @id @default(cuid())
  name          String
  city          String
  address       String?
  bedCount      Int       @default(0)
  pricePerBed   Float     @default(5.0)   // €/lit/mois
  staff         Staff[]
  visits        Visit[]
  createdAt     DateTime  @default(now())
}

// Comptes utilisateurs (tous rôles confondus)
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String
  role          Role
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  patient       Patient?
  staff         Staff?
  auditLogs     AuditLog[]
}

enum Role {
  PATIENT
  ACCUEIL
  IAO
  INFIRMIER
  URGENTISTE
  ADMIN_HOPITAL
}

// Profil patient
model Patient {
  id              String    @id @default(cuid())
  userId          String    @unique
  user            User      @relation(fields: [userId], references: [id])
  firstName       String
  lastName        String
  birthDate       DateTime
  birthCity       String
  photoUrl        String?
  qrCode          String    @unique  // token aléatoire
  bloodGroup      String?
  validatedAt     DateTime?
  validatedBy     String?   // nom de l'IAO
  validatedByStaffId String?
  record          MedicalRecord?
  visits          Visit[]
  recordVersions  RecordVersion[]
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

// Dossier médical principal
model MedicalRecord {
  id              String    @id @default(cuid())
  patientId       String    @unique
  patient         Patient   @relation(fields: [patientId], references: [id])
  allergies       Allergy[]
  medications     Medication[]
  medicalHistory  MedicalHistory[]
  emergencyContact EmergencyContact?
  treatingDoctor  String?
  notes           String?
  updatedAt       DateTime  @updatedAt
}

// Allergies (avec niveau de gravité)
model Allergy {
  id              String    @id @default(cuid())
  recordId        String
  record          MedicalRecord @relation(fields: [recordId], references: [id])
  name            String
  severity        AllergySeverity
  reaction        String?
}

enum AllergySeverity {
  LEGERE
  MODEREE
  GRAVE
  ANAPHYLAXIE
}

// Traitements en cours
model Medication {
  id              String    @id @default(cuid())
  recordId        String
  record          MedicalRecord @relation(fields: [recordId], references: [id])
  name            String
  dosage          String?
  frequency       String?
  since           DateTime?
}

// Antécédents médicaux
model MedicalHistory {
  id              String    @id @default(cuid())
  recordId        String
  record          MedicalRecord @relation(fields: [recordId], references: [id])
  condition       String
  diagnosedAt     DateTime?
  notes           String?
}

// Contact d'urgence
model EmergencyContact {
  id              String    @id @default(cuid())
  recordId        String    @unique
  record          MedicalRecord @relation(fields: [recordId], references: [id])
  firstName       String
  lastName        String
  relationship    String
  phone           String
}

// Historique des versions du dossier
model RecordVersion {
  id              String    @id @default(cuid())
  patientId       String
  patient         Patient   @relation(fields: [patientId], references: [id])
  snapshot        String    // JSON sérialisé du dossier à l'instant T
  changedBy       String    // "patient" ou nom du staff
  createdAt       DateTime  @default(now())
}

// Personnel hospitalier
model Staff {
  id              String    @id @default(cuid())
  userId          String    @unique
  user            User      @relation(fields: [userId], references: [id])
  hospitalId      String
  hospital        Hospital  @relation(fields: [hospitalId], references: [id])
  firstName       String
  lastName        String
  active          Boolean   @default(true)
  auditLogs       AuditLog[]
}

// Passages / consultations (interopérabilité)
model Visit {
  id              String    @id @default(cuid())
  patientId       String
  patient         Patient   @relation(fields: [patientId], references: [id])
  hospitalId      String
  hospital        Hospital  @relation(fields: [hospitalId], references: [id])
  date            DateTime  @default(now())
  reason          String
  notes           String?
  staffId         String?
}

// Journal d'audit
model AuditLog {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id])
  staffId         String?
  staff           Staff?    @relation(fields: [staffId], references: [id])
  patientId       String?
  action          AuditAction
  details         String?   // JSON contextuel (justification bris de glace, etc.)
  isEmergency     Boolean   @default(false)
  createdAt       DateTime  @default(now())
}

enum AuditAction {
  LOGIN
  LOGOUT
  VIEW_RECORD
  EDIT_RECORD
  VALIDATE_RECORD
  EMERGENCY_ACCESS
  REGISTER_VISIT
  CREATE_STAFF
  DEACTIVATE_STAFF
  SEARCH_PATIENT
}
```

---

## 3. Pages et routes

### Espace public / authentification
| Route | Description |
|-------|-------------|
| `/` | Page d'accueil démo (liens vers patient et hôpital) |
| `/login` | Connexion unifiée (redirige selon rôle) |
| `/register` | Inscription patient uniquement |

### Espace patient `/patient/*`
| Route | Description |
|-------|-------------|
| `/patient/dashboard` | Tableau de bord patient (statut dossier, dernier passage) |
| `/patient/dossier` | Consultation du dossier |
| `/patient/dossier/edit` | Formulaire d'édition complet |
| `/patient/qr-code` | Affichage QR code personnel (grand format tablette) |
| `/patient/historique` | Historique des versions du dossier |

### Espace personnel hospitalier `/hopital/*`
| Route | Description |
|-------|-------------|
| `/hopital/dashboard` | Dashboard staff (file d'attente, recherches récentes) |
| `/hopital/recherche` | Recherche patient (nom + prénom + optionnels) |
| `/hopital/scan` | Scanner QR code caméra + saisie manuelle |
| `/hopital/patient/[id]` | Fiche patient (niveau de détail selon rôle) |
| `/hopital/patient/[id]/valider` | Formulaire validation IAO |
| `/hopital/patient/[id]/passage` | Enregistrement d'un passage |
| `/hopital/patient/[id]/urgence` | Modal bris de glace (justification obligatoire) |

### Espace admin `/admin/*`
| Route | Description |
|-------|-------------|
| `/admin/dashboard` | KPIs : patients, passages, dossiers en attente, abonnement |
| `/admin/personnel` | CRUD personnel rattaché à l'établissement |
| `/admin/audit` | Journal d'audit filtrable (bris de glace en rouge) |

### API Routes `/api/*`
| Endpoint | Méthodes | Description |
|----------|----------|-------------|
| `/api/auth/[...nextauth]` | GET, POST | NextAuth |
| `/api/patients` | GET, POST | Liste / création patient |
| `/api/patients/search` | GET | Recherche fuzzy |
| `/api/patients/[id]` | GET, PUT, DELETE | Dossier complet |
| `/api/patients/[id]/record` | GET, PUT | Dossier médical |
| `/api/patients/[id]/qr` | GET | Accès par QR token |
| `/api/patients/[id]/validate` | POST | Validation IAO |
| `/api/patients/[id]/emergency` | POST | Bris de glace |
| `/api/visits` | GET, POST | Passages |
| `/api/staff` | GET, POST, PUT | Personnel |
| `/api/audit` | GET | Journal (admin seulement) |
| `/api/hospitals` | GET | Établissements |

---

## 4. Matrice des droits par rôle

| Fonctionnalité | PATIENT | ACCUEIL | IAO | INFIRMIER | URGENTISTE | ADMIN_HOPITAL |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Voir son propre dossier | ✅ | — | — | — | — | — |
| Modifier son dossier | ✅ | — | — | — | — | — |
| Voir QR code personnel | ✅ | — | — | — | — | — |
| Rechercher un patient | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| Voir identité + allergies | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| Voir dossier médical complet | — | ❌ | ✅ | ✅ | ✅ | ✅ |
| Valider dossier (IAO) | — | ❌ | ✅ | ❌ | ❌ | ❌ |
| Enregistrer un passage | — | ✅ | ✅ | ✅ | ✅ | ❌ |
| Accès d'urgence (bris de glace) | — | ❌ | ❌ | ❌ | ✅ | ❌ |
| Scan QR code | — | ✅ | ✅ | ✅ | ✅ | ❌ |
| Gérer le personnel | — | ❌ | ❌ | ❌ | ❌ | ✅ |
| Voir journal d'audit | — | ❌ | ❌ | ❌ | ❌ | ✅ |
| Voir tableau de bord admin | — | ❌ | ❌ | ❌ | ❌ | ✅ |

**Règle d'accès inter-établissements :** tout personnel authentifié peut voir les dossiers des patients de tout établissement partenaire, mais le passage est toujours rattaché à son établissement.

**Bris de glace :** l'urgentiste saisit une justification textuelle obligatoire ; l'accès est loggé comme `EMERGENCY_ACCESS` et mis en évidence rouge dans le journal d'audit de l'admin.

---

## 5. Découpage en phases

### Phase 1 — Fondations (initialisation, BD, auth, seed)
**Livrable :** `npm install && npx prisma db push && npx prisma db seed && npm run dev` → page d'accueil visible, login fonctionnel pour chaque rôle.

Étapes :
- Initialiser le projet Next.js + TypeScript + Tailwind
- Configurer Prisma + SQLite, écrire `schema.prisma`
- Écrire `seed.ts` : 2 hôpitaux, 30 patients fictifs, 1 compte par rôle × 2 établissements
- Configurer NextAuth.js avec CredentialsProvider (bcrypt)
- Écrire `middleware.ts` : redirection selon rôle
- Composants UI de base : layout, bandeau démo, boutons
- **Validation :** `npm run build` ✅, tous les logins seed fonctionnent

### Phase 2 — Espace patient
**Livrable :** un patient peut créer/modifier son dossier et voir son QR code.

Étapes :
- Pages : dashboard patient, formulaire dossier (toutes les sections), historique
- Upload photo (stockage local `/public/uploads`)
- Génération QR code (token cuid unique) avec bibliothèque `qrcode`
- API : `POST/PUT /api/patients/[id]/record`
- Sauvegarde de version à chaque modification
- Affichage statut validation (en attente / validé le … par …)
- **Validation :** `npm run build` ✅, parcours patient E2E (Playwright)

### Phase 3 — Espace personnel hospitalier (recherche + fiche)
**Livrable :** le personnel trouve un patient, voit sa fiche selon son rôle.

Étapes :
- Page recherche avec Fuse.js (tolérance accents, fautes de frappe)
- Résultats avec photo + date de naissance pour désambiguïsation
- Scanner QR code (`html5-qrcode`) + saisie manuelle de secours
- Fiche patient : allergies graves en rouge en haut, puis traitements, groupe sanguin, antécédents, contact d'urgence
- Masquage des sections médicales pour ACCUEIL (allergies + identité seulement)
- Log `VIEW_RECORD` à chaque consultation
- **Validation :** `npm run build` ✅, tests unitaires matrice droits, parcours E2E IAO

### Phase 4 — Validation IAO, passages, bris de glace
**Livrable :** l'IAO valide un dossier ; un urgentiste accède en mode d'urgence ; les passages sont visibles inter-établissements.

Étapes :
- Formulaire de validation IAO (case à cocher par section + bouton valider)
- Mise à jour `Patient.validatedAt` / `validatedBy`
- Enregistrement de passage (motif, notes) rattaché à l'établissement du staff
- Modal bris de glace : justification obligatoire → `EMERGENCY_ACCESS` loggé
- Affichage des passages sur la fiche patient (tous établissements confondus)
- **Validation :** `npm run build` ✅, parcours E2E bris de glace

### Phase 5 — Espace admin
**Livrable :** l'admin gère son personnel et lit le journal d'audit.

Étapes :
- Tableau de bord : compteurs (patients, passages du mois, en attente validation, lits, abonnement calculé)
- CRUD personnel : créer un compte staff, désactiver, changer de rôle
- Journal d'audit filtrable (par action, par date, par staff) — `EMERGENCY_ACCESS` en rouge
- **Validation :** `npm run build` ✅, tests unitaires accès admin

### Phase 6 — Finitions UI et démo
**Livrable :** MVP démo-ready, README complet.

Étapes :
- Design tablette-first : gros boutons (min 48px), lisible à distance, contrastes AA
- États vides soignés (aucun patient trouvé, dossier incomplet)
- Messages d'erreur et feedback (toast notifications)
- Page d'accueil démo avec scénarios cliquables
- Bandeau « Démo — données fictives » sur toutes les pages
- `README.md` : installation 3 commandes, comptes de démo, script jury 5 min
- **Validation :** `npm run build` ✅, `npm run lint` ✅, tous tests E2E verts

---

## 6. Données de démonstration (seed)

### Établissements
| Nom | Ville | Lits |
|-----|-------|------|
| Hôpital de Versailles | Versailles | 450 |
| Clinique de Saint-Cloud | Saint-Cloud | 120 |

### Comptes (mot de passe universel : `demo1234`)
| Email | Rôle | Établissement |
|-------|------|---------------|
| `accueil.versailles@sam.demo` | ACCUEIL | Hôpital de Versailles |
| `iao.versailles@sam.demo` | IAO | Hôpital de Versailles |
| `infirmier.versailles@sam.demo` | INFIRMIER | Hôpital de Versailles |
| `urgentiste.versailles@sam.demo` | URGENTISTE | Hôpital de Versailles |
| `admin.versailles@sam.demo` | ADMIN_HOPITAL | Hôpital de Versailles |
| `accueil.saintcloud@sam.demo` | ACCUEIL | Clinique de Saint-Cloud |
| `iao.saintcloud@sam.demo` | IAO | Clinique de Saint-Cloud |
| `urgentiste.saintcloud@sam.demo` | URGENTISTE | Clinique de Saint-Cloud |
| `admin.saintcloud@sam.demo` | ADMIN_HOPITAL | Clinique de Saint-Cloud |
| `patient.martin@sam.demo` | PATIENT | — |
| `patient.dubois@sam.demo` | PATIENT | — |
| *(28 autres patients)* | PATIENT | — |

### Scénario « patient inconscient » prêt à jouer
- **Patient :** Jean Dupont, né 14/03/1978 à Lyon (sans compte — entré manuellement dans le seed)
- **Allergie grave :** Pénicilline (anaphylaxie), Aspirine (grave)
- **Groupe sanguin :** A-
- L'urgentiste recherche « Dupont Jean » → trouve le dossier → voit allergies en rouge → mode bris de glace → justification → accès loggé

---

## 7. Conventions de code

- **Nommage :** camelCase pour les variables/fonctions, PascalCase pour les composants et types
- **Composants serveur** par défaut, `"use client"` uniquement quand nécessaire (forms, interactivité)
- **Validation API :** Zod sur toutes les routes API
- **Pas de secret externe :** `NEXTAUTH_SECRET` généré automatiquement en dev si absent
- **Tailwind :** palette personnalisée SAM (bleu médical, rouge urgence, vert validé)

---

## 8. Critères de validation finale

- [ ] `npm install` → aucune erreur
- [ ] `npx prisma db push && npx prisma db seed` → aucune erreur
- [ ] `npm run dev` → page d'accueil visible sur `localhost:3000`
- [ ] `npm run build` → compilation sans erreur TypeScript
- [ ] `npm run lint` → aucune erreur ESLint
- [ ] `npm test` → tous les tests unitaires passent
- [ ] `npm run test:e2e` → 3 parcours Playwright verts
- [ ] Démo 5 min réalisable sans script technique
