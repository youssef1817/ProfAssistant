# Contributing to ProfAssistant (NotesEleves)

Thank you for showing interest in contributing to **ProfAssistant**! This project is free, open-source, and dedicated to supporting educators. We welcome contributions of all forms, including bug reports, feature requests, documentation improvements, code cleanups, and translation efforts.

---

## 🗺️ How Can I Contribute?

### 1. Reporting Bugs & Requesting Features
- Search the open issues on GitHub to see if your problem or idea has already been reported.
- If not, open a new issue detailing:
  - What you expected to happen.
  - What actually happened.
  - Step-by-step instructions to reproduce the issue.
  - Your environment details (OS, Node.js version, browser).

### 2. Documenting and Designing
- We are always looking for improvements in documentation (in both English and Arabic).
- UI/UX refinements are highly appreciated to make the teacher's dashboard look even more beautiful and intuitive.

### 3. Submitting Code Changes (Pull Requests)
- Fork the repository.
- Create a new branch named after your feature/fix: `git checkout -b feature/amazing-new-feature` or `git checkout -b fix/issue-name`.
- Write clean, commented, and self-documenting code.
- Test your changes locally to ensure the server starts properly and the dashboard page renders without console errors.
- Ensure that you **DO NOT** commit any private Excel files or real student databases (`database.json`) when submitting.
- Submit a Pull Request targeting the `main` branch, explaining what your changes do and what issues they address.

---

## 🛠️ Local Development Setup

1. Make sure you have **Node.js** installed locally.
2. In the `system` directory, run `npm install` to install dependencies.
3. Start the development server using `node scripts/server.mjs`.
4. The server runs at `http://localhost:3000`. You can inspect the frontend files inside `system/public/`.

---

## 🔒 Security and Privacy Safeguards

As this application handles student grades and identities:
- **Never submit real student data** in any commit, issue, or pull request.
- Keep the `.gitignore` active.
- If you find a security vulnerability, please contact the maintainers directly or open a confidential issue.

---

## 📜 Code of Conduct

We are committed to creating a friendly, inclusive, and collaborative environment. Please treat all contributors with respect, patience, and kindness. 

*Thank you for helping us make the lives of teachers easier!* 🎓
