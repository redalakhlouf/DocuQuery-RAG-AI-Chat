# SESSION LOG — 13 juillet 2026

## Ce qui a été fait

### Phase 0 ✅ Terminée et commitée

Toutes les sous-étapes (0.1 à 0.8) cochées dans le roadmap :

- **0.1** Dépôt GitHub créé, `git init` + `git remote add origin` → branche `dev`
- **0.2** Arborescence : `backend/`, `frontend/`, `docs/`, `README.md`, `.gitignore`
- **0.3** Stratégie de branches (`main` protégée + `dev` + feature) + convention de commits (`feat:`, `fix:`, `docs:`)
- **0.4** `Dockerfile` : Python 3.11-slim, pip install, EXPOSE 8000, CMD uvicorn
- **0.5** `docker-compose.yml` : service backend, port 8000, volume mount
- **0.6** `.env.example` : variables Supabase, LLM, JWT (valeurs vides)
- **0.7** `docker compose up --build` testé et fonctionnel — `/health` répond `{"status":"ok"}`
- **0.8** Premier commit : `3b9f8b5 feat:setup phase 0`

### Phase 1 ✅ Terminée et commitée

Toutes les sous-étapes (1.1 à 1.5) cochées dans le roadmap :

- **1.1** Diagramme d'architecture globale → `docs/architecture.md`
- **1.2** Modèle de données complet : 5 tables (`documents`, `chunks`, `conversations`, `messages`, `usage`) avec colonnes et types
- **1.3** Politique RLS : `auth.uid() = user_id` sur les 4 tables + jointure pour `chunks`/`messages`
- **1.4** Limites MVP documentées (30 questions/jour, TTL 1h/2h, 1 PDF/user, 5 MB max, etc.)
- **1.5** Tout sauvegardé dans `docs/architecture.md`

Commit : `51068c6 feat : add Supabase schema`

Structure backend créée (stubs avec commentaires, pas de logique métier) :
```
backend/app/
├── main.py, core/config.py, core/security.py
├── routes/auth.py, documents.py, chat.py
├── services/document_service.py, embedding_service.py, retrieval_service.py, llm_service.py
└── models/schemas.py
backend/db/schema.sql (5 tables + RLS + fonctions de nettoyage)
```

### Phase 2 — En cours

- **Projet Supabase créé** : `qudpglrwsmzpwvhwmosj.supabase.co`
- **Clés API configurées** dans `backend/.env` :
  - `SUPABASE_URL` = https://qudpglrwsmzpwvhwmosj.supabase.co
  - `SUPABASE_ANON_KEY` = JWT (commence par `eyJ`) ✅
  - `SUPABASE_SERVICE_ROLE_KEY` = JWT ✅
- **Connexion testée avec succès** via curl :
  - Clé `anon` sur `/rest/v1/` → refusé (comportement normal, endpoint racine réservé)
  - Clé `service_role` sur `/rest/v1/` → Swagger JSON retourné ✅

### Erreurs rencontrées et résolues

1. **`"requested path is invalid"`** → Le Slash `/` en trop dans SUPABASE_URL n'était pas la cause réelle. Le vrai problème était la clé API.
2. **`"Invalid API key"`** → La clé dans `.env` était `sb_publishable_...` (pas une clé Supabase anon). Remplacée par la vraie clé anon (JWT `eyJ...`).
3. **`"Secret API key required"`** → L'endpoint racine `/rest/v1/` est réservé à la clé `service_role`. Normal.
4. **Fausse piste : saut de ligne dans la clé** → Vérifié : la clé est bien sur une seule ligne. C'était juste PowerShell qui tronquait l'affichage.

### Détails techniques découverts

- La clé `anon` Supabase commence toujours par `eyJ` (c'est un JWT). Toute clé commençant par `sb_publishable_` n'est **pas** une clé anon.
- L'endpoint `/rest/v1/` (racine) ne retourne les tables que si des tables existent dans le schéma. Actuellement le schéma est vide → pas de tables dans le Swagger.
- `.env.example` contient `SUPABASE_KEY=` mais `.env` utilise `SUPABASE_ANON_KEY=` et `SUPABASE_SERVICE_ROLE_KEY=` → **incohérence à corriger** dans `.env.example`.

---

## Prochaine action immédiate

**Exécuter le `schema.sql` dans le SQL Editor de Supabase** pour créer les tables.

1. Aller sur https://supabase.com/dashboard → projet `qudpglrwsmzpwvhwmosj`
2. Ouvrir **SQL Editor**
3. Copier le contenu de `backend/db/schema.sql`
4. Cliquer "Run"
5. Vérifier que les 5 tables apparaissent dans **Table Editor**
6. Tester la connexion avec les tables créées :
   ```
   curl -H "apikey: ANON_KEY" -H "Authorization: Bearer ANON_KEY" "SUPABASE_URL/rest/v1/"
   ```
   → Les tables `documents`, `chunks`, `conversations`, `messages`, `usage` doivent apparaître dans `paths`.

**Puis** : mettre à jour `.env.example` pour refléter les vrais noms de variables (`SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).

---

## Rappel méthode

- Une seule action à la fois. Expliquer le concept avant d'exécuter.
- Ne jamais sauter une étape de compréhension pour aller plus vite.
- Si Amine ne comprend pas, reformuler avec une analogie, pas avancer.
- Chaque sous-étape n'est validée que si elle est testée ET compréhensible par Amine.
- Pas de félicitations excessives. Feedback factuel uniquement.

---

## État d'esprit

On a fait du solide aujourd'hui. Phase 0 et Phase 1 sont terminées, la structure est propre, et la connexion Supabase fonctionne. On entre maintenant dans le vrai : créer les tables et commencer à construire. La prochaine session commence par le SQL Editor.
