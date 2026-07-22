# Problemes identifies — DocuQuery

Derniere mise a jour : 2026-07-22

---

## Issue 1 — PgBouncer vs asyncpg : toutes les routes chat en 500

### Symptome
- `POST /api/v1/chat/conversations` → 500 Internal Server Error
- `GET /api/v1/chat/conversations/` → 500 Internal Server Error
- `POST /api/v1/chat/query` → 500 Internal Server Error
- `GET /api/v1/documents/` → 200 OK (pas affecte)
- `POST /api/v1/documents/upload` → 200 OK (pas affecte)

### Detection
Logs Azure :
```
sqlalchemy.exc.ProgrammingError: prepared statement "__asyncpg_stmt_9__" already exists
HINT: pgbouncer with pool_mode set to "transaction" does not support prepared statements properly.
```

### Cause
Le `DATABASE_URL` pointe vers le pooler Supabase (port 6543) qui utilise PgBouncer en mode transaction. asyncpg (driver de SQLAlchemy) genere des "prepared statements" qui entrent en conflit avec PgBouncer. Quand la meme requete SQL est envoyee 2 fois, PgBouncer crash.

Les routes `/documents/` ne sont pas affectees car elles utilisent le client Supabase Python (HTTP direct, pas asyncpg). Les routes `/chat/` utilisent SQLAlchemy + asyncpg (passage par le pooler).

### Fichiers concernes
- `backend/app/core/database.py:6` — engine sans `statement_cache_size=0`
- `backend/app/routes/chat.py` — toutes les routes utilisent `db: AsyncSession = Depends(get_db)`
- `backend/.env:6` — `DATABASE_URL` pointe vers le pooler (port 6543)

### Solution appliquee
Dans `database.py:6`, ajoute `statement_cache_size=0` au engine :
```python
engine = create_async_engine(DATABASE_URL, echo=False, connect_args={"statement_cache_size": 0})
```
Desactive le cache de prepared statements asyncpg, compatible avec PgBouncer en mode transaction.

### Statut
**RESOLU** (2026-07-22) — backend redeploye, routes chat fonctionnelles.

---

## Issue 2 — Rate limit Groq : erreurs 429 sur tier gratuit

### Symptome
- `POST /api/v1/chat/query` → parfois 200 OK, parfois 500 Internal Server Error
- Les reussites et echecs alternent de facon imprevisible

### Detection
Logs Azure :
```
Groq API error: 429 - Rate limit reached for model `llama-3.1-8b-instant`
Limit 6000 tokens/min, Used4289, Requested 3360
```

### Cause
Le tier gratuit de Groq impose 6000 tokens par minute par organisation. Plusieurs requetes rapides depassent cette limite.

### Fichiers concernes
- `backend/app/services/chat_service.py` — une seule cle API, pas de retry

### Solution
Rotation de 6 cles API Groq (de comptes differs) avec retry automatique. Quand une cle recoit un 429, le systeme passe a la cle suivante.

### Statut
**Resolu** — rotation de cles implementee et deployee.

---

## Issue 3 — Domaine custom non configure

### Symptome
- Le site est accessible via `docuquery-mu.vercel.app` mais pas via `docuquery.dev`
- Le backend rejette les requetes CORS du nouveau domaine

### Detection
- Naviguer vers `https://docuquery.dev` → page Vercel introuvable ou pas de site
- Console navigateur : erreur CORS `Origin not allowed`

### Cause
1. Les DNS records du domaine `docuquery.dev` n'etaient pas configures chez Name.com
2. Le backend n'avait pas `docuquery.dev` dans `ALLOWED_ORIGINS`

### Fichiers concernes
- `backend/.env:7` — `ALLOWED_ORIGINS` n'incluait pas `docuquery.dev`
- DNS Name.com — pas de records A/CNAME configures
- Vercel Settings → Domains — domaine pas ajoute

### Solution
1. Ajouter le domaine dans Vercel (Settings → Domains)
2. Configurer les DNS chez Name.com :
   - A record : `@` → `216.198.79.1`
   - CNAME record : `www` → `cname.vercel-dns.com`
3. Ajouter les domaines dans `ALLOWED_ORIGINS` :
   ```
   ALLOWED_ORIGINS=http://localhost:3000,https://docuquery-mu.vercel.app,https://docuquery.dev,https://www.docuquery.dev
   ```

### Statut
**Resolu** — backend redeploye avec les CORS, DNS a configurer chez Name.com.

---

## Issue 4 — Doublons d'upload

### Symptome
- L'utilisateur upload le meme fichier plusieurs fois
- Le dashboard montre plusieurs copies du meme document
- Les conversations et chunks sont dupliques en base

### Detection
- SELECT sur la table `documents` montre plusieurs lignes avec le meme `filename` pour le meme `user_id`
- Le storage Supabase contient plusieurs fichiers avec des noms similaires

### Cause
Aucune verification de doublon dans le code d'upload. Chaque upload cree un nouveau document avec un UUID unique, meme si le fichier est identique. Le frontend n'empeche pas non plus le double-clic sur "Uploader".

### Fichiers concernes
- `backend/app/services/document_service.py:57-76` — `create_document_in_db()` fait un INSERT sans verif
- `backend/app/routes/documents.py:70-133` — pas de check pre-upload
- `frontend/app/upload/page.js:43-108` — pas de protection double-clic

