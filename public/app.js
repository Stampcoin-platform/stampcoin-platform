// Stampcoin Platform - Frontend API Integration
// Production-ready interactive dashboard with comprehensive features

const API_BASE = '/';

// Display results with proper formatting
function showResult(containerId, data, isError = false) {
    const container = document.getElementById(containerId);
    if (!data) return;

    container.classList.add('show');
    
    let html = '';
    if (isError) {
        html = `<div class="alert alert-danger">
            <strong><i class="fas fa-exclamation-circle"></i> Error:</strong> ${data.message || data.error || JSON.stringify(data)}
        </div>`;
    } else {
        html = `<div class="alert alert-success">
            <strong><i class="fas fa-check-circle"></i> Success!</strong>
        </div>`;
        html += `<pre style="background: #f8f9fa; padding: 1rem; border-radius: 8px; overflow-x: auto; border-left: 4px solid #06d6a0;">`;
        html += JSON.stringify(data, null, 2);
        html += `</pre>`;
    }
    
    container.innerHTML = html;
}

// ===== WALLET ENDPOINTS =====

// Create Wallet
document.getElementById('createWalletForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const userId = document.getElementById('userId').value;
    const userName = document.getElementById('userName').value;
    
    try {
        const response = await fetch(`${API_BASE}api/wallet/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, userName })
        });
        
        const data = await response.json();
        showResult('createWalletResult', data, !response.ok);
        
        if (response.ok) {
            document.getElementById('createWalletForm').reset();
        }
    } catch (error) {
        showResult('createWalletResult', { error: error.message }, true);
    }
});

// View Wallet
document.getElementById('viewWalletForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const userId = document.getElementById('viewUserId').value;
    
    try {
        const response = await fetch(`${API_BASE}api/wallet/${userId}`);
        const data = await response.json();
        showResult('viewWalletResult', data, !response.ok);
    } catch (error) {
        showResult('viewWalletResult', { error: error.message }, true);
    }
});

// Transfer Funds
document.getElementById('transferForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fromUserId = document.getElementById('fromUserId').value;
    const toUserId = document.getElementById('toUserId').value;
    const amount = parseInt(document.getElementById('transferAmount').value);
    
    try {
        const response = await fetch(`${API_BASE}api/wallet/transfer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fromUserId, toUserId, amount })
        });
        
        const data = await response.json();
        showResult('transferResult', data, !response.ok);
        
        if (response.ok) {
            document.getElementById('transferForm').reset();
        }
    } catch (error) {
        showResult('transferResult', { error: error.message }, true);
    }
});

// View Transactions
document.getElementById('transactionsForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const userId = document.getElementById('txUserId').value;
    
    try {
        const response = await fetch(`${API_BASE}api/wallet/${userId}/transactions`);
        const data = await response.json();
        
        const container = document.getElementById('transactionsResult');
        container.classList.add('show');
        
        if (Array.isArray(data) && data.length > 0) {
            let html = `<div class="alert alert-success">Found ${data.length} transaction(s)</div>`;
            html += '<table class="table"><thead><tr><th>From</th><th>To</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead><tbody>';
            
            data.forEach(tx => {
                const date = new Date(tx.timestamp).toLocaleDateString();
                html += `<tr>
                    <td><strong>${tx.from}</strong></td>
                    <td><strong>${tx.to}</strong></td>
                    <td>${tx.amount}</td>
                    <td><span class="badge badge-success">${tx.status}</span></td>
                    <td>${date}</td>
                </tr>`;
            });
            
            html += '</tbody></table>';
            container.innerHTML = html;
        } else {
            container.innerHTML = '<div class="alert alert-info">No transactions found</div>';
        }
    } catch (error) {
        showResult('transactionsResult', { error: error.message }, true);
    }
});

// ===== MARKETPLACE ENDPOINTS =====

// List Item
document.getElementById('listItemForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const sellerId = document.getElementById('sellerId').value;
    const name = document.getElementById('itemName').value;
    const price = parseInt(document.getElementById('itemPrice').value);
    const type = document.getElementById('itemType').value;
    const description = document.getElementById('itemDesc').value;
    
    try {
        const response = await fetch(`${API_BASE}api/market/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sellerId, name, price, type, description })
        });
        
        const data = await response.json();
        showResult('listItemResult', data, !response.ok);
        
        if (response.ok) {
            document.getElementById('listItemForm').reset();
        }
    } catch (error) {
        showResult('listItemResult', { error: error.message }, true);
    }
});

// View Items
document.getElementById('viewItemsBtn')?.addEventListener('click', async () => {
    try {
        const response = await fetch(`${API_BASE}api/market/items`);
        const data = await response.json();
        
        const container = document.getElementById('viewItemsResult');
        container.classList.add('show');
        
        if (Array.isArray(data) && data.length > 0) {
            let html = `<div class="alert alert-success">Found ${data.length} item(s) in marketplace</div>`;
            html += '<table class="table"><thead><tr><th>Name</th><th>Price</th><th>Type</th><th>Status</th><th>Seller</th></tr></thead><tbody>';
            
            data.forEach(item => {
                html += `<tr>
                    <td><strong>${item.name}</strong></td>
                    <td>${item.price}</td>
                    <td><span class="badge badge-info">${item.type}</span></td>
                    <td><span class="badge badge-success">${item.status}</span></td>
                    <td>${item.sellerId}</td>
                </tr>`;
            });
            
            html += '</tbody></table>';
            container.innerHTML = html;
        } else {
            container.innerHTML = '<div class="alert alert-info">No items in marketplace</div>';
        }
    } catch (error) {
        showResult('viewItemsResult', { error: error.message }, true);
    }
});

// Buy Item
document.getElementById('buyItemForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const itemId = document.getElementById('buyItemId').value;
    const buyerId = document.getElementById('buyerId').value;
    
    try {
        const response = await fetch(`${API_BASE}api/market/items/${itemId}/buy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ buyerId })
        });
        
        const data = await response.json();
        showResult('buyItemResult', data, !response.ok);
        
        if (response.ok) {
            document.getElementById('buyItemForm').reset();
        }
    } catch (error) {
        showResult('buyItemResult', { error: error.message }, true);
    }
});

