import React, { useContext, useState } from 'react';
import Web3Context from '../context/Web3Context';
import AuthContext from '../context/AuthContext';
import { Wallet, X, Check, AlertCircle, Loader2, RefreshCw, ExternalLink, Coins, Copy, CheckCircle2 } from 'lucide-react';

const WalletConnect = ({ onWalletLinked }) => {
  const {
    isConnected,
    address,
    walletType,
    isConnecting,
    error,
    network,
    balance,
    isLoadingBalance,
    connectMetaMask,
    connectPolkadot,
    disconnect,
    linkWalletToAccount,
    refreshBalance,
    isMetaMaskInstalled,
  } = useContext(Web3Context);

  const { user, token } = useContext(AuthContext);
  const [isLinking, setIsLinking] = useState(false);
  const [linkError, setLinkError] = useState(null);
  const [linkSuccess, setLinkSuccess] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);

  const handleConnectMetaMask = async () => {
    try {
      setLinkError(null);
      await connectMetaMask();
      // Auto-link if user is logged in
      if (user && token) {
        await handleLinkWallet();
      }
    } catch (err) {
      console.error('Failed to connect MetaMask:', err);
    }
  };

  const handleConnectPolkadot = async () => {
    try {
      setLinkError(null);
      await connectPolkadot();
      // Auto-link if user is logged in
      if (user && token) {
        await handleLinkWallet();
      }
    } catch (err) {
      console.error('Failed to connect Polkadot:', err);
    }
  };

  const handleLinkWallet = async () => {
    if (!isConnected || !address || !token) {
      setLinkError('Please connect a wallet and ensure you are logged in');
      return;
    }

    setIsLinking(true);
    setLinkError(null);
    setLinkSuccess(false);

    try {
      await linkWalletToAccount(token);
      setLinkSuccess(true);
      if (onWalletLinked) {
        onWalletLinked();
      }
      // Clear success message after 3 seconds
      setTimeout(() => setLinkSuccess(false), 3000);
    } catch (err) {
      setLinkError(err.message);
    } finally {
      setIsLinking(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setLinkSuccess(false);
    setLinkError(null);
  };

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyAddressToClipboard = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setAddressCopied(true);
      setTimeout(() => setAddressCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  return (
    <div className="bg-gray-900 border-2 border-yellow-400 p-4 rounded-lg" style={{ fontFamily: 'monospace' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-yellow-400" />
          <h3 className="text-lg font-bold text-yellow-400">WALLET CONNECTION</h3>
        </div>
        {isConnected && (
          <button
            onClick={handleDisconnect}
            className="text-red-400 hover:text-red-300 transition-colors"
            title="Disconnect"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {error && (
        <div className="mb-3 p-2 bg-red-900/50 border border-red-500 rounded flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span className="text-red-400 text-sm">{error}</span>
        </div>
      )}

      {linkError && (
        <div className="mb-3 p-2 bg-red-900/50 border border-red-500 rounded flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span className="text-red-400 text-sm">{linkError}</span>
        </div>
      )}

      {linkSuccess && (
        <div className="mb-3 p-2 bg-green-900/50 border border-green-500 rounded flex items-center gap-2">
          <Check className="w-4 h-4 text-green-400" />
          <span className="text-green-400 text-sm">Wallet linked successfully!</span>
        </div>
      )}

      {!isConnected ? (
        <div className="space-y-2">
          <p className="text-gray-400 text-sm mb-3">
            Connect your wallet to enable Web3 features:
          </p>
          
          {/* MetaMask Button - PRIMARY */}
          <div>
            <button
              onClick={handleConnectMetaMask}
              disabled={isConnecting || !isMetaMaskInstalled}
              className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold rounded transition-all flex items-center justify-center gap-2"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>CONNECTING...</span>
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4" />
                  <span>CONNECT METAMASK</span>
                </>
              )}
            </button>
            <p className="text-xs text-yellow-400 text-center mt-1 font-bold">
              ✓ REQUIRED for NFTs & Smart Contracts
            </p>
            {!isMetaMaskInstalled && (
              <p className="text-xs text-orange-400 text-center mt-1">
                Install MetaMask extension to connect
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-gray-900 text-gray-500">OR (Optional)</span>
            </div>
          </div>

          {/* Polkadot.js Button - OPTIONAL */}
          <div>
            <button
              onClick={handleConnectPolkadot}
              disabled={isConnecting}
              className="w-full py-3 px-4 bg-pink-600 hover:bg-pink-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold rounded transition-all flex items-center justify-center gap-2 opacity-75"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>CONNECTING...</span>
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4" />
                  <span>CONNECT POLKADOT.JS</span>
                </>
              )}
            </button>
            <p className="text-xs text-gray-500 text-center mt-1">
              Optional: For future Substrate features
            </p>
          </div>

          <p className="text-xs text-gray-500 text-center mt-3 p-2 bg-gray-800 rounded">
            <span className="text-yellow-400 font-bold">Note:</span> MetaMask is required for Pokemon NFTs, match staking, and marketplace features.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Connected Wallet Info */}
          <div className="bg-gray-800 p-3 rounded border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-xs">WALLET TYPE:</span>
              <span className="text-yellow-400 font-bold text-xs">
                {walletType?.toUpperCase() || 'UNKNOWN'}
              </span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-xs">ADDRESS:</span>
              <button
                onClick={copyAddressToClipboard}
                className="flex items-center gap-1 text-white font-mono text-xs hover:text-yellow-400 transition-colors"
                title="Copy full address"
              >
                <span>{formatAddress(address)}</span>
                {addressCopied ? (
                  <CheckCircle2 className="w-3 h-3 text-green-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
            {network && (
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-xs">NETWORK:</span>
                <span className="text-green-400 font-bold text-xs">
                  {network.name?.toUpperCase() || 'UNKNOWN'}
                </span>
              </div>
            )}
            {/* Balance Display (for EVM wallets) */}
            {walletType === 'evm' && (
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-700">
                <span className="text-gray-400 text-xs flex items-center gap-1">
                  <Coins className="w-3 h-3" />
                  BALANCE:
                </span>
                <div className="flex items-center gap-2">
                  {isLoadingBalance ? (
                    <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                  ) : (
                    <span className="text-yellow-400 font-bold text-xs">
                      {balance !== null ? `${parseFloat(balance).toFixed(4)} ${network?.name?.toLowerCase().includes('moonbase') ? 'DEV' : 'GLMR'}` : '--'}
                    </span>
                  )}
                  <button
                    onClick={refreshBalance}
                    className="p-1 hover:bg-gray-700 rounded transition-colors"
                    title="Refresh balance"
                  >
                    <RefreshCw className="w-3 h-3 text-gray-400 hover:text-yellow-400" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Testnet Faucet Section */}
          {network?.name?.toLowerCase().includes('testnet') || network?.name?.toLowerCase().includes('moonbase') ? (
            <div className="bg-blue-900/30 border-2 border-blue-500 p-3 rounded">
              <div className="flex items-center gap-2 mb-2">
                <Coins className="w-4 h-4 text-blue-400" />
                <span className="text-blue-400 font-bold text-sm">NEED TESTNET TOKENS?</span>
              </div>
              <p className="text-xs text-gray-300 mb-2">
                Get free DEV tokens from the Moonbase Alpha Testnet faucet to pay for gas fees
              </p>
              
              {/* Copy Address Helper */}
              <div className="mb-2 p-2 bg-gray-800 rounded border border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Your address:</span>
                  <button
                    onClick={copyAddressToClipboard}
                    className="flex items-center gap-1 text-xs text-yellow-400 hover:text-yellow-300 transition-colors"
                  >
                    {addressCopied ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 font-mono mt-1 break-all">{formatAddress(address)}</p>
              </div>

              <a
                href="https://faucet.moonbeam.network/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded transition-all flex items-center justify-center gap-2 text-xs mb-2"
              >
                <span>GET DEV FROM FAUCET</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              
              <div className="text-xs text-gray-400 space-y-1">
                <p className="text-center font-bold">Steps:</p>
                <ol className="list-decimal list-inside space-y-0.5 text-left pl-2">
                  <li>Click button above to open faucet</li>
                  <li>Paste your wallet address (click Copy above)</li>
                  <li>Complete verification if needed</li>
                  <li>Receive DEV tokens in a few minutes</li>
                </ol>
              </div>
            </div>
          ) : null}

          {/* Link Wallet Button (if user is logged in but wallet not linked) */}
          {user && token && !isLinking && !linkSuccess && (
            <button
              onClick={handleLinkWallet}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>LINK TO ACCOUNT</span>
            </button>
          )}

          {isLinking && (
            <div className="w-full py-2 px-4 bg-blue-600 text-white font-bold rounded flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>LINKING...</span>
            </div>
          )}

          {/* Already Linked Indicator */}
          {user?.walletAddress === address && (
            <div className="p-2 bg-green-900/50 border border-green-500 rounded flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-xs">Wallet linked to your account</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WalletConnect;

