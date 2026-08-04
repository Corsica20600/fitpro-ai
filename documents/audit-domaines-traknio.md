# Audit de bascule Traknio

Objectif : préparer la bascule propre vers `traknio.fr` et `traknio.com` sans casser l'app mobile, la montre, l'authentification, Spotify, Stripe, Neon ou Vercel.

## 1. Décision à prendre avant DNS

- Choisir le domaine canonique : `traknio.com` ou `traknio.fr`.
- Rediriger l'autre domaine vers le canonique.
- Garder l'ancienne URL Vercel uniquement comme secours technique, pas comme URL publique.

Recommandation actuelle : `traknio.com` en canonique, `traknio.fr` en redirection permanente.

## 2. Dossier local et nommage projet

Fait localement :

- Dossier local renommé : `C:\dev\traknio\traknio-app`.
- Projet Android renommé : `android-private\traknio-android`.

Etat actuel :

- Identifiants Android alignés sur Traknio : `com.traknio.app` et `com.traknio.watch`.
- Noms de fichiers Android alignés sur `traknio_*`.
- Variables Android alignées sur `TRAKNIO_*`.

## 3. Vercel et DNS OVH

Dans Vercel :

- Ajouter `traknio.com`.
- Ajouter `www.traknio.com`.
- Ajouter `traknio.fr`.
- Ajouter `www.traknio.fr`.
- Définir le domaine canonique dans le projet.
- Créer une redirection du domaine secondaire vers le canonique.

Chez OVH :

- Pour le domaine racine, pointer vers Vercel avec l'enregistrement A recommandé par Vercel.
- Pour `www`, utiliser le CNAME Vercel.
- Supprimer ou désactiver les anciennes redirections web OVH si elles entrent en conflit.
- Attendre la propagation DNS, puis vérifier les certificats SSL dans Vercel.

Variables Vercel à vérifier :

- `NEXT_PUBLIC_SITE_URL=https://traknio.com`
- `AUTH_URL=https://traknio.com` si utilisé par NextAuth/Auth.js.
- `NEXTAUTH_URL=https://traknio.com` si encore présent.
- `TRAKNIO_SYNC_BASE_URL=https://traknio.com` pour les builds Android téléphone et montre.
- `DATABASE_URL` et `DIRECT_URL` inchangées, mais bien présentes en Production.
- Variables Spotify et Stripe inchangées côté secret, mais leurs URLs de callback/webhook changent.

Sources utiles :

- Vercel domaines/DNS : https://vercel.com/docs/domains/working-with-dns
- Ajouter un domaine Vercel : https://vercel.com/docs/domains/working-with-domains/add-a-domain

## 4. Neon

La base Neon ne dépend pas directement du nom de domaine.

A vérifier :

- `DATABASE_URL` doit utiliser l'URL poolée Neon pour l'app en production.
- `DIRECT_URL` doit utiliser l'URL directe Neon pour Prisma/migrations.
- Les migrations Prisma doivent être lancées avec `DIRECT_URL` disponible.
- Avant lancement public : activer sauvegardes, surveiller connexions, stockage et compute.
- Au passage Pro : surveiller surtout nombre de connexions, temps de requêtes et stockage historique.

Sources utiles :

- Neon + Prisma : https://neon.com/docs/guides/prisma
- Pooling Neon : https://neon.com/docs/connect/connection-pooling

## 5. GitHub

Optionnel mais recommandé avant publication :

- Renommer le repository vers `traknio` ou `traknio-app`.
- Mettre à jour le remote local : `git remote set-url origin <nouvelle-url>`.
- Vérifier que Vercel suit bien le nouveau repository.
- Mettre à jour README, badges, liens de déploiement, mentions Play Store et docs.
- Protéger `main` quand on entre en phase publique.

Note : GitHub redirige généralement les anciennes URLs de repository, mais il faut quand même mettre à jour les remotes locaux pour éviter la confusion.

Source utile :

- GitHub transfert/renommage et redirections : https://docs.github.com/en/repositories/creating-and-managing-repositories/transferring-a-repository

## 6. Android téléphone

Avant publication Play Store :

- Valider définitivement l'identifiant `applicationId = "com.traknio.app"`.
- Attention : l'identifiant Android ne se change plus librement après publication Play Store.
- Mettre `TRAKNIO_SYNC_BASE_URL=https://traknio.com` dans `android-private\traknio-android\gradle.properties`.
- Rebuilder l'APK/AAB téléphone après changement de domaine.
- Tester :
  - ouverture WebView ;
  - connexion Google ;
  - `traknio://health-sync` ;
  - Health Connect ;
  - Spotify ;
  - lancement sans écran blanc ;
  - synchro téléphone/montre hors Wi-Fi.

## 7. Montre Wear OS

Avant publication :

- Valider définitivement l'identifiant `applicationId = "com.traknio.watch"`.
- Mettre `TRAKNIO_SYNC_BASE_URL=https://traknio.com` pour le module `wear`.
- Rebuilder l'APK montre après changement de domaine.
- Tester :
  - récupération séance active ;
  - validation série ;
  - fin de séance depuis montre ;
  - latence repos ;
  - reconnexion après coupure réseau.

## 8. Intégrations externes

Spotify :

- Ajouter `https://traknio.com/api/integrations/spotify/callback` dans les redirect URIs.
- Garder l'ancienne URL Vercel pendant les tests si nécessaire.
- Tester play/pause, précédent, suivant, refresh du titre.

Stripe :

- Mettre à jour les success/cancel URLs si elles sont configurées.
- Créer ou modifier le webhook vers `https://traknio.com/api/stripe/webhook`.
- Tester avec Stripe CLI ou un paiement test.

Google/Auth :

- Ajouter le domaine dans les origines autorisées OAuth.
- Ajouter les callbacks nécessaires selon la configuration Auth.js.
- Vérifier l'écran de consentement et les liens confidentialité/suppression.

Play Store :

- Page confidentialité : `https://traknio.com/privacy`.
- Suppression des données : `https://traknio.com/data-deletion`.
- Conditions : `https://traknio.com/terms`.

## 9. Tests de bascule

Checklist finale :

- `https://traknio.com` charge la page de présentation.
- `https://www.traknio.com` redirige proprement.
- `https://traknio.fr` redirige proprement.
- `https://www.traknio.fr` redirige proprement.
- Connexion Google OK.
- Dashboard OK.
- Génération programme OK.
- Séance guidée OK.
- Spotify OK.
- Health Connect OK.
- Historique séance OK.
- Montre OK.
- Export/suppression des données OK.
- Aucun lien public ne pointe vers `traknio-pro*.vercel.app`.
