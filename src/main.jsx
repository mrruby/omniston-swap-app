import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { OmnistonProvider } from '@ston-fi/omniston-sdk-react';
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TonConnectUIProvider manifestUrl={`${window.location.origin}/tonconnect-manifest.json`}>
      <OmnistonProvider apiUrl="wss://omni-ws.ston.fi">
        <App />
      </OmnistonProvider>
    </TonConnectUIProvider>
  </StrictMode>,
)