import { useEffect, useState } from 'react';
import { StonApiClient, AssetTag } from '@ston-fi/api';
import { TonConnectButton } from '@tonconnect/ui-react';

function App() {
  const [assets, setAssets] = useState([]);
  const [fromAsset, setFromAsset] = useState(null);
  const [toAsset, setToAsset] = useState(null);
  const [amount, setAmount] = useState('');

  // fetch assets on mount
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const client = new StonApiClient();
        // Filter out top liquidity tokens for brevity
        const condition = [
          AssetTag.LiquidityVeryHigh,
          AssetTag.LiquidityHigh,
          AssetTag.LiquidityMedium
        ].join(' | ');
        const assetList = await client.queryAssets({ condition });

        setAssets(assetList);
        if (assetList.length > 0) {
          setFromAsset(assetList[0]);
        }
        if (assetList.length > 1) {
          setToAsset(assetList[1]);
        }
      } catch (err) {
        console.error('Failed to fetch assets:', err);
      }
    };
    fetchAssets();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-indigo-700">Omniston Swap</h1>
          <TonConnectButton />
        </div>

        <div className="h-px bg-gray-200 w-full my-4"></div>

        {assets.length > 0 ? (
          <div className="space-y-6">
            {/* From */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1">
                From
              </label>
              <select
                value={fromAsset?.contractAddress || ''}
                onChange={(e) => {
                  const selected = assets.find(a => a.contractAddress === e.target.value);
                  setFromAsset(selected);
                }}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              >
                {assets.map(asset => (
                  <option
                    key={asset.contractAddress}
                    value={asset.contractAddress}
                  >
                    {asset.meta?.symbol || asset.meta?.displayName || 'token'}
                  </option>
                ))}
              </select>
            </div>

            {/* To */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1">
                To
              </label>
              <select
                value={toAsset?.contractAddress || ''}
                onChange={(e) => {
                  const selected = assets.find(a => a.contractAddress === e.target.value);
                  setToAsset(selected);
                }}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              >
                {assets.map(asset => (
                  <option
                    key={asset.contractAddress}
                    value={asset.contractAddress}
                  >
                    {asset.meta?.symbol || asset.meta?.displayName || 'token'}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1">
                Amount
              </label>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center py-10">
            <div className="animate-pulse flex space-x-2">
              <div className="h-2 w-2 bg-indigo-500 rounded-full"></div>
              <div className="h-2 w-2 bg-indigo-500 rounded-full"></div>
              <div className="h-2 w-2 bg-indigo-500 rounded-full"></div>
            </div>
            <p className="ml-3 text-gray-600">Loading assets...</p>
          </div>
        )}
      </div>

      <div className="mt-6 text-center text-xs text-gray-500">
        Powered by Omniston
      </div>
    </div>
  );
}

export default App;