# 2OS Accounting System - Desktop App (PC Demo)

A 100% offline-capable desktop accounting application built with an embedded Python engine, SQLite database (`2os_database.db`), active SQL transaction sync (`transactions.sql`), and a dedicated native desktop window.

---

## 🚀 How to Run

1. **Double-click `Launch_App.bat`**.
2. The batch script immediately launches the desktop application in the background and closes the Command Prompt window automatically.
3. The app opens in its own clean desktop window (without browser navigation bars or tabs) running on your local machine.

---

## 📂 Entity Directory Structure

Whenever you register or import a company (e.g. `abc corporation`), the system automatically provisions its corporate document and tax filing directory tree under `entity directory/`:

```
parent folder /
└── entity directory/
    └── abc corporation/
        ├── main (if branch code is 00000)/
        │   ├── main documents/
        │   │   ├── dti/sec
        │   │   ├── bir
        │   │   ├── lgu
        │   │   └── other documents
        │   └── 2026 transactions/
        │       ├── sales
        │       ├── expenses
        │       ├── 2307
        │       ├── 2316
        │       └── tax compliances/
        │           ├── attachments
        │           └── filings
        └── branch 1 (or specific branch code)/
            ├── main documents/
            │   ├── dti/sec
            │   ├── bir
            │   ├── lgu
            │   └── other documents
            └── 2026 transactions/
                ├── sales
                ├── expenses
                ├── 2307
                ├── 2316
                └── tax compliances/
                    ├── attachments
                    └── filings
```

---

## ⚡ Features

- **100% Offline Capability**: Runs entirely from local files on your machine without requiring an internet connection.
- **Embedded Database**: Saves all ledger records into `2os_database.db` (SQLite).
- **Automated Directory Generation**: Instantly creates the hierarchical folder structure upon adding an entity.
- **Self-Closing Batch Launcher**: Spawns the desktop window and silently dismisses the command prompt.
