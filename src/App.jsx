import { useEffect, useState } from "react";
import { StonApiClient, AssetTag } from "@ston-fi/api";
import { TonConnectButton, useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";
import {
  useRfq,
  SettlementMethod,
  Blockchain,
  useOmniston,
  useTrackTrade,
} from "@ston-fi/omniston-sdk-react";
import { TonClient, Address, Cell, beginCell, storeMessage } from "@ton/ton";

function App() {
  const [assets, setAssets] = useState([]);
  const [fromAsset, setFromAsset] = useState(null);
  const [toAsset, setToAsset] = useState(null);
  const [amount, setAmount] = useState("");
  const [outgoingTxHash, setOutgoingTxHash] = useState("");
  const walletAddress = useTonAddress();
  const [tonConnect] = useTonConnectUI();
  const [tradedQuote, setTradedQuote] = useState(null);

  const omniston = useOmniston();

  // Reset outgoingTxHash when inputs change
  useEffect(() => {
    setTradedQuote("");
    setOutgoingTxHash("");
  }, [fromAsset, toAsset, amount]);

  // fetch assets on mount
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const client = new StonApiClient();
        // Filter out top liquidity tokens for brevity
        const condition = [
          AssetTag.LiquidityVeryHigh,
          AssetTag.LiquidityHigh,
          AssetTag.LiquidityMedium,
        ].join(" | ");
        const assetList = await client.queryAssets({ condition });

        setAssets(assetList);
        if (assetList.length > 0) {
          setFromAsset(assetList[0]);
        }
        if (assetList.length > 1) {
          setToAsset(assetList[1]);
        }
      } catch (err) {
        console.error("Failed to fetch assets:", err);
      }
    };
    fetchAssets();
  }, []);

  // Helper to get decimals from asset with default fallback
  const getDecimals = (asset) => asset?.meta?.decimals ?? 9;

  // Helper to calculate conversion factor based on decimals
  const getConversionFactor = (asset) => 10 ** getDecimals(asset);

  function toBaseUnits(asset, amt) {
    if (!asset || !amt) return "0";
    return Math.floor(parseFloat(amt) * getConversionFactor(asset)).toString();
  }

  function fromBaseUnits(asset, baseUnits) {
    if (!asset || !baseUnits) return "0";
    return (parseInt(baseUnits) / getConversionFactor(asset)).toFixed(2);
  }

  const {
    data: quote,
    isLoading: quoteLoading,
    error: quoteError,
  } = useRfq(
    {
      settlementMethods: [SettlementMethod.SETTLEMENT_METHOD_SWAP],
      offerAssetAddress: fromAsset
        ? { blockchain: Blockchain.TON, address: fromAsset.contractAddress }
        : undefined,
      askAssetAddress: toAsset
        ? { blockchain: Blockchain.TON, address: toAsset.contractAddress }
        : undefined,
      amount: {
        offerUnits: fromAsset ? toBaseUnits(fromAsset, amount) : "0",
      },
      settlementParams: {
        // example: allow up to 5% slippage, max 4 outgoing messages
        max_price_slippage_bps: 500,
        max_outgoing_messages: 4,
      },
    },
    {
      enabled:
        !!fromAsset?.contractAddress &&
        !!toAsset?.contractAddress &&
        amount !== "" &&
        !outgoingTxHash,
    }
  );

  const {
    isLoading: trackingLoading,
    error: trackingError,
    data: tradeStatus,
  } = useTrackTrade({
    quoteId: tradedQuote?.quote?.quoteId,
    traderWalletAddress: {
      blockchain: Blockchain.TON,
      address: walletAddress,
    },
    outgoingTxHash,
  }, {
    enabled: !!tradedQuote?.quote?.quoteId && !!walletAddress && !!outgoingTxHash,
  });

  // Function to translate trade result to human-readable text
  const getTradeResultText = (status) => {
    if (!status?.tradeSettled) return "";
    
    const result = status.tradeSettled.result;
    switch (result) {
      case "TRADE_RESULT_FULLY_FILLED":
        return "Trade completed successfully and fully filled";
      case "TRADE_RESULT_PARTIALLY_FILLED":
        return "Trade partially filled - something went wrong";
      case "TRADE_RESULT_ABORTED":
        return "Trade was aborted";
      case "TRADE_RESULT_UNKNOWN":
      case "UNRECOGNIZED":
      default:
        return "Unknown trade result";
    }
  };

  async function buildTx(willTradedQuote) {
    if (!willTradedQuote || !walletAddress) {
      alert("Please connect your wallet and ensure a valid quote is loaded.");
      return null;
    }

    try {
      const tx = await omniston.buildTransfer({
        quote: willTradedQuote.quote,
        sourceAddress: {
          blockchain: Blockchain.TON,
          address: walletAddress, // the wallet sending the offer token
        },
        destinationAddress: {
          blockchain: Blockchain.TON,
          address: walletAddress, // the same wallet receiving the ask token
        },
      });

      return tx.ton?.messages || [];
    } catch (err) {
      console.error("Error building transaction:", err);
      alert("Failed to build transaction. Check console for details.");
      return null;
    }
  }

  // Utility function to retry an async operation
