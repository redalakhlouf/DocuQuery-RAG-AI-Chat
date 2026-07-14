# Architecture — RAG SaaS

> Document de référence pour l'ensemble du projet.
> Chaque phase du roadmap s'appuie sur ce document.

---

## 1. Vue d'ensemble

Plateforme SaaS publique type "Claude/ChatGPT pour tes propres documents" : chaque utilisateur crée un compte, upload son propre PDF, et discute avec un assistant qui répond en se basant sur le contenu de SON document. Isolation stricte des données entre utilisateurs.

### Diagramme d'architecture

```
Utilisateur (navigateur)
        │
        │  HTTPS
        ▼
┌──────────────────────────┐
│       Frontend           │   Vercel (gratuit)
│       Next.js            │   Port 3000
│       Tailwind CSS       │
└────────────┬─────────────┘
             │  API HTTPS
             ▼
┌──────────────────────────┐
│       Backend            │   Oracle Cloud Always Free (gratuit)
│       FastAPI + Uvicorn  │   Port 8000
│       Docker             │
│                          │
│  ┌────────────────────┐  │
│  │ sentence-          │  │   Modèle d'embedding local
│  │ transformers       │  │   multilingual-e5-small
│  │ (384 dim)          │  │   ~300 MB RAM
│  └────────────────────┘  │
└──┬──────┬───────┬────────┘
   │      │       │
   │      │       │
   ▼      ▼       ▼
┌──────┐ ┌──────────┐ ┌──────────────┐
│Supa- │ │ Supabase │ │   Groq API   │
│base  │ │ DB +     │ │   (LLM)      │
│Auth  │ │ Storage  │ │              │
│      │ │ + pgvec  │ │  Gratuit     │
│JWT   │ │ tor      │ │  tier dev    │
└──────┘ └──────────┘ └──────────────┘
```

### Flux de données

```
FLUX UPLOAD (back-end asynchrone)
─────────────────────────────────
1. Utilisateur upload un PDF (max 5 MB)
2. Backend valide : taille + type MIME réel (pas juste l'extension)
3. Backend stocke le fichier dans Supabase Storage (chemin: {user_id}/{doc_id}.pdf)
4. Backend extrait le texte page par page (PyMuPDF)
5. Backend découpe le texte en chunks (~500 mots, overlap de 50 mots)
6. Backend génère l'embedding de chaque chunk (multilingual-e5-small, 384 dim)
7. Backend sauvegarde les chunks + embeddings dans Supabase DB (table chunks)
8. Document marqué "ready", expires_at = now() + 1 heure

FLUX QUESTION (back-end synchrone)
─────────────────────────────────
1. Utilisateur tape une question
2. Backend vérifie : token JWT valide + quota 30/jour
3. Backend transforme la question en embedding (même modèle)
4. Backend cherche les 5 chunks les plus similaires (pgvector, cosine distance)
   → Filtre : document_id + user_id (double sécurité)
5. Backend envoie au LLM (Groq) : system prompt + 5 chunks + question
6. LLM génère la réponse
7. Backend retourne la réponse à l'utilisateur
8. Message sauvegardé dans DB (expires_at = now() + 2 heures)

FLUX NETTOYAGE
─────────────────────────────────
- Chaque requête vérifie les données expirées
- Documents expirés → supprime document + chunks associés
- Conversations expirées → supprime conversation + messages associés
- Usage expiré → supprime les lignes de jours précédents
```

---

## 2. Stack technique

| Couche | Technologie | Hébergement | Prix |
|---|---|---|---|
| Frontend | Next.js + Tailwind CSS | Vercel | Gratuit |
| Backend | FastAPI + Uvicorn | Oracle Cloud Always Free | Gratuit |
| Auth | Supabase Auth (email/password) | Supabase | Gratuit |
| Database | PostgreSQL + pgvector | Supabase | Gratuit |
| Storage | Supabase Storage | Supabase | Gratuit |
| LLM | Groq API | Groq | Gratuit (tier dev) |
| Embeddings | sentence-transformers (multilingual-e5-small) | Backend local | Gratuit |
| Containerisation | Docker + Docker Compose | Oracle Cloud VM | Gratuit |

### Choix d'hébergement : Oracle Cloud Always Free

