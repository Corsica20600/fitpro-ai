<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Instructions Codex — Traknio

## Projet

Traknio est une application fitness composée de :
- une application web/mobile basée sur Next.js ;
- un backend avec Prisma et PostgreSQL/Neon ;
- une application Android ;
- une application Wear OS pour montre connectée ;
- des fonctionnalités IA via OpenAI.

L’objectif est de créer une application de suivi sportif premium, fiable, fluide et cohérente entre téléphone, web et montre.

## Règles générales

- Toujours analyser le dépôt avant de modifier le code.
- Ne jamais modifier une fonctionnalité existante sans nécessité.
- Préférer des changements ciblés, cohérents et testables.
- Ne jamais exposer de clé API côté client.
- Ne jamais inventer de variable d’environnement.
- Ne pas ajouter de dépendance sans justification claire.
- Respecter TypeScript strict.
- Respecter l’architecture existante.
- Préserver la compatibilité Android et Wear OS.
- Ne jamais supprimer du code sans expliquer pourquoi.
- Ne pas faire de refonte globale si la demande concerne une correction précise.

## Next.js

- La version de Next.js utilisée peut différer des connaissances d’entraînement.
- Lire la documentation locale dans `node_modules/next/dist/docs/` avant toute modification importante liée à Next.js.
- Respecter les conventions App Router si elles sont utilisées dans le projet.
- Vérifier les usages Server Components / Client Components avant de déplacer du code.
- Ne jamais utiliser d’API obsolète sans vérifier la documentation locale.

## Prisma / Base de données

- Vérifier `prisma/schema.prisma` avant toute modification.
- Ne jamais modifier une migration déjà appliquée.
- Créer une nouvelle migration pour tout changement de structure.
- Vérifier les relations, index et contraintes.
- Ne jamais utiliser `prisma db push` en production sans consigne explicite.
- Lancer `npx prisma validate` après modification du schéma.
- Ne pas casser les données existantes des utilisateurs.

## OpenAI / IA

- Tous les appels OpenAI doivent rester côté serveur.
- Ne jamais exposer la clé API au client.
- Envoyer uniquement les données nécessaires.
- Éviter les données personnelles inutiles.
- Pour les réponses stockées, demander un JSON strictement structuré.
- Valider la réponse IA avant enregistrement.
- Ne jamais présenter une recommandation sportive comme un diagnostic médical.
- Ne jamais inventer de données absentes.

## Traknio Coach

Pour toute fonctionnalité liée à Traknio Coach :

- Calculer les métriques sportives côté serveur sans IA.
- Utiliser l’IA uniquement pour interpréter les métriques.
- Ne jamais modifier automatiquement un programme sans validation utilisateur.
- Chaque recommandation doit être justifiée par une donnée réelle.
- Prévoir les états : vide, chargement, erreur, succès.
- Prévoir une limite de génération pour éviter les abus.
- Stocker le modèle utilisé, la période analysée, les métriques et la réponse du coach.

## Android / Wear OS

- Préserver la compatibilité avec l’application téléphone et l’application montre.
- Ne pas modifier les fichiers Gradle sans nécessité.
- Si une version Android est générée, augmenter correctement le `versionCode`.
- Vérifier les modules `app` et `wear` séparément.
- Respecter les contraintes de lisibilité sur montre.
- Ne pas casser le centrage, le timer, les états de repos ou la synchronisation.

## UI / Design

- Respecter le thème sombre premium existant.
- Couleurs principales : bleu, cyan, violet, vert, orange, rouge, gris.
- Garder une interface mobile-first.
- Prévoir les états loading, empty, error et success.
- Ne pas introduire de design incohérent avec le reste de Traknio.
- Éviter les textes trop longs sur mobile et montre.

## Avant de coder

Pour toute tâche importante ou risquée :

1. Identifier les fichiers concernés.
2. Résumer l’architecture actuelle.
3. Proposer un plan court.
4. Signaler les risques.
5. Attendre validation si la tâche touche Prisma, auth, Stripe, OpenAI, Android, Wear OS ou publication Play Store.

## Après modification

Toujours exécuter les commandes disponibles parmi :

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npx prisma validate