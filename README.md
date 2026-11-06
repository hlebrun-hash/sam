# SAM — Service d'Accès Médical

MVP d'un dossier médical partagé entre établissements de santé, développé pour l'évaluation de cours.

## Installation (3 commandes)

```bash
npm install
```

```bash
npx prisma db push && npm run db:seed
```

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

---

## Comptes de démo

Mot de passe universel : **`demo1234`**

| Rôle | Email | Établissement |
|---|---|---|
| Patient | `jean.dupont@sam.demo` | — |
| Accueil | `accueil.versailles@sam.demo` | Versailles |
| IAO | `iao.versailles@sam.demo` | Versailles |
| Infirmier | `infirmier.versailles@sam.demo` | Versailles |
| Urgentiste | `urgentiste.versailles@sam.demo` | Versailles |
| Admin hôpital | `admin.versailles@sam.demo` | Versailles |
| Accueil | `accueil.saintcloud@sam.demo` | Saint-Cloud |
| IAO | `iao.saintcloud@sam.demo` | Saint-Cloud |
| Urgentiste | `urgentiste.saintcloud@sam.demo` | Saint-Cloud |
| Admin hôpital | `admin.saintcloud@sam.demo` | Saint-Cloud |

---

## Script jury — 5 minutes

### Scénario 1 : Patient gère son dossier (1 min)

1. Se connecter avec `jean.dupont@sam.demo` / `demo1234`
2. Observer le dashboard : bannière rouge ANAPHYLAXIE Pénicilline, dossier validé
3. Cliquer **Mon QR code** : affichage du QR et du code textuel `SAM:...`
4. Cliquer **Modifier dossier** : mettre à jour un traitement, sauvegarder
5. Se déconnecter

### Scénario 2 : Accueil scanne et enregistre un passage (1 min)

1. Se connecter avec `accueil.versailles@sam.demo` / `demo1234`
2. Cliquer **Scanner QR code** : saisir manuellement le code SAM du patient
3. Observer la fiche : identité + allergies graves affichées immédiatement
4. Cliquer **Enregistrer un passage** : choisir la date et le motif, valider
5. Se déconnecter

### Scénario 3 : IAO valide un dossier (1 min)

1. Se connecter avec `iao.versailles@sam.demo` / `demo1234`
2. Cliquer **Rechercher un patient**, taper « Dupont »
3. Observer l'avertissement homonyme (2 Dupont)
4. Cliquer sur Jean Dupont, puis **Valider le dossier**
5. Cocher la case de confirmation, valider — le dossier est marqué validé
6. Se déconnecter

### Scénario 4 : Urgentiste — bris de glace (1 min)

1. Se connecter avec `urgentiste.versailles@sam.demo` / `demo1234`
2. Chercher un patient ou scanner son QR code
3. Sur la fiche patient, cliquer **Bris de glace**
4. Saisir la justification médicale (obligatoire), confirmer
5. L'accès est journalisé et irréversible — confirmation affichée
6. Se déconnecter

### Scénario 5 : Admin — personnel et audit (1 min)

1. Se connecter avec `admin.versailles@sam.demo` / `demo1234`
2. Tableau de bord : KPIs (patients, passages du mois, bris de glace), prix abonnement
3. Cliquer **Gérer le personnel** : liste des agents, formulaire d'ajout
4. Cliquer **Journal d'audit** : tous les accès, bris de glace en rouge
5. Observer l'entrée de bris de glace créée au scénario 4

### Point d'interopérabilité (bonus)

Sur la fiche de Jean Dupont (connecté en urgentiste), observer que l'**historique des passages** affiche des visites à la **Clinique de Saint-Cloud** et à l'**Hôpital de Versailles** : un même dossier, consulté depuis n'importe quel établissement du réseau.

---

## Architecture

```
app/
├── (auth)/login          # Page de connexion + action Server
├── (auth)/register       # Création de compte patient
├── (patient)/patient/    # Espace patient (dashboard, dossier, QR, historique)
├── (hopital)/hopital/    # Espace personnel hospitalier (search, scan, fiche patient)
│   └── patient/[id]/     # Fiche + valider + visite + bris de glace
└── (admin)/admin/        # Espace admin (dashboard, personnel, audit)

lib/
├── permissions.ts        # Matrice rôle → permissions
├── prisma.ts             # Client Prisma singleton
└── utils.ts              # Formatage dates, slugs

prisma/
├── schema.prisma         # Modèle SQLite
└── seed.ts               # Données fictives (2 hôpitaux, 10 agents, 5 patients)
```

## Tests

```bash
npm test                  # Jest — permissions matrix + fuzzy search
npm run test:e2e          # Playwright — flux E2E (nécessite le serveur)
```

## Stack

- **Next.js 14** App Router + TypeScript
- **NextAuth v5 beta** (JWT, credentials provider)
- **Prisma 5 + SQLite** (fichier local, zéro serveur externe)
- **Tailwind CSS** (tablet-first, touch targets ≥ 48 px)
- **Fuse.js** (recherche floue tolérante aux accents)
- **html5-qrcode** (scanner caméra + saisie manuelle)
- **qrcode** (génération QR canvas)

> Données 100 % fictives. Aucun patient réel. Usage strictement pédagogique.