const retry = async (fn, { retries = 5, delay = 1000 }) => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return retry(fn, { retries: retries - 1, delay });
  }
};

const getTxByBOC = async (exBoc, walletAddress) => {
  if (!exBoc || !walletAddress) {
    throw new Error('Missing required parameters for transaction tracking');
  }

  const client = new TonClient({
    endpoint: 'https://toncenter.com/api/v2/jsonRPC'
  });

  const myAddress = Address.parse(walletAddress);

  return retry(async () => {
    const transactions = await client.getTransactions(myAddress, {
      limit: 5,
    });

    for (const tx of transactions) {
      const inMsg = tx.inMessage;
      if (inMsg?.info.type === 'external-in') {
        const inBOC = inMsg?.body;
        if (typeof inBOC === 'undefined') {
          continue;
        }

        const extHash = Cell.fromBase64(exBoc).hash().toString('hex');
        const inHash = beginCell().store(storeMessage(inMsg)).endCell().hash().toString('hex');

        if (extHash === inHash) {
          return tx.hash().toString('hex');
        }
      }
    }
    throw new Error('Transaction not found');
  }, { retries: 30, delay: 1000 });
}; 

  async function handleSwap() {
    const willTradedQuote = quote;
    const messages = await buildTx(willTradedQuote);
    if (!messages) return;
    
    try {
      // Store the quote at the time of trade
      setTradedQuote(willTradedQuote);
      
      const res = await tonConnect.sendTransaction({
        validUntil: Date.now() + 1000000,
        messages: messages.map((message) => ({
          address: message.targetAddress,
          amount: message.sendAmount,
          payload: message.payload,
        })),
      });

      const exBoc = res.boc;
      const txHash = await getTxByBOC(exBoc, walletAddress);
      setOutgoingTxHash(txHash);
    } catch (err) {
      console.error("Error sending transaction:", err);
      alert("Failed to send transaction. Check console for details.");
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-indigo-700">Omniston Swap</h1>
          <TonConnectButton />
        </div>

        <div className="h-px bg-gray-200 w-full my-4"></div>

        {/* Trade status */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          {trackingLoading && <p className="text-sm text-blue-600">Tracking trade...</p>}
          {trackingError && (
            <p className="text-sm text-orange-600">Trade tracking error: {String(trackingError)}</p>
          )}
          {tradeStatus?.status?.tradeSettled && (
            <p className="text-sm text-green-600">
              Trade Result: {getTradeResultText(tradeStatus.status)}
            </p>
          )}
        </div>

        {assets.length > 0 ? (
          <div className="space-y-6">
            {/* From */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1">
                From
              </label>
              <select
                value={fromAsset?.contractAddress || ""}
                onChange={(e) => {
                  const selected = assets.find(
                    (a) => a.contractAddress === e.target.value
                  );
                  setFromAsset(selected);
                }}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              >
                {assets.map((asset) => (
                  <option
                    key={asset.contractAddress}
                    value={asset.contractAddress}
                  >
                    {asset.meta?.symbol || asset.meta?.displayName || "token"}
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
                value={toAsset?.contractAddress || ""}
                onChange={(e) => {
                  const selected = assets.find(
                    (a) => a.contractAddress === e.target.value
                  );
                  setToAsset(selected);
                }}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              >
                {assets.map((asset) => (
                  <option
                    key={asset.contractAddress}
                    value={asset.contractAddress}
                  >
                    {asset.meta?.symbol || asset.meta?.displayName || "token"}
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

        {/* Quote section */}
        <div className="pt-4">
          {quoteLoading && <p>Loading quote...</p>}
          {quoteError && (
            <p className="text-red-500">Error: {String(quoteError)}</p>
          )}
          {quote && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="font-semibold text-gray-700">Quote Info</p>
              <p className="text-sm text-gray-600">
                Resolver: {quote.quote.resolverName}
              </p>
              <p className="text-sm text-gray-600">
                Offer Units: {fromBaseUnits(fromAsset, quote.quote.offerUnits)} {fromAsset.meta?.symbol}
              </p>
              <p className="text-sm text-gray-600">
                Ask Units: {fromBaseUnits(toAsset, quote.quote.askUnits)} {toAsset.meta?.symbol}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={handleSwap}
          className="mt-4 w-full bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-3 px-4 rounded-lg transition-all"
        >
          Build Transaction
        </button>
      </div>

      <div className="mt-6 text-center text-xs text-gray-500">
        Powered by Ston.fi
      </div>
    </div>
  );
}

export default App;
