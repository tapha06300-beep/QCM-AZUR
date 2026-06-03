# QCM Azure — Application web complète

Application web autonome pour faire passer le QCM d'évaluation finale
du cours "Introduction à Microsoft Azure" (Bac+3 · Systèmes, Réseaux et Cloud).

---

## Structure des fichiers

```
qcm-azure/
├── server.js          ← Serveur Express (API + fichiers statiques)
├── package.json       ← Dépendances Node.js
├── public/
│   └── index.html     ← Interface unique (étudiant + formateur)
└── README.md
```

---

## Démarrage en local (test)

```bash
npm install
node server.js
# → http://localhost:3000
```

---

## Déploiement gratuit sur Render.com (recommandé)

Render est un hébergeur cloud gratuit, parfait pour ce cas d'usage.
L'URL sera du type : https://qcm-azure.onrender.com

### Étapes

1. Créer un compte sur https://render.com (gratuit, pas de carte bancaire)

2. Créer un dépôt GitHub :
   - Aller sur https://github.com → New repository → "qcm-azure"
   - Uploader les fichiers : server.js, package.json, public/index.html

3. Sur Render :
   - New → Web Service
   - Connecter votre dépôt GitHub
   - Paramètres :
     - Name : qcm-azure
     - Runtime : Node
     - Build Command : npm install
     - Start Command : node server.js
   - Cliquer "Create Web Service"

4. Render fournit l'URL publique en 2 minutes.
   Envoyez-la à vos étudiants via le chat Teams.

---

## Déploiement alternatif sur Railway.app

```bash
npm install -g @railway/cli
railway login
railway new
railway up
```

---

## Identifiants par défaut

| Rôle       | Identifiant   | Valeur       |
|------------|---------------|--------------|
| Étudiant   | Code d'accès  | AZURE2024    |
| Formateur  | Mot de passe  | FORMATEUR    |

Pour changer ces valeurs, modifier les constantes dans server.js :
- Ligne ~7 : accessCode: 'AZURE2024'
- Ligne ~8 : teacherPwd: 'FORMATEUR'

---

## Fonctionnalités

### Côté étudiant
- Identification obligatoire (nom, groupe, code d'accès)
- 20 questions chronomètrées (30 minutes)
- Navigation libre entre questions
- Barre de progression
- Détection de sortie de fenêtre (onglet, alt-tab, minimisation)
- Soumission automatique à expiration du chronomètre
- Correction détaillée affichée à la fin

### Côté formateur (tableau de bord)
- Accès sécurisé par mot de passe
- Rafraîchissement automatique toutes les 3 secondes
- KPIs : nombre connectés, terminés, score moyen, sorties détectées
- Suivi en temps réel : avancement, statut, score, violations par étudiant
- Détail question par question pour chaque étudiant
- Taux de réussite par question (pour identifier les points mal compris)
- Activation / désactivation du QCM à la volée
- Export CSV téléchargeable

### Sécurité
- Le code d'accès étudiant est communiqué oralement au démarrage
- Les sorties de fenêtre sont détectées, comptabilisées et transmises au serveur
- Le tableau de bord formateur est protégé par mot de passe
- Les réponses sont soumises côté serveur et vérifiées par le serveur

---

## Remarque sur la persistance

Dans la version actuelle, les données sont en mémoire (in-process).
Elles sont perdues au redémarrage du serveur.
Pour une persistance permanente, remplacer `db.sessions` par une base
SQLite ou PostgreSQL (disponible gratuitement sur Render et Railway).
