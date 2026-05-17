# 🎓 ProfAssistant (NotesEleves) - Smart Academic Tracking System

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D%2016.0.0-brightgreen.svg)](https://nodejs.org/)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)](#)

An intelligent, elegant, and interactive web application designed to help Moroccan teachers manage, visualize, and analyze student grades exported from the **Massar** system. This system is designed **exclusively for Pioneer Schools (المدارس الرائدة / Écoles Pionnières)** in Morocco, fully supporting their three core subjects: **Arabic, French, and Mathematics**. Built with local portability, high performance, and offline-first capabilities in mind, it provides beautiful charts and reports to share with parents during academic meetings.


---

## 🌟 Key Features

- **📊 Dynamic Dashboard**: Stunning interactive charts (using Chart.js) that display class progress and student-specific grade evolutions across up to 5 stages.
- **📁 Smart Excel Importer**: Drag-and-drop Massar Excel sheets (GrilleEvaluation) or entire directories. The system recursively scans, parses, and organizes files.
- **📝 Automated Student Reports**: Instantly generates qualitative academic summaries and reports for each student based on their grades and competencies.
- **⚡ Subject Toggle Group**: Instant multi-selection of the three core subjects (**Arabic, French, and Mathematics**) with real-time update of charts, summaries, and competency grids.
- **🔍 Quick Live Search**: Predictive, immediate autocomplete search bar to jump to any student’s dossier in milliseconds.
- **💾 Smart State Persistence**: Saves the current active student, class, and filters in `location.hash` so refreshing the page never loses your context.
- **🛡️ Robust File Handling**: Specially designed copy-and-process algorithms for Windows to handle locked Excel files (e.g., when currently open in MS Excel) with elegant, non-blocking visual warnings.
- **📴 Offline Enabler**: Automatically downloads and caches necessary CDNs/assets so the application runs completely offline in schools with no internet access.

---

## 🛠️ Technology Stack

- **Frontend**: Standard HTML5, CSS3 (Premium Glassmorphism & Responsive layout), Vanilla ES6 JavaScript.
- **Backend**: Express.js (Node.js framework).
- **Libraries**:
  - `xlsx` (SheetJS) for lightning-fast programmatic Excel parsing.
  - `chart.js` for stunning, responsive visualizations.
  - `fs-extra` for clean and robust filesystem operations.
  - `multer` for secure, multi-part form upload.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
Ensure you have **Node.js** (v16 or higher) installed on your system.
> **Note**: For portable Windows environments, the project is configured to use a local portable `node.exe` placed inside `system/bin/` if available.

### 2. Installation
Clone the repository and install the dependencies:
```bash
git clone https://github.com/YOUR_USERNAME/ProfAssistant.git
cd ProfAssistant/system
npm install
```
*For Windows users:* If you face PowerShell Execution Policy restrictions during npm install, use:
```bash
npm.cmd install
```
Or temporarily grant execution permissions using:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 3. Running the Server
Start the local Express server:
```bash
node scripts/server.mjs
```
The server will boot up and listen on:
👉 **[http://localhost:3000](http://localhost:3000)**

### 4. Direct One-Click Launch (Windows)
Double-click the `boot.bat` file in the `system/` directory (or the `Lancer ProfAssistant` shortcut). This will automatically launch the local Node server and open Google Chrome directly to the app.

---

## 📂 Data Structure & Import Process

1. Go to the **"Data Import"** tab in the sidebar.
2. Drag and drop your **Massar Excel sheets** or click to select a **complete folder** containing your grades files.
3. The system will programmatically identify the school name, school year, stage number (1–5), subjects, and student IDs.
4. Click **"Start Import"**. The files will be parsed, student records saved to `database.json`, and the source Excel files organized inside the Grade Repository folder.

---

## 🔒 Open Source & Privacy First

> [!IMPORTANT]
> **Privacy is our top priority.** Student grades and names are stored **completely locally** on your machine inside `system/database.json`. No student data is ever sent to external servers or cloud services.
> 
> The project includes a pre-configured `.gitignore` file that automatically excludes:
> - `system/database.json` (Local database)
> - `مستودع النقط/` (Local excel spreadsheets folder)
> - `system/uploads/` (Temporary upload cache)
> - `system/node_modules/` (Node packages)
> 
> You can safely push updates to your public fork without worrying about leaking sensitive student data.

---

## 🤝 Contributing

We welcome contributions from teachers, developers, and designers alike! 
1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

**Developed with ❤️ for Moroccan Teachers.**  
*Empowering educators with smart, elegant technology.*
