<div align="center">
  <br />
  <img src="https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" />
  <br />
  
  <h1>⬡ SplitHouse</h1>
  <p><strong>Expense Tracking, Reimagined.</strong></p>
  <p>Split bills. Zero stress. Make shared living fair, one expense at a time.</p>
  <br />
</div>

<hr />

## 📖 About SplitHouse

SplitHouse is a modern, minimalistic, and beautifully designed web application for managing shared living expenses. Track everything from rent to groceries, split costs fairly among housemates, and settle up safely—all in one place.

Built with **Angular**, this repository contains the **Frontend** application for the SplitHouse project. The backend (Spring Boot) powers the RESTful API, while this frontend focuses on delivering a seamless, dark-themed, glassmorphic user experience.

<br />

## ✨ Core Features

- **⚡ Instant Splits**: Split any expense in seconds—equal splits, custom amounts, or percentage-based.
- **🏠 House Groups**: Create dedicated spaces for roommates or shared living arrangements.
- **🔔 Real-time Sync**: Every expense updates seamlessly across all members using a robust Spring Boot backend.
- **💳 Settlement Tracking**: See exact balances. Know who owes what at a glance with color-coded positive and negative settlement indicators.
- **🔒 Secure Authentication**: Powered by seamless JWT authentication and seamless interceptors for robust data security.

<br />

## 🎨 UI / Aesthetics
The application features a modern "Midnight" design system:
- **Background Palette**: Rich dark shades ranging from `#0a0a0f` to `#13131f`.
- **Primary Accent**: A vibrant violet (`#6c63ff`) and soft lavender (`#a78bfa`) pairing for glows, buttons, and visual hierarchy.
- **Typography**: [Syne](https://fonts.google.com/specimen/Syne) for bold, dynamic headlines and [Inter](https://fonts.google.com/specimen/Inter) for clean, readable interface text.
- **Effects**: Beautiful CSS-only backdrop blurs, floating mockup elements, structural gradients, and subtle micro-animations on hover interactions.

<br />

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Angular CLI](https://angular.io/cli) (v17+)

### Installation
1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/split-house.git
   cd split-house
   ```

2. **Install frontend dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environments:**
   - The application relies on `src/environments/environment.ts` for local development (defaults to `http://localhost:5555`).
   - When building for production, Angular uses `fileReplacements` to seamlessly deploy `src/environments/environment.production.ts`.

4. **Run the Development Server:**
   ```bash
   npm run start
   ```
   Navigate your browser to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

<br />

## 🛠️ Technology Stack
- **Framework**: Angular 21
- **Language**: TypeScript
- **Styling**: Vanilla CSS (Custom properties, Flexbox/Grid, Glassmorphism, CSS Animations)
- **State/Auth**: LocalStorage & JWT HTTP Interceptors
- **Backend (External)**: Spring Boot / Java / REST APIs

<hr />

<div align="center">
  <p>Built with ❤️ for hassle-free shared living.</p>
</div>
