import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { OmnistonProvider, Omniston } from '@ston-fi/omniston-sdk-react';
import './index.css'
import App from './App.js'

const omniston = new Omniston({ apiUrl: "wss://omni-ws.ston.fi" });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TonConnectUIProvider manifestUrl={`${window.location.origin}/tonconnect-manifest.json`}>
      <OmnistonProvider omniston={omniston}>
        <App />
      </OmnistonProvider>
    </TonConnectUIProvider>
  </StrictMode>,
)