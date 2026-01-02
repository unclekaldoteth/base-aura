import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseAbi } from 'viem';
import { sdk } from '@farcaster/miniapp-sdk';

// NFT Images - Supabase Storage
const AURA_IMAGES = {
    fire: 'https://esolvhnpvfoavgycrwgy.supabase.co/storage/v1/object/public/base-aura/images/fire.png',
    water: 'https://esolvhnpvfoavgycrwgy.supabase.co/storage/v1/object/public/base-aura/images/water.png',
    tide: 'https://esolvhnpvfoavgycrwgy.supabase.co/storage/v1/object/public/base-aura/images/tide.png',
    rock: 'https://esolvhnpvfoavgycrwgy.supabase.co/storage/v1/object/public/base-aura/images/rock.png',
    collection: 'https://esolvhnpvfoavgycrwgy.supabase.co/storage/v1/object/public/base-aura/images/collection.png',
};

const AURA_CONFIG = {
    fire: { name: 'Fire Whale', emoji: '🔥', tagline: 'DeFi Power User', minTx: 500, tier: 4 },
    water: { name: 'Wave Rider', emoji: '💧', tagline: 'Active Explorer', minTx: 100, tier: 3 },
    tide: { name: 'Tide Watcher', emoji: '🌊', tagline: 'Getting Started', minTx: 10, tier: 2 },
    rock: { name: 'Rock Holder', emoji: '🪨', tagline: 'Diamond Hands HODLer', minTx: 1, tier: 1 },
};

// Contract address - V2 with target address tracking
const CONTRACT_ADDRESS = '0xF105DAeF021Ce4613e0A4599D001a6767A4018DF';
const CONTRACT_ABI = parseAbi([
    'function mint(address targetAddress, string auraType) public',
    'function updateAura(uint256 tokenId, string newAura) public',
    'function getTokenByTargetAddress(address targetAddress) public view returns (uint256)',
    'function hasMinted(address targetAddress) public view returns (bool)',
    'function getAura(uint256 tokenId) public view returns (string)',
]);