### Solution appliquee
**Backend :** Ajout d'une verification pre-upload dans `documents.py` :
```python
safe_filename = sanitize_filename(file.filename or "document.pdf")
existing = find_duplicate_document(user_id, safe_filename)
if existing:
    raise HTTPException(status_code=409, detail=f'Un document "{safe_filename}" existe deja...')
```
Nouvelle fonction `find_duplicate_document()` dans `document_service.py` qui interroge la table `documents` pour un meme `filename` + `user_id` avec `status = 'ready'`.

**Frontend :** Pas de changement — le backend rejette avec 409 et le frontend affiche deja le message d'erreur.

### Statut
**RESOLU** (2026-07-22) — backend redeploye.

---

## Issue 5 — Pas de limite de 5 fichiers

### Symptome
- L'utilisateur peut uploader un nombre illimite de documents
- Le quota de stockage Supabase peut etre depasse
- L'UX ne refle pas de contrainte

### Detection
- SELECT COUNT(*) sur `documents` WHERE `user_id` depasse 5
- Aucune verif dans le code d'upload

### Cause
La route `POST /upload` n'effectue aucun COUNT avant d'accepter l'upload. La limite de 5 n'est implementee nulle part (ni backend, ni frontend).

### Fichiers concernes
- `backend/app/routes/documents.py:70-133` — pas de COUNT pre-upload
- `frontend/app/upload/page.js` — pas de limite affichee

### Solution
**Backend :** Avant l'INSERT, compter les documents existants de l'utilisateur. Si >= 5, rejeter avec 400/403 et un message clair.

**Frontend :** Afficher le nombre de documents / 5, griser le DropZone quand la limite est atteinte.

### Statut
**A resoudre.**

---

## Issue 6 — Pas de suppression de fichier

### Symptome
- L'utilisateur ne peut pas supprimer un document qu'il n'utilise plus
- Pas de bouton "Supprimer" dans le dashboard
- Les documents expires restent visibles jusqu'au cleanup automatique (1h)

### Detection
- Pas de bouton de suppression dans l'UI
- Pas de route DELETE dans le backend (seul `allow_methods` inclut DELETE dans CORS)
- Aucune reference a "delete" ou "supprimer" dans le code

### Cause
L'endpoint DELETE n'a jamais ete implemente. Le CORS autorise la methode DELETE mais aucune route ne la gere.

### Fichiers concernes
- `backend/app/routes/documents.py` — pas de route DELETE
- `backend/app/services/document_service.py` — pas de fonction de suppression
- Frontend — pas de bouton "Supprimer"

### Solution
**Backend :** Creer `DELETE /api/v1/documents/{document_id}` qui :
1. Verifie que le document appartient a l'utilisateur
2. Supprime les chunks associes (CASCADE en DB, mais aussi le fichier dans Storage)
3. Supprime le document de la table `documents`
4. Supprime le fichier du bucket `documents` dans Supabase Storage

**Frontend :** Ajouter un bouton "Supprimer" dans le dashboard a cote de chaque document, avec une confirmation.

### Statut
**A resoudre.**

---

## Issue 7 — Document ID vide envoye par le frontend

### Symptome
- `POST /api/v1/chat/conversations` → 500 quand l'utilisateur selectionne un document
- Puis 200 OK quand le document a bien un ID valide

### Detection
Logs Azure :
```
invalid UUID '': length must be between 32..36 characters, got 0
[SQL: SELECT id, status FROM documents WHERE id = $1 AND user_id = $2]
[parameters: ('', '88a51366-...')]
```

### Cause
Le frontend envoie `{"document_id": ""}` quand l'utilisateur clique sur un document dans le select. Cela arrive si :
1. Le document est en statut "processing" (encore en cours de traitement)
2. La valeur du select est vide au moment du clic

Le backend ne valide pas que `document_id` est un UUID valide avant de lancer la requete SQL.

### Fichiers concernes
- `frontend/app/chat/page.js:43-81` — `handleSelectDocument` envoie le document_id sans validation
- `backend/app/routes/chat.py` — pas de validation du format UUID dans `CreateConversationRequest`

### Solution appliquee
**Backend :** Ajout de la validation UUID au debut de `create_conversation` :
```python
try:
    uuid_lib.UUID(body.document_id)
except ValueError:
    raise HTTPException(status_code=400, detail="document_id invalide")
```
Rejette les document_id vides ou malformes avant toute requete SQL.

**Frontend :** Ajout d'une garde au debut de `handleSelectDocument` :
```javascript
if (!docId) return;
```
Empeche l'appel API si la valeur est vide.

### Statut
**RESOLU** (2026-07-22) — backend redeploye, frontend pousse sur Vercel.

---

## Recapitulatif

| # | Probleme | Gravite | Statut |
|---|----------|---------|--------|
| 1 | PgBouncer vs asyncpg (routes chat en 500) | Critique | Resolu |
| 2 | Rate limit Groq (429) | Moyen | Resolu |
| 3 | Domaine custom (CORS + DNS) | Moyen | Resolu |
| 4 | Doublons d'upload | Moyen | Resolu |
| 5 | Pas de limite 5 fichiers | Moyen | A resoudre |
| 6 | Pas de suppression de fichier | Moyen | A resoudre |
| 7 | Document ID vide envoye par le frontend | Moyen | Resolu |