| Ressource | Disponible | Besoin estimé |
|---|---|---|
| RAM | 24 GB | ~300 MB (modèle + FastAPI) |
| CPU | 4 cœurs ARM | 1 cœur suffit |
| Storage | 200 GB | ~500 MB |
| Bande passante | 10 TB/mois | Quelques GB |
| Spin-down | Non (toujours allumé) | — |

**Raison du choix :** pas de spin-down comme Render, pas de limite de RAM comme Fly.io, gratuit pour toujours.

---

## 3. Modèle de données

### Table `documents`

Stocke les métadonnées de chaque PDF uploadé.

| Colonne | Type | Contrainte | Rôle |
|---|---|---|---|
| `id` | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | Identifiant unique |
| `user_id` | uuid | NOT NULL, REFERENCES auth.users(id) | Qui l'a uploadé |
| `filename` | text | NOT NULL | Nom du fichier original |
| `storage_path` | text | NOT NULL | Chemin dans Supabase Storage |
| `status` | text | NOT NULL, DEFAULT 'processing' | État : `processing` / `ready` / `error` |
| `expires_at` | timestamptz | NOT NULL | Date d'expiration (now + 1 heure) |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | Date de création |

### Table `chunks`

Stocke les morceaux de texte extraits du PDF et leurs embeddings vectoriels.

| Colonne | Type | Contrainte | Rôle |
|---|---|---|---|
| `id` | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | Identifiant unique |
| `document_id` | uuid | NOT NULL, REFERENCES documents(id) ON DELETE CASCADE | Document parent |
| `content` | text | NOT NULL | Le texte du morceau (~500 mots) |
| `embedding` | vector(384) | NOT NULL | Vecteur numérique (384 dimensions) |
| `page_number` | int | NOT NULL | Numéro de page source |

### Table `conversations`

Stocke les sessions de chat.

| Colonne | Type | Contrainte | Rôle |
|---|---|---|---|
| `id` | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | Identifiant unique |
| `user_id` | uuid | NOT NULL, REFERENCES auth.users(id) | Qui discute |
| `document_id` | uuid | NOT NULL, REFERENCES documents(id) ON DELETE CASCADE | Sur quel document |
| `expires_at` | timestamptz | NOT NULL | Date d'expiration (now + 2 heures) |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | Date de création |

### Table `messages`

Stocke chaque message dans une conversation.

| Colonne | Type | Contrainte | Rôle |
|---|---|---|---|
| `id` | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | Identifiant unique |
| `conversation_id` | uuid | NOT NULL, REFERENCES conversations(id) ON DELETE CASCADE | Conversation parent |
| `role` | text | NOT NULL | `user` ou `assistant` |
| `content` | text | NOT NULL | Le texte du message |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | Date de création |

### Table `usage`

Compteur de questions par jour par utilisateur (rate limiting).

| Colonne | Type | Contrainte | Rôle |
|---|---|---|---|
| `user_id` | uuid | NOT NULL, REFERENCES auth.users(id) | L'utilisateur |
| `date` | date | NOT NULL, DEFAULT CURRENT_DATE | Le jour |
| `questions_count` | int | NOT NULL, DEFAULT 0 | Nombre de questions posées |

**Contrainte unique :** UNIQUE(user_id, date) — une seule ligne par jour par utilisateur.

---

## 4. Politique d'isolation des données (RLS)

**Principe :** chaque utilisateur ne peut voir ET modifier que SES propres données. Cette règle est appliquée au niveau de la base de données (Row Level Security), pas seulement dans le code backend.

### Table `documents`

```sql
CREATE POLICY "user_isolation" ON documents
FOR ALL USING (auth.uid() = user_id);
```

**Règle :** un utilisateur ne voit que les documents où `user_id` correspond à son JWT.

### Table `chunks`

```sql
CREATE POLICY "user_isolation" ON chunks
FOR ALL USING (
  document_id IN (
    SELECT id FROM documents WHERE user_id = auth.uid()
  )
);
```

**Règle :** un utilisateur ne voit que les chunks dont le document parent lui appartient. Filtre indirect via jointure.

### Table `conversations`

```sql
CREATE POLICY "user_isolation" ON conversations
FOR ALL USING (auth.uid() = user_id);
```

**Règle :** un utilisateur ne voit que ses conversations.

### Table `messages`

