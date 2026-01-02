// Vercel Serverless Function for Basescan API
// This avoids CORS issues when calling Basescan from the frontend

export default async function handler(req, res) {
    const { address } = req.query;

    if (!address) {
        return res.status(400).json({ error: 'Address is required' });
    }

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return res.status(400).json({ error: 'Invalid address format' });
    }

    try {
        // Get the API key from environment variable
        const apiKey = process.env.BASESCAN_API_KEY || '';
        const baseUrl = 'https://api-sepolia.basescan.org/api';

        // Method 1: Get transaction count (nonce) - this is the total outgoing tx count
        const nonceResponse = await fetch(
            `${baseUrl}?module=proxy&action=eth_getTransactionCount&address=${address}&tag=latest${apiKey ? `&apikey=${apiKey}` : ''}`
        );
        const nonceData = await nonceResponse.json();
        const nonceTxCount = parseInt(nonceData.result, 16) || 0;

        // Method 2: Get transaction list to count all transactions (including incoming)
        const txListResponse = await fetch(
            `${baseUrl}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10000&sort=asc${apiKey ? `&apikey=${apiKey}` : ''}`
        );
        const txListData = await txListResponse.json();

        let totalTxCount = nonceTxCount;
        if (txListData.status === '1' && Array.isArray(txListData.result)) {
            totalTxCount = txListData.result.length;
        }

        // Also get internal transactions count
        const internalTxResponse = await fetch(
            `${baseUrl}?module=account&action=txlistinternal&address=${address}&startblock=0&endblock=99999999&page=1&offset=10000&sort=asc${apiKey ? `&apikey=${apiKey}` : ''}`
        );
        const internalTxData = await internalTxResponse.json();

        let internalTxCount = 0;
        if (internalTxData.status === '1' && Array.isArray(internalTxData.result)) {
            internalTxCount = internalTxData.result.length;
        }

        // Combine regular + internal transactions for a complete picture
        const combinedCount = totalTxCount + internalTxCount;

        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
        return res.status(200).json({
            address,
            txCount: combinedCount,
            regularTxCount: totalTxCount,
            internalTxCount: internalTxCount,
            nonce: nonceTxCount,
        });
    } catch (error) {
        console.error('Basescan API error:', error);
        return res.status(500).json({ error: 'Failed to fetch transaction count' });
    }
}
