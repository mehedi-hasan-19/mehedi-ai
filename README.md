# MEHEDI AI — Your Personal AI Operating System

**MEHEDI AI** is a semi-autonomous, multi-agent personal AI operating system built with **React 19**, **TypeScript**, **Node.js (Express)**, **Google Gemini API (`@google/genai`)**, and **Firebase (Authentication & Firestore)**. It supports both **English** and **Bengali (বাংলা)** across all 16 operating system modules.

---

## 1. Architecture Overview

```text
/
├── server.ts                  # Express + Vite full-stack server, Gemini AI Brain, Multi-Agent Orchestrator
├── firebase-blueprint.json    # Strict Entity & Firestore path blueprint
├── firestore.rules            # Zero-Trust, 8-Pillar hardened Firestore Security Rules
├── security_spec.md           # Phase 0 Security TDD & Dirty Dozen adversarial specification
├── firestore.rules.test.ts    # Adversarial security test scenarios
├── desktop/
│   ├── main/main.ts           # Secure Electron Windows main process configuration
│   └── preload/preload.ts     # Context-isolated Electron preload script
└── src/
    ├── App.tsx                # Main OS Application Shell + 16 Functional Modules
    ├── firebase.ts            # Firebase SDK initialization, connection test, safe CRUD & error handler
    ├── types.ts               # Shared TypeScript interfaces
    └── constants/
        ├── agents.ts          # 10 Specialist Agents registry & system prompts
        └── translations.ts    # English & Bengali bilingual dictionary
```

---

## 2. Beginner Setup Guide

### A. Which Firebase Services to Enable
1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Select your provisioned project (`copper-paratext-gc9s2` or your custom project).
3. **Authentication**:
   - Navigate to **Build > Authentication > Sign-in method**.
   - **Google Sign-In** is enabled automatically by AI Studio provisioning.
   - *(Optional)* To use **Email/Password Sign-In**, click **Add new provider > Email/Password**, toggle **Enable**, and click **Save**. Note: Our hardened Firestore security rules verify `request.auth.token.email_verified == true` for database writes, so Google Sign-In is recommended for immediate verified access.
4. **Cloud Firestore**:
   - Navigate to **Build > Firestore Database**.
   - Your database and `firestore.rules` are already provisioned and deployed.

### B. Where to Obtain & Place the Gemini API Key
1. Obtain a Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey).
2. In AI Studio Build, open **Settings > Secrets** and set `GEMINI_API_KEY`.
3. For local development outside AI Studio, copy `.env.example` to `.env` and set:
   ```env
   GEMINI_API_KEY="your_actual_gemini_api_key"
   GEMINI_MODEL="gemini-3.8-flash"
   ```
   *Never place `GEMINI_API_KEY` in frontend code or `VITE_*` client variables.*

### C. How to Run Locally
```bash
npm install
npm run dev
```
The full-stack server starts on `http://localhost:3000`.

### D. How to Test the AI & Semi-Autonomous Approval System
1. Sign in with your Google account.
2. On the **Home Dashboard**, use the **Quick Command Bar** to run a multi-agent workflow:
   - *"Research the best AI design tools, compare them, and prepare a report."*
3. Try triggering the **Semi-Autonomous Permission System** in **AI Chat**:
   - *"Send an email to the product team summarizing our Q4 roadmap."*
   - Notice that MEHEDI AI drafts the email and automatically creates a pending request in the **Approval Center** rather than executing an unapproved external action.
4. Open the **Approval Center** to inspect the exact payload, consequences, and click **Approve & Execute** or **Reject Request**. Every decision is recorded in **Activity Logs**.

### E. Packaging as a Windows Desktop Application (Electron)
1. Install Electron builder dependencies in your local desktop packaging environment:
   ```bash
   npm install --save-dev electron electron-builder
   ```
2. Compile `/desktop/main/main.ts` and `/desktop/preload/preload.ts` and point Electron to your running or hosted MEHEDI AI server (`APP_URL`).
3. Run `npx electron-builder --win` to generate the Windows NSIS installer.
