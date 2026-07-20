# DocuQuery Frontend Audit Report

**Date:** 19 juillet 2026
**Workspace:** `frontend/`
**Total issues:** 49

---

## HAUTE Priorité (Fonctionnel / Correcteur)

### 1. Absence de gestion d'erreur visible (Silent Error Swallowing)

| Fichier | Ligne | Problème |
|---------|-------|----------|
| `app/dashboard/page.js` | 20 | `.catch(() => {})` — masque les erreurs API, l'utilisateur voit une liste vide sans indication d'erreur |
| `app/chat/page.js` | 31 | `.catch(() => {})` — masque les erreurs de chargement des documents |
| `app/chat/page.js` | 35 | `.catch(() => {})` — masque les erreurs de chargement des conversations |

### 2. Boundary d'erreur manquante (Missing Error Boundaries)

| Fichier attendu | Statut |
|-----------------|--------|
| `app/error.js` | **MANQUANT** |
| `app/dashboard/error.js` | **MANQUANT** |
| `app/chat/error.js` | **MANQUANT** |
| `app/upload/error.js` | **MANQUANT** |
| `app/login/error.js` | **MANQUANT** |

### 3. Export metadata manquant

| Fichier | Problème |
|---------|----------|
| `app/page.js` | `"use client"` — ne peut pas exporter metadata |
| `app/dashboard/page.js` | `"use client"` — ne peut pas exporter metadata |
| `app/chat/page.js` | `"use client"` — ne peut pas exporter metadata |
| `app/upload/page.js` | `"use client"` — ne peut pas exporter metadata |
| `app/login/page.js` | `"use client"` — ne peut pas exporter metadata |

---

## MOYENNE Priorité (Qualité Code / Design)

### 4. Couleur `text-white` hardcodée (devrait être `text-dq-text`)

| Fichier | Ligne |
|---------|-------|
| `app/page.js` | 257 |
| `app/page.js` | 386 |
| `app/chat/page.js` | 263 |
| `app/components/Header.js` | 62 |
| `app/components/Header.js` | 80 |
| `app/components/Header.js` | 147 |
| `app/components/Header.js` | 165 |
| `app/login/page.js` | 89 |
| `app/upload/page.js` | 130 |

### 5. Hex hardcodé dans styles inline

| Fichier | Ligne | Valeur | Devrait être |
|---------|-------|--------|--------------|
| `app/page.js` | 216 | `rgba(245,246,248,0.5)` | `var(--dq-text)` avec opacité |
| `app/page.js` | 224 | `#0B1E3D` | `var(--dq-navy)` |
| `app/page.js` | 257, 386 | `rgba(37,99,235,0.25)` / `rgba(37,99,235,0.35)` | `var(--dq-accent)` avec opacité |
| `app/components/Footer.js` | 29 | `#0B1E3D`, `#0D1528`, `#0A0A0A` | Variables CSS |

### 6. Dépendances React hooks manquantes

| Fichier | Ligne | Problème |
|---------|-------|----------|
| `app/hooks/useUser.js` | 20 | `supabase`, `router`, `redirectTo` manquent dans `[]` |
| `app/components/Header.js` | 27 | `supabase` manque dans `[]` |
| `app/components/DropZone.js` | 61 | `handleFile` manque dans `[]` |
| `app/chat/page.js` | 40 | `scrollToBottom` manque dans `[]` |

### 7. Fichiers loading.js manquants

| Fichier | Statut |
|---------|--------|
| `app/loading.js` | **MANQUANT** |
| `app/dashboard/loading.js` | **MANQUANT** |
| `app/chat/loading.js` | **MANQUANT** |
| `app/upload/loading.js` | **MANQUANT** |

---

## BASSE Priorité (Best Practice)

### 8. Directive `"use client"` manquante sur hooks

| Fichier | Hooks utilisés |
|---------|----------------|
| `app/hooks/useUser.js` | `useState`, `useEffect`, `useRouter` |
| `app/hooks/useDocumentStatus.js` | `useState`, `useEffect`, `useRef` |

### 9. `"use client"` inutile

| Fichier | Raison |
|---------|--------|
| `app/components/Footer.js` | Composant purement présentatif, pas de hooks |

### 10. rgba hardcodé dans globals.css

| Ligne | Valeur | Contexte |
|-------|--------|----------|
| 132 | `rgba(10, 10, 10, 0.8)` | Header glassmorphism |
| 135 | `rgba(31, 35, 48, 0.5)` | Bordure header |
| 140 | `rgba(37, 99, 235, 0.3)` | Sélection texte |

### 11. Tokens design manquants

| Token | Usage |
|-------|-------|
| `--dq-shadow` | Ombres standardisées |
| `--dq-radius` | Border-radius standardisé |

---

## Statistiques

| Sévérité | Nombre |
|----------|--------|
| HAUTE | 13 |
| MOYENNE | 27 |
| BASSE | 9 |
| **Total** | **49** |
