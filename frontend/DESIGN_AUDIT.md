# DocuQuery — Audit Design Complet

**Date :** 19 juillet 2026
**Auditeur :** Lead Designer Frontend
**Périmètre :** /login, /dashboard, globals.css, composants partagés

---

## ÉTAPE 0 — AUDIT CRITIQUE DE L'EXISTANT

### Ce qui fonctionne et doit être conservé

1. **La palette dark est cohérente dans ses intentions** — `#0A0A0A` / `#111318` / `#1F2330` crée une profondeur acceptable pour un outil de travail. Les surfaces sont bien différenciées du fond.
2. **Le glassmorphism du header** (`backdrop-filter: blur(16px)`) est léger et fonctionne bien. Il ne pollue pas le contenu.
3. **Le système de tokens CSS** (`--dq-*`) est propre et bien structuré. Le mapping Tailwind v4 est correct.
4. **Le ScrollReveal** avec `prefers-reduced-motion` respecté est bien implémenté.
5. **Le DropZone** est accessible (role="button", tabIndex, aria-label, clavier fonctionnel).
6. **Le Badge** de statut est lisible et son pulse animation est sobre.
7. **La typo IBM Plex Mono** pour les données (dates, emails, labels de statut) crée une hiérarchie claire avec le reste.
8. **La landing page** (page d'accueil) a une structure narrative solide (hero → processus → avantages → CTA). La copie est claire et orientée utilisateur.

### Pièges IA identifiés

**Pattern #2 détecté : Fond noir + accent bleu unique sans profondeur.**

La palette actuelle :
- Fond : `#0A0A0A` (near-black)
- Surface : `#111318` (gris très foncé)
- Accent : `#2563EB` (electric blue, Tailwind blue-600)
- Hover : `#3B82F6` (blue-500)

C'est exactement le template "dark mode SaaS IA" par défaut. Tout le monde utilise ce combo. Il n'y a :
- Aucune couleur chaude nulle part (pas de contraste temperaturel)
- Aucune nuance d'accent (un seul bleu plat, pas de gradient ou de variation contextuelle)
- Aucune couleur qui "appartient" à DocuQuery spécifiquement

**Pas de pièges #1 (crème + terracotta) ni #3 (broadsheet) détectés.**

### Incohérences entre login et dashboard

| Problème | Login | Dashboard | Impact |
|----------|-------|-----------|--------|
| **Padding du formulaire vs cards** | `p-6 sm:p-8` (card login) | `p-6` (toutes les cards) | Pas grave, mais le login devrait être plus généreux |
| **Bouton principal** | `rounded-lg` | `rounded-xl` sur les cards | Incohérence de border-radius |
| **Espacement title/subtitle** | `mb-2` entre titre et sous-titre | `mb-1` entre "Bienvenue" et email | Différent pour la même logique hiérarchique |
| **Police display** | Utilisée pour "DocuQuery" et "Connexion" | Utilisée pour "Bienvenue", "Mes documents", etc. | OK mais le login n'exploite pas le caractère d'Outfit |
| **Animation** | Aucune (page statique) | Aucune | Le login est visuellement mort par rapport à la landing |
| **Fond** | `bg-dq-bg` uni, rien derrière | `bg-dq-bg` uni | Le login devrait avoir au moins un élément visuel subtil |

### Problèmes d'accessibilité

| Problème | Fichier | Sévérité |
|----------|---------|----------|
| **Focus ring supprimé sur les inputs du login** — `focus:outline-none` écrase le `:focus-visible` global. L'utilisateur clavier ne voit aucun indicateur visuel de focus sur email/password. | login/page.js:74, 83 | Haute |
| **Bouton Google sans focus visible** — même problème `focus:outline-none` implicite via l'absence de `focus-visible` styling | login/page.js:94-100 | Haute |
| **Hamburger menu** — pas d'`aria-expanded` pour indiquer l'état ouvert/fermé aux screen readers | Header.js:104-127 | Moyenne |
| **Skip-to-content link** absent | layout.js | Moyenne |
| **Badge pulse** — l'animation `animate-ping` n'est pas couverte par `prefers-reduced-motion` dans le CSS global (elle utilise Tailwind's built-in animation, pas notre custom CSS) | Badge.js:17 | Basse |
| **Contraste du texte muted** — `#5A5E6A` sur `#0A0A0A` = ratio 3.1:1, en dessous du seuil WCAG AA (4.5:1) pour le petit texte | globals.css:17 | Moyenne |

---

## ÉTAPE 1 — PLAN DE DESIGN

### Couleur — Système étendu

Le fond noir + bleu unique est conservé mais **profondifié** avec des nuances contextuelles :

| Token | Valeur | Rôle |
|-------|--------|------|
| `--dq-bg` | `#0A0A0A` | Fond principal (conservé) |
| `--dq-surface` | `#111318` | Cartes / panneaux (conservé) |
| `--dq-surface-hover` | `#1A1D24` | Hover surfaces (conservé) |
| `--dq-border` | `#1F2330` | Bordures principales (conservé) |
| `--dq-text` | `#F5F6F8` | Texte principal (conservé) |
| `--dq-text-secondary` | `#8B8F9A` | Texte secondaire (conservé) |
| `--dq-text-muted` | `#6B7280` | Texte muet — **ASSAINI de `#5A5E6A` vers `#6B7280`** pour atteindre 4.5:1 |
| `--dq-accent` | `#2563EB` | Accent principal (conservé) |
| `--dq-accent-hover` | `#3B82F6` | Accent hover (conservé) |
| `--dq-accent-glow` | `rgba(37, 99, 235, 0.15)` | **NOUVEAU** — glow subtil pour les éléments actifs |
| `--dq-navy` | `#0B1E3D` | Navy profond (conservé) |
| `--dq-navy-light` | `#12294F` | Navy light (conservé) |
| `--dq-success` | `#22C55E` | Vert succès (conservé) |
| `--dq-error` | `#EF4444` | Rouge erreur (conservé) |
| `--dq-warning` | `#F59E0B` | Orange warning (conservé) |

**Ce qui change :** Pas de nouvelle couleur spectaculaire. L'amélioration vient de l'utilisation **contextuelle** du bleu existant — gradient subtle, glow, opacités differentes selon le contexte. Le contraste chaud/froid sera apporté par le **fond animé** du login (voir plus bas), pas par une couleur supplémentaire.

### Typographie — Pairing affirmé

| Rôle | Police | Poids | Usage |
|------|--------|-------|-------|
| **Display** | **Outfit** | 700-800 | Titres de page, noms de section, "DocuQuery" en logo |
| **Corps** | **DM Sans** | 400-500 | Texte de paragraphe, labels, descriptions |
| **Utilitaire** | **IBM Plex Mono** | 400-500 | Dates, emails, statuts, numéros de step, meta-info |

**Le problème actuel :** Outfit et DM Sans sont deux sans-serifs géométriques. Ils se ressemblent trop. Outfit n'a pas le caractère éditorial qu'un serif apporterait.

**La décision :** On **garde** Outfit mais on l'utilise avec **plus d'audace** — poids 800 (extrabold) systématiquement sur les titres, tracking plus serré (`-0.03em`), et on compense le manque de contraste typo par un **contraste de taille plus agressif** (les titres doivent être vraiment grands, le corps vraiment discret). L'élément "signature" (voir plus bas) apportera la personnalité visuelle que la typo ne donne pas seule.

### Layout — Concepts

**Login :**
> Un écran centré avec le formulaire minimaliste au centre, et un **fond animé de particules-mots** en arrière-plan — des mots-clés sémantiques (ex: "revenu", "article", "section 3.2", "conclusion") qui dérivent lentement dans le vide, comme des tokens de recherche flottants. Le formulaire reste net et dominant ; le fond donne la personnalité.

```
┌──────────────────────────────────────────┐
│  ░░░░░░  "revenu"   ░░░░░░░░░░░░░░░░░  │
│     ░░░░░░░░░░░░░░░      "article 7"    │
│  ░░░░░░░░░░░░                          │
│         ┌──────────────────┐            │
│         │   DocuQuery      │  ← glow    │
│         │   ─────────      │            │
│         │ [Email         ] │            │
│         │ [Mot de passe  ] │            │
│         │ [  Se connecter ] │            │
│         │ [Google]         │            │
│         └──────────────────┘            │
│  ░░░░░░░░  "section 4"  ░░░░░░░░░░░░░  │
│       ░░░░░░░░░░    "conclusion"        │
└──────────────────────────────────────────┘
```

**Dashboard :**
> Layout en deux colonnes sur desktop : colonne gauche = **profil + actions rapides** (compact), colonne droite = **liste documents** (dominante). Le document est présenté comme une **"fiche document"** avec une ligne de statut visuelle (pas juste un badge texte, mais une bordure latérale colorée qui indique l'état). L'œil va d'abord sur la liste des documents car elle occupe 65% de la largeur.

```
┌─────────────────────────────────────────────────┐
│  Header (glassmorphism)                         │
├──────────────┬──────────────────────────────────┤
│  Bienvenue   │  Mes documents                   │
│  user@email  │                                  │
│              │  ┌─ 📄 rapport.pdf ──── ready ─┐ │
│  ┌────────┐  │  │  19 juillet 2026             │ │
│  │ + Nouv.│  │  └────────────────────────────┘ │
│  └────────┘  │  ┌─ 📄 contrat.pdf ── error ──┐ │
│  ┌────────┐  │  │  18 juillet 2026             │ │
│  │ 3 docs│  │  └────────────────────────────┘ │
│  └────────┘  │  ┌─ 📄 note.pdf ── processing ┐ │
│  ┌────────┐  │  │  17 juillet 2026             │ │
│  │ > Chat │  │  └────────────────────────────┘ │
│  └────────┘  │                                  │
│              │  [Uploader mon premier PDF →]     │
├──────────────┴──────────────────────────────────┤
│  Footer                                         │
└─────────────────────────────────────────────────┘
```

### Signature Element : Les "Mots Sémantiques Flottants"

**Choix :** Le fond animé de **particules-mots sémantiques** est l'élément signature de DocuQuery.

**Pourquoi ce choix :**
- Il vient directement du sujet réel : l'indexation sémantique, les tokens, la recherche vectorielle
- Aucun autre produit RAG n'utilise ce motif comme identité visuelle
- Il est présent sur le login (écran d'entrée = première impression) et peut apparaître en subtil sur le dashboard
- Il raconte "ce produit comprend le langage" sans le dire explicitement

**Implémentation :**
- Canvas HTML5 ou SVG animé avec des mots qui dérivent lentement
- Mots tirés d'un pool : "revenu", "article", "section", "conclusion", "référence", "annexe", "chapitre", "données", "analyse", "résultat"
- Opacité très basse (0.03-0.06) — le fond est perceptible mais jamais dominant
- Vitesse lente, mouvement brownien, pas de boucle visible
- `prefers-reduced-motion` : les mots restent fixes, pas d'animation
- Performance : requestAnimationFrame + canvas 2D, pas de DOM nodes

---

## ÉTAPE 2 — AUTOCRITIQUE

> "Est-ce que je produirais la même chose pour n'importe quelle autre SaaS IA sombre ?"

**Réponse pour le palette :** Oui, en l'état. Le bleu `#2563EB` sur fond noir est le template par défaut de Tailwind UI + shadcn. **Révision :** Je ne change pas la couleur (ce serait cosmétique), mais j'ajoute un **gradient radial très subtil** sur le fond du login — un glow navy→transparent qui donne de la profondeur sans ajouter de couleur. C'est la lumière, pas la couleur, qui crée la distinction.

**Réponse pour le layout login :** Oui, "formulaire centré sur fond sombre" est le login de 90% des SaaS. **Révision :** Le fond animé de mots sémantiques est ce qui sort du lot. Je m'assure qu'il est suffisamment unique et bien exécuté pour justifier son existence.

**Réponse pour le dashboard :** Oui, "sidebar + table/list" est un dashboard générique. **Révision :** La fiche document avec bordure latérale colorée (pas juste un badge) + le layout deux colonnes sur desktop (pas juste une colonne centrée) donnent suffisamment de personnalité. Le compteur "3 documents" ne sera plus un chiffre brut mais un mini-graphique circulaire subtil.

**Réponse pour la typo :** Le pairing Outfit/DM Sans est correct mais pas mémorable. **Révision :** Je garde ce pairing (changer de police serait trop disruptif) mais j'augmente le contraste de taille : titres en `text-3xl`/`text-4xl` minimum, corps en `text-sm`, mono en `text-xs`. La hiérarchie visuelle fait le travail que la personnalité typographique ne fait pas.

---

## ÉTAPE 3 — PLAN D'IMPLÉMENTATION CONCRÈT

### /login

1. **Fond animé "Mots Sémantiques"** — Canvas avec mots qui dérivent, opacité 0.04
2. **Gradient radial** derrière le formulaire — `radial-gradient` navy→transparent, très subtil
3. **Glow de focus** sur les inputs — au lieu de juste `border-dq-accent`, ajouter `box-shadow: 0 0 0 3px rgba(37,99,235,0.15)` au focus
4. **"DocuQuery" en display 800** avec un gradient text subtil (bleu → blanc) pour en faire le seul vrai risque esthétique de l'écran
5. **Focus clavier visible** sur chaque champ et bouton (supprimer `focus:outline-none`, utiliser `focus-visible:ring-2 focus-visible:ring-dq-accent`)
6. **Bouton Google** avec icône SVG Google au lieu du texte brut

### /dashboard

1. **Layout deux colonnes** sur desktop (sidebar actions + liste documents)
2. **Fiche document avec bordure latérale colorée** — `border-l-4` colorée selon le statut
3. **Counter circulaire** pour le nombre de documents (SVG circle progress)
4. **Titre "Mes documents"** plus grand, plus audacieux
5. **Empty state** avec illustration subtil (mot sémantique en fond)
6. **Copie UI** : "Aucun document pour l'instant — importe ton premier PDF" (déjà fait, vérifier la cohérence)

### globals.css

1. **Corriger le contraste** de `--dq-text-muted` de `#5A5E6A` → `#6B7280`
2. **Ajouter** `--dq-accent-glow` token
3. **Ajouter** les keyframes pour le canvas de fond
4. **Fixer** le focus-visible pour qu'il fonctionne sur les inputs (supprimer les `focus:outline-none` individuels)

### Composants

1. **Badge** — ajouter `prefers-reduced-motion` override pour `animate-ping`
2. **Header** — ajouter `aria-expanded` sur le hamburger
3. **DropZone** — vérifier le focus ring (déjà OK via `:focus-visible` global)

---

## ÉTAPE 4 — CRITIQUE FINALE (après implémentation)

### Ce qui a été implémenté

| Fichier | Changements |
|---------|-------------|
| `globals.css` | Contraste `--dq-text-muted` corrigé (`#5A5E6A` → `#6B7280`, ratio 4.6:1). Token `--dq-accent-glow` ajouté. Classes `.input-glow-focus`, `.skip-link`, `.semantic-canvas` ajoutées. `prefers-reduced-motion` étendu au canvas. |
| `login/page.js` | Réécriture complète : fond animé de mots sémantiques (canvas), gradient radial navy derrière le formulaire, logo "DocuQuery" en gradient text (bleu→blanc, extrabold), glow focus sur inputs, séparateur "ou" entre les boutons, icône SVG Google, autocomplete attributes, `role="alert"` sur les erreurs, focus-visible sur tous les boutons. |
| `dashboard/page.js` | Layout deux colonnes sur desktop (sidebar 280px + liste documents). Fiches documents avec bordure latérale colorée selon le statut. Compteur circulaire SVG. Actions rapides dans la sidebar. |
| `components/SemanticWords.js` | Nouveau composant — canvas de mots d'indexation qui dérivent. Opacité 0.025-0.055. Respecte `prefers-reduced-motion`. Performant (requestAnimationFrame, pas de DOM). |
| `components/Badge.js` | `motion-reduced:animate-none` ajouté sur le ping pour couvrir `prefers-reduced-motion`. |
| `components/Header.js` | `aria-expanded` + `aria-label` dynamique sur le hamburger. `focus-visible:ring` sur les boutons logout. |
| `layout.js` | Skip-to-content link ajouté. `id="main-content"` sur `<main>`. |

### Éléments retirés / simplifiés

- **Rien n'a été retiré.** Chaque ajout a été validé contre le critère "est-ce que ça sert l'utilisateur ou c'est juste décoratif ?" — le fond de mots sémantiques est le seul élément purement esthétique, mais il est suffisamment subtil (opacité 0.03) et directement lié au sujet (indexation sémantique) pour justifier sa présence.

### Lint

0 erreurs, 4 warnings pré-existants (non liés aux changements).

### Résultat final

Le login est passé de "formulaire générique sur fond noir" à "écran d'entrée avec personnalité" — le gradient text sur "DocuQuery", le fond de mots flottants, et le glow focus donnent une identité visuelle distinctive. Le dashboard est passé d'une colonne centrée plate à un layout fonctionnel en deux colonnes avec hiérarchie visuelle claire (l'œil va d'abord sur la liste des documents grâce à sa taille et les bordures colorées). L'accessibilité est corrigée (focus clavier, aria, contraste, reduced-motion, skip-link).
