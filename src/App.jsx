import { TonConnectButton } from '@tonconnect/ui-react';

function App() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Omniston Swap Demo</h1>
      <TonConnectButton />
    </div>
  );
}

export default App;