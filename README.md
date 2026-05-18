# 🎓 ProfAssistant - Système Intelligent de Suivi Scolaire

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D%2016.0.0-brightgreen.svg)](https://nodejs.org/)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)](#)

Une application web locale, intelligente, élégante et interactive, conçue pour aider les enseignants marocains à gérer, visualiser et analyser les notes des élèves exportées du système **Massar**. Ce système est conçu **exclusivement pour les Écoles Pionnières (المدارس الرائدة)** au Maroc, prenant entièrement en charge leurs trois matières principales : **l'Arabe, le Français et les Mathématiques**. Conçu dans un esprit de portabilité locale, de haute performance et de fonctionnement hors ligne (offline-first), il génère de magnifiques graphiques et rapports à partager avec les parents d'élèves lors des réunions pédagogiques.

---

## 🌟 Caractéristiques Principales

- **📊 Tableau de Bord Dynamique** : Des graphiques interactifs époustouflants (développés avec Chart.js) qui affichent la progression de la classe et l'évolution des notes spécifiques à chaque élève sur un maximum de 5 étapes.
- **📁 Importateur Excel Intelligent** : Glissez-déposez des feuilles Excel Massar (Grilles d'évaluation) ou des dossiers complets. Le système analyse, extrait et organise automatiquement les données de manière récursive.
- **📝 Rapports Automatisés pour les Élèves** : Génère instantanément des synthèses scolaires qualitatives et des rapports détaillés pour chaque élève en fonction de ses notes et de ses niveaux de maîtrise par compétence.
- **⚡ Sélecteur de Matières Interactif** : Sélection multiple instantanée des trois matières principales (**Arabe, Français et Mathématiques**) avec mise à jour en temps réel des graphiques, des synthèses et des grilles de compétences.
- **🔍 Recherche Intuitive et Rapide** : Barre de recherche avec autocomplétion prédictive immédiate pour accéder au dossier de n'importe quel élève en quelques millisecondes.
- **💾 Persistance de l'État** : Sauvegarde automatique de l'élève actif, de la classe et des filtres sélectionnés dans `location.hash` pour ne jamais perdre le contexte lors du rafraîchissement de la page.
- **🛡️ Gestion Robuste des Fichiers** : Algorithmes de copie et de traitement spécialement conçus pour Windows afin de gérer les fichiers Excel verrouillés (par exemple, s'ils sont ouverts dans MS Excel) avec des avertissements visuels non bloquants.
- **📴 Fonctionnement Hors Ligne (Offline)** : Télécharge et met en cache automatiquement toutes les dépendances et icônes (CDN) nécessaires pour que l'application fonctionne de manière fluide et autonome au sein des classes sans aucune connexion Internet.

---

## 🛠️ Technologies Utilisées

- **Frontend** : Standard HTML5, CSS3 (Design moderne et épuré avec effet Glassmorphism), Vanilla ES6 JavaScript.
- **Backend** : Express.js (Framework Node.js).
- **Bibliothèques Clés** :
  - `xlsx` (SheetJS) pour une lecture et un traitement ultrarapides des fichiers Excel.
  - `chart.js` pour des visualisations graphiques réactives et interactives.
  - `fs-extra` pour des opérations de système de fichiers fluides et sécurisées.
  - `multer` pour la gestion des téléchargements de fichiers de notes.

---

## 🚀 Guide de Démarrage Rapide

### 1. Prérequis
Assurez-vous d'avoir **Node.js** (version 16 ou supérieure) installé sur votre système.
> **Note pour les utilisateurs de Windows** : Le projet prend en charge le fonctionnement portable en plaçant simplement l'exécutable `node.exe` dans le dossier `system/bin/`.

### 2. Installation
Clonez le dépôt, puis accédez au dossier du serveur pour installer les dépendances nécessaires :
```bash
git clone https://github.com/youssef1817/ProfAssistant.git
cd ProfAssistant/system
npm install
```
*Pour les utilisateurs de Windows :* Si vous rencontrez des restrictions liées aux règles d'exécution (Execution Policy) lors de l'installation, utilisez la commande suivante :
```bash
npm.cmd install
```
Ou autorisez temporairement l'exécution des scripts via PowerShell (lancé en tant qu'administrateur) :
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 3. Lancement du Serveur
Démarrez le serveur local Express :
```bash
node scripts/server.mjs
```
Le serveur démarrera et sera accessible à l'adresse suivante :
👉 **[http://localhost:3000](http://localhost:3000)**

### 4. Lancement en Un Clic (sur Windows)
Double-cliquez simplement sur le fichier `boot.bat` situé dans le dossier `system` (ou le raccourci `Lancer ProfAssistant` dans le dossier principal). Cela lancera automatiquement le serveur Node local et ouvrira Google Chrome directement sur l'application.

---

## 📂 Structure des Données & Importation

1. Accédez à l'onglet **"Importer des Données"** dans la barre latérale de l'application.
2. Glissez-déposez vos **fichiers Excel exportés de Massar** ou sélectionnez un **dossier complet** contenant vos grilles de notes.
3. Le système identifiera automatiquement le nom de l'établissement, l'année scolaire, le numéro de l'étape (1 à 5), les matières et les identifiants Massar des élèves.
4. Cliquez sur **"Démarrer l'importation"** pour enregistrer et organiser instantanément les données dans la base de données locale `database.json`.

### 📥 Fichiers Excel Supportés & Comment les Exporter
Les fichiers cibles sont les grilles d'évaluation exportées depuis le système **Massar** en suivant ce chemin :
**ملف الكفايات (Carnet des compétences)** → **تصدير مستويات التحكم (Exporter les niveaux de maîtrise)**

![Comment exporter les fichiers Excel depuis Massar](system/assets/export_guide.png)

---

## 🔒 Confidentialité & Code Source Ouvert

> [!IMPORTANT]
> **La confidentialité est notre priorité absolue.** Toutes les données des élèves (noms, notes, niveaux de maîtrise) sont stockées **exclusivement en local** sur votre ordinateur dans le fichier `system/database.json`. Aucune donnée n'est envoyée à des serveurs externes ou à des services cloud.
> 
> Le projet intègre un fichier `.gitignore` préconfiguré qui exclut automatiquement de votre dépôt public les fichiers sensibles suivants :
> - `system/database.json` (Votre base de données locale contenant les notes de vos élèves)
> - `مستودع النقط/` (Le dossier local contenant vos fichiers Excel réels)
> - `system/uploads/` (Le cache temporaire des fichiers importés)
> - `system/node_modules/` (Les paquets et dépendances Node)
> 
> Vous pouvez ainsi partager et développer ce projet en toute sécurité sur votre compte GitHub, sans aucun risque de fuite de données personnelles de vos élèves.

---

## 🤝 Contribution

Les contributions de la part d'enseignants, de développeurs et de designers sont les bienvenues !
1. Faites un Fork du projet.
2. Créez une nouvelle branche pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`).
3. Enregistrez vos modifications (`git commit -m 'Add some AmazingFeature'`).
4. Poussez les modifications sur la branche (`git push origin feature/AmazingFeature`).
5. Ouvrez une Pull Request.

---

## 📄 Licence

Distribué sous la licence **MIT**. Voir le fichier `LICENSE` pour plus d'informations.

---

**Développé avec ❤️ pour soutenir et faciliter le travail des Enseignants.**  
*Ensemble, améliorons nos écoles grâce à des solutions numériques libres et intelligentes.*