```sql
CREATE POLICY "user_isolation" ON messages
FOR ALL USING (
  conversation_id IN (
    SELECT id FROM conversations WHERE user_id = auth.uid()
  )
);
```

**Règle :** un utilisateur ne voit que les messages de ses conversations. Filtre indirect via jointure.

### Table `usage`

```sql
CREATE POLICY "user_isolation" ON usage
FOR ALL USING (auth.uid() = user_id);
```

**Règle :** un utilisateur ne voit que son propre compteur.

### Double sécurité

| Niveau | Mécanisme | Rôle |
|---|---|---|
| Niveau 1 (DB) | RLS policies | La DB refuse de renvoyer les lignes d'un autre user, même si le code backend est défaillant |
| Niveau 2 (Backend) | JWT validation + user_id vérification | Le backend vérifie le token ET le user_id avant chaque requête |

---

## 5. Limites du MVP

### Paramètres fonctionnels

| Paramètre | Valeur | Raison |
|---|---|---|
| Utilisateurs max | 100 | Limite free tier Supabase |
| PDF par utilisateur | 1 | Simplicité V1 |
| Taille max par PDF | 5 MB | 100 × 5 MB = 500 MB (dans le 1 GB free) |
| Formats acceptés | PDF texte uniquement | Pas d'OCR en V1 |
| Langues supportées | Anglais + Français | multilingual-e5-small supporte les deux |
| Questions par jour par utilisateur | 30 | Protéger l'API Groq contre les abus |
| TTL documents | 1 heure | Auto-nettoyage |
| TTL conversations | 2 heures | Auto-nettoyage |
| Streaming | Non (réponse d'un coup) | Moins complexe |
| Multi-document | Non (1 PDF = 1 chat) | Simplicité |
| Email confirmation | Oui | Sécurité de base |

### Ce que le MVP fait

- Inscription + connexion (email/password via Supabase Auth)
- Upload 1 PDF (texte, max 5 MB)
- Extraction de texte page par page
- Découpage en chunks (~500 mots, overlap 50 mots)
- Génération d'embeddings multilingues
- Recherche vectorielle (pgvector, cosine distance)
- Réponse du LLM basée sur les 5 chunks les plus pertinents
- Isolation stricte des données (RLS + JWT)
- TTL automatique (documents 1h, conversations 2h)
- Rate limiting (30 questions/jour/user)
- Message "Revenir demain" avec image quand le quota est atteint
- Message "Document expiré" quand le TTL est dépassé
- Possibilité de réessayer en cas d'erreur de traitement

### Ce que le MVP ne fait PAS

- PDF image / OCR
- Streaming mot par mot
- Multi-document (mélange de plusieurs PDF)
- Suppression manuelle de document par l'utilisateur
- Suppression de compte
- Monitoring / analytics
- CI/CD automatique (GitHub Actions)
- Tests automatisés
- Notifications email avancées
- Plans payants / facturation
- Historique longue durée (tout expire)

### Limites techniques connues

| Limite | Impact | Mitigation |
|---|---|---|
| Spin-down absent (Oracle) | Aucun | Serveur toujours allumé |
| 1 PDF par utilisateur | Fonctionnel | V2 : multi-document |
| 5 MB max par PDF | Fonctionnel | Adapté aux documents texte |
| 30 questions/jour | Fonctionnel | Message "Revenir demain" |
| TTL 1h/2h | Fonctionnel | Pas d'historique long |
| Pas de streaming | UX | Réponse d'un coup, acceptable |
| Pas d'OCR | Fonctionnel | PDF texte uniquement |
| 100 utilisateurs max | Scalabilité | Limite free tier |

---

## 6. Variables d'environnement

Fichier `.env.example` à la racine du projet :

```env
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# LLM Inference
LLM_API_KEY=
LLM_PROVIDER=groq

# JWT
JWT_SECRET=
```

---

## 7. Stratégie de branches

| Branche | Rôle |
|---|---|
| `main` | Version stable, jamais de commit direct |
| `dev` | Développement courant |
| `feature/nom-de-la-feature` | Branches ponctuelles pour une feature précise |

### Convention de commits

- `feat:` nouvelle fonctionnalité
- `fix:` correction de bug
- `docs:` documentation
- `chore:` tâche technique (setup, config)
- `refactor:` réécriture sans changement de comportement
