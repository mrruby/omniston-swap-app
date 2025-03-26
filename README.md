# STON.fi Omniston Swap App

This project is a minimal **React + Vite** setup that demonstrates how to implement an Omniston token swap using the [Omniston React SDK](https://github.com/ston-fi/omniston-sdk/tree/main/packages/omniston-sdk-react) on the [TON blockchain](https://ton.org/). It connects with a TON wallet using [TonConnect](https://ton.org/docs/), gets real-time quotes, and then executes on-chain transactions.

## Table of Contents

1. [Guide Overview](#guide-overview)
2. [Project Structure](#project-structure)
3. [Running Locally](#running-locally)
4. [Preview on Replit](#preview-on-replit)

---

## Guide Overview

For full instructions on how this project was built, please refer to our **[Omniston Guide](https://docs.ston.fi/docs/developer-section/quickstart/omniston)**. It walks you through:

- Setting up a new React + Vite project with **Tailwind CSS** and the required dependencies.
- Connecting a wallet with **TonConnect**.
- Fetching tokens (assets) from STON.fi.
- Getting quotes and executing swaps (via `@ston-fi/omniston-sdk-react`).

If you want to dive straight into the core swap logic, take a look at:

- **[`App.jsx`](./src/App.jsx)** — The main React component that implements the swap functionality.

---

## Project Structure

The most relevant files for the swap demo are:

- **`src/App.jsx`**  
  Contains the main UI and swap handling logic (wallet connection, asset selection, getting quotes, and transaction execution).

- **`src/main.jsx`**  
  The entry point of the React application, setting up providers such as `TonConnectUIProvider` and `OmnistonProvider`.

- **`src/index.css`**  
  Imports Tailwind CSS and applies global styles.

- **`vite.config.js`**  
  Vite configuration file with necessary plugins and settings.

- **`eslint.config.js`**  
  ESLint configuration for React and modern JavaScript/JSX.

- **`package.json`**  
  Project dependencies and scripts.

---

## Running Locally

1. **Clone the repository**:

```bash
  git clone https://github.com/mrruby/omniston-swap-app.git
  cd stonfi-swap-app
```

2. Install dependencies (using pnpm, npm, or yarn):

```bash
  pnpm install
```

3. Start the development server:
```bash
  pnpm dev
```

4. Open http://localhost:5173 in your browser to see the swap app in action.

---

## Preview on Replit

If you prefer not to run the app locally, you can quickly preview or fork it on Replit:

1. Go to **[Replit Omniston Swap App](https://replit.com/@stonfi/omniston-swap-app?embed=true)**
2. Click Fork (top-right corner) to create your own copy of the project.
3. Wait for the environment to install dependencies.
4. Click the Run button to start the dev server.
5. Use the Replit preview to interact with the swap UI.

You can then modify any files (like App.jsx) directly in Replit and immediately see the changes reflected in the preview.

---

Happy building on TON and STON.fi!

