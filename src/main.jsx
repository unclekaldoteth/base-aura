import '@coinbase/onchainkit/styles.css';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { baseAccount, metaMaskWallet, rainbowWallet, safeWallet, walletConnectWallet } from '@rainbow-me/rainbowkit/wallets';
import { WagmiProvider } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const wallets = [
    {
        groupName: 'Base Account',
        wallets: [baseAccount],
    },
    {
        groupName: 'Popular',
        wallets: [rainbowWallet, metaMaskWallet, walletConnectWallet, safeWallet],
    },
];

const config = getDefaultConfig({
    appName: 'Base Aura',
    projectId: 'base-aura-demo', // Replace with WalletConnect project ID for production
    chains: [baseSepolia],
    wallets,
    ssr: false,
});

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <OnchainKitProvider chain={baseSepolia} apiKey={import.meta.env.VITE_CDP_API_KEY}>
                    <App />
                </OnchainKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    </React.StrictMode>
);
