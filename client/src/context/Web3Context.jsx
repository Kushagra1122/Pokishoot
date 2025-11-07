import React, { createContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

// Moonbeam Network configuration
const MOONBEAM_NETWORK = {
  chainId: '0x504', // Moonbeam Mainnet: 1284
  chainName: 'Moonbeam',
  nativeCurrency: {
    name: 'GLMR',
    symbol: 'GLMR',
    decimals: 18,
  },
  rpcUrls: ['https://rpc.api.moonbeam.network'],
  blockExplorerUrls: ['https://moonbeam.moonscan.io/'],
};

const MOONBASE_ALPHA_TESTNET = {
  chainId: '0x507', // 1287 in decimal
  chainName: 'Moonbase Alpha',
  nativeCurrency: {
    name: 'DEV',
    symbol: 'DEV',
    decimals: 18,
  },
  rpcUrls: ['https://rpc.api.moonbase.moonbeam.network'],
  blockExplorerUrls: ['https://moonbase.moonscan.io/'],
};

const Web3Context = createContext();

export function Web3Provider({ children }) {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState(null);
  const [walletType, setWalletType] = useState(null); // 'evm' or 'substrate'
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [network, setNetwork] = useState(null);
  const [balance, setBalance] = useState(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && window.ethereum !== undefined;
  };

  // Check if Polkadot.js extension is installed
  const isPolkadotExtensionInstalled = async () => {
    if (typeof window === 'undefined') return false;
    const { web3Accounts } = await import('@polkadot/extension-dapp');
    try {
      const accounts = await web3Accounts();
      return accounts.length > 0;
    } catch {
      return false;
    }
  };

  // Fetch balance for EVM wallet
  const fetchBalance = useCallback(async (providerInstance, walletAddress) => {
    if (!providerInstance || !walletAddress) {
      return;
    }

    setIsLoadingBalance(true);
    try {
      const balance = await providerInstance.getBalance(walletAddress);
      // Convert from Wei to Ether/SBY and format
      const formattedBalance = ethers.formatEther(balance);
      setBalance(formattedBalance);
    } catch (err) {
      console.error('Failed to fetch balance:', err);
      setBalance(null);
    } finally {
      setIsLoadingBalance(false);
    }
  }, []);

  // Refresh balance
  const refreshBalance = useCallback(async () => {
    if (provider && address && walletType === 'evm') {
      await fetchBalance(provider, address);
    }
  }, [provider, address, walletType, fetchBalance]);

  // Connect to MetaMask (EVM)
  const connectMetaMask = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      if (!isMetaMaskInstalled()) {
        throw new Error('MetaMask is not installed. Please install MetaMask extension.');
      }

      // Switch or add Moonbase Alpha Testnet to MetaMask
      try {
        // Try to switch to the network
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: MOONBASE_ALPHA_TESTNET.chainId }], // Using testnet for development
        });
      } catch (switchError) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          try {
            // Add the network
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [MOONBASE_ALPHA_TESTNET],
            });
          } catch (addError) {
            throw new Error(`Failed to add Moonbase Alpha network: ${addError.message}`);
          }
        } else {
          throw switchError;
        }
      }

      // Request account access
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask.');
      }

      const address = accounts[0];
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();

      setProvider(provider);
      setSigner(signer);
      setAddress(address);
      setWalletType('evm');
      setIsConnected(true);
      setNetwork({
        chainId: network.chainId.toString(),
        name: network.name,
      });

      // Save to localStorage
      localStorage.setItem('walletAddress', address);
      localStorage.setItem('walletType', 'evm');

      // Fetch balance
      await fetchBalance(provider, address);

      return { address, walletType: 'evm' };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, [fetchBalance]);

  // Connect to Polkadot.js extension (Substrate)
  const connectPolkadot = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      if (typeof window === 'undefined') {
        throw new Error('Window is not available');
      }

      const { web3Accounts, web3Enable } = await import('@polkadot/extension-dapp');
      
      // Enable extension
      const extensions = await web3Enable('PokeWars');
      
      if (extensions.length === 0) {
        throw new Error('No Polkadot extension found. Please install Polkadot.js extension.');
      }

      // Get accounts
      const accounts = await web3Accounts();

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please create an account in Polkadot.js extension.');
      }

      // Use first account (can be extended to let user choose)
      const account = accounts[0];
      const address = account.address;

      setAddress(address);
      setWalletType('substrate');
      setIsConnected(true);
      setNetwork({
        chainId: 'moonbeam',
        name: 'Moonbeam Network',
      });

      // Save to localStorage
      localStorage.setItem('walletAddress', address);
      localStorage.setItem('walletType', 'substrate');

      // Note: Substrate balance fetching would require Polkadot API connection
      // For now, we'll leave balance as null for Substrate wallets

      return { address, walletType: 'substrate' };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setAddress(null);
    setWalletType(null);
    setIsConnected(false);
    setProvider(null);
    setSigner(null);
    setNetwork(null);
    setBalance(null);
    setError(null);
    
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('walletType');
  }, []);

  // Link wallet to user account on backend
  const linkWalletToAccount = useCallback(async (token) => {
    if (!address || !walletType) {
      throw new Error('Wallet not connected');
    }

    try {
      const response = await fetch(`${API_BASE}/api/auth/link-wallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          walletAddress: address,
          walletType: walletType,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to link wallet');
      }

      return await response.json();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [address, walletType]);

  // Restore wallet connection from localStorage on mount
  useEffect(() => {
    const savedAddress = localStorage.getItem('walletAddress');
    const savedWalletType = localStorage.getItem('walletType');

    if (savedAddress && savedWalletType) {
      if (savedWalletType === 'evm' && isMetaMaskInstalled()) {
        // Reconnect to MetaMask
        connectMetaMask().catch(() => {
          // If reconnection fails, clear saved data
          disconnect();
        });
      } else if (savedWalletType === 'substrate') {
        // For Substrate, we just set the address (extension handles connection)
        setAddress(savedAddress);
        setWalletType('substrate');
        setIsConnected(true);
      }
    }
  }, [connectMetaMask, disconnect]);

  // Refresh balance when address or provider changes
  useEffect(() => {
    if (provider && address && walletType === 'evm') {
      fetchBalance(provider, address);
    }
  }, [provider, address, walletType, fetchBalance]);

  // Listen for MetaMask account changes
  useEffect(() => {
    if (walletType === 'evm' && window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          disconnect();
        } else if (accounts[0] !== address) {
          setAddress(accounts[0]);
          localStorage.setItem('walletAddress', accounts[0]);
        }
      };

      const handleChainChanged = () => {
        // Reload to handle chain change
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum?.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [walletType, address, disconnect]);

  return (
    <Web3Context.Provider
      value={{
        isConnected,
        address,
        walletType,
        provider,
        signer,
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
        isMetaMaskInstalled: isMetaMaskInstalled(),
        isPolkadotExtensionInstalled: isPolkadotExtensionInstalled(),
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export default Web3Context;