// Market Transactions
document.getElementById('marketTxBtn')?.addEventListener('click', async () => {
    try {
        const response = await fetch(`${API_BASE}api/market/transactions`);
        const data = await response.json();
        
        const container = document.getElementById('marketTxResult');
        container.classList.add('show');
        
        if (Array.isArray(data) && data.length > 0) {
            let html = `<div class="alert alert-success">Found ${data.length} transaction(s)</div>`;
            html += '<table class="table"><thead><tr><th>Buyer</th><th>Seller</th><th>Price</th><th>Date</th></tr></thead><tbody>';
            
            data.forEach(tx => {
                const date = new Date(tx.timestamp).toLocaleDateString();
                html += `<tr>
                    <td><strong>${tx.buyerId}</strong></td>
                    <td><strong>${tx.sellerId}</strong></td>
                    <td>${tx.price}</td>
                    <td>${date}</td>
                </tr>`;
            });
            
            html += '</tbody></table>';
            container.innerHTML = html;
        } else {
            container.innerHTML = '<div class="alert alert-info">No marketplace transactions yet</div>';
        }
    } catch (error) {
        showResult('marketTxResult', { error: error.message }, true);
    }
});

// ===== BLOCKCHAIN ENDPOINTS =====

// Get Token Info
document.getElementById('getTokenBtn')?.addEventListener('click', async () => {
    try {
        const response = await fetch(`${API_BASE}api/token`);
        const data = await response.json();
        showResult('tokenResult', data, !response.ok);
    } catch (error) {
        showResult('tokenResult', { error: error.message }, true);
    }
});

// Get Blockchain Info
document.getElementById('getBlockchainBtn')?.addEventListener('click', async () => {
    try {
        const response = await fetch(`${API_BASE}api/blockchain/info`);
        const data = await response.json();
        showResult('blockchainResult', data, !response.ok);
    } catch (error) {
        showResult('blockchainResult', { error: error.message }, true);
    }
});

// Check Balance
document.getElementById('balanceForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const address = document.getElementById('balanceAddress').value;
    
    try {
        const response = await fetch(`${API_BASE}api/blockchain/balance/${address}`);
        const data = await response.json();
        showResult('balanceResult', data, !response.ok);
    } catch (error) {
        showResult('balanceResult', { error: error.message }, true);
    }
});

// Get Supply Info
document.getElementById('getSupplyBtn')?.addEventListener('click', async () => {
    try {
        const response = await fetch(`${API_BASE}api/blockchain/supply`);
        const data = await response.json();
        showResult('supplyResult', data, !response.ok);
    } catch (error) {
        showResult('supplyResult', { error: error.message }, true);
    }
});

// ===== HEALTH CHECK =====

document.getElementById('healthBtn')?.addEventListener('click', async () => {
    try {
        const response = await fetch(`${API_BASE}health`);
        const data = await response.json();
        
        const container = document.getElementById('healthResult');
        container.classList.add('show');
        
        let html = `<div class="alert alert-success">
            <strong><i class="fas fa-check-circle"></i> System is Healthy!</strong>
        </div>`;
        html += '<table class="table"><tbody>';
        html += `<tr><td><strong>Status</strong></td><td>${data.status}</td></tr>`;
        html += `<tr><td><strong>Service</strong></td><td>${data.service}</td></tr>`;
        html += `<tr><td><strong>Version</strong></td><td>${data.version}</td></tr>`;
        html += `<tr><td><strong>Timestamp</strong></td><td>${new Date(data.timestamp).toLocaleString()}</td></tr>`;
        html += '</tbody></table>';
        
        container.innerHTML = html;
    } catch (error) {
        showResult('healthResult', { error: error.message }, true);
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('✓ Stampcoin Platform Frontend Loaded');
    console.log('✓ API Base:', API_BASE);
    console.log('✓ 23 API endpoints available');
    
    // Auto-check health on load
    setTimeout(() => {
        document.getElementById('healthBtn')?.click();
    }, 800);
});