function App() {
    const { address, isConnected } = useAccount();
    const [targetAddress, setTargetAddress] = useState('');
    const [scanResult, setScanResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [existingNft, setExistingNft] = useState(null); // { tokenId, currentAura }

    // Write contract hooks - Mint
    const { data: mintHash, writeContract: writeMint, isPending: isMinting, reset: resetMint } = useWriteContract();
    const { isLoading: isMintConfirming, isSuccess: isMintConfirmed } = useWaitForTransactionReceipt({
        hash: mintHash,
    });

    // Write contract hooks - Update
    const { data: updateHash, writeContract: writeUpdate, isPending: isUpdating, reset: resetUpdate } = useWriteContract();
    const { isLoading: isUpdateConfirming, isSuccess: isUpdateConfirmed } = useWaitForTransactionReceipt({
        hash: updateHash,
    });

    // Mini App SDK - Signal that app is ready
    useEffect(() => {
        sdk.actions.ready();
    }, []);

    // Auto-fill connected address
    useEffect(() => {
        if (isConnected && address && !targetAddress) {
            setTargetAddress(address);
        }
    }, [isConnected, address, targetAddress]);

    // Calculate aura type from transaction count
    const getAuraType = (txCount) => {
        if (txCount >= 500) return 'fire';
        if (txCount >= 100) return 'water';
        if (txCount >= 10) return 'tide';
        if (txCount >= 1) return 'rock';
        return null;
    };

    // Fetch transaction count from Basescan API
    const fetchTxCount = async (addr) => {
        try {
            const response = await fetch(`/api/txcount?address=${addr}`);
            if (!response.ok) throw new Error('Failed to fetch transaction count');
            const data = await response.json();
            return data.txCount || 0;
        } catch (err) {
            console.error('Error fetching tx count:', err);
            try {
                const baseUrl = 'https://api-sepolia.basescan.org/api';
                const response = await fetch(
                    `${baseUrl}?module=account&action=txlist&address=${addr}&startblock=0&endblock=99999999&page=1&offset=1&sort=desc`
                );
                const data = await response.json();
                if (data.status === '1') {
                    const countResponse = await fetch(
                        `${baseUrl}?module=proxy&action=eth_getTransactionCount&address=${addr}&tag=latest`
                    );
                    const countData = await countResponse.json();
                    return parseInt(countData.result, 16) || 0;
                }
                return 0;
            } catch (fallbackErr) {
                console.error('Fallback also failed:', fallbackErr);
                return 0;
            }
        }
    };

    // Check if address already has NFT
    const checkExistingNft = async (addr) => {
        try {
            // We'll do this check manually after deploying V2
            // For now, return null (no existing NFT)
            return null;
        } catch (err) {
            console.error('Error checking existing NFT:', err);
            return null;
        }
    };

    // Scan address for aura
    const handleScan = async () => {
        if (!targetAddress) {
            setError('Please enter a Base address');
            return;
        }

        if (!/^0x[a-fA-F0-9]{40}$/.test(targetAddress)) {
            setError('Invalid Ethereum address format');
            return;
        }

        setIsLoading(true);
        setError('');
        setScanResult(null);
        setExistingNft(null);
        resetMint?.();
        resetUpdate?.();

        try {
            const txCount = await fetchTxCount(targetAddress);
            const auraType = getAuraType(txCount);

            if (!auraType) {
                setError('No transactions found for this address on Base Sepolia');
                setIsLoading(false);
                return;
            }

            const auraInfo = AURA_CONFIG[auraType];

            // Check if this address already has an NFT
            const existing = await checkExistingNft(targetAddress);
            setExistingNft(existing);

            setScanResult({
                address: targetAddress,
                txCount,
                auraType,
                auraName: auraInfo.name,
                auraEmoji: auraInfo.emoji,
                tagline: auraInfo.tagline,
                image: AURA_IMAGES[auraType],
                tier: auraInfo.tier,
            });
        } catch (err) {
            setError('Failed to scan address. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    // Mint new NFT
    const handleMint = () => {
        if (!scanResult || !isConnected) return;

        writeMint({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: 'mint',
            args: [scanResult.address, scanResult.auraType],
        });
    };

    // Upgrade existing NFT
    const handleUpgrade = () => {
        if (!scanResult || !isConnected || !existingNft) return;

        writeUpdate({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: 'updateAura',
            args: [existingNft.tokenId, scanResult.auraType],
        });
    };

    // Check if upgrade is available (new tier > current tier)
    const canUpgrade = existingNft && scanResult &&
        AURA_CONFIG[scanResult.auraType]?.tier > AURA_CONFIG[existingNft.currentAura]?.tier;

    return (
        <div className="container">
            <header className="header">
                <h1>⬡ BASE AURA</h1>
                <p className="subtitle">
                    Discover your on-chain identity based on your Base transaction history
                </p>
                <span className="network-badge">Base Sepolia Testnet</span>
            </header>

            {/* Aura Card Display */}
            <div className="aura-section">
                <div className="aura-card">
                    <img
                        src={scanResult?.image || AURA_IMAGES.collection}
                        alt={scanResult?.auraName || 'Base Aura Collection'}
                    />
                </div>
                <p className="aura-title">
                    {scanResult ? `${scanResult.auraEmoji} ${scanResult.auraName}` : 'Base Aura Collection'}
                </p>
            </div>

            {/* Wallet Connection */}
            <div className="wallet-section">
                <div className="wallet-info">
                    <span className="network-badge" style={{ marginTop: 0 }}>Base Sepolia</span>
                    <p className={`wallet-status ${isConnected ? 'connected' : ''}`}>
                        {isConnected ? `Connected: ${address?.slice(0, 6)}...${address?.slice(-4)}` : 'Not connected'}
                    </p>
                </div>
                <ConnectButton />
            </div>

            {/* Scan Section - Only show when connected */}
            {isConnected && (
                <div className="scan-section">
                    <input
                        type="text"
                        value={targetAddress}
                        onChange={(e) => setTargetAddress(e.target.value)}
                        placeholder="Enter Base address (0x...)"
                    />
                    <button
                        className="btn-scan"
                        onClick={handleScan}
                        disabled={isLoading}
                    >
                        {isLoading ? '🔍 Scanning...' : '⚡ SCAN MY AURA'}
                    </button>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <p style={{ color: '#ef4444', marginTop: '16px' }}>{error}</p>
            )}

            {/* Results */}
            {scanResult && (
                <div className="result-area">
                    <h2 className={`aura-result-title ${scanResult.auraType}`}>
                        {scanResult.auraEmoji} {scanResult.auraName.toUpperCase()}
                    </h2>

                    <img
                        src={scanResult.image}
                        alt={scanResult.auraName}
                        className="result-card-img"
                    />

                    <div className="stats">
                        <p><strong>Total Transactions:</strong> {scanResult.txCount}</p>
                        <p><strong>Trait:</strong> {scanResult.tagline}</p>
                        {existingNft && (
                            <p><strong>Current NFT:</strong> {AURA_CONFIG[existingNft.currentAura]?.name || existingNft.currentAura}</p>
                        )}
                    </div>

                    <div className="action-buttons">
                        {/* Show Mint button if no existing NFT */}
                        {!existingNft && (
                            <button
                                className="btn-mint"
                                onClick={handleMint}
                                disabled={isMinting || isMintConfirming}
                            >
                                {isMinting ? '⏳ Confirm in wallet...' :
                                    isMintConfirming ? '⏳ Minting...' :
                                        isMintConfirmed ? '✅ Minted!' : '🚀 MINT NFT'}
                            </button>
                        )}

                        {/* Show Upgrade button if existing NFT and can upgrade */}
                        {existingNft && canUpgrade && (
                            <button
                                className="btn-upgrade"
                                onClick={handleUpgrade}
                                disabled={isUpdating || isUpdateConfirming}
                            >
                                {isUpdating ? '⏳ Confirm in wallet...' :
                                    isUpdateConfirming ? '⏳ Upgrading...' :
                                        isUpdateConfirmed ? '✅ Upgraded!' : '⬆️ UPGRADE AURA'}
                            </button>
                        )}

                        {/* Show message if already at max tier or same tier */}
                        {existingNft && !canUpgrade && (
                            <p style={{ color: '#fbbf24', marginTop: '8px' }}>
                                {existingNft.currentAura === scanResult.auraType
                                    ? '✨ Your NFT is already at this tier!'
                                    : '🏆 Your NFT is already at a higher tier!'}
                            </p>
                        )}
                    </div>

                    {/* Transaction links */}
                    {(mintHash || updateHash) && (
                        <p className="tx-status">
                            View on{' '}
                            <a
                                href={`https://sepolia.basescan.org/tx/${mintHash || updateHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Basescan
                            </a>
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

export default App;
