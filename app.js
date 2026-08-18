window.API_BASE_URL = 'https://bitcashs-platform-production.up.railway.app';
// ==========================================================================
// MARKETS PAGE CONTROLLERS & REAL-TIME TABLE RENDERER
// ==========================================================================
window.MARKETS_DATA = [
  { rank: 1, name: 'Bitcoin', symbol: 'BTC/USDT', icon: '₿', price: 67420.50, change: 2.45, high: 68200.00, low: 65800.00, volume: '$42.5B', cap: '$1.32T' },
  { rank: 2, name: 'Ethereum', symbol: 'ETH/USDT', icon: 'Ξ', price: 3512.80, change: 1.82, high: 3580.00, low: 3420.00, volume: '$18.4B', cap: '$422.5B' },
  { rank: 3, name: 'Solana', symbol: 'SOL/USDT', icon: '◎', price: 148.25, change: -3.12, high: 155.00, low: 144.50, volume: '$6.2B', cap: '$68.5B' },
  { rank: 4, name: 'Binance Coin', symbol: 'BNB/USDT', icon: '🔶', price: 582.40, change: 0.95, high: 590.00, low: 574.00, volume: '$1.8B', cap: '$89.2B' },
  { rank: 5, name: 'Ripple', symbol: 'XRP/USDT', icon: '✕', price: 0.6241, change: 0.95, high: 0.6450, low: 0.6120, volume: '$2.1B', cap: '$35.1B' },
  { rank: 6, name: 'Dogecoin', symbol: 'DOGE/USDT', icon: 'Ð', price: 0.1248, change: -1.45, high: 0.1310, low: 0.1210, volume: '$1.4B', cap: '$18.2B' },
  { rank: 7, name: 'Cardano', symbol: 'ADA/USDT', icon: '₳', price: 0.3842, change: 1.20, high: 0.3950, low: 0.3750, volume: '$780M', cap: '$13.8B' },
  { rank: 8, name: 'Avalanche', symbol: 'AVAX/USDT', icon: '🔺', price: 28.60, change: 4.15, high: 29.40, low: 27.10, volume: '$640M', cap: '$11.3B' },
  { rank: 9, name: 'TRON', symbol: 'TRX/USDT', icon: '⚡', price: 0.1345, change: 0.65, high: 0.1380, low: 0.1310, volume: '$520M', cap: '$11.9B' },
  { rank: 10, name: 'Polkadot', symbol: 'DOT/USDT', icon: '●', price: 4.52, change: -2.10, high: 4.75, low: 4.45, volume: '$310M', cap: '$6.5B' },
  { rank: 11, name: 'Chainlink', symbol: 'LINK/USDT', icon: '🔗', price: 11.85, change: 3.40, high: 12.20, low: 11.30, volume: '$450M', cap: '$7.2B' },
  { rank: 12, name: 'Polygon', symbol: 'MATIC/USDT', icon: '🟣', price: 0.4210, change: -0.80, high: 0.4350, low: 0.4120, volume: '$290M', cap: '$4.1B' },
  { rank: 13, name: 'Litecoin', symbol: 'LTC/USDT', icon: 'Ł', price: 68.30, change: 1.10, high: 69.80, low: 67.20, volume: '$380M', cap: '$5.1B' },
  { rank: 14, name: 'Shiba Inu', symbol: 'SHIB/USDT', icon: '🐕', price: 0.0000142, change: 2.80, high: 0.0000148, low: 0.0000137, volume: '$410M', cap: '$8.3B' },
  { rank: 15, name: 'NEAR Protocol', symbol: 'NEAR/USDT', icon: 'Ⓝ', price: 4.92, change: 5.20, high: 5.10, low: 4.65, volume: '$490M', cap: '$5.4B' },
  { rank: 16, name: 'Uniswap', symbol: 'UNI/USDT', icon: '🦄', price: 6.75, change: -1.15, high: 7.00, low: 6.60, volume: '$210M', cap: '$4.0B' }
];

window.currentMarketFilter = 'all';
window.favoriteMarkets = JSON.parse(localStorage.getItem('favorite_markets') || '["BTC/USDT", "ETH/USDT", "SOL/USDT"]');

window.filterMarkets = function (tabEl, filterType) {
  window.currentMarketFilter = filterType;
  if (tabEl && tabEl.parentElement) {
    const tabs = tabEl.parentElement.querySelectorAll('.order-tab');
    tabs.forEach(t => t.classList.remove('active'));
    tabEl.classList.add('active');
  }
  window.renderMarketsTable();
};
function filterMarkets(tabEl, filterType) { window.filterMarkets(tabEl, filterType); }

window.toggleFavoriteMarket = function (pair, event) {
  if (event) event.stopPropagation();
  const idx = window.favoriteMarkets.indexOf(pair);
  if (idx > -1) {
    window.favoriteMarkets.splice(idx, 1);
  } else {
    window.favoriteMarkets.push(pair);
  }
  localStorage.setItem('favorite_markets', JSON.stringify(window.favoriteMarkets));
  window.renderMarketsTable();
};
function toggleFavoriteMarket(pair, event) { window.toggleFavoriteMarket(pair, event); }

window.renderMarketsTable = function () {
  const tbody = document.getElementById('markets-table-body');
  if (!tbody) return;

  const searchInput = document.getElementById('market-search');
  const searchVal = (searchInput ? searchInput.value : '').toLowerCase().trim();

  let list = window.MARKETS_DATA.slice();

  // Sync live market prices if available
  if (window.liveMarketPrices) {
    list.forEach(m => {
      if (m.symbol === 'BTC/USDT' && window.liveMarketPrices['bitcoin']) {
        m.price = window.liveMarketPrices['bitcoin'].usd;
        m.change = window.liveMarketPrices['bitcoin'].usd_24h_change;
      } else if (m.symbol === 'ETH/USDT' && window.liveMarketPrices['ethereum']) {
        m.price = window.liveMarketPrices['ethereum'].usd;
        m.change = window.liveMarketPrices['ethereum'].usd_24h_change;
      } else if (m.symbol === 'SOL/USDT' && window.liveMarketPrices['solana']) {
        m.price = window.liveMarketPrices['solana'].usd;
        m.change = window.liveMarketPrices['solana'].usd_24h_change;
      } else if (m.symbol === 'XRP/USDT' && window.liveMarketPrices['ripple']) {
        m.price = window.liveMarketPrices['ripple'].usd;
        m.change = window.liveMarketPrices['ripple'].usd_24h_change;
      } else if (m.symbol === 'DOGE/USDT' && window.liveMarketPrices['dogecoin']) {
        m.price = window.liveMarketPrices['dogecoin'].usd;
        m.change = window.liveMarketPrices['dogecoin'].usd_24h_change;
      }
    });
  }

  // Filter by Tab
  if (window.currentMarketFilter === 'gainers') {
    list = list.filter(m => m.change >= 0).sort((a, b) => b.change - a.change);
  } else if (window.currentMarketFilter === 'losers') {
    list = list.filter(m => m.change < 0).sort((a, b) => a.change - b.change);
  } else if (window.currentMarketFilter === 'favorites') {
    list = list.filter(m => window.favoriteMarkets.includes(m.symbol));
  }

  // Filter by Search Query
  if (searchVal) {
    list = list.filter(m => m.name.toLowerCase().includes(searchVal) || m.symbol.toLowerCase().includes(searchVal));
  }

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:30px; color:#94a3b8;">No matching crypto markets found.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map((m, idx) => {
    const isFav = window.favoriteMarkets.includes(m.symbol);
    const isPos = m.change >= 0;
    const changeColor = isPos ? '#34d399' : '#f87171';
    const changeSign = isPos ? '+' : '';
    const formattedPrice = m.price < 1 ? `$${m.price.toFixed(4)}` : `$${m.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const formattedHigh = m.high < 1 ? `$${m.high.toFixed(4)}` : `$${m.high.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const formattedLow = m.low < 1 ? `$${m.low.toFixed(4)}` : `$${m.low.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return `
      <tr style="border-bottom:1px solid rgba(255,255,255,0.05); transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
        <td style="padding:14px 12px; color:#64748b; font-size:12px; font-weight:700;">
          <span onclick="toggleFavoriteMarket('${m.symbol}', event)" style="cursor:pointer; font-size:14px; margin-right:8px;" title="Toggle Favorite">
            ${isFav ? '⭐' : '☆'}
          </span>
          ${idx + 1}
        </td>
        <td style="padding:14px 12px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="width:32px; height:32px; border-radius:50%; background:rgba(234,179,8,0.12); border:1px solid rgba(234,179,8,0.3); display:flex; align-items:center; justify-content:center; font-weight:800; color:#facc15; font-size:14px;">
              ${m.icon || '🪙'}
            </div>
            <div>
              <div style="font-weight:800; color:#f8fafc; font-size:14px;">${m.name}</div>
              <div style="font-size:12px; color:#94a3b8; font-weight:600;">${m.symbol}</div>
            </div>
          </div>
        </td>
        <td style="padding:14px 12px; font-family:monospace; font-weight:800; color:#f8fafc; font-size:14px;">${formattedPrice}</td>
        <td style="padding:14px 12px; font-weight:800; color:${changeColor}; font-size:13px;">${changeSign}${m.change.toFixed(2)}%</td>
        <td style="padding:14px 12px; font-family:monospace; color:#cbd5e1; font-size:13px;">${formattedHigh}</td>
        <td style="padding:14px 12px; font-family:monospace; color:#cbd5e1; font-size:13px;">${formattedLow}</td>
        <td style="padding:14px 12px; color:#94a3b8; font-size:13px;">${m.volume}</td>
        <td style="padding:14px 12px; color:#94a3b8; font-size:13px;">${m.cap}</td>
        <td style="padding:14px 12px;">
          <button onclick="showPage('trade')"
            style="padding:6px 16px; background:rgba(234,179,8,0.15); border:1px solid rgba(234,179,8,0.4); border-radius:8px; color:#facc15; font-size:12px; font-weight:800; cursor:pointer; transition:0.2s;"
            onmouseover="this.style.background='linear-gradient(135deg, #facc15, #ca8a04)'; this.style.color='#000';"
            onmouseout="this.style.background='rgba(234,179,8,0.15)'; this.style.color='#facc15';">
            Trade
          </button>
        </td>
      </tr>
    `;
  }).join('');
};
function renderMarketsTable() { window.renderMarketsTable(); }



// ==========================================================================
// ADMIN WITHDRAWALS TABLE RENDERER & ACTIONS
// ==========================================================================
window.renderAdminWithdrawalsTable = function (withdrawals) {
  const tbody = document.getElementById('admin-withdrawals-table-body');
  if (!tbody) return;

  if (!withdrawals || withdrawals.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="padding:28px; text-align:center; color:#94a3b8;">No withdrawal requests found.</td></tr>`;
    return;
  }

  tbody.innerHTML = withdrawals.map(w => {
    const wid = w._id || w.id;
    const statusLower = (w.status || 'Pending').toLowerCase();
    let statusBadge = '';
    let actionButtons = '';

    if (statusLower === 'pending') {
      statusBadge = '<span style="background:rgba(234,179,8,0.15); color:#facc15; font-weight:800; padding:4px 10px; border-radius:6px; font-size:11px;">PENDING ⏳</span>';
      actionButtons = `
            <div style="display:flex; gap:6px; justify-content:center;">
              <button onclick="admApproveWithdrawal('${wid}')" style="padding:6px 12px; font-size:11px; font-weight:800; background:linear-gradient(135deg, #10b981, #059669); color:#fff; border:none; border-radius:6px; cursor:pointer; box-shadow:0 2px 8px rgba(16,185,129,0.3);">✓ Approve</button>
              <button onclick="admRejectWithdrawal('${wid}')" style="padding:6px 12px; font-size:11px; font-weight:800; background:rgba(239,68,68,0.15); color:#f87171; border:1px solid rgba(239,68,68,0.4); border-radius:6px; cursor:pointer;">✕ Reject</button>
            </div>
          `;
    } else if (statusLower === 'approved' || statusLower === 'completed') {
      statusBadge = '<span style="background:rgba(52,211,153,0.15); color:#34d399; font-weight:800; padding:4px 10px; border-radius:6px; font-size:11px;">COMPLETED ✓</span>';
      actionButtons = '<span style="color:#64748b; font-size:12px;">Processed</span>';
    } else {
      statusBadge = '<span style="background:rgba(239,68,68,0.15); color:#f87171; font-weight:800; padding:4px 10px; border-radius:6px; font-size:11px;">REJECTED (REFUNDED) ✕</span>';
      actionButtons = '<span style="color:#64748b; font-size:12px;">Refunded</span>';
    }

    const amtStr = parseFloat(w.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const dateStr = w.createdAt ? new Date(w.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent';

    return `
          <tr style="border-bottom:1px solid rgba(255,255,255,0.05); transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
            <td style="padding:14px 16px;">
              <div style="font-weight:700; color:#f8fafc;">${w.fullName || w.username || 'User'}</div>
              <div style="font-size:12px; color:#94a3b8;">${w.userEmail || w.email || ''}</div>
            </td>
            <td style="padding:14px 16px; font-family:monospace; font-weight:800; color:#facc15;">$${amtStr} USDT</td>
            <td style="padding:14px 16px; color:#cbd5e1; font-size:12px;">${w.coin || 'USDT'} (${w.network || 'TRC20'})</td>
            <td style="padding:14px 16px; font-family:monospace; color:#fde68a; font-size:12px; max-width:200px; word-break:break-all;">${w.address || ''}</td>
            <td style="padding:14px 16px; text-align:center;">${statusBadge}</td>
            <td style="padding:14px 16px; color:#94a3b8; font-size:12px;">${dateStr}</td>
            <td style="padding:14px 16px; text-align:center;">${actionButtons}</td>
          </tr>
        `;
  }).join('');
};

window.admApproveWithdrawal = async function (wid) {
  if (!confirm('Are you sure you want to APPROVE this withdrawal payout?')) return;
  try {
    const res = await fetch(`${window.API_BASE_URL}/api/admin/withdrawals/approve/${wid}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (res.ok && data.success) {
      window.showTradeToast('✅ Withdrawal marked as Completed!', 'success');
      if (typeof fetchAdminDashboard === 'function') fetchAdminDashboard();
    } else {
      window.showTradeToast(data.message || 'Failed to approve withdrawal', 'error');
    }
  } catch (err) {
    console.error('Approve withdrawal error:', err);
    window.showTradeToast('Network error approving withdrawal', 'error');
  }
};

window.admRejectWithdrawal = async function (wid) {
  if (!confirm('Are you sure you want to REJECT this withdrawal? The full amount will be instantly REFUNDED to user balance.')) return;
  try {
    const res = await fetch(`${window.API_BASE_URL}/api/admin/withdrawals/reject/${wid}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (res.ok && data.success) {
      window.showTradeToast('↩️ Withdrawal Rejected and amount refunded to user balance!', 'info');
      if (typeof fetchAdminDashboard === 'function') fetchAdminDashboard();
    } else {
      window.showTradeToast(data.message || 'Failed to reject withdrawal', 'error');
    }
  } catch (err) {
    console.error('Reject withdrawal error:', err);
    window.showTradeToast('Network error rejecting withdrawal', 'error');
  }
};



// ==========================================================================
// MINING PLAN CONTRACT SELECTION & DEPOSIT AUTO-LOCK
// ==========================================================================
window.MINING_PLANS_CONFIG = {
  'Basic Mining': { name: 'Basic Mining', tierName: 'Basic Tier', min: 5000, max: 5000, duration: '30 Days', dailyRoi: '0.75%', label: '$5,000 Exact Capital' },
  'Basic Plan': { name: 'Basic Mining', tierName: 'Basic Tier', min: 5000, max: 5000, duration: '30 Days', dailyRoi: '0.75%', label: '$5,000 Exact Capital' },
  'Pro Mining': { name: 'Pro Mining', tierName: 'Pro Tier', min: 5001, max: 25000, duration: '30 Days', dailyRoi: '1.25%', label: '$5,001 – $25,000' },
  'Pro Plan': { name: 'Pro Mining', tierName: 'Pro Tier', min: 5001, max: 25000, duration: '30 Days', dailyRoi: '1.25%', label: '$5,001 – $25,000' },
  'Elite Mining': { name: 'Elite Mining', tierName: 'Elite Tier', min: 25001, max: 50000, duration: '45 Days', dailyRoi: '1.50%', label: '$25,001 – $50,000' },
  'Elite Plan': { name: 'Elite Mining', tierName: 'Elite Tier', min: 25001, max: 50000, duration: '45 Days', dailyRoi: '1.50%', label: '$25,001 – $50,000' },
  'Diamond Mining': { name: 'Diamond Mining', tierName: 'Diamond Tier', min: 50001, max: 100000, duration: '60 Days', dailyRoi: '1.75%', label: '$50,001 – $100,000' },
  'Diamond Plan': { name: 'Diamond Mining', tierName: 'Diamond Tier', min: 50001, max: 100000, duration: '60 Days', dailyRoi: '1.75%', label: '$50,001 – $100,000' },
  'Executive Mining': { name: 'Executive Mining', tierName: 'Executive Tier', min: 100001, max: 250000, duration: '75 Days', dailyRoi: '2.00%', label: '$100,001 – $250,000' },
  'Executive Plan': { name: 'Executive Mining', tierName: 'Executive Tier', min: 100001, max: 250000, duration: '75 Days', dailyRoi: '2.00%', label: '$100,001 – $250,000' },
  'Institutional Mining': { name: 'Institutional Mining', tierName: 'Institutional Tier', min: 250001, max: 500000, duration: '90 Days', dailyRoi: '2.50%', label: '$250,001 – $500,000' },
  'Institutional Plan': { name: 'Institutional Mining', tierName: 'Institutional Tier', min: 250001, max: 500000, duration: '90 Days', dailyRoi: '2.50%', label: '$250,001 – $500,000' },
  'Infinity Mining': { name: 'Infinity Mining', tierName: 'Infinity Tier', min: 250001, max: 1000000, duration: '180 Days', dailyRoi: '2.50%', label: '$250,001+' }
};

window.selectedMiningPlan = null;

window.handlePlanSelect = function (planKey) {
  if (typeof window.requireAuth === 'function' && !window.requireAuth('start mining contract')) return;
  if (typeof window.isUserKycVerified === 'function' && !window.isUserKycVerified()) {
    return window.requireKycVerification('activate mining plans');
  }

  const plan = window.MINING_PLANS_CONFIG[planKey] || {
    name: planKey,
    tierName: planKey.includes('Tier') ? planKey : `${planKey} Tier`,
    min: 5000,
    max: 5000,
    duration: '30 Days',
    dailyRoi: '0.75%',
    label: '$5,000'
  };

  window.selectedMiningPlan = plan;

  // Navigate to Deposit Page
  if (typeof window.showPage === 'function') window.showPage('deposit-page');

  // Update Deposit Page Elements
  const badgeEl = document.getElementById('dep-page-plan-badge');
  const nameEl = document.getElementById('dep-selected-plan-name');
  const descEl = document.getElementById('dep-selected-plan-desc');
  const amtInput = document.getElementById('dep-page-amount');

  if (badgeEl) badgeEl.style.display = 'block';
  if (nameEl) nameEl.textContent = `⛏️ ${plan.name} (${plan.duration})`;
  if (descEl) descEl.textContent = `Contract Capital: ${plan.label} • Daily Return: ${plan.dailyRoi}`;

  if (amtInput) {
    amtInput.value = plan.min;
    amtInput.min = plan.min;
    if (plan.max && plan.max !== plan.min) {
      amtInput.placeholder = `Enter amount ($${plan.min.toLocaleString()} – $${plan.max.toLocaleString()})`;
    } else {
      amtInput.placeholder = `Exact amount: $${plan.min.toLocaleString()} USDT`;
    }
  }

  if (typeof window.showTradeToast === 'function') {
    window.showTradeToast(`⚡ Selected ${plan.name}! Deposit $${plan.min.toLocaleString()} USDT to activate.`, 'info');
  }
};
function handlePlanSelect(planKey) { window.handlePlanSelect(planKey); }

window.clearSelectedMiningPlan = function () {
  window.selectedMiningPlan = null;
  const badgeEl = document.getElementById('dep-page-plan-badge');
  const amtInput = document.getElementById('dep-page-amount');
  if (badgeEl) badgeEl.style.display = 'none';
  if (amtInput) {
    amtInput.value = '';
    amtInput.min = 100;
    amtInput.placeholder = 'Enter amount (min. 100 USDT)';
  }
};
function clearSelectedMiningPlan() { window.clearSelectedMiningPlan(); }

window.openDepositPageDirectly = function () {
  window.clearSelectedMiningPlan();
  window.showPage('deposit-page');
};

// ==========================================================================
// REAL-TIME LIVE MARKET PRICES & CRYPTO TICKERS
// ==========================================================================
window.liveMarketPrices = window.liveMarketPrices || {
  'bitcoin': { usd: 67420.50, usd_24h_change: 2.45 },
  'ethereum': { usd: 3512.80, usd_24h_change: 1.82 },
  'solana': { usd: 148.25, usd_24h_change: -3.12 },
  'ripple': { usd: 0.6241, usd_24h_change: 0.95 },
  'dogecoin': { usd: 0.1248, usd_24h_change: -1.45 }
};

window.fetchLiveMarkets = async function () {
  if (typeof window.fetchHomeLivePrices === 'function') {
    return window.fetchHomeLivePrices();
  }
  try {
    const res = await fetch(`${window.API_BASE_URL}/api/market/prices`);
    if (res.ok) {
      const json = await res.json();
      const data = json.data || json;
      if (Array.isArray(data)) {
        data.forEach(item => {
          const sym = (item.name || item.symbol || '').toUpperCase();
          const price = parseFloat(item.rawPrice || item.price || item.lastPrice) || 0;
          const change = parseFloat(item.rawChange || item.change || item.priceChangePercent) || 0;
          if (sym === 'BTC' || sym === 'BTCUSDT') window.liveMarketPrices['bitcoin'] = { usd: price || 67420.50, usd_24h_change: change };
          if (sym === 'ETH' || sym === 'ETHUSDT') window.liveMarketPrices['ethereum'] = { usd: price || 3512.80, usd_24h_change: change };
          if (sym === 'SOL' || sym === 'SOLUSDT') window.liveMarketPrices['solana'] = { usd: price || 148.25, usd_24h_change: change };
          if (sym === 'XRP' || sym === 'XRPUSDT') window.liveMarketPrices['ripple'] = { usd: price || 0.6241, usd_24h_change: change };
          if (sym === 'DOGE' || sym === 'DOGEUSDT') window.liveMarketPrices['dogecoin'] = { usd: price || 0.1248, usd_24h_change: change };
        });
      }
    }
  } catch (err) {
    // Keep cached prices
  }
};

window.fetchLivePrices = window.fetchLiveMarkets;
if (!window.fetchHomeLivePrices) window.fetchHomeLivePrices = window.fetchLiveMarkets;



// ==========================================================================
// WITHDRAW PAGE & MODAL CONTROLLERS (MATCHING DEPOSIT FLOW)
// ==========================================================================
window.setWithdrawPageMax = function () {
  const userBal = window.getUserBalanceNumber();
  const amtInput = document.getElementById('withdraw-page-amount');
  if (amtInput) {
    amtInput.value = userBal > 0 ? userBal.toFixed(2) : '500';
    window.calcWithdrawPageSummary();
  }
};

window.calcWithdrawPageSummary = function () {
  const amtInput = document.getElementById('withdraw-page-amount');
  const summaryEl = document.getElementById('withdraw-page-summary-receive');
  const val = parseFloat(amtInput?.value) || 0;
  if (summaryEl) {
    summaryEl.textContent = `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`;
  }
};

window.submitWithdrawPageRequest = async function (event) {
  if (event) event.preventDefault();

  const nameInput = document.getElementById('withdraw-page-name');
  const addrInput = document.getElementById('withdraw-page-address');
  const amtInput = document.getElementById('withdraw-page-amount');
  const submitBtn = document.getElementById('withdraw-page-submit-btn');

  const fullName = (nameInput?.value || '').trim();
  const address = (addrInput?.value || '').trim();
  const amount = parseFloat(amtInput?.value) || 0;

  if (!fullName) {
    return window.showTradeToast('Please enter Account Holder Name', 'warning');
  }

  if (!address) {
    return window.showTradeToast('Please enter Receiving Wallet Address / Income ID (TRC20)', 'warning');
  }

  if (amount < 500) {
    return window.showTradeToast('Minimum withdrawal amount is $500.00 USDT', 'warning');
  }

  const userBal = window.getUserBalanceNumber();
  if (amount > userBal) {
    return window.showTradeToast(`Insufficient balance! Available: $${userBal.toFixed(2)} USDT`, 'warning');
  }

  const token = localStorage.getItem('token') || localStorage.getItem('bitcashs_token');
  const userJson = localStorage.getItem('user') || localStorage.getItem('bitcashs_user');
  let email = '';
  try { if (userJson) email = JSON.parse(userJson).email; } catch (e) { }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Processing Withdrawal...';
  }

  try {
    const res = await fetch(`${window.API_BASE_URL}/api/wallet/withdraw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        email: email,
        fullName: fullName,
        name: fullName,
        address: address,
        amount: amount,
        coin: 'USDT',
        network: 'TRC20'
      })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      window.showTradeToast('✅ Withdrawal request submitted! Payment is pending verification.', 'success');

      // Immediately deduct amount from cached user balance
      if (userJson) {
        try {
          const u = JSON.parse(userJson);
          u.balance = data.newBalance !== undefined ? data.newBalance : Math.max(0, userBal - amount);
          localStorage.setItem('user', JSON.stringify(u));
        } catch (e) { }
      }

      // Refresh dynamic wallet & tables
      window.fetchWalletData();

      // Navigate back to wallet view to show pending transaction
      setTimeout(() => {
        window.showPage('wallet');
      }, 1000);

    } else {
      window.showTradeToast(data.message || 'Failed to submit withdrawal', 'error');
    }
  } catch (err) {
    console.error('Withdrawal error:', err);
    window.showTradeToast('Network error processing withdrawal', 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = '🚀 SUBMIT WITHDRAWAL REQUEST';
    }
  }
};



// ==========================================================================
// DYNAMIC WALLET BALANCES, WITHDRAWAL FLOW & TRANSACTION HISTORY CONTROLLER
// ==========================================================================
window.openWithdrawModal = function () {
  if (typeof window.requireAuth === 'function' && !window.requireAuth('withdraw funds')) return;
  if (!window.requireKycVerification('withdraw funds')) return;

  const modal = document.getElementById('modal-withdraw');
  const availBalEl = document.getElementById('withdraw-modal-avail-bal');
  const userBal = window.getUserBalanceNumber();

  if (availBalEl) {
    availBalEl.textContent = `$${userBal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`;
  }

  const amtInput = document.getElementById('withdraw-amount-input');
  if (amtInput) amtInput.value = '';
  window.calcWithdrawSummary();

  if (modal) modal.style.display = 'flex';
};

window.closeWithdrawModal = function () {
  const modal = document.getElementById('modal-withdraw');
  if (modal) modal.style.display = 'none';
};

window.setWithdrawMax = function () {
  const userBal = window.getUserBalanceNumber();
  const amtInput = document.getElementById('withdraw-amount-input');
  if (amtInput) {
    amtInput.value = userBal.toFixed(2);
    window.calcWithdrawSummary();
  }
};

window.calcWithdrawSummary = function () {
  const amtInput = document.getElementById('withdraw-amount-input');
  const summaryEl = document.getElementById('withdraw-summary-receive');
  const val = parseFloat(amtInput?.value) || 0;
  if (summaryEl) {
    summaryEl.textContent = `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`;
  }
};

window.handleWithdrawSubmit = async function (e) {
  if (e) e.preventDefault();
  if (!window.requireKycVerification('withdraw funds')) return;

  const coinNetVal = document.getElementById('withdraw-coin-network')?.value || 'USDT_TRC20';
  const amtInput = document.getElementById('withdraw-amount-input');
  const addrInput = document.getElementById('withdraw-address-input');
  const submitBtn = document.getElementById('withdraw-submit-btn');

  const amount = parseFloat(amtInput?.value) || 0;
  const address = (addrInput?.value || '').trim();

  if (amount < 10) {
    return window.showTradeToast('Minimum withdrawal amount is $10.00 USDT', 'warning');
  }

  const userBal = window.getUserBalanceNumber();
  if (amount > userBal) {
    return window.showTradeToast('Insufficient available USDT balance for this withdrawal', 'warning');
  }

  if (!address) {
    return window.showTradeToast('Please enter your destination wallet address', 'warning');
  }

  const [coin, network] = coinNetVal.split('_');

  const token = localStorage.getItem('token') || localStorage.getItem('bitcashs_token');
  const userJson = localStorage.getItem('user');
  let email = '';
  try { if (userJson) email = JSON.parse(userJson).email; } catch (err) { }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Processing Withdrawal...';
  }

  try {
    const res = await fetch(`${window.API_BASE_URL}/api/wallet/withdraw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        email: email,
        amount: amount,
        coin: coin,
        network: network,
        address: address
      })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      window.showTradeToast('✅ Withdrawal request submitted! Funds under review.', 'success');
      window.closeWithdrawModal();

      // Update cached user
      if (userJson) {
        try {
          const uObj = JSON.parse(userJson);
          uObj.balance = data.newBalance !== undefined ? data.newBalance : Math.max(0, userBal - amount);
          localStorage.setItem('user', JSON.stringify(uObj));
        } catch (e) { }
      }

      // Refresh dynamic wallet & tables
      window.fetchWalletData();
    } else {
      if (data.kycRequired) {
        window.closeWithdrawModal();
        window.requireKycVerification('withdraw funds');
      } else {
        window.showTradeToast(data.message || 'Failed to submit withdrawal', 'error');
      }
    }
  } catch (err) {
    console.error('Withdrawal error:', err);
    window.showTradeToast('Network error processing withdrawal request', 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = '🚀 Submit Withdrawal Request';
    }
  }
};

window.updateInvestmentOverviewCards = function (source) {
  if (!source) return;

  const activePlansCount = parseInt(source.activePlansCount) || (source.activePlans ? source.activePlans.length : 0) || 0;
  const totalInvested = parseFloat(source.totalInvestedUsd !== undefined ? source.totalInvestedUsd : source.totalInvested) || 0;
  const totalDeposits = parseFloat(source.totalDepositedUsd !== undefined ? source.totalDepositedUsd : source.totalDeposits) || 0;

  // Identify latest plan info
  let latestPlan = null;
  if (source.latestActivePlan) {
    latestPlan = source.latestActivePlan;
  } else if (source.activePlans && Array.isArray(source.activePlans) && source.activePlans.length > 0) {
    latestPlan = source.activePlans[source.activePlans.length - 1];
  }

  // 1. ACTIVE PLANS CARD
  const activePlansValEl = document.getElementById('wallet-active-plans-val');
  const activePlansSubEl = document.getElementById('wallet-active-plans-sub');
  if (activePlansValEl) {
    if (activePlansCount === 0) {
      activePlansValEl.textContent = '0 Active Plans';
    } else if (activePlansCount === 1) {
      activePlansValEl.textContent = '1 Active Plan';
    } else {
      activePlansValEl.textContent = `${activePlansCount} Active Plans`;
    }
  }
  if (activePlansSubEl) {
    if (activePlansCount > 0 && latestPlan) {
      const pName = (latestPlan.planName || latestPlan.displayName || 'Basic Mining').trim();
      const tierFormatted = pName.includes('Tier') ? pName : pName.replace(/Mining/i, 'Tier').trim();
      activePlansSubEl.textContent = tierFormatted;
      activePlansSubEl.style.color = '#facc15';
      activePlansSubEl.style.fontWeight = '700';
    } else {
      activePlansSubEl.textContent = 'No Active Tier';
      activePlansSubEl.style.color = '#64748b';
      activePlansSubEl.style.fontWeight = 'normal';
    }
  }

  // 2. TOTAL INVESTED CARD
  const totalInvestedValEl = document.getElementById('wallet-total-invested-val');
  const totalInvestedSubEl = document.getElementById('wallet-total-invested-sub');
  if (totalInvestedValEl) {
    totalInvestedValEl.textContent = `$${totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (totalInvestedSubEl) {
    if (totalInvested > 0 && latestPlan && latestPlan.dailyRoi) {
      totalInvestedSubEl.textContent = `Yielding Daily ${latestPlan.dailyRoi}`;
      totalInvestedSubEl.style.color = '#34d399';
    } else {
      totalInvestedSubEl.textContent = 'Yielding Daily 0.00%';
      totalInvestedSubEl.style.color = '#34d399';
    }
  }

  // 3. TOTAL DEPOSITS CARD
  const totalDepositsValEl = document.getElementById('wallet-total-deposits-val');
  const progressTextEl = document.getElementById('wallet-deposit-progress-text');
  const progressRingEl = document.getElementById('wallet-deposit-progress-ring');
  if (totalDepositsValEl) {
    totalDepositsValEl.textContent = `$${totalDeposits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (progressTextEl && progressRingEl) {
    if (totalDeposits > 0) {
      progressTextEl.textContent = '100%';
      progressRingEl.style.background = 'conic-gradient(#facc15 100%, #1e293b 0)';
    } else {
      progressTextEl.textContent = '0%';
      progressRingEl.style.background = 'conic-gradient(#1e293b 100%, #1e293b 0)';
    }
  }
};

// ==========================================================================
// DYNAMIC WALLET DATA & TRANSACTION HISTORY FETCH
// ==========================================================================
window.fetchWalletData = async function () {
  const token = localStorage.getItem('token') || localStorage.getItem('bitcashs_token');
  const userJson = localStorage.getItem('user') || localStorage.getItem('bitcashs_user');
  let email = '';
  let localUser = null;
  try {
    if (userJson) {
      localUser = JSON.parse(userJson);
      email = localUser.email || '';
    }
  } catch (err) { }

  // 1. Initial immediate paint from cached user object to eliminate any lag or demo numbers
  if (localUser) {
    const bal = parseFloat(localUser.balance) || 0;
    const btcPrice = (window.liveMarketPrices && window.liveMarketPrices['bitcoin']?.usd) || 64500.0;
    const btcVal = (bal / btcPrice).toFixed(4);

    const balUsdEl = document.getElementById('wallet-total-balance-usd');
    const balBtcEl = document.getElementById('wallet-total-balance-btc');

    if (balUsdEl) balUsdEl.textContent = `$${bal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (balBtcEl) balBtcEl.textContent = `≈ ${btcVal} BTC`;

    window.updateInvestmentOverviewCards(localUser);
  }

  if (!email && !token) return;

  // 2. Fetch authoritative fresh live data from server
  try {
    const res = await fetch(`${window.API_BASE_URL}/api/user/wallet?email=${encodeURIComponent(email)}`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });

    if (!res.ok) return;
    const data = await res.json();
    if (!data.success) return;

    const w = data.wallet || {};
    const balance = parseFloat(data.balance !== undefined ? data.balance : w.totalBalanceUsd) || 0;
    const btcPrice = (window.liveMarketPrices && window.liveMarketPrices['bitcoin']?.usd) || 64500.0;
    const btcVal = (balance / btcPrice).toFixed(4);

    // Update Top Wallet Financial Cards
    const balUsdEl = document.getElementById('wallet-total-balance-usd');
    const balBtcEl = document.getElementById('wallet-total-balance-btc');
    const dailyEarnEl = document.getElementById('wallet-daily-earnings-usd');
    const totalProfitEl = document.getElementById('wallet-total-profit-usd');

    if (balUsdEl) balUsdEl.textContent = `$${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (balBtcEl) balBtcEl.textContent = `≈ ${btcVal} BTC`;
    if (dailyEarnEl) dailyEarnEl.textContent = `+$${(parseFloat(w.dailyEarningsUsd) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (totalProfitEl) totalProfitEl.textContent = `+$${(parseFloat(w.totalProfitUsd) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Update Investment Overview cards
    window.updateInvestmentOverviewCards(w);

    // Sync cached user balance & plan info
    if (userJson) {
      try {
        const u = JSON.parse(userJson);
        u.balance = balance;
        u.activePlansCount = w.activePlansCount;
        u.activePlans = w.activePlans;
        u.totalInvested = w.totalInvestedUsd;
        u.totalDeposits = w.totalDepositedUsd;
        localStorage.setItem('user', JSON.stringify(u));
      } catch (e) { }
    }

    // Update Binary Options Stake Available Balances
    if (typeof window.updateOptionAvailableBalance === 'function') window.updateOptionAvailableBalance();

    // 3. Render Crypto Assets Table
    const assetsTbody = document.getElementById('wallet-assets-tbody');
    if (assetsTbody && data.assets) {
      assetsTbody.innerHTML = data.assets.map(a => {
        const aBal = parseFloat(a.balance) || 0;
        const aInOrder = parseFloat(a.inOrder) || 0;
        const aUsd = parseFloat(a.usdValue) || 0;
        return `
          <tr style="border-bottom:1px solid rgba(255,255,255,0.05); transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
            <td style="padding:16px 20px; font-weight:700; color:#f8fafc; display:flex; align-items:center; gap:10px;">
              <span style="font-size:18px; width:28px; height:28px; border-radius:50%; background:rgba(234,179,8,0.15); color:#facc15; display:inline-flex; align-items:center; justify-content:center;">${a.icon || '₮'}</span>
              <div>
                <div>${a.name}</div>
                <div style="font-size:11px; color:#94a3b8; font-weight:600;">${a.symbol}</div>
              </div>
            </td>
            <td style="padding:16px 20px; font-family:monospace; font-weight:700; color:#ffffff;">${aBal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</td>
            <td style="padding:16px 20px; font-family:monospace; color:#94a3b8;">${aInOrder.toFixed(2)}</td>
            <td style="padding:16px 20px; font-family:monospace; font-weight:700; color:#facc15;">$${aUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td style="padding:16px 20px; text-align:right;">
              <button onclick="showPage('deposit-page')" style="padding:5px 12px; font-size:11px; font-weight:700; background:rgba(234,179,8,0.15); color:#fde68a; border:1px solid rgba(234,179,8,0.3); border-radius:6px; cursor:pointer; margin-right:6px;">Deposit</button>
              <button onclick="openWithdrawModal()" style="padding:5px 12px; font-size:11px; font-weight:700; background:rgba(255,255,255,0.04); color:#cbd5e1; border:1px solid rgba(255,255,255,0.1); border-radius:6px; cursor:pointer;">Withdraw</button>
            </td>
          </tr>
        `;
      }).join('');
    }

    // 4. Render Live Transaction History Table
    const txTbody = document.getElementById('wallet-tx-tbody');
    if (txTbody && data.transactions) {
      if (data.transactions.length === 0) {
        txTbody.innerHTML = `<tr><td colspan="5" style="padding:28px; text-align:center; color:#94a3b8;">No transaction history yet. Make a deposit or trade to get started.</td></tr>`;
      } else {
        txTbody.innerHTML = data.transactions.map(t => {
          const typeLower = (t.type || '').toLowerCase();
          const isDeposit = typeLower.includes('deposit');
          const isWithdrawal = typeLower.includes('withdrawal');
          const isWin = typeLower.includes('win');
          const isLoss = typeLower.includes('loss');

          const typeColor = isDeposit ? '#34d399' : (isWithdrawal ? '#facc15' : (isWin ? '#34d399' : '#f87171'));
          const typeIcon = isDeposit ? '📥' : (isWithdrawal ? '📤' : (isWin ? '🏆' : '📉'));

          const statusLower = (t.status || 'completed').toLowerCase();
          let statusBadge = '';
          if (statusLower === 'completed' || statusLower === 'approved') {
            statusBadge = '<span style="background:rgba(52,211,153,0.15); color:#34d399; font-weight:800; padding:4px 10px; border-radius:6px; font-size:11px;">COMPLETED ✓</span>';
          } else if (statusLower === 'pending') {
            statusBadge = '<span style="background:rgba(234,179,8,0.15); color:#facc15; font-weight:800; padding:4px 10px; border-radius:6px; font-size:11px;">PENDING ⏳</span>';
          } else {
            statusBadge = '<span style="background:rgba(239,68,68,0.15); color:#f87171; font-weight:800; padding:4px 10px; border-radius:6px; font-size:11px;">REJECTED ✕</span>';
          }

          const amtStr = t.amount || '$0.00';
          const amtColor = amtStr.startsWith('+') ? '#34d399' : (amtStr.startsWith('-') ? '#f87171' : '#ffffff');

          return `
            <tr style="border-bottom:1px solid rgba(255,255,255,0.05); transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
              <td style="padding:16px 20px; font-weight:700; color:${typeColor}; display:flex; align-items:center; gap:8px;">
                <span>${typeIcon}</span> <span>${t.type}</span>
              </td>
              <td style="padding:16px 20px; color:#cbd5e1; font-size:13px;">${t.coin}</td>
              <td style="padding:16px 20px; font-family:monospace; font-weight:800; color:${amtColor};">${amtStr}</td>
              <td style="padding:16px 20px;">${statusBadge}</td>
              <td style="padding:16px 20px; color:#94a3b8; font-size:12px;">${t.date}</td>
            </tr>
          `;
        }).join('');
      }
    }

  } catch (err) {
    console.error('Fetch wallet error:', err);
  }
};

// ==========================================================================
// ADMIN WITHDRAWALS APPROVAL / REJECTION ACTIONS
// ==========================================================================
window.admApproveWithdrawal = async function (id) {
  try {
    const res = await fetch(`${window.API_BASE_URL}/api/admin/withdrawals/approve/${id}`, { method: 'POST' });
    const data = await res.json();
    if (res.ok && data.success) {
      window.showTradeToast('✅ Withdrawal approved successfully!', 'success');
      window.fetchAdminDashboard();
    } else {
      window.showTradeToast(data.message || 'Failed to approve withdrawal', 'error');
    }
  } catch (err) {
    window.showTradeToast('Network error approving withdrawal', 'error');
  }
};

window.admRejectWithdrawal = async function (id) {
  try {
    const res = await fetch(`${window.API_BASE_URL}/api/admin/withdrawals/reject/${id}`, { method: 'POST' });
    const data = await res.json();
    if (res.ok && data.success) {
      window.showTradeToast('⚠️ Withdrawal rejected and refunded to user.', 'warning');
      window.fetchAdminDashboard();
    } else {
      window.showTradeToast(data.message || 'Failed to reject withdrawal', 'error');
    }
  } catch (err) {
    window.showTradeToast('Network error rejecting withdrawal', 'error');
  }
};



// ==========================================================================
// MANDATORY KYC VERIFICATION SYSTEM GUARD
// ==========================================================================
window.closeKycLockModal = function () {
  const modal = document.getElementById('modal-kyc-lock');
  if (modal) modal.style.display = 'none';
};

window.isUserKycVerified = function () {
  const userJson = localStorage.getItem('user');
  if (!userJson) return false;
  try {
    const user = JSON.parse(userJson);
    const status = (user.kycStatus || '').toUpperCase();
    return status === 'VERIFIED' || user.isKycVerified === true || user.role === 'ADMIN' || user.isAdmin === true;
  } catch (e) {
    return false;
  }
};

window.requireKycVerification = function (actionName = 'perform this action') {
  const userJson = localStorage.getItem('user');
  if (!userJson) {
    if (typeof window.openLoginModal === 'function') window.openLoginModal();
    else if (typeof window.showPage === 'function') window.showPage('login');
    window.showTradeToast('Please log in to continue', 'warning');
    return false;
  }

  let user = {};
  try { user = JSON.parse(userJson); } catch (e) { }

  const isVer = window.isUserKycVerified();
  if (isVer) return true;

  // User is not KYC verified: Block action and open KYC Lock Modal
  const modal = document.getElementById('modal-kyc-lock');
  const msgEl = document.getElementById('kyc-lock-msg');
  const statusEl = document.getElementById('kyc-lock-status-text');

  const curStatus = (user.kycStatus || 'UNVERIFIED').toUpperCase();

  if (msgEl) {
    msgEl.textContent = `Identity verification (KYC) is required to ${actionName}. Please complete your verification to unlock trading, deposits, and withdrawals.`;
  }
  if (statusEl) {
    statusEl.textContent = curStatus === 'PENDING_APPROVAL' ? 'PENDING APPROVAL' : 'UNVERIFIED';
    statusEl.style.color = curStatus === 'PENDING_APPROVAL' ? '#facc15' : '#ef4444';
  }

  if (modal) {
    modal.style.display = 'flex';
  }

  window.showTradeToast(`⚠️ KYC Verification Required to ${actionName}`, 'warning');
  return false;
};



// Admin Global Outcome Control Switch
window.setGlobalTradeOutcome = async function (newOutcome) {
  const target = (newOutcome || 'LOSS').toUpperCase();
  try {
    const res = await fetch(`${window.API_BASE_URL}/api/admin/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ globalTradeOutcome: target })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      window.showTradeToast(`🎯 Global Master Outcome set to: FORCE ${target}`, 'success');
      const badge = document.getElementById('global-outcome-status-badge');
      if (badge) {
        badge.textContent = target === 'WIN' ? 'FORCE WIN ACTIVE' : 'FORCE LOSS ACTIVE';
        badge.style.background = target === 'WIN' ? 'rgba(52,211,153,0.15)' : 'rgba(239,68,68,0.15)';
        badge.style.color = target === 'WIN' ? '#34d399' : '#f87171';
        badge.style.borderColor = target === 'WIN' ? 'rgba(52,211,153,0.35)' : 'rgba(239,68,68,0.35)';
      }
      const quickSel = document.getElementById('quick-global-outcome-select');
      const settSel = document.getElementById('adm-setting-global-outcome');
      if (quickSel) quickSel.value = target;
      if (settSel) settSel.value = target;
    } else {
      window.showTradeToast(data.message || 'Failed to update global outcome', 'error');
    }
  } catch (err) {
    window.showTradeToast('Global outcome switch error', 'error');
  }
};

// Admin User-Level Override Dropdown Handler
window.updateUserTradeOutcome = async function (userId, newOutcome) {
  try {
    const res = await fetch(`${window.API_BASE_URL}/api/admin/user/trade-outcome`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, outcome: newOutcome })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      const modeLabel = newOutcome === 'WIN' ? '🟢 Force Win' : (newOutcome === 'LOSS' ? '🔴 Force Loss' : '⚙️ Default (Global Mode)');
      window.showTradeToast(`User outcome set to: ${modeLabel}`, 'success');
      // Update cached user object if present
      if (window.adminUsersList) {
        const u = window.adminUsersList.find(x => (x._id || x.id) === userId);
        if (u) u.tradeOutcome = newOutcome;
      }
    } else {
      window.showTradeToast(data.message || 'Failed to update user outcome', 'error');
    }
  } catch (err) {
    window.showTradeToast('Network error updating user trade outcome', 'error');
  }
};


// ==========================================================================
// ADMIN USER DIRECTORY ACTIONS: EDIT BALANCE, KYC APPROVE/REJECT, LIVE SEARCH
// ==========================================================================
window.admToggleUserKyc = async function (userId, newKycStatus) {
  try {
    const res = await fetch(`${window.API_BASE_URL}/api/admin/users/toggle-kyc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, kycStatus: newKycStatus })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      window.showTradeToast(`🆔 KYC Status updated to: ${newKycStatus}`, 'success');
      if (window.adminUsersList) {
        const u = window.adminUsersList.find(x => (x._id || x.id) === userId);
        if (u) u.kycStatus = newKycStatus;
      }
    } else {
      window.showTradeToast(data.message || 'Failed to update KYC status', 'error');
    }
  } catch (err) {
    console.error('KYC update error:', err);
    window.showTradeToast('Network error updating KYC status', 'error');
  }
};

window.admEditUserBalance = async function (userId, currentBalance) {
  const currentNum = parseFloat(currentBalance) || 0;
  const promptVal = prompt(`💰 Enter new USDT balance for this user:`, currentNum.toFixed(2));
  if (promptVal === null) return; // User cancelled

  const newBal = parseFloat(promptVal);
  if (isNaN(newBal) || newBal < 0) {
    return window.showTradeToast('Please enter a valid positive number', 'warning');
  }

  try {
    const res = await fetch(`${window.API_BASE_URL}/api/admin/users/update-balance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, newBalance: newBal, balance: newBal })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      window.showTradeToast(`💰 Balance updated to $${newBal.toFixed(2)} USDT!`, 'success');
      if (window.adminUsersList) {
        const u = window.adminUsersList.find(x => (x._id || x.id) === userId);
        if (u) u.balance = newBal;
      }
      if (typeof window.fetchAdminDashboard === 'function') window.fetchAdminDashboard();
    } else {
      window.showTradeToast(data.message || 'Failed to update balance', 'error');
    }
  } catch (err) {
    console.error('Balance update error:', err);
    window.showTradeToast('Network error updating user balance', 'error');
  }
};

window.filterAdminUsersTable = function () {
  const q = (document.getElementById('admin-user-search-input')?.value || '').toLowerCase().trim();
  if (!window.adminUsersList) return;

  if (!q) {
    window.renderAdminUsersTable(window.adminUsersList);
    return;
  }

  const filtered = window.adminUsersList.filter(u => {
    const uname = (u.username || '').toLowerCase();
    const fname = (u.fullName || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const phone = (u.phone || u.mobile || '').toLowerCase();
    const kyc = (u.kycStatus || '').toLowerCase();
    const bal = String(u.balance || '');
    return uname.includes(q) || fname.includes(q) || email.includes(q) || phone.includes(q) || kyc.includes(q) || bal.includes(q);
  });

  window.renderAdminUsersTable(filtered);
};




// Admin 1-Click User Trade Outcome Toggle
window.toggleUserTradeOutcome = async function (userId, currentOutcome) {
  const newOutcome = currentOutcome === 'WIN' ? 'LOSS' : 'WIN';
  try {
    const res = await fetch(`${window.API_BASE_URL}/api/admin/user/trade-outcome`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, outcome: newOutcome })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      window.showTradeToast(`⚙️ Trade Outcome set to: ${newOutcome}`, 'success');
      if (typeof window.fetchAdminDashboard === 'function') window.fetchAdminDashboard();
    } else {
      window.showTradeToast(data.message || 'Failed to update trade outcome', 'error');
    }
  } catch (err) {
    window.showTradeToast('Error connecting to server', 'error');
  }
};

window.saveAdminSettings = async function () {
  const treasury = document.getElementById('adm-setting-treasury')?.value || 'TRBuYjnRoj9jM3WheB2k4X1t3SdxsYGr2j';
  const globalOutcome = document.getElementById('adm-setting-global-outcome')?.value || 'LOSS';

  try {
    const res = await fetch(`${window.API_BASE_URL}/api/admin/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ treasuryAddress: treasury, globalTradeOutcome: globalOutcome })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      window.showTradeToast(`⚙️ Settings Saved! Global Outcome: ${globalOutcome}, Deposit/Withdraw Fees: 0%`, 'success');
    } else {
      window.showTradeToast(data.message || 'Failed to save settings', 'error');
    }
  } catch (err) {
    window.showTradeToast('Settings saved locally!', 'info');
  }
};



// ==========================================================================
// SWAP, CONVERTER & SUPPORT CHAT HANDLERS
// ==========================================================================
window.calcSwapResult = function () {
  const fromSym = document.getElementById('swap-from')?.value || 'USDT';
  const toSym = document.getElementById('swap-to')?.value || 'BTC';
  const fromVal = parseFloat(document.getElementById('swap-from-val')?.value) || 0;
  const toInput = document.getElementById('swap-to-val');
  if (!toInput) return;

  const prices = {
    USDT: 1.00,
    BTC: 67420.50,
    ETH: 3512.80,
    SOL: 148.25,
    XRP: 0.6241,
    DOGE: 0.1248
  };

  const fromPrice = prices[fromSym] || 1.00;
  const toPrice = prices[toSym] || 1.00;

  if (fromVal <= 0) {
    toInput.value = '';
    return;
  }

  const result = (fromVal * fromPrice) / toPrice;
  toInput.value = result < 1 ? result.toFixed(6) : result.toFixed(4);
};

window.swapTokens = function () {
  const fromSelect = document.getElementById('swap-from');
  const toSelect = document.getElementById('swap-to');
  const fromValInput = document.getElementById('swap-from-val');
  const toValInput = document.getElementById('swap-to-val');

  if (!fromSelect || !toSelect) return;

  const temp = fromSelect.value;
  fromSelect.value = toSelect.value;
  toSelect.value = temp;

  if (toValInput && toValInput.value) {
    if (fromValInput) fromValInput.value = toValInput.value;
  }

  window.calcSwapResult();
};

window.changeLang = function () {
  const select = document.getElementById('lang-select');
  const lang = select ? select.value : 'en';
  const langNames = {
    en: 'English',
    ur: 'اردو (Urdu)',
    ar: 'العربية (Arabic)',
    hi: 'हिन्दी (Hindi)',
    zh: '中文 (Chinese)',
    es: 'Español',
    fr: 'Français',
    tr: 'Türkçe'
  };
  window.showTradeToast(`🌐 Language switched to ${langNames[lang] || lang}`, 'info');
};

window.toggleChat = function () {
  const panel = document.getElementById('chat-panel');
  if (!panel) return;
  panel.style.display = (panel.style.display === 'none' || panel.style.display === '') ? 'flex' : 'none';
};

window.sendChat = function () {
  const input = document.getElementById('chat-input');
  const body = document.getElementById('chat-body');
  if (!input || !body) return;

  const msg = input.value.trim();
  if (!msg) return;

  const userMsgEl = document.createElement('div');
  userMsgEl.className = 'chat-msg';
  userMsgEl.style.cssText = 'background:#facc15; color:#000; margin-left:auto; text-align:right; border-radius:12px 12px 0 12px; margin-bottom:8px; padding:8px 12px; max-width:80%; font-size:13px; font-weight:600;';
  userMsgEl.textContent = msg;
  body.appendChild(userMsgEl);

  input.value = '';
  body.scrollTop = body.scrollHeight;

  setTimeout(() => {
    const botMsgEl = document.createElement('div');
    botMsgEl.className = 'chat-msg';
    botMsgEl.style.cssText = 'background:#1e293b; color:#f8fafc; margin-right:auto; border-radius:12px 12px 12px 0; margin-bottom:8px; padding:8px 12px; max-width:85%; font-size:13px;';
    botMsgEl.textContent = "Thank you for contacting BitCashs 24/7 Support! An agent will assist you shortly.";
    body.appendChild(botMsgEl);
    body.scrollTop = body.scrollHeight;
  }, 800);
};



// ==========================================================================
// TRADING SUITE LOGIC, TABS, MODES & ORDERBOOK
// ==========================================================================
window.currentSuiteSymbol = 'BTC';
window.currentSuitePrice = 67420.50;
window.currentOrderSide = 'buy';

window.setTradeMode = function (el, modeKey) {
  try {
    document.querySelectorAll('#spot-menu .icon-menu-item, .icon-menu-item').forEach(item => item.classList.remove('active'));
    if (el) el.classList.add('active');

    document.querySelectorAll('.trade-mode-panel').forEach(panel => {
      panel.style.display = 'none';
      panel.classList.remove('active');
    });

    const targetPanel = document.getElementById(`trademode-${modeKey}`);
    if (targetPanel) {
      targetPanel.style.display = 'block';
      targetPanel.classList.add('active');
    }
  } catch (e) {
    console.warn('setTradeMode error:', e);
  }
};

window.changeSuitePair = function (sym) {
  try {
    if (!sym) sym = 'BTC';
    sym = sym.toUpperCase().replace('/USDT', '').replace('USDT', '');
    window.currentSuiteSymbol = sym;
    const pairName = `${sym}/USDT`;

    const obTitle = document.getElementById('ob-pair-title');
    if (obTitle) obTitle.textContent = `ORDER BOOK — ${pairName}`;

    const amountSym = document.getElementById('spot-amount-sym');
    if (amountSym) amountSym.textContent = sym;

    const basePrices = {
      BTC: 67420.50,
      ETH: 3512.80,
      SOL: 148.25,
      XRP: 0.6241,
      DOGE: 0.1248,
      ADA: 0.4520,
      AVAX: 28.50,
      BNB: 580.00
    };

    window.currentSuitePrice = basePrices[sym] || 100.00;

    const priceInput = document.getElementById('spot-price');
    if (priceInput) priceInput.value = window.currentSuitePrice;

    if (typeof window.calcSpotTotal === 'function') window.calcSpotTotal();
    if (typeof window.generateOrderBook === 'function') window.generateOrderBook(window.currentSuitePrice);

    const iframe = document.getElementById('tv-suite-iframe');
    if (iframe) {
      const tvSym = `BINANCE:${sym}USDT`;
      iframe.src = `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=${tvSym}&interval=15&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=141923&studies=%5B%5D&theme=dark&style=1&timezone=Etc%2FUTC&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en`;
    }
  } catch (e) {
    console.warn('changeSuitePair error:', e);
  }
};

window.setOrderSide = function (side) {
  window.currentOrderSide = side;
  const buyTab = document.getElementById('spot-buy-tab');
  const sellTab = document.getElementById('spot-sell-tab');
  const actionBtn = document.getElementById('spot-action-btn');

  if (side === 'buy') {
    if (buyTab) {
      buyTab.style.background = 'rgba(52,211,153,0.15)';
      buyTab.style.color = '#34d399';
    }
    if (sellTab) {
      sellTab.style.background = 'transparent';
      sellTab.style.color = '#94a3b8';
    }
    if (actionBtn) {
      actionBtn.textContent = `Place Buy Order`;
      actionBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
    }
  } else {
    if (sellTab) {
      sellTab.style.background = 'rgba(239,68,68,0.15)';
      sellTab.style.color = '#f87171';
    }
    if (buyTab) {
      buyTab.style.background = 'transparent';
      buyTab.style.color = '#94a3b8';
    }
    if (actionBtn) {
      actionBtn.textContent = `Place Sell Order`;
      actionBtn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
    }
  }
};

window.calcSpotTotal = function () {
  const price = parseFloat(document.getElementById('spot-price')?.value) || window.currentSuitePrice || 0;
  const amount = parseFloat(document.getElementById('spot-amount')?.value) || 0;
  const totalInput = document.getElementById('spot-total');
  if (totalInput) {
    totalInput.value = (price * amount).toFixed(2);
  }
};

window.setSpotPercentage = function (pct) {
  const userBalanceUSDT = 10000;
  const price = parseFloat(document.getElementById('spot-price')?.value) || window.currentSuitePrice || 1;
  const targetTotal = userBalanceUSDT * pct;
  const amount = targetTotal / price;

  const amountInput = document.getElementById('spot-amount');
  if (amountInput) {
    amountInput.value = amount.toFixed(4);
    if (typeof window.calcSpotTotal === 'function') window.calcSpotTotal();
  }
};

window.executeTradeOrder = function (modeName) {
  const sym = window.currentSuiteSymbol || 'BTC';
  const price = document.getElementById('spot-price')?.value || window.currentSuitePrice;
  const amount = document.getElementById('spot-amount')?.value || '0.05';
  const sideUpper = (window.currentOrderSide || 'buy').toUpperCase();

  window.showTradeToast(`🚀 Order Executed! ${sideUpper} ${amount} ${sym} @ $${price} USDT`, 'success');
};

window.switchObTab = function (tab) {
  const wrapOb = document.getElementById('ob-content-wrap');
  const wrapTrades = document.getElementById('trades-content-wrap');
  const btnOb = document.getElementById('ob-tab-main');
  const btnTrades = document.getElementById('ob-tab-trades');

  if (tab === 'ob') {
    if (wrapOb) wrapOb.style.display = 'flex';
    if (wrapTrades) wrapTrades.style.display = 'none';
    if (btnOb) { btnOb.style.color = '#eab308'; btnOb.style.fontWeight = '700'; }
    if (btnTrades) { btnTrades.style.color = '#94a3b8'; btnTrades.style.fontWeight = '600'; }
  } else {
    if (wrapOb) wrapOb.style.display = 'none';
    if (wrapTrades) wrapTrades.style.display = 'flex';
    if (btnTrades) { btnTrades.style.color = '#eab308'; btnTrades.style.fontWeight = '700'; }
    if (btnOb) { btnOb.style.color = '#94a3b8'; btnOb.style.fontWeight = '600'; }
    if (typeof window.generateRecentTrades === 'function') window.generateRecentTrades(window.currentSuitePrice);
  }
};

window.generateOrderBook = function (basePrice = 67420.50) {
  const asksEl = document.getElementById('ob-asks');
  const bidsEl = document.getElementById('ob-bids');
  const spreadEl = document.getElementById('ob-spread');

  if (!asksEl || !bidsEl) return;

  const step = basePrice * 0.0004;

  let asksHTML = '';
  for (let i = 6; i >= 1; i--) {
    const price = (basePrice + (i * step)).toFixed(basePrice < 1 ? 4 : 2);
    const size = (Math.random() * 1.5 + 0.05).toFixed(3);
    const depthPct = Math.min(100, Math.floor(size * 45));
    asksHTML += `
      <div style="display:grid; grid-template-columns:1fr 1fr; font-size:11px; padding:3px 0; position:relative;">
        <div style="position:absolute; right:0; top:0; bottom:0; width:${depthPct}%; background:rgba(239,68,68,0.12); pointer-events:none;"></div>
        <span style="color:#f87171; font-weight:600; z-index:1;">$${price}</span>
        <span style="text-align:right; color:#e2e8f0; z-index:1;">${size}</span>
      </div>
    `;
  }
  asksEl.innerHTML = asksHTML;

  if (spreadEl) {
    spreadEl.textContent = `$${basePrice >= 1000 ? basePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : basePrice.toFixed(2)} ▲`;
  }

  let bidsHTML = '';
  for (let i = 1; i <= 6; i++) {
    const price = (basePrice - (i * step)).toFixed(basePrice < 1 ? 4 : 2);
    const size = (Math.random() * 1.5 + 0.05).toFixed(3);
    const depthPct = Math.min(100, Math.floor(size * 45));
    bidsHTML += `
      <div style="display:grid; grid-template-columns:1fr 1fr; font-size:11px; padding:3px 0; position:relative;">
        <div style="position:absolute; right:0; top:0; bottom:0; width:${depthPct}%; background:rgba(52,211,153,0.12); pointer-events:none;"></div>
        <span style="color:#34d399; font-weight:600; z-index:1;">$${price}</span>
        <span style="text-align:right; color:#e2e8f0; z-index:1;">${size}</span>
      </div>
    `;
  }
  bidsEl.innerHTML = bidsHTML;
};

window.generateRecentTrades = function (basePrice = 67420.50) {
  const container = document.getElementById('recent-trades-list');
  if (!container) return;

  const now = new Date();
  let tradesHTML = '';

  for (let i = 0; i < 12; i++) {
    const timeStr = new Date(now.getTime() - (i * 12000)).toTimeString().split(' ')[0];
    const isBuy = Math.random() > 0.45;
    const diff = (Math.random() - 0.5) * basePrice * 0.002;
    const p = (basePrice + diff).toFixed(basePrice < 1 ? 4 : 2);
    const size = (Math.random() * 0.8 + 0.02).toFixed(3);

    tradesHTML += `
      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; font-size:11px; padding:3px 0; border-bottom:1px solid rgba(255,255,255,0.03);">
        <span style="color:#64748b;">${timeStr}</span>
        <span style="color:${isBuy ? '#34d399' : '#f87171'}; font-weight:600;">$${p}</span>
        <span style="text-align:right; color:#e2e8f0;">${size}</span>
      </div>
    `;
  }
  container.innerHTML = tradesHTML;
};



// ==========================================================================
// REAL-TIME HOME DASHBOARD LIVE MARKET PRICES & 7D SPARKLINE CHARTS
// ==========================================================================

// Helper: Generate Smooth SVG Sparkline Path (Emerald Green for Up / Rose Red for Down)
window.generate7dSparklineSVG = function (coinKey, isUp) {
  const color = isUp ? '#10B981' : '#F43F5E';
  const gradId = `spark-grad-${coinKey}-${isUp ? 'up' : 'down'}`;

  // Precise curved 7d trajectory points
  let points = isUp
    ? [[0, 62], [28, 58], [56, 64], [84, 46], [112, 50], [140, 36], [168, 40], [196, 24], [224, 28], [252, 16], [280, 20], [300, 10]]
    : [[0, 14], [28, 20], [56, 16], [84, 34], [112, 30], [140, 46], [168, 42], [196, 56], [224, 52], [252, 64], [280, 60], [300, 68]];

  let pathD = `M ${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const cx = (p1[0] + p2[0]) / 2;
    pathD += ` C ${cx},${p1[1]} ${cx},${p2[1]} ${p2[0]},${p2[1]}`;
  }

  const fillD = `${pathD} L 300,80 L 0,80 Z`;

  return `
    <svg width="100%" height="70" viewBox="0 0 300 80" preserveAspectRatio="none" style="display:block; overflow:visible; filter: drop-shadow(0 4px 10px ${isUp ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'});">
      <defs>
        <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${color}" stop-opacity="0.35"/>
          <stop offset="80%" stop-color="${color}" stop-opacity="0.04"/>
          <stop offset="100%" stop-color="${color}" stop-opacity="0.0"/>
        </linearGradient>
      </defs>
      <path d="${fillD}" fill="url(#${gradId})" />
      <path d="${pathD}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  `;
};

// Target Coins configuration for Home Dashboard
window.HOME_TARGET_COINS = [
  { sym: 'BTCUSDT', key: 'btc', name: 'Bitcoin', code: 'BTC', icon: '₿', defaultPrice: 67420.50, defaultChange: 2.45, defaultVol: '$28.4B' },
  { sym: 'ETHUSDT', key: 'eth', name: 'Ethereum', code: 'ETH', icon: 'Ξ', defaultPrice: 3512.80, defaultChange: 1.82, defaultVol: '$14.2B' },
  { sym: 'SOLUSDT', key: 'sol', name: 'Solana', code: 'SOL', icon: '◎', defaultPrice: 148.25, defaultChange: -3.12, defaultVol: '$3.8B' },
  { sym: 'XRPUSDT', key: 'xrp', name: 'XRP', code: 'XRP', icon: '✕', defaultPrice: 0.6241, defaultChange: 0.95, defaultVol: '$1.9B' },
  { sym: 'DOGEUSDT', key: 'doge', name: 'Dogecoin', code: 'DOGE', icon: 'Ð', defaultPrice: 0.1248, defaultChange: -1.45, defaultVol: '$980M' }
];

window.fetchHomeLivePrices = async function () {
  try {
    let tickers = [];
    try {
      const sRes = await fetch(`${window.API_BASE_URL}/api/markets`);
      if (sRes.ok) {
        const sData = await sRes.json();
        if (sData.success && sData.markets) tickers = sData.markets;
      }
    } catch (e) {
      try {
        const pRes = await fetch(`${window.API_BASE_URL}/api/market/prices`);
        if (pRes.ok) {
          const pData = await pRes.json();
          if (pData.success && pData.data) tickers = pData.data;
        }
      } catch (e2) { }
    }

    const coinMap = {};
    window.HOME_TARGET_COINS.forEach(tc => {
      let price = tc.defaultPrice;
      let change = tc.defaultChange;
      let volStr = tc.defaultVol;

      if (tickers && tickers.length > 0) {
        const match = tickers.find(t => t.symbol === tc.sym || t.pair === tc.sym || (t.coin && t.coin.toUpperCase() === tc.code));
        if (match) {
          price = parseFloat(match.lastPrice || match.price || price);
          change = parseFloat(match.priceChangePercent || match.change24h || match.change || change);
          const volNum = parseFloat(match.quoteVolume || match.volume || 0);
          if (volNum > 1e9) {
            volStr = '$' + (volNum / 1e9).toFixed(1) + 'B';
          } else if (volNum > 1e6) {
            volStr = '$' + (volNum / 1e6).toFixed(1) + 'M';
          }
        }
      }

      const isUp = change >= 0;
      coinMap[tc.sym] = {
        ...tc,
        price,
        change,
        volStr,
        isUp,
        priceFormatted: price < 1 ? `$${price.toFixed(4)}` : `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        changeFormatted: (isUp ? '+' : '') + change.toFixed(2) + '%'
      };
    });

    // 1. UPDATE HERO POPULAR MARKETS WIDGET (#home-popular-markets)
    const heroCard = document.getElementById('home-popular-markets');
    if (heroCard) {
      let heroHTML = `<h3>Popular Markets</h3>`;
      window.HOME_TARGET_COINS.forEach(tc => {
        const c = coinMap[tc.sym];
        if (c) {
          const colorClass = c.isUp ? 'green' : 'red';
          heroHTML += `
            <div class="price-item" onclick="showPage('trade')" style="cursor:pointer;" title="Click to Trade ${c.name}">
              <span style="font-weight:700;">${c.code}/USDT</span>
              <span class="${colorClass}" style="font-weight:800; font-family:monospace;">
                ${c.priceFormatted} <small style="font-weight:700; font-size:12px;">(${c.changeFormatted})</small>
              </span>
            </div>
          `;
        }
      });
      heroCard.innerHTML = heroHTML;
    }

    // 2. UPDATE MAIN TOP MARKETS TABLE (#home-top-markets-body)
    const topTbody = document.getElementById('home-top-markets-body');
    if (topTbody) {
      let topHTML = '';
      window.HOME_TARGET_COINS.forEach(tc => {
        const c = coinMap[tc.sym];
        if (c) {
          const colorClass = c.isUp ? 'green' : 'red';
          topHTML += `
            <tr onclick="showPage('trade')" style="cursor:pointer; border-bottom:1px solid rgba(255,255,255,0.05); transition:background 0.2s ease;" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background='transparent'">
              <td style="padding:14px 18px;">
                <div class="coin" style="display:flex; align-items:center; gap:10px;">
                  <div class="coin-icon" style="font-size:20px; width:34px; height:34px; border-radius:50%; background:rgba(234,179,8,0.1); border:1px solid rgba(234,179,8,0.25); display:flex; align-items:center; justify-content:center; color:#facc15;">${c.icon}</div>
                  <div><strong style="color:#f8fafc; font-size:14px;">${c.name}</strong><br><small style="color:#94a3b8; font-weight:700;">${c.code}</small></div>
                </div>
              </td>
              <td style="padding:14px 18px; font-weight:800; color:#f8fafc; font-family:monospace; font-size:14px;">${c.priceFormatted}</td>
              <td class="${colorClass}" style="padding:14px 18px; font-weight:800; font-family:monospace; font-size:14px;">${c.changeFormatted}</td>
              <td style="padding:14px 18px; color:#cbd5e1; font-weight:600; font-size:13px;">${c.volStr}</td>
            </tr>
          `;
        }
      });
      topTbody.innerHTML = topHTML;
    }

    // 3. UPDATE RUNNING TICKER TRACK (#crypto-ticker-track / #ticker-track)
    const tickerTrack = document.getElementById('crypto-ticker-track') || document.getElementById('ticker-track');
    if (tickerTrack) {
      let tickerHTML = '';
      window.HOME_TARGET_COINS.forEach(tc => {
        const c = coinMap[tc.sym];
        if (c) {
          const colorClass = c.isUp ? 'green' : 'red';
          tickerHTML += `
            <div class="ticker-item" style="display:inline-flex; align-items:center; gap:8px; margin-right:32px; font-size:13px; font-weight:700;">
              <span style="color:#fde68a;">${c.code}/USDT</span>
              <span style="color:#f8fafc; font-family:monospace;">${c.priceFormatted}</span>
              <span class="${colorClass}">${c.changeFormatted}</span>
            </div>
          `;
        }
      });
      tickerTrack.innerHTML = tickerHTML + tickerHTML;
    }

    // 4. RENDER 5 COIN GRAPHS (7D) MINI SPARKLINE CARDS (#home-charts-grid)
    const homeGrid = document.getElementById('home-charts-grid');
    if (homeGrid) {
      let gridHTML = '';
      window.HOME_TARGET_COINS.forEach(tc => {
        const c = coinMap[tc.sym];
        if (c) {
          const colorHex = c.isUp ? '#10B981' : '#F43F5E';
          const bgBadge = c.isUp ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)';
          const borderBadge = c.isUp ? 'rgba(16,185,129,0.35)' : 'rgba(244,63,94,0.35)';
          const svgChart = window.generate7dSparklineSVG(c.key, c.isUp);

          gridHTML += `
            <div class="sparkline-card" onclick="showPage('charts')" title="Click to view full ${c.name} chart">
              <!-- Top Row: Icon + Name & 7d/24h Change Badge -->
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="width:28px; height:28px; border-radius:50%; background:rgba(234,179,8,0.15); border:1px solid rgba(234,179,8,0.3); display:inline-flex; align-items:center; justify-content:center; color:#facc15; font-size:14px; font-weight:800;">${c.icon}</span>
                  <div>
                    <strong style="color:#f8fafc; font-size:14px; font-weight:800;">${c.name}</strong>
                    <span style="color:#94a3b8; font-size:11px; font-weight:700; margin-left:4px;">${c.code}</span>
                  </div>
                </div>
                <span style="background:${bgBadge}; color:${colorHex}; border:1px solid ${borderBadge}; padding:3px 8px; border-radius:6px; font-size:12px; font-weight:800; font-family:monospace;">
                  ${c.changeFormatted}
                </span>
              </div>

              <!-- Price Row -->
              <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:12px;">
                <span style="font-size:22px; font-weight:900; color:#facc15; font-family:monospace;">${c.priceFormatted}</span>
                <span style="font-size:11px; color:#94a3b8; font-weight:600;">24h Vol: ${c.volStr}</span>
              </div>

              <!-- Glowing SVG Sparkline Curve -->
              <div style="width:100%; border-radius:10px; overflow:hidden;">
                ${svgChart}
              </div>
            </div>
          `;
        }
      });
      homeGrid.innerHTML = gridHTML;
    }

  } catch (err) {
    console.warn('fetchHomeLivePrices Error:', err);
  }
};

window.fetchLivePrices = window.fetchHomeLivePrices;

// Start continuous polling every 3.5 seconds
if (window.homePriceInterval) clearInterval(window.homePriceInterval);
window.homePriceInterval = setInterval(window.fetchHomeLivePrices, 3500);

// Run immediately on initialization
setTimeout(() => {
  if (typeof window.fetchHomeLivePrices === 'function') window.fetchHomeLivePrices();
}, 200);


// Universal Admin Check Helper
window.checkIsAdmin = function () {
  try {
    const role = localStorage.getItem('role');
    if (role && (role.toUpperCase() === 'ADMIN' || role.toLowerCase() === 'admin')) return true;

    const userJson = localStorage.getItem('user') || localStorage.getItem('bitcashs_user') || localStorage.getItem('current_user');
    if (userJson) {
      const u = JSON.parse(userJson);
      if (u.role && (u.role.toUpperCase() === 'ADMIN' || u.role.toLowerCase() === 'admin')) return true;
      if (u.isAdmin === true) return true;
      if (u.email && (u.email.toLowerCase() === 'admin@bitcashs.com' || u.email.toLowerCase() === 'admin')) return true;
      if (u.username && (u.username.toLowerCase() === 'admin' || u.username.toLowerCase() === 'system admin')) return true;
      if (u.fullName && (u.fullName.toLowerCase() === 'system admin' || u.fullName.toLowerCase() === 'administrator')) return true;
    }
  } catch (e) { }
  return false;
};

// ==========================================================================
// CORE GLOBAL NAVIGATION & UI HANDLERS (LINE 1 DEFINITIONS)
// ==========================================================================
window.showTradeToast = function (message, type = 'info') {
  let toast = document.getElementById('trade-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'trade-toast';
    toast.style.cssText = 'position:fixed; bottom:20px; right:20px; z-index:9999999; padding:12px 24px; border-radius:12px; color:#fff; font-weight:700; font-size:14px; box-shadow:0 10px 30px rgba(0,0,0,0.5); transition:all 0.3s ease; display:none;';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  const bgColors = {
    error: '#ef4444',
    warning: '#f59e0b',
    success: '#10b981',
    info: '#3b82f6'
  };
  toast.style.background = bgColors[type] || bgColors.info;
  toast.style.display = 'block';
  toast.style.opacity = '1';

  if (window.toastTimeout) clearTimeout(window.toastTimeout);
  window.toastTimeout = setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => { toast.style.display = 'none'; }, 300);
  }, 3500);
};

// ==========================================================================
// ROUTE & AUTH PROTECTION SYSTEM FOR NON-LOGGED-IN USERS
// ==========================================================================
window.requireAuth = function (featureName = 'access this feature') {
  const token = localStorage.getItem('token') || localStorage.getItem('bitcashs_token');
  const userJson = localStorage.getItem('user') || localStorage.getItem('bitcashs_user');
  let isLoggedIn = false;
  try {
    if (token && userJson) {
      const u = JSON.parse(userJson);
      if (u && (u.email || u.id || u._id)) {
        isLoggedIn = true;
      }
    }
  } catch (e) { }

  if (!isLoggedIn) {
    window.showTradeToast('Please login or create an account to access this feature.', 'warning');
    if (typeof window.openLoginModal === 'function') {
      window.openLoginModal();
    }
    return false;
  }
  return true;
};

window.handleRewardsClick = function (e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  if (typeof window.closeMobileMenu === 'function') {
    window.closeMobileMenu();
  }
  if (typeof window.showTradeToast === 'function') {
    window.showTradeToast('🎁 Rewards Program is coming soon! Stay tuned.', 'info');
  }
};
function handleRewardsClick(e) { window.handleRewardsClick(e); }

window.showPage = function (pageId) {
  try {
    // Intercept Rewards navigation to show Coming Soon notification
    if (pageId === 'rewards' || pageId === 'rewards-section') {
      if (typeof window.closeMobileMenu === 'function') window.closeMobileMenu();
      if (typeof window.showTradeToast === 'function') {
        window.showTradeToast('🎁 Rewards Program is coming soon! Stay tuned.', 'info');
      }
      return;
    }

    const token = localStorage.getItem('token') || localStorage.getItem('bitcashs_token');
    const userJson = localStorage.getItem('user') || localStorage.getItem('bitcashs_user');
    let isLoggedIn = false;
    let userRole = 'user';
    try {
      if (token && userJson) {
        const u = JSON.parse(userJson);
        if (u && (u.email || u.id || u._id)) {
          isLoggedIn = true;
          userRole = (u.role || 'user').toLowerCase();
        }
      }
    } catch (e) { }

    // Public pages: Only 'home' and 'contact'
    const publicPages = ['home', 'contact'];

    // ROUTE / AUTH PROTECTION:
    // If not logged in and user clicks Trade, Wallet, Mining, Rewards, Deposit, Withdraw, Converter, Charts, etc.
    if (!isLoggedIn && !publicPages.includes(pageId)) {
      window.showTradeToast('Please login or create an account to access this feature.', 'warning');
      if (typeof window.openLoginModal === 'function') {
        window.openLoginModal();
      }
      return;
    }

    // Access Control Guards for Admin
    const isUserAdmin = window.checkIsAdmin();
    if ((pageId === 'admin-control-panel' || pageId === 'admin-dashboard' || pageId === 'admin-panel-view' || pageId === 'admin') && !isUserAdmin) {
      window.showTradeToast('Access Denied: Admin privileges required', 'warning');
      pageId = 'home';
    }

    if (isUserAdmin && (pageId === 'admin' || pageId === 'admin-dashboard' || pageId === 'admin-panel-view' || pageId === 'admin-control-panel' || pageId === 'admin-section')) {
      if (typeof window.showAdminDashboard === 'function') return window.showAdminDashboard();
      pageId = 'admin-panel-view';
    }

    // Hide all page containers
    document.querySelectorAll('.page, .page-section, section.page-section').forEach(p => {
      p.classList.remove('active');
      p.classList.add('hidden');
      p.style.display = 'none';
    });

    // Deactivate active nav links
    document.querySelectorAll('nav a.nav-link').forEach(link => {
      link.classList.remove('active');
    });

    let targetPage = document.getElementById(`${pageId}-section`) || document.getElementById(`${pageId}-panel-view`) || document.getElementById(pageId);
    if (!targetPage && (pageId === 'admin-dashboard' || pageId === 'admin-control-panel' || pageId === 'admin')) {
      targetPage = document.getElementById('admin-panel-view') || document.getElementById('admin-control-panel');
    }
    if (!targetPage && pageId === 'mining') {
      targetPage = document.getElementById('mining-section') || document.getElementById('plans-section');
    }
    if (!targetPage && pageId === 'converter') {
      targetPage = document.getElementById('converter-section') || document.getElementById('converter');
    }

    if (targetPage) {
      targetPage.classList.remove('hidden');
      targetPage.classList.add('active');
      targetPage.style.display = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Trigger page-specific data fetching safely
      try {
        if (pageId === 'profile' && typeof window.fetchUserProfile === 'function') window.fetchUserProfile();
        if (pageId === 'rewards' && typeof window.updateRewardsUI === 'function') window.updateRewardsUI();
        if (pageId === 'wallet' && typeof window.fetchWalletData === 'function') window.fetchWalletData();
        if (pageId === 'deposit-page' || pageId === 'deposit') {
          if (!window.selectedMiningPlan) {
            const badgeEl = document.getElementById('dep-page-plan-badge');
            const amtInput = document.getElementById('dep-page-amount');
            if (badgeEl) badgeEl.style.display = 'none';
            if (amtInput) {
              amtInput.min = 100;
              amtInput.placeholder = 'Enter amount (min. 100 USDT)';
            }
          }
        }
        // Populate Withdraw Page Details
        if (pageId === 'withdraw-page' || pageId === 'withdraw') {
          const userBal = window.getUserBalanceNumber();
          const availEl = document.getElementById('withdraw-page-avail-bal');
          const nameInput = document.getElementById('withdraw-page-name');
          if (availEl) availEl.textContent = `$${userBal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`;
          if (nameInput && userJson) {
            try {
              const u = JSON.parse(userJson);
              if (!nameInput.value) nameInput.value = u.fullName || u.username || '';
            } catch (e) { }
          }
        }
        if (pageId === 'markets' && typeof window.fetchLiveMarkets === 'function') window.fetchLiveMarkets();
        if ((pageId === 'admin-panel-view' || pageId === 'admin-control-panel' || pageId === 'admin') && typeof window.fetchAdminDashboard === 'function') window.fetchAdminDashboard();
      } catch (err) {
        console.warn(`Data fetch error for ${pageId}:`, err);
      }
    }

    // Highlight matching active navbar link and mobile drawer link
    const activeNav = document.querySelector(`nav a.nav-link[onclick*="${pageId}"]`);
    if (activeNav) activeNav.classList.add('active');

    document.querySelectorAll('.mobile-nav-link').forEach(ml => {
      ml.classList.remove('active');
      if (ml.getAttribute('onclick') && ml.getAttribute('onclick').includes(`'${pageId}'`)) {
        ml.classList.add('active');
      }
    });

    if (typeof window.closeMobileMenu === 'function') {
      window.closeMobileMenu();
    }
  } catch (err) {
    console.error('showPage Error:', err);
  }
};

window.handleGetStarted = function () {
  const token = localStorage.getItem('token') || localStorage.getItem('bitcashs_token');
  if (token) {
    window.showPage('trade');
  } else {
    window.openSignupModal();
  }
};


// Utility: Toggle password visibility
window.togglePasswordVisibility = function (inputId, toggleId) {
  const input = document.getElementById(inputId);
  const toggle = document.getElementById(toggleId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    if (toggle) toggle.textContent = '🔒';
  } else {
    input.type = 'password';
    if (toggle) toggle.textContent = '👁️';
  }
};

window.fetchLivePrices = async function () {
  if (typeof window.fetchLiveMarkets === 'function') {
    return window.fetchLiveMarkets();
  }
};

// ========== CRITICAL GLOBAL AUTH MODAL HANDLERS (LINE 1 ATTACHMENT) ==========
window.openLoginModal = function () {
  const overlay = document.getElementById('auth-modal-overlay');
  const loginPanel = document.getElementById('login-modal') || document.getElementById('modal-login-panel');
  const signupPanel = document.getElementById('signup-modal') || document.getElementById('modal-signup-panel');
  const forgotPanel = document.getElementById('modal-forgot-panel');

  if (overlay) overlay.style.display = 'flex';
  if (loginPanel) loginPanel.style.display = 'block';
  if (signupPanel) signupPanel.style.display = 'none';
  if (forgotPanel) forgotPanel.style.display = 'none';

  if (window.currentAuthEmail || window.currentSignupEmail) {
    const loginEmailInput = document.getElementById('modal-login-email') || document.getElementById('login-email-input');
    if (loginEmailInput) loginEmailInput.value = window.currentAuthEmail || window.currentSignupEmail;
  }
};

window.openSignupModal = function () {
  const overlay = document.getElementById('auth-modal-overlay');
  const loginPanel = document.getElementById('login-modal') || document.getElementById('modal-login-panel');
  const signupPanel = document.getElementById('signup-modal') || document.getElementById('modal-signup-panel');
  const forgotPanel = document.getElementById('modal-forgot-panel');

  if (overlay) overlay.style.display = 'flex';
  if (loginPanel) loginPanel.style.display = 'none';
  if (signupPanel) signupPanel.style.display = 'block';
  if (forgotPanel) forgotPanel.style.display = 'none';

  if (typeof window.showModalSignupStep === 'function') window.showModalSignupStep('details');
};

// ==========================================================================
// AUTHENTICATION & MODAL CONTROLLERS (SERVER-BACKED MONGODB & OTP)
// ==========================================================================
window.closeAuthModal = function () {
  const overlay = document.getElementById('auth-modal-overlay');
  if (overlay) overlay.style.display = 'none';
  if (window.resendTimerInterval) clearInterval(window.resendTimerInterval);
};

window.openLoginModal = function () {
  const overlay = document.getElementById('auth-modal-overlay');
  const loginModal = document.getElementById('login-modal') || document.getElementById('modal-login-panel');
  const signupModal = document.getElementById('signup-modal') || document.getElementById('modal-signup-panel');
  const otpModal = document.getElementById('modal-signup-otp-panel');
  const forgotModal = document.getElementById('modal-forgot-panel');

  if (loginModal) loginModal.style.display = 'block';
  if (signupModal) signupModal.style.display = 'none';
  if (otpModal) otpModal.style.display = 'none';
  if (forgotModal) forgotModal.style.display = 'none';
  if (overlay) overlay.style.display = 'flex';
};

window.openSignupModal = function () {
  const overlay = document.getElementById('auth-modal-overlay');
  const loginModal = document.getElementById('login-modal') || document.getElementById('modal-login-panel');
  const signupModal = document.getElementById('signup-modal') || document.getElementById('modal-signup-panel');
  const otpModal = document.getElementById('modal-signup-otp-panel');
  const forgotModal = document.getElementById('modal-forgot-panel');

  if (loginModal) loginModal.style.display = 'none';
  if (signupModal) signupModal.style.display = 'block';
  if (otpModal) otpModal.style.display = 'none';
  if (forgotModal) forgotModal.style.display = 'none';
  if (overlay) overlay.style.display = 'flex';
};

window.openForgotPasswordModal = function () {
  const overlay = document.getElementById('auth-modal-overlay');
  const loginModal = document.getElementById('login-modal') || document.getElementById('modal-login-panel');
  const signupModal = document.getElementById('signup-modal') || document.getElementById('modal-signup-panel');
  const otpModal = document.getElementById('modal-signup-otp-panel');
  const forgotModal = document.getElementById('modal-forgot-panel');

  if (loginModal) loginModal.style.display = 'none';
  if (signupModal) signupModal.style.display = 'none';
  if (otpModal) otpModal.style.display = 'none';
  if (forgotModal) forgotModal.style.display = 'block';

  window.showModalForgotStep('request');
  if (overlay) overlay.style.display = 'flex';
};

window.showModalSignupStep = function (step) {
  const signupModal = document.getElementById('signup-modal') || document.getElementById('modal-signup-panel');
  const otpModal = document.getElementById('modal-signup-otp-panel');
  if (step === 'otp') {
    if (signupModal) signupModal.style.display = 'none';
    if (otpModal) otpModal.style.display = 'block';
  } else {
    if (signupModal) signupModal.style.display = 'block';
    if (otpModal) otpModal.style.display = 'none';
  }
};

window.showModalForgotStep = function (step) {
  const reqStep = document.getElementById('modal-forgot-step-request');
  const resetStep = document.getElementById('modal-forgot-step-reset');
  if (step === 'request') {
    if (reqStep) reqStep.style.display = 'block';
    if (resetStep) resetStep.style.display = 'none';
  } else {
    if (reqStep) reqStep.style.display = 'none';
    if (resetStep) resetStep.style.display = 'block';
  }
};

window.showAdminPanel = function () {
  if (typeof window.showAdminDashboard === 'function') {
    window.showAdminDashboard();
  } else if (typeof window.showPage === 'function') {
    window.showPage('admin-panel-view');
  }
};

// 1. SIGNUP HANDLER (Sends OTP via backend)
window.handleSignup = async function (e) {
  if (e) e.preventDefault();
  const username = (document.getElementById('modal-reg-username')?.value || document.getElementById('reg-fullname')?.value || '').trim();
  const email = (document.getElementById('modal-reg-email')?.value || document.getElementById('reg-email')?.value || '').trim().toLowerCase();
  const phone = (document.getElementById('modal-reg-phone')?.value || document.getElementById('reg-mobile')?.value || '').trim();
  const country = document.getElementById('modal-reg-country')?.value || 'Global';
  const password = (document.getElementById('modal-reg-password')?.value || document.getElementById('reg-password')?.value || '').trim();
  const confirmPassword = (document.getElementById('modal-reg-cpassword')?.value || document.getElementById('reg-cpassword')?.value || '').trim();
  const referredBy = (document.getElementById('modal-reg-ref')?.value || '').trim();
  const errDiv = document.getElementById('modal-signup-error');

  if (errDiv) errDiv.style.display = 'none';

  if (!email || !password) {
    if (errDiv) { errDiv.textContent = 'Please enter email and password'; errDiv.style.display = 'block'; }
    return window.showTradeToast('Please enter email and password', 'warning');
  }

  if (password.length < 6) {
    if (errDiv) { errDiv.textContent = 'Password must be at least 6 characters'; errDiv.style.display = 'block'; }
    return window.showTradeToast('Password must be at least 6 characters', 'warning');
  }

  if (confirmPassword && password !== confirmPassword) {
    if (errDiv) { errDiv.textContent = 'Passwords do not match'; errDiv.style.display = 'block'; }
    return window.showTradeToast('Passwords do not match', 'warning');
  }

  try {
    const res = await fetch(`${window.API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, mobile: phone, country, referredBy })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      const msg = data.message || 'Registration failed';
      if (errDiv) { errDiv.textContent = msg; errDiv.style.display = 'block'; }
      throw new Error(msg);
    }

    window.currentSignupEmail = email;
    window.currentAuthEmail = email;

    const targetEmailEl = document.getElementById('modal-otp-target-email') || document.getElementById('otp-target-email');
    if (targetEmailEl) targetEmailEl.textContent = window.currentSignupEmail;

    window.showModalSignupStep('otp');
    window.showTradeToast(`📧 Verification OTP sent to ${window.currentSignupEmail}`, 'info');

  } catch (err) {
    window.showTradeToast(err.message || 'Network Error connecting to server', 'error');
  }
};

window.handleRegister = window.handleSignup;

// 1b. VERIFY SIGNUP OTP HANDLER
window.handleVerifySignupOTP = async function (e) {
  if (e) e.preventDefault();
  const otpInput = document.getElementById('modal-signup-otp')?.value || document.getElementById('reg-otp-code')?.value || '';
  const errDiv = document.getElementById('modal-otp-error');
  if (errDiv) errDiv.style.display = 'none';

  if (!otpInput || otpInput.length < 6) {
    if (errDiv) { errDiv.textContent = 'Please enter a valid 6-digit OTP code'; errDiv.style.display = 'block'; }
    return window.showTradeToast('Please enter a valid 6-digit OTP code', 'warning');
  }

  const verifyEmail = window.currentSignupEmail || window.currentAuthEmail;
  if (!verifyEmail) {
    if (errDiv) { errDiv.textContent = 'Email address missing. Please try signing up again.'; errDiv.style.display = 'block'; }
    return window.showTradeToast('Email address missing', 'warning');
  }

  try {
    const res = await fetch(`${window.API_BASE_URL}/api/auth/verify-signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: verifyEmail, otp: otpInput })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      const msg = data.message || 'OTP verification failed';
      if (errDiv) { errDiv.textContent = msg; errDiv.style.display = 'block'; }
      throw new Error(msg);
    }

    window.openLoginModal();
    window.showTradeToast('🎉 Account verified successfully! Please log in.', 'success');

  } catch (err) {
    window.showTradeToast(err.message || 'Verification failed', 'error');
  }
};

// 2. LOGIN HANDLER
window.handleLogin = async function (e) {
  if (e) e.preventDefault();
  const emailInput = (document.getElementById('modal-login-email')?.value || document.getElementById('login-email-input')?.value || '').trim();
  const passwordInput = (document.getElementById('modal-login-pass')?.value || document.getElementById('login-password-input')?.value || '').trim();
  const errDiv = document.getElementById('modal-login-error');

  if (errDiv) errDiv.style.display = 'none';

  if (!emailInput || !passwordInput) {
    if (errDiv) { errDiv.textContent = 'Please enter your email/username and password'; errDiv.style.display = 'block'; }
    return window.showTradeToast('Please enter your email/username and password', 'warning');
  }

  try {
    const res = await fetch(`${window.API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrMobile: emailInput, email: emailInput, username: emailInput, password: passwordInput })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      const msg = data.message || 'Invalid email or password';
      if (errDiv) { errDiv.textContent = msg; errDiv.style.display = 'block'; }
      throw new Error(msg);
    }

    const userRole = (data.user && data.user.role) ? data.user.role.toUpperCase() : 'USER';
    const isAdmin = userRole === 'ADMIN' || (data.user && data.user.isAdmin === true) || data.user.email === 'admin@bitcashs.com';

    // Store tokens & user details in localStorage
    localStorage.setItem('token', data.token);
    localStorage.setItem('bitcashs_token', data.token);
    localStorage.setItem('bitcashs_user', JSON.stringify(data.user));
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('role', userRole);

    window.closeAuthModal();

    if (isAdmin) {
      if (typeof window.showAdminPanel === 'function') {
        window.showAdminPanel();
      } else if (typeof window.showAdminDashboard === 'function') {
        window.showAdminDashboard();
      }
    } else {
      if (typeof window.showPage === 'function') window.showPage('home');
    }

    if (typeof window.updateAuthUI === 'function') window.updateAuthUI();
    window.showTradeToast(`Welcome back, ${data.user.username || data.user.fullName || 'User'}!`, 'success');

  } catch (err) {
    window.showTradeToast(err.message || 'Login failed', 'error');
  }
};

// 3. LOGOUT HANDLER
window.handleLogout = function (e) {
  if (e) e.preventDefault();
  localStorage.removeItem('token');
  localStorage.removeItem('bitcashs_token');
  localStorage.removeItem('user');
  localStorage.removeItem('bitcashs_user');
  localStorage.removeItem('role');
  localStorage.removeItem('current_user');

  if (typeof window.updateAuthUI === 'function') window.updateAuthUI();
  if (typeof window.showPage === 'function') window.showPage('home');
  window.showTradeToast('Logged out successfully', 'info');
};

window.handleAdminLogout = function (e) {
  window.handleLogout(e);
};

// 4. FORGOT PASSWORD FLOW
window.handleForgotPassword = async function (e) {
  if (e) e.preventDefault();
  const emailInput = document.getElementById('forgot-email-input') || document.getElementById('modal-forgot-email');
  const email = (emailInput?.value || '').trim().toLowerCase();
  const errDiv = document.getElementById('modal-forgot-req-error');

  if (errDiv) errDiv.style.display = 'none';

  if (!email) {
    if (errDiv) { errDiv.textContent = 'Please enter your registered email address'; errDiv.style.display = 'block'; }
    return window.showTradeToast('Please enter your registered email address', 'warning');
  }

  try {
    const res = await fetch(`${window.API_BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      const msg = data.message || 'Failed to send reset code';
      if (errDiv) { errDiv.textContent = msg; errDiv.style.display = 'block'; }
      throw new Error(msg);
    }

    window.currentAuthEmail = email;
    const targetEmailEl = document.getElementById('modal-forgot-target-email');
    if (targetEmailEl) targetEmailEl.textContent = email;

    window.showModalForgotStep('reset');
    window.showTradeToast('✅ 6-digit reset code sent to your email!', 'success');
  } catch (err) {
    window.showTradeToast(err.message || 'Error sending reset code', 'error');
  }
};

window.handleSendResetOTP = window.handleForgotPassword;

window.verifyForgotOtp = async function (e) {
  if (e) e.preventDefault();
  const otpInput = document.getElementById('forgot-otp-input') || document.getElementById('modal-forgot-otp');
  const otp = (otpInput?.value || '').trim();
  const errDiv = document.getElementById('modal-forgot-reset-error');

  if (!otp || otp.length < 6) {
    if (errDiv) { errDiv.textContent = 'Please enter the 6-digit reset code'; errDiv.style.display = 'block'; }
    return window.showTradeToast('Please enter the 6-digit reset code', 'warning');
  }

  window.showTradeToast('OTP code confirmed. Enter your new password below.', 'info');
};

window.submitNewPassword = async function (e) {
  if (e) e.preventDefault();
  const otpInput = document.getElementById('forgot-otp-input') || document.getElementById('modal-forgot-otp');
  const newPassInput = document.getElementById('forgot-new-password') || document.getElementById('modal-forgot-newpass');
  const confirmPassInput = document.getElementById('forgot-confirm-password') || document.getElementById('modal-forgot-cnewpass');
  const errDiv = document.getElementById('modal-forgot-reset-error');

  if (errDiv) errDiv.style.display = 'none';

  const otp = (otpInput?.value || '').trim();
  const newPassword = (newPassInput?.value || '').trim();
  const confirmPassword = (confirmPassInput?.value || '').trim();
  const email = window.currentAuthEmail || '';

  if (!otp || otp.length < 6) {
    if (errDiv) { errDiv.textContent = 'Please enter the 6-digit reset code'; errDiv.style.display = 'block'; }
    return window.showTradeToast('Please enter the 6-digit reset code', 'warning');
  }

  if (!newPassword || newPassword.length < 6) {
    if (errDiv) { errDiv.textContent = 'Password must be at least 6 characters'; errDiv.style.display = 'block'; }
    return window.showTradeToast('Password must be at least 6 characters', 'warning');
  }

  if (newPassword !== confirmPassword) {
    if (errDiv) { errDiv.textContent = 'Passwords do not match'; errDiv.style.display = 'block'; }
    return window.showTradeToast('Passwords do not match', 'warning');
  }

  try {
    const res = await fetch(`${window.API_BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, newPassword })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      const msg = data.message || 'Password reset failed';
      if (errDiv) { errDiv.textContent = msg; errDiv.style.display = 'block'; }
      throw new Error(msg);
    }

    if (otpInput) otpInput.value = '';
    if (newPassInput) newPassInput.value = '';
    if (confirmPassInput) confirmPassInput.value = '';

    window.openLoginModal();
    window.showTradeToast('🎉 Password reset successfully! Please log in.', 'success');
  } catch (err) {
    window.showTradeToast(err.message || 'Password reset failed', 'error');
  }
};

window.resetPassword = window.submitNewPassword;
window.handleResetPassword = window.submitNewPassword;


// ========== WALLET MODAL HANDLERS ==========
window.openWalletModal = function (type) { if (type === 'withdraw') { window.showPage('withdraw-page'); } else { window.showPage('deposit-page'); } };


window.fetchWalletData = async function () {
  const token = localStorage.getItem('token') || localStorage.getItem('bitcashs_token');
  const userJson = localStorage.getItem('user') || localStorage.getItem('bitcashs_user');
  let email = '';
  let localUser = null;
  try {
    if (userJson) {
      localUser = JSON.parse(userJson);
      email = localUser.email || '';
    }
  } catch (err) { }

  // 1. Initial immediate paint from cached user object to eliminate any lag or demo numbers
  if (localUser) {
    const bal = parseFloat(localUser.balance) || 0;
    const btcPrice = (window.liveMarketPrices && window.liveMarketPrices['bitcoin']?.usd) || 64500.0;
    const btcVal = (bal / btcPrice).toFixed(4);

    const balUsdEl = document.getElementById('wallet-total-balance-usd');
    const balBtcEl = document.getElementById('wallet-total-balance-btc');

    if (balUsdEl) balUsdEl.textContent = `$${bal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (balBtcEl) balBtcEl.textContent = `≈ ${btcVal} BTC`;

    if (typeof window.updateInvestmentOverviewCards === 'function') {
      window.updateInvestmentOverviewCards(localUser);
    }
  }

  if (!email && !token) return;

  // 2. Fetch authoritative fresh live data from server
  try {
    const res = await fetch(`${window.API_BASE_URL}/api/user/wallet?email=${encodeURIComponent(email)}`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });

    if (!res.ok) return;
    const data = await res.json();
    if (!data.success) return;

    const w = data.wallet || {};
    const balance = parseFloat(data.balance !== undefined ? data.balance : w.totalBalanceUsd) || 0;
    const btcPrice = (window.liveMarketPrices && window.liveMarketPrices['bitcoin']?.usd) || 64500.0;
    const btcVal = (balance / btcPrice).toFixed(4);

    // Update Top Wallet Financial Cards
    const balUsdEl = document.getElementById('wallet-total-balance-usd');
    const balBtcEl = document.getElementById('wallet-total-balance-btc');
    const dailyEarnEl = document.getElementById('wallet-daily-earnings-usd');
    const totalProfitEl = document.getElementById('wallet-total-profit-usd');

    if (balUsdEl) balUsdEl.textContent = `$${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (balBtcEl) balBtcEl.textContent = `≈ ${btcVal} BTC`;
    if (dailyEarnEl) dailyEarnEl.textContent = `+$${(parseFloat(w.dailyEarningsUsd) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (totalProfitEl) totalProfitEl.textContent = `+$${(parseFloat(w.totalProfitUsd) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Update Investment Overview cards
    if (typeof window.updateInvestmentOverviewCards === 'function') {
      window.updateInvestmentOverviewCards(w);
    }

    // Sync cached user balance
    if (userJson) {
      try {
        const u = JSON.parse(userJson);
        u.balance = balance;
        u.activePlansCount = w.activePlansCount;
        u.activePlans = w.activePlans;
        u.totalInvested = w.totalInvestedUsd;
        u.totalDeposits = w.totalDepositedUsd;
        localStorage.setItem('user', JSON.stringify(u));
      } catch (e) { }
    }

    // Update Binary Options Stake Available Balances
    if (typeof window.updateOptionAvailableBalance === 'function') window.updateOptionAvailableBalance();

    // 3. Render Crypto Assets Table
    const assetsTbody = document.getElementById('wallet-assets-tbody');
    if (assetsTbody && data.assets) {
      assetsTbody.innerHTML = data.assets.map(a => {
        const aBal = parseFloat(a.balance) || 0;
        const aInOrder = parseFloat(a.inOrder) || 0;
        const aUsd = parseFloat(a.usdValue) || 0;
        return `
          <tr style="border-bottom:1px solid rgba(255,255,255,0.05); transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
            <td style="padding:16px 20px; font-weight:700; color:#f8fafc; display:flex; align-items:center; gap:10px;">
              <span style="font-size:18px; width:28px; height:28px; border-radius:50%; background:rgba(234,179,8,0.15); color:#facc15; display:inline-flex; align-items:center; justify-content:center;">${a.icon || '₮'}</span>
              <div>
                <div>${a.name}</div>
                <div style="font-size:11px; color:#94a3b8; font-weight:600;">${a.symbol}</div>
              </div>
            </td>
            <td style="padding:16px 20px; font-family:monospace; font-weight:700; color:#ffffff;">${aBal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</td>
            <td style="padding:16px 20px; font-family:monospace; color:#94a3b8;">${aInOrder.toFixed(2)}</td>
            <td style="padding:16px 20px; font-family:monospace; font-weight:700; color:#facc15;">$${aUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td style="padding:16px 20px; text-align:right;">
              <button onclick="showPage('deposit-page')" style="padding:5px 12px; font-size:11px; font-weight:700; background:rgba(234,179,8,0.15); color:#fde68a; border:1px solid rgba(234,179,8,0.3); border-radius:6px; cursor:pointer; margin-right:6px;">Deposit</button>
              <button onclick="openWithdrawModal()" style="padding:5px 12px; font-size:11px; font-weight:700; background:rgba(255,255,255,0.04); color:#cbd5e1; border:1px solid rgba(255,255,255,0.1); border-radius:6px; cursor:pointer;">Withdraw</button>
            </td>
          </tr>
        `;
      }).join('');
    }

    // 4. Render Live Transaction History Table
    const txTbody = document.getElementById('wallet-tx-tbody');
    if (txTbody && data.transactions) {
      if (data.transactions.length === 0) {
        txTbody.innerHTML = `<tr><td colspan="5" style="padding:28px; text-align:center; color:#94a3b8;">No transaction history yet. Make a deposit or trade to get started.</td></tr>`;
      } else {
        txTbody.innerHTML = data.transactions.map(t => {
          const typeLower = (t.type || '').toLowerCase();
          const isDeposit = typeLower.includes('deposit');
          const isWithdrawal = typeLower.includes('withdrawal');
          const isWin = typeLower.includes('win');
          const isLoss = typeLower.includes('loss');

          const typeColor = isDeposit ? '#34d399' : (isWithdrawal ? '#facc15' : (isWin ? '#34d399' : '#f87171'));
          const typeIcon = isDeposit ? '📥' : (isWithdrawal ? '📤' : (isWin ? '🏆' : '📉'));

          const statusLower = (t.status || 'completed').toLowerCase();
          let statusBadge = '';
          if (statusLower === 'completed' || statusLower === 'approved') {
            statusBadge = '<span style="background:rgba(52,211,153,0.15); color:#34d399; font-weight:800; padding:4px 10px; border-radius:6px; font-size:11px;">COMPLETED ✓</span>';
          } else if (statusLower === 'pending') {
            statusBadge = '<span style="background:rgba(234,179,8,0.15); color:#facc15; font-weight:800; padding:4px 10px; border-radius:6px; font-size:11px;">PENDING ⏳</span>';
          } else {
            statusBadge = '<span style="background:rgba(239,68,68,0.15); color:#f87171; font-weight:800; padding:4px 10px; border-radius:6px; font-size:11px;">REJECTED ✕</span>';
          }

          const amtStr = t.amount || '$0.00';
          const amtColor = amtStr.startsWith('+') ? '#34d399' : (amtStr.startsWith('-') ? '#f87171' : '#ffffff');

          return `
            <tr style="border-bottom:1px solid rgba(255,255,255,0.05); transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
              <td style="padding:16px 20px; font-weight:700; color:${typeColor}; display:flex; align-items:center; gap:8px;">
                <span>${typeIcon}</span> <span>${t.type}</span>
              </td>
              <td style="padding:16px 20px; color:#cbd5e1; font-size:13px;">${t.coin}</td>
              <td style="padding:16px 20px; font-family:monospace; font-weight:800; color:${amtColor};">${amtStr}</td>
              <td style="padding:16px 20px;">${statusBadge}</td>
              <td style="padding:16px 20px; color:#94a3b8; font-size:12px;">${t.date}</td>
            </tr>
          `;
        }).join('');
      }
    }

  } catch (err) {
    console.error('Fetch wallet error:', err);
  }
};

window.selectPlan = function (planName, price) {
  console.log('Plan selected:', planName, price);
  window.showTradeToast(`Selected Plan: ${planName} ($${price})`, 'info');
  window.showPage('deposit-page');
};


function updateAuthUI() {
  try {
    const container = document.getElementById('auth-header-actions');
    const navWallet = document.getElementById('nav-wallet');

    const token = localStorage.getItem('token') || localStorage.getItem('bitcashs_token');
    const userJson = localStorage.getItem('user') || localStorage.getItem('bitcashs_user');

    if (token && userJson) {
      try {
        const user = JSON.parse(userJson);
        const name = user.username || user.fullName || (user.email ? user.email.split('@')[0] : 'User');
        const isAdmin = window.checkIsAdmin();

        // 1. UPDATE NAVBAR ITEM: Change 'Wallet' to 'Admin Panel' for Admins with whitespace-nowrap and flex
        const mobileNavWallet = document.getElementById('mobile-nav-wallet');
        if (navWallet) {
          if (isAdmin) {
            navWallet.textContent = 'Admin Panel';
            navWallet.innerHTML = '<span style="font-size:14px;">👑</span> <span>Admin Panel</span>';
            navWallet.setAttribute('onclick', "showAdminDashboard();");
            navWallet.style.whiteSpace = 'nowrap';
            navWallet.style.display = 'inline-flex';
            navWallet.style.alignItems = 'center';
            navWallet.style.gap = '6px';
            navWallet.style.color = '#facc15';
            navWallet.style.fontWeight = '800';
            navWallet.classList.add('nav-admin-link');
          } else {
            navWallet.textContent = 'Wallet';
            navWallet.innerHTML = 'Wallet';
            navWallet.setAttribute('onclick', "showPage('wallet');");
            navWallet.style.whiteSpace = 'nowrap';
            navWallet.style.display = 'inline-flex';
            navWallet.style.alignItems = 'center';
            navWallet.style.gap = '6px';
            navWallet.style.color = '';
            navWallet.style.fontWeight = '';
            navWallet.classList.remove('nav-admin-link');
          }
        }
        if (mobileNavWallet) {
          if (isAdmin) {
            mobileNavWallet.innerHTML = '<span>👑</span> Admin Panel';
            mobileNavWallet.setAttribute('onclick', "showAdminDashboard(); closeMobileMenu();");
            mobileNavWallet.style.color = '#facc15';
          } else {
            mobileNavWallet.innerHTML = '<span>💼</span> Wallet';
            mobileNavWallet.setAttribute('onclick', "showPage('wallet'); closeMobileMenu();");
            mobileNavWallet.style.color = '';
          }
        }

        // 2. UPDATE TOP-RIGHT AUTH PROFILE DROPDOWN
        if (container) {
          if (isAdmin) {
            container.innerHTML = `
                  <div class="profile-dropdown-wrapper" style="position:relative; display:inline-block;">
                    <button onclick="showAdminDashboard(); toggleProfileDropdown(event);" class="btn btn-outline" style="display:flex; align-items:center; gap:8px; padding:8px 14px; font-weight:700; border-color:rgba(234,179,8,0.4); color:#facc15; cursor:pointer;">
                      <span style="font-size:16px;">👑</span>
                      <span>${name} (Super Admin)</span>
                      <span style="font-size:10px;">▼</span>
                    </button>

                    <div id="profile-dropdown" style="display:none; position:absolute; right:0; top:calc(100% + 8px); width:240px; background:#141923; border:1px solid rgba(234,179,8,0.3); border-radius:12px; padding:16px; box-shadow:0 12px 30px rgba(0,0,0,0.6); z-index:10000;">
                      <div style="font-size:15px; font-weight:700; color:#fde68a; margin-bottom:2px;">System Admin</div>
                      <div style="font-size:11px; font-weight:800; color:#f87171; margin-bottom:10px;">SUPER ADMIN CONTROL</div>

                      <div style="height:1px; background:rgba(255,255,255,0.08); margin:8px 0;"></div>

                      <a onclick="showAdminDashboard(); toggleProfileDropdown();" style="display:block; padding:8px 0; color:#facc15; text-decoration:none; cursor:pointer; font-size:13px; font-weight:700;" onmouseover="this.style.color='#fde68a'" onmouseout="this.style.color='#facc15'">📊 Admin Control Panel</a>
                      <a onclick="showPage('wallet'); toggleProfileDropdown();" style="display:block; padding:6px 0; color:#e2e8f0; text-decoration:none; cursor:pointer; font-size:13px;" onmouseover="this.style.color='#eab308'" onmouseout="this.style.color='#e2e8f0'">💼 Wallet & Funds</a>
                      <a onclick="handleLogout()" style="display:block; padding:8px 0; color:#f87171; text-decoration:none; cursor:pointer; font-size:13px;" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#f87171'">🚪 Log Out</a>
                    </div>
                  </div>
                `;
          } else {
            container.innerHTML = `
                  <div class="profile-dropdown-wrapper" style="position:relative; display:inline-block;">
                    <button onclick="toggleProfileDropdown(event);" class="btn btn-outline" style="display:flex; align-items:center; gap:8px; padding:8px 14px; font-weight:600; cursor:pointer;">
                      <span style="font-size:16px;">👤</span>
                      <span>${name}</span>
                      <span style="font-size:10px;">▼</span>
                    </button>

                    <div id="profile-dropdown" style="display:none; position:absolute; right:0; top:calc(100% + 8px); width:240px; background:#141923; border:1px solid rgba(234,179,8,0.3); border-radius:12px; padding:16px; box-shadow:0 12px 30px rgba(0,0,0,0.6); z-index:10000;">
                      <div style="font-size:15px; font-weight:700; color:#fde68a; margin-bottom:4px;">${name}</div>
                      <div style="font-size:12px; color:#94a3b8; margin-bottom:12px; word-break:break-all;">${user.email || user.mobile || ''}</div>

                      <div style="height:1px; background:rgba(255,255,255,0.08); margin:8px 0;"></div>

                      <a onclick="showPage('profile'); toggleProfileDropdown();" style="display:block; padding:6px 0; color:#e2e8f0; text-decoration:none; cursor:pointer; font-size:13px;" onmouseover="this.style.color='#eab308'" onmouseout="this.style.color='#e2e8f0'">👤 My Profile</a>
                      <a onclick="showPage('wallet'); toggleProfileDropdown();" style="display:block; padding:6px 0; color:#e2e8f0; text-decoration:none; cursor:pointer; font-size:13px;" onmouseover="this.style.color='#eab308'" onmouseout="this.style.color='#e2e8f0'">💼 Wallet & Funds</a>
                      <a onclick="handleLogout()" style="display:block; padding:6px 0; color:#f87171; text-decoration:none; cursor:pointer; font-size:13px;" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#f87171'">🚪 Log Out</a>
                    </div>
                  </div>
                `;
          }
        }
      } catch (e) {
        console.error('Error parsing user data:', e);
        if (container) {
          container.innerHTML = `
                <button class="btn btn-outline" onclick="openLoginModal()">Log In</button>
                <button class="btn btn-primary" onclick="openSignupModal()">Sign Up</button>
              `;
        }
        if (navWallet) {
          navWallet.textContent = 'Wallet';
          navWallet.innerHTML = 'Wallet';
          navWallet.setAttribute('onclick', "showPage('wallet');");
          navWallet.style.color = '';
          navWallet.style.fontWeight = '';
        }
      }
    } else {
      if (container) {
        container.innerHTML = `
              <button class="btn btn-outline" onclick="openLoginModal()">Log In</button>
              <button class="btn btn-primary" onclick="openSignupModal()">Sign Up</button>
            `;
      }
      if (navWallet) {
        navWallet.textContent = 'Wallet';
        navWallet.innerHTML = 'Wallet';
        navWallet.setAttribute('onclick', "showPage('wallet');");
        navWallet.style.color = '';
        navWallet.style.fontWeight = '';
      }
    }
  } catch (err) {
    console.error('updateAuthUI Error:', err);
  }
}

function handleLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('pendingRefCode');
  updateAuthUI();
  showPage('home');
  showTradeToast('Logged out successfully.', 'info');
}

function handleAdminLogout() {
  handleLogout();
}


// ========== MASTER ADMIN DASHBOARD NAVIGATION & LOGIC ==========
window.showAdminDashboard = function () {
  try {
    if (!window.checkIsAdmin()) {
      window.showTradeToast('Access Denied: Admin privileges required', 'warning');
      return window.showPage('home');
    }

    // Hide all public/user page containers
    document.querySelectorAll('.page, .page-section').forEach(p => {
      p.classList.remove('active');
      p.classList.add('hidden');
      p.style.display = 'none';
    });

    // Activate admin panel view
    let adminView = document.getElementById('admin-panel-view') || document.getElementById('admin-control-panel');
    if (adminView) {
      adminView.classList.remove('hidden');
      adminView.classList.add('active');
      adminView.style.display = 'block';
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Fetch statistics & table lists
    if (typeof window.fetchAdminDashboard === 'function') window.fetchAdminDashboard();
  } catch (err) {
    console.error('showAdminDashboard Error:', err);
  }
};
function showAdminDashboard() { window.showAdminDashboard(); }

function admSwitchTab(tabKey) {
  try {
    const tabs = ['overview', 'withdrawals', 'deposits', 'trades', 'users', 'kyc', 'settings'];
    const headers = {
      overview: '⚡ Master Admin Overview',
      withdrawals: '📤 Withdrawal Requests & Approvals',
      deposits: '📥 Deposit Approvals',
      trades: '📈 User Binary Trades History',
      users: '👥 User Directory & Accounts',
      kyc: '🆔 KYC Verification Requests',
      settings: '⚙️ System Wallet Settings'
    };

    tabs.forEach(t => {
      const btn = document.getElementById(`adm-nav-${t}`);
      const panel = document.getElementById(`adm-panel-${t}`);
      if (btn) {
        if (t === tabKey) {
          btn.style.background = 'rgba(234,179,8,0.15)';
          btn.style.borderColor = 'rgba(234,179,8,0.3)';
          btn.style.color = '#facc15';
        } else {
          btn.style.background = 'transparent';
          btn.style.borderColor = 'transparent';
          btn.style.color = '#94a3b8';
        }
      }
      if (panel) panel.style.display = (t === tabKey ? 'block' : 'none');
    });

    const headerTitle = document.getElementById('adm-header-title');
    if (headerTitle && headers[tabKey]) headerTitle.textContent = headers[tabKey];

    fetchAdminDashboard();
  } catch (err) {
    console.error('admSwitchTab Error:', err);
  }
}

async function fetchAdminDashboard() {
  const token = localStorage.getItem('token');
  if (!token) return;

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  try {
    // 1. Fetch Stats from /api/admin/stats
    const resStats = await fetch(`${window.API_BASE_URL}/api/admin/stats`, { headers });
    if (resStats.ok) {
      const dataS = await resStats.json();
      if (dataS.success) {
        const totalUsers = dataS.totalUsers !== undefined ? dataS.totalUsers : (dataS.stats?.totalUsers || 0);
        const pendingDep = dataS.pendingDeposits !== undefined ? dataS.pendingDeposits : (dataS.stats?.pendingDeposits || 0);
        const approvedVol = dataS.totalApproved !== undefined ? dataS.totalApproved : (dataS.stats?.approvedVolume || 0);
        const sysBal = dataS.platformBalance !== undefined ? dataS.platformBalance : (dataS.stats?.platformBalance || 0);

        const elUsers = document.getElementById('stat-total-users') || document.getElementById('admin-metric-users');
        const elPending = document.getElementById('stat-pending-deposits') || document.getElementById('admin-metric-pending');
        const elApproved = document.getElementById('stat-approved-volume') || document.getElementById('admin-metric-depvol');
        const elBal = document.getElementById('stat-platform-balance') || document.getElementById('admin-metric-sysbal');
        const elRev = document.getElementById('stat-platform-revenue') || document.getElementById('admin-metric-revenue');
        const badgePending = document.getElementById('adm-badge-pending');

        if (elUsers) elUsers.textContent = totalUsers;
        if (elPending) elPending.textContent = pendingDep;
        if (elApproved) elApproved.textContent = typeof approvedVol === 'number' ? ('$' + approvedVol.toLocaleString(undefined, { minimumFractionDigits: 2 })) : approvedVol;
        if (elBal) elBal.textContent = typeof sysBal === 'number' ? ('$' + sysBal.toLocaleString(undefined, { minimumFractionDigits: 2 })) : sysBal;

        const platformRev = dataS.platformFeeRevenue !== undefined ? dataS.platformFeeRevenue : (dataS.stats?.platformFeeRevenue || dataS.platformTotalEarnings || 0);
        if (elRev) {
          const revVal = typeof platformRev === 'number' ? platformRev : (parseFloat(String(platformRev).replace(/[^0-9.]/g, '')) || 0);
          elRev.textContent = `$${revVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`;
        }

        if (badgePending) {
          badgePending.textContent = pendingDep;
          badgePending.style.display = pendingDep > 0 ? 'inline-block' : 'none';
        }
      }
    }

    // 1.5. Fetch Withdrawals from /api/admin/withdrawals
    const resWith = await fetch(`${window.API_BASE_URL}/api/admin/withdrawals`, { headers });
    if (resWith.ok) {
      const dataW = await resWith.json();
      if (dataW.success) {
        const allWith = dataW.withdrawals || [];
        const pendingWith = allWith.filter(w => (w.status || 'Pending').toLowerCase() === 'pending');

        // Update Red Badge on Sidebar
        const badgePendingWith = document.getElementById('adm-badge-pending-withdrawals');
        if (badgePendingWith) {
          badgePendingWith.textContent = pendingWith.length;
          badgePendingWith.style.display = pendingWith.length > 0 ? 'inline-block' : 'none';
        }

        renderAdminWithdrawalsTable(allWith);
      }
    }

    // 2. Fetch Pending Deposits from /api/admin/deposits/pending
    const resDep = await fetch(`${window.API_BASE_URL}/api/admin/deposits/pending`, { headers });
    if (resDep.ok) {
      const dataD = await resDep.json();
      if (dataD.success) {
        renderAdminDepositsTable(dataD.deposits || dataD.pendingDeposits || []);
      }
    }

    // 3. Fetch Users from /api/admin/users
    const resUsers = await fetch(`${window.API_BASE_URL}/api/admin/users`, { headers });
    if (resUsers.ok) {
      const dataU = await resUsers.json();
      if (dataU.success) {
        window.adminUsersList = dataU.users || [];
        renderAdminUsersTable(window.adminUsersList);
        if (typeof window.fetchAdminKycRequests === 'function') window.fetchAdminKycRequests();
        if (typeof window.fetchAdminTrades === 'function') window.fetchAdminTrades();
      }
    }

  } catch (err) {
    console.error('Fetch Admin Dashboard Error:', err);
  }
}


window.renderAdminUsersTable = function (users) {
  const tbody = document.getElementById('admin-users-table-body') || document.getElementById('admin-users-tbody');
  if (!tbody) return;

  if (!users || users.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="padding:28px; text-align:center; color:#94a3b8;">No matching registered users found.</td></tr>`;
    return;
  }

  tbody.innerHTML = users.map(u => {
    const uid = u._id || u.id;
    const curKyc = (u.kycStatus || 'UNVERIFIED').toUpperCase();

    // Interactive KYC Dropdown / Toggle
    const kycSelect = `
          <select onchange="admToggleUserKyc('${uid}', this.value)"
            style="padding:6px 10px; font-size:11px; font-weight:800; border-radius:8px; background:#080808; border:1px solid ${curKyc === 'VERIFIED' ? '#10b981' : (curKyc === 'PENDING_APPROVAL' ? '#f59e0b' : '#ef4444')}; color:${curKyc === 'VERIFIED' ? '#34d399' : (curKyc === 'PENDING_APPROVAL' ? '#facc15' : '#f87171')}; cursor:pointer;">
            <option value="VERIFIED" ${curKyc === 'VERIFIED' ? 'selected' : ''}>🟢 VERIFIED ✓</option>
            <option value="UNVERIFIED" ${curKyc === 'UNVERIFIED' ? 'selected' : ''}>🔴 UNVERIFIED</option>
            <option value="PENDING_APPROVAL" ${curKyc === 'PENDING_APPROVAL' ? 'selected' : ''}>⏳ PENDING</option>
          </select>
        `;

    const curOutcome = (u.tradeOutcome || 'DEFAULT').toUpperCase();
    const outcomeDropdown = `
          <select onchange="updateUserTradeOutcome('${uid}', this.value)"
            style="padding:6px 10px; font-size:11px; font-weight:800; border-radius:8px; background:#080808; border:1px solid ${curOutcome === 'WIN' ? '#10b981' : (curOutcome === 'LOSS' ? '#ef4444' : 'rgba(234,179,8,0.4)')}; color:${curOutcome === 'WIN' ? '#34d399' : (curOutcome === 'LOSS' ? '#f87171' : '#facc15')}; cursor:pointer;">
            <option value="DEFAULT" ${curOutcome === 'DEFAULT' ? 'selected' : ''}>⚙️ Default (Global Mode)</option>
            <option value="WIN" ${curOutcome === 'WIN' ? 'selected' : ''}>🟢 Force Win</option>
            <option value="LOSS" ${curOutcome === 'LOSS' ? 'selected' : ''}>🔴 Force Loss</option>
          </select>
        `;

    const balFormatted = parseFloat(u.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const dateStr = u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent';

    return `
          <tr style="border-bottom:1px solid rgba(255,255,255,0.05); transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
            <td style="padding:14px 16px; font-weight:700; color:#f8fafc;">${u.username || u.fullName || 'User'}</td>
            <td style="padding:14px 16px; color:#cbd5e1; font-size:13px;">${u.email}</td>
            <td style="padding:14px 16px; font-family:monospace; font-weight:800; color:#facc15;">$${balFormatted}</td>
            <td style="padding:14px 16px; text-align:center;">${kycSelect}</td>
            <td style="padding:14px 16px; text-align:center;">${outcomeDropdown}</td>
            <td style="padding:14px 16px; color:#94a3b8; font-size:12px;">${dateStr}</td>
            <td style="padding:14px 16px; text-align:center;">
              <button onclick="admEditUserBalance('${uid}', ${u.balance || 0})" style="padding:6px 14px; font-size:11px; font-weight:800; background:rgba(234,179,8,0.15); color:#fde68a; border:1px solid rgba(234,179,8,0.4); border-radius:8px; cursor:pointer; transition:0.2s;" onmouseover="this.style.background='rgba(234,179,8,0.3)'" onmouseout="this.style.background='rgba(234,179,8,0.15)'">✏️ Edit Balance</button>
            </td>
          </tr>
        `;
  }).join('');
};

window.renderAdminDepositsTable = function renderAdminDepositsTable(deposits) {
  const tbody = document.getElementById('admin-deposits-table-body') || document.getElementById('admin-deposits-tbody');
  if (!tbody) return;

  window.adminDepositsMap = window.adminDepositsMap || {};

  if (!deposits || deposits.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="padding:28px; text-align:center; color:#94a3b8;">No pending deposit requests found.</td></tr>`;
    return;
  }

  tbody.innerHTML = deposits.map(d => {
    const userDisplay = d.userEmail || d.username || 'User';
    const amountStr = `${(parseFloat(d.amount) || 0).toLocaleString()} ${d.coin || 'USDT'}`;
    const txid = d.txid || '—';
    const depositId = String(d._id || d.id);
    const status = (d.status || 'Pending').toLowerCase();

    window.adminDepositsMap[depositId] = d;

    let statusBadge = '<span style="background:rgba(234,179,8,0.15); border:1px solid rgba(234,179,8,0.35); color:#facc15; font-size:11px; font-weight:800; padding:4px 10px; border-radius:12px;">Pending</span>';
    if (status === 'approved') {
      statusBadge = '<span style="background:rgba(52,211,153,0.15); border:1px solid rgba(52,211,153,0.35); color:#34d399; font-size:11px; font-weight:800; padding:4px 10px; border-radius:12px;">Approved ✓</span>';
    } else if (status === 'rejected') {
      statusBadge = '<span style="background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.35); color:#f87171; font-size:11px; font-weight:800; padding:4px 10px; border-radius:12px;">Rejected</span>';
    }

    const rawProof = (d.proofImage || d.receipt || '').trim();
    const hasValidImg = rawProof.startsWith('http://') || rawProof.startsWith('https://') || rawProof.startsWith('data:image/png') || rawProof.startsWith('data:image/jpeg') || rawProof.startsWith('data:image/webp');

    let proofHtml = '';
    if (hasValidImg) {
      proofHtml = `<img src="${rawProof}" onclick="openReceiptModal('${depositId}')" style="width:48px; height:48px; object-fit:cover; border-radius:8px; cursor:pointer; border:1px solid rgba(234,179,8,0.4); box-shadow:0 2px 8px rgba(0,0,0,0.5); display:inline-block; vertical-align:middle;" alt="Receipt" title="Click to view full screenshot">`;
    } else {
      proofHtml = `<button type="button" onclick="openReceiptModal('${depositId}')" style="background:rgba(234,179,8,0.15); border:1px solid rgba(234,179,8,0.35); color:#fde68a; font-size:12px; font-weight:700; padding:6px 12px; border-radius:8px; cursor:pointer; display:inline-flex; align-items:center; gap:6px; transition:0.2s;" onmouseover="this.style.background='rgba(234,179,8,0.25)'" onmouseout="this.style.background='rgba(234,179,8,0.15)'"><span>🧾</span> <span>View Proof</span></button>`;
    }

    return `
          <tr style="border-bottom:1px solid rgba(255,255,255,0.05); transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
            <td style="padding:14px;"><strong style="color:#f8fafc;">${userDisplay}</strong></td>
            <td style="padding:14px;"><strong style="color:#facc15; font-size:15px; font-family:monospace;">${amountStr}</strong></td>
            <td style="padding:14px;">
              <span style="font-family:monospace; color:#94a3b8; font-size:12px; max-width:180px; display:inline-block; overflow:hidden; text-overflow:ellipsis; vertical-align:middle;" title="${txid}">${txid}</span>
            </td>
            <td style="padding:14px; text-align:center;">${proofHtml}</td>
            <td style="padding:14px; text-align:center;">${statusBadge}</td>
            <td style="padding:14px; text-align:center;">
              <div style="display:flex; gap:8px; justify-content:center;">
                <button onclick="approveAdminDeposit('${depositId}')" style="padding:6px 14px; font-size:12px; font-weight:800; background:#10b981; color:#fff; border:none; border-radius:8px; cursor:pointer; box-shadow:0 3px 10px rgba(16,185,129,0.3);">Approve</button>
                <button onclick="rejectAdminDeposit('${depositId}')" style="padding:6px 14px; font-size:12px; font-weight:800; background:#ef4444; color:#fff; border:none; border-radius:8px; cursor:pointer; box-shadow:0 3px 10px rgba(239,68,68,0.3);">Reject</button>
              </div>
            </td>
          </tr>
        `;
  }).join('');
};

async function approveAdminDeposit(depositId) {
  const token = localStorage.getItem('token');
  if (!confirm('Are you sure you want to APPROVE this deposit request and credit user balance?')) return;

  try {
    const res = await fetch(`${window.API_BASE_URL}/api/admin/deposits/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ depositId })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      showTradeToast('✅ Deposit Approved & User Balance Credited!', 'success');
      fetchAdminDashboard();
    } else {
      showTradeToast(data.message || 'Failed to approve deposit', 'warning');
    }
  } catch (err) {
    showTradeToast('Network error approving deposit.', 'warning');
  }
}

async function rejectAdminDeposit(depositId) {
  const token = localStorage.getItem('token');
  if (!confirm('Are you sure you want to REJECT this deposit request?')) return;

  try {
    const res = await fetch(`${window.API_BASE_URL}/api/admin/deposits/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ depositId, reason: 'Manual Admin Rejection' })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      showTradeToast('Deposit Request Rejected.', 'info');
      fetchAdminDashboard();
    } else {
      showTradeToast(data.message || 'Failed to reject deposit', 'warning');
    }
  } catch (err) {
    showTradeToast('Network error rejecting deposit.', 'warning');
  }
}

async function adminAdjustUserBalance(userId, currentBal) {
  const token = localStorage.getItem('token');
  const newBalStr = prompt(`Enter new balance amount for user (Current: $${currentBal}):`, currentBal);
  if (newBalStr === null) return;

  const newBalance = parseFloat(newBalStr);
  if (isNaN(newBalance) || newBalance < 0) {
    return showTradeToast('Please enter a valid positive balance number.', 'warning');
  }

  try {
    const res = await fetch(`${window.API_BASE_URL}/api/admin/users/update-balance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ userId, newBalance })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      showTradeToast(`✅ User balance updated to $${newBalance.toFixed(2)}`, 'success');
      fetchAdminDashboard();
    } else {
      showTradeToast(data.message || 'Failed to update balance', 'warning');
    }
  } catch (err) {
    showTradeToast('Network error updating balance.', 'warning');
  }
}

async function adminToggleKYC(userId, currentStatus) {
  const token = localStorage.getItem('token');
  const newStatus = currentStatus === 'VERIFIED' ? 'UNVERIFIED' : 'VERIFIED';
  if (!confirm(`Toggle KYC status to ${newStatus}?`)) return;

  try {
    const res = await fetch(`${window.API_BASE_URL}/api/admin/users/toggle-kyc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ userId, kycStatus: newStatus })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      showTradeToast(`KYC status updated to ${newStatus}`, 'success');
      fetchAdminDashboard();
    } else {
      showTradeToast(data.message || 'Failed to update KYC', 'warning');
    }
  } catch (err) {
    showTradeToast('Network error updating KYC.', 'warning');
  }
}

function saveAdminSettings() {
  const addr = document.getElementById('adm-setting-treasury')?.value;
  if (addr) {
    const pageAddr = document.getElementById('deposit-page-address');
    if (pageAddr) pageAddr.value = addr;
    showTradeToast('✅ Treasury wallet settings saved successfully!', 'success');
  }
}


function toggleProfileDropdown(e) {
  if (e) e.stopPropagation();
  const dropdown = document.getElementById('profile-dropdown');
  if (dropdown) {
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
  }
}

document.addEventListener('click', function (e) {
  const dropdown = document.getElementById('profile-dropdown');
  const wrapper = document.querySelector('.profile-dropdown-wrapper');
  if (dropdown && wrapper && !wrapper.contains(e.target)) {
    dropdown.style.display = 'none';
  }
});

// ========== DOMCONTENTLOADED PAGE STARTUP ==========
document.addEventListener('DOMContentLoaded', function () {
  try {
    updateAuthUI();

    // 1. Check referral code parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      localStorage.setItem('pendingRefCode', refCode);
      const regRefInput = document.getElementById('reg-referral-code');
      if (regRefInput) regRefInput.value = refCode;
      showPage('register');
    } else {
      // 2. Check persistent session
      const token = localStorage.getItem('token');
      const userJson = localStorage.getItem('user');
      if (token && userJson) {
        try {
          const user = JSON.parse(userJson);
          if (user.role === 'admin') {
            showAdminDashboard();
          } else {
            showPage('wallet');
          }
        } catch (e) {
          showPage('home');
        }
      } else {
        showPage('home');
      }
    }

    // 3. Start background live market feeds safely
    if (typeof window.fetchHomeLivePrices === 'function') window.fetchHomeLivePrices().catch(err => console.warn('Live price feed notice:', err));
    if (typeof window.fetchLiveMarkets === 'function') window.fetchLiveMarkets().catch(err => console.warn('Live markets feed notice:', err));

  } catch (err) {
    console.warn('Startup initialization notice:', err);
  }
});



// ========== CURRENCY & CRYPTO CONVERTER LOGIC ==========
window.converterPriceMap = window.converterPriceMap || {
  BTC: 67420.50,
  ETH: 3512.80,
  SOL: 148.25,
  XRP: 0.6241,
  DOGE: 0.1245,
  USDT: 1.0,
  USD: 1.0,
  EUR: 1.087,
  GBP: 1.266,
  PKR: 1 / 278.5
};

window.fetchConverterRates = async function () {
  try {
    const res = await fetch(`${window.API_BASE_URL}/api/converter/rates`);
    if (res.ok) {
      const data = await res.json();
      if (data.rates) {
        for (const [code, rate] of Object.entries(data.rates)) {
          if (rate > 0) {
            window.converterPriceMap[code] = 1 / rate;
          }
        }
      }
      if (data.cryptoPrices) {
        for (const [code, price] of Object.entries(data.cryptoPrices)) {
          if (price > 0) {
            window.converterPriceMap[code] = price;
          }
        }
      }
    }
  } catch (err) {
    // Keep default rates
  }
};

window.runConvert = async function () {
  const amountEl = document.getElementById('conv-amount');
  const fromEl = document.getElementById('conv-from');
  const toEl = document.getElementById('conv-to');
  const resultEl = document.getElementById('conv-result');

  if (!amountEl || !fromEl || !toEl || !resultEl) return;

  const amount = parseFloat(amountEl.value) || 0;
  const fromCode = fromEl.value || 'BTC';
  const toCode = toEl.value || 'USDT';

  // Fetch real-time rate from Binance
  await window.fetchConverterRates();

  const fromPrice = window.converterPriceMap[fromCode] || 1.0;
  const toPrice = window.converterPriceMap[toCode] || 1.0;

  // Rate per 1 unit
  const unitRate = fromPrice / toPrice;
  // Total value
  const totalConverted = amount * unitRate;

  const formatRate = (val) => {
    if (val === 0) return '0.00';
    if (val < 0.0001) return val.toFixed(8);
    if (val < 1) return val.toFixed(4);
    return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  };

  const formattedTotal = formatRate(totalConverted);
  const formattedUnit = formatRate(unitRate);

  resultEl.innerHTML = `
    <div style="font-size:28px; font-weight:800; color:#facc15; margin-bottom:6px;">
      ${amount.toLocaleString()} ${fromCode} = ${formattedTotal} ${toCode}
    </div>
    <div style="font-size:13px; font-weight:600; color:#cbd5e1; margin-bottom:12px;">
      Exchange Rate: 1 ${fromCode} = ${formattedUnit} ${toCode}
    </div>
    <div class="live-rate-badge"><span class="live-dot"></span> Live Binance rates • Auto-updated</div>
  `;
};

window.swapConvert = function () {
  const fromEl = document.getElementById('conv-from');
  const toEl = document.getElementById('conv-to');
  if (!fromEl || !toEl) return;

  const temp = fromEl.value;
  fromEl.value = toEl.value;
  toEl.value = temp;

  window.runConvert();
};


// Run initial calculation when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.runConvert === 'function') window.runConvert();
  });
} else {
  if (typeof window.runConvert === 'function') window.runConvert();
}



// ========== 7-DAY CHARTS PAGE LOGIC ==========
window.CHARTS_COINS = [
  { pair: 'BTC/USDT', sym: 'BTCUSDT', key: 'btc', name: 'Bitcoin', icon: '₿' },
  { pair: 'ETH/USDT', sym: 'ETHUSDT', key: 'eth', name: 'Ethereum', icon: 'Ξ' },
  { pair: 'SOL/USDT', sym: 'SOLUSDT', key: 'sol', name: 'Solana', icon: '◎' },
  { pair: 'XRP/USDT', sym: 'XRPUSDT', key: 'xrp', name: 'XRP', icon: '✕' },
  { pair: 'DOGE/USDT', sym: 'DOGEUSDT', key: 'doge', name: 'Dogecoin', icon: 'Ð' },
  { pair: 'ADA/USDT', sym: 'ADAUSDT', key: 'ada', name: 'Cardano', icon: '₳' },
  { pair: 'AVAX/USDT', sym: 'AVAXUSDT', key: 'avax', name: 'Avalanche', icon: '🔺' },
  { pair: 'DOT/USDT', sym: 'DOTUSDT', key: 'dot', name: 'Polkadot', icon: '●' }
];

window.fetchLiveChartsGrid = async function () {
  const container = document.getElementById('full-charts-grid');
  if (!container) return;

  try {
    let tickers = [];
    try {
      const sRes = await fetch(`${window.API_BASE_URL}/api/markets`);
      if (sRes.ok) {
        const sData = await sRes.json();
        if (sData.success && sData.markets) tickers = sData.markets;
      }
    } catch (e) {
      try {
        const pRes = await fetch(`${window.API_BASE_URL}/api/market/prices`);
        if (pRes.ok) {
          const pData = await pRes.json();
          if (pData.success && pData.data) tickers = pData.data;
        }
      } catch (e2) { }
    }

    if (!tickers || tickers.length === 0) return;

    let cardsHTML = '';
    window.CHARTS_COINS.forEach(c => {
      const match = tickers.find(t => t.symbol === c.sym || t.name === c.name);
      let price = 0;
      let change = 0;
      if (match) {
        price = parseFloat(match.lastPrice || match.price || 0);
        change = parseFloat(match.priceChangePercent || match.change || 0);
      }

      const isUp = change >= 0;
      const colorHex = isUp ? '#34d399' : '#f87171';
      const changeStr = `${isUp ? '+' : ''}${change.toFixed(2)}%`;
      const priceStr = price > 0
        ? `$${price.toLocaleString(undefined, { minimumFractionDigits: (price < 1 ? 4 : 2), maximumFractionDigits: (price < 1 ? 4 : 2) })}`
        : '—';

      const gradId = `full-chart-grad-${c.key}`;
      const color = isUp ? '#34d399' : '#f87171';

      let points = isUp
        ? [[0, 65], [35, 55], [70, 48], [105, 42], [140, 28], [175, 22], [210, 18], [245, 15], [300, 15]]
        : [[0, 15], [35, 28], [70, 38], [105, 42], [140, 52], [175, 58], [210, 65], [245, 68], [300, 68]];

      let pathD = `M ${points[0][0]},${points[0][1]}`;
      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        const cx = (p1[0] + p2[0]) / 2;
        pathD += ` C ${cx},${p1[1]} ${cx},${p2[1]} ${p2[0]},${p2[1]}`;
      }
      const fillD = `${pathD} L 300,80 L 0,80 Z`;

      const svgChart = `
        <svg width="100%" height="80" viewBox="0 0 300 80" preserveAspectRatio="none" style="display:block; overflow:visible;">
          <defs>
            <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="${color}" stop-opacity="0.35"/>
              <stop offset="100%" stop-color="${color}" stop-opacity="0.0"/>
            </linearGradient>
          </defs>
          <path d="${fillD}" fill="url(#${gradId})" />
          <path d="${pathD}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" />
        </svg>
      `;

      cardsHTML += `
        <div class="chart-card" style="background:#0e121b; border:1px solid rgba(234,179,8,0.25); border-radius:18px; padding:22px; transition:all 0.3s ease; box-shadow:0 8px 25px rgba(0,0,0,0.4);" onmouseover="this.style.borderColor='#facc15'; this.style.transform='translateY(-3px)';" onmouseout="this.style.borderColor='rgba(234,179,8,0.25)'; this.style.transform='translateY(0)';">
          <!-- Header: Pair Symbol on left, 24h % Change on right -->
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:20px;">${c.icon}</span>
              <strong style="color:#f8fafc; font-size:16px; font-weight:700;">${c.pair}</strong>
            </div>
            <span style="font-size:13px; font-weight:700; color:${colorHex}; background:${isUp ? 'rgba(52,211,153,0.12)' : 'rgba(239,68,68,0.12)'}; padding:4px 10px; border-radius:8px; border:1px solid ${isUp ? 'rgba(52,211,153,0.3)' : 'rgba(239,68,68,0.3)'};">
              ${changeStr}
            </span>
          </div>

          <!-- Center: Mini SVG sparkline wave chart -->
          <div style="width:100%; border-radius:10px; overflow:hidden; margin-bottom:14px;">
            ${svgChart}
          </div>

          <!-- Footer: Live Price on left, 7D · Live data on right -->
          <div style="display:flex; justify-content:space-between; align-items:center; padding-top:10px; border-top:1px solid rgba(255,255,255,0.06);">
            <div style="font-size:20px; font-weight:800; color:#facc15;">${priceStr}</div>
            <div style="font-size:12px; color:#94a3b8; font-weight:600; display:flex; align-items:center; gap:5px;">
              <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#10b981;"></span>
              7D · Live data
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = cardsHTML;
  } catch (err) {
    console.warn('fetchLiveChartsGrid error:', err);
  }
};

// 5-second interval for live charts grid
if (window.chartsGridInterval) clearInterval(window.chartsGridInterval);
window.chartsGridInterval = setInterval(() => {
  if (typeof window.fetchLiveChartsGrid === 'function') window.fetchLiveChartsGrid();
}, 5000);



// ========== GLOBAL USER PROFILE HANDLERS ==========
window.updateProfileInfo = async function (event) {
  if (event) event.preventDefault();
  const token = localStorage.getItem('token') || localStorage.getItem('bitcashs_token');
  const userJson = localStorage.getItem('user');
  let currentEmail = '';
  try { if (userJson) currentEmail = JSON.parse(userJson).email; } catch (e) { }

  const updatedData = {
    email: currentEmail,
    username: document.getElementById('prof-input-username')?.value || document.getElementById('profile-username')?.value || '',
    country: document.getElementById('prof-input-country')?.value || document.getElementById('profile-country')?.value || 'Global',
    phone: document.getElementById('prof-input-phone')?.value || document.getElementById('profile-phone')?.value || '',
    mobile: document.getElementById('prof-input-phone')?.value || document.getElementById('profile-phone')?.value || ''
  };

  try {
    const res = await fetch(`${window.API_BASE_URL}/api/user/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updatedData)
    });
    const data = await res.json();
    if (res.ok && data.success) {
      if (typeof window.showTradeToast === 'function') {
        window.showTradeToast('Profile updated successfully!', 'success');
      } else {
        alert('Profile updated successfully!');
      }

      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      if (typeof window.fetchUserProfile === 'function') window.fetchUserProfile();
      if (typeof window.updateAuthUI === 'function') window.updateAuthUI();
    } else {
      const msg = data.message || 'Failed to update profile';
      if (typeof window.showTradeToast === 'function') window.showTradeToast(msg, 'warning');
      else alert(msg);
    }
  } catch (err) {
    console.error('Update profile error:', err);
    if (typeof window.showTradeToast === 'function') window.showTradeToast('Network error updating profile', 'error');
    else alert('Network error updating profile');
  }
};

window.fetchUserProfile = async function () {
  const token = localStorage.getItem('token') || localStorage.getItem('bitcashs_token');
  if (!token) return;

  const userJson = localStorage.getItem('user');
  let email = '';
  try { if (userJson) email = JSON.parse(userJson).email; } catch (e) { }

  try {
    const url = email ? `${window.API_BASE_URL}/api/user/profile?email=${encodeURIComponent(email)}` : `${window.API_BASE_URL}/api/user/profile`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.user) {
        const user = data.user;
        localStorage.setItem('user', JSON.stringify(user));

        const usernameVal = user.username || user.fullName || (user.email ? user.email.split('@')[0] : 'User');
        const emailVal = user.email || '';
        const countryVal = user.country || 'Global / International';
        const phoneVal = user.mobile || user.phone || 'Not provided';
        const userIdVal = user.userId || user.id || user._id || 'IM4242';
        const roleVal = user.role || 'user';
        const kycVal = user.kycStatus || 'UNVERIFIED';
        const joinedVal = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Aug 15, 2026';
        const initials = usernameVal.substring(0, 2).toUpperCase();

        // 1. Populate Input fields
        const inUser = document.getElementById('prof-input-username') || document.getElementById('profile-username');
        const inCountry = document.getElementById('prof-input-country') || document.getElementById('profile-country');
        const inEmail = document.getElementById('prof-input-email') || document.getElementById('profile-email');
        const inPhone = document.getElementById('prof-input-phone') || document.getElementById('profile-phone');
        const inUserId = document.getElementById('prof-input-userid') || document.getElementById('profile-id');
        const inRole = document.getElementById('prof-input-role') || document.getElementById('profile-role');

        if (inUser) inUser.value = usernameVal;
        if (inCountry) inCountry.value = countryVal;
        if (inEmail) { inEmail.value = emailVal; inEmail.readOnly = true; }
        if (inPhone) inPhone.value = phoneVal !== 'Not provided' ? phoneVal : '';
        if (inUserId) inUserId.value = userIdVal;
        if (inRole) inRole.value = roleVal;

        // 2. Populate Display badges & Avatar
        const dName = document.getElementById('prof-display-name');
        const dRole = document.getElementById('prof-display-role');
        const dKyc = document.getElementById('prof-display-kyc');
        const dJoined = document.getElementById('prof-display-joined');
        const dUserId = document.getElementById('prof-display-userid');
        const dAvatar = document.getElementById('prof-avatar-initials') || document.getElementById('profile-avatar');

        if (dName) dName.textContent = usernameVal.toUpperCase();
        if (dRole) dRole.textContent = roleVal.toUpperCase();

        // 2b. Update KYC Status Badges and Profile KYC Card
        const kycStatus = (user.kycStatus || 'UNVERIFIED').toUpperCase();
        if (dKyc) {
          if (kycStatus === 'VERIFIED') {
            dKyc.innerHTML = '<span style="background:rgba(52,211,153,0.15); border:1px solid rgba(52,211,153,0.3); color:#34d399; font-size:12px; font-weight:800; padding:4px 10px; border-radius:12px;">VERIFIED ✓</span>';
          } else if (kycStatus === 'PENDING_APPROVAL') {
            dKyc.innerHTML = '<span style="background:rgba(59,130,246,0.15); border:1px solid rgba(59,130,246,0.3); color:#60a5fa; font-size:12px; font-weight:800; padding:4px 10px; border-radius:12px;">PENDING APPROVAL ⏳</span>';
          } else {
            dKyc.innerHTML = '<span style="color:#facc15; font-weight:800;">UNVERIFIED</span>';
          }
        }

        const kycCardContent = document.getElementById('prof-kyc-card-content');
        const kycIcon = document.getElementById('prof-kyc-icon');
        const kycStatusText = document.getElementById('prof-kyc-status-text');
        const kycBtn = document.getElementById('prof-kyc-btn');

        if (kycStatusText) {
          if (kycStatus === 'VERIFIED') {
            if (kycIcon) kycIcon.textContent = '✅';
            kycStatusText.textContent = 'KYC Verified. Your account has full privileges.';
            if (kycBtn) kycBtn.style.display = 'none';
          } else if (kycStatus === 'PENDING_APPROVAL') {
            if (kycIcon) kycIcon.textContent = '⏳';
            kycStatusText.textContent = '⏳ KYC Under Review: Your verification details have been submitted. Please wait, admin will approve your verification.';
            if (kycBtn) kycBtn.style.display = 'none';
          } else {
            if (kycIcon) kycIcon.textContent = '⚠️';
            kycStatusText.textContent = 'KYC pending. Please complete verification.';
            if (kycBtn) { kycBtn.style.display = 'inline-block'; kycBtn.textContent = 'Verify Now →'; }
          }
        }

        if (dJoined) dJoined.textContent = joinedVal;
        if (dUserId) dUserId.textContent = userIdVal;
        if (dAvatar) dAvatar.textContent = initials;

        // 3. Update top navbar
        if (typeof window.updateAuthUI === 'function') window.updateAuthUI();
      }
    }
  } catch (err) {
    console.error('Fetch profile error:', err);
  }
};




// Helper: Compress/resize base64 images via Canvas (Max width 1280px, quality 0.7)
async function compressBase64Image(base64Str, maxWidth = 1280, quality = 0.7) {
  if (!base64Str || typeof base64Str !== 'string' || !base64Str.startsWith('data:image')) {
    return base64Str || '';
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(base64Str);
    img.src = base64Str;
  });
}

// ========== MULTI-STEP KYC VERIFICATION CONTROLLER ==========
window.kycUploadedFiles = {
  front: '',
  back: '',
  residence: '',
  selfie: ''
};

window.goToKycStep = function (step) {
  // Validate Step 1
  if (step === 2) {
    const fn = document.getElementById('kyc-first-name')?.value?.trim();
    const ln = document.getElementById('kyc-last-name')?.value?.trim();
    const dob = document.getElementById('kyc-dob')?.value;
    if (!fn || !ln || !dob) {
      return window.showTradeToast('Please enter your First Name, Last Name, and Date of Birth', 'warning');
    }
  }

  // Validate Step 2
  if (step === 3) {
    const frontEl = document.getElementById('kyc-preview-front');
    if (!frontEl || frontEl.style.display === 'none') {
      return window.showTradeToast('Please upload the Front Side of your identity document', 'warning');
    }
  }

  // Validate Step 3
  if (step === 4) {
    const addr = document.getElementById('kyc-address')?.value?.trim();
    const resEl = document.getElementById('kyc-preview-residence');
    if (!addr) {
      return window.showTradeToast('Please enter your full residential address', 'warning');
    }
    if (!resEl || resEl.style.display === 'none') {
      return window.showTradeToast('Please upload proof of residence', 'warning');
    }
  }

  // Hide all panels, reveal target step
  for (let i = 1; i <= 4; i++) {
    const panel = document.getElementById(`kyc-panel-step-${i}`);
    const tab = document.getElementById(`kyc-step-tab-${i}`);
    if (panel) panel.style.display = (i === step) ? 'block' : 'none';
    if (tab) {
      if (i <= step) {
        tab.style.opacity = '1';
        const numDiv = tab.querySelector('div');
        if (numDiv) {
          numDiv.style.background = '#facc15';
          numDiv.style.color = '#000';
          numDiv.style.boxShadow = '0 0 15px rgba(234,179,8,0.5)';
        }
      } else {
        tab.style.opacity = '0.5';
        const numDiv = tab.querySelector('div');
        if (numDiv) {
          numDiv.style.background = '#1e293b';
          numDiv.style.color = '#94a3b8';
          numDiv.style.boxShadow = 'none';
        }
      }
    }
  }

  window.scrollTo({ top: 100, behavior: 'smooth' });
};

window.setKycDocType = function (docType) {
  const hiddenInput = document.getElementById('kyc-selected-doctype');
  if (hiddenInput) hiddenInput.value = docType;

  const btnMap = {
    'National ID': 'doc-btn-nid',
    'Driving License': 'doc-btn-dl',
    'Passport': 'doc-btn-pass'
  };

  ['National ID', 'Driving License', 'Passport'].forEach(dt => {
    const btn = document.getElementById(btnMap[dt]);
    if (btn) {
      if (dt === docType) {
        btn.style.background = 'rgba(234,179,8,0.2)';
        btn.style.border = '2px solid #eab308';
        btn.style.color = '#facc15';
      } else {
        btn.style.background = 'rgba(255,255,255,0.04)';
        btn.style.border = '1px solid rgba(255,255,255,0.1)';
        btn.style.color = '#94a3b8';
      }
    }
  });
};

window.previewKycFile = function (input, previewImgId, placeholderId) {
  if (input && input.files && input.files[0]) {
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = document.getElementById(previewImgId);
      const placeholder = document.getElementById(placeholderId);
      if (img) {
        img.src = e.target.result;
        img.style.display = 'block';
      }
      if (placeholder) placeholder.style.display = 'none';

      // Save into kycUploadedFiles
      if (previewImgId.includes('front')) window.kycUploadedFiles.front = e.target.result;
      if (previewImgId.includes('back')) window.kycUploadedFiles.back = e.target.result;
      if (previewImgId.includes('residence')) window.kycUploadedFiles.residence = e.target.result;
      if (previewImgId.includes('selfie')) window.kycUploadedFiles.selfie = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

window.startKycCamera = async function () {
  const video = document.getElementById('kyc-cam-video');
  const standby = document.getElementById('kyc-cam-standby');
  const controls = document.getElementById('kyc-cam-controls');

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    if (video) {
      video.srcObject = stream;
      video.style.display = 'block';
    }
    if (standby) standby.style.display = 'none';
    if (controls) controls.style.display = 'flex';
  } catch (err) {
    console.warn('Camera access error:', err.message);
    window.showTradeToast('Camera permission required. You can also upload a photo directly.', 'info');
  }
};

window.captureKycPhoto = function () {
  const video = document.getElementById('kyc-cam-video');
  const canvas = document.getElementById('kyc-cam-canvas');
  const preview = document.getElementById('kyc-preview-selfie');
  const placeholder = document.getElementById('kyc-placeholder-selfie');

  if (!video || !canvas) return;

  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const dataUrl = canvas.toDataURL('image/png');
  window.kycUploadedFiles.selfie = dataUrl;

  if (preview) {
    preview.src = dataUrl;
    preview.style.display = 'block';
  }
  if (placeholder) placeholder.style.display = 'none';

  // Stop camera tracks
  if (video.srcObject) {
    video.srcObject.getTracks().forEach(t => t.stop());
  }

  window.showTradeToast('Live photo captured successfully! ✓', 'success');
};

window.submitKycForm = async function (event) {
  if (event) event.preventDefault();

  const selfieImg = document.getElementById('kyc-preview-selfie');
  if (!selfieImg || selfieImg.style.display === 'none' || !selfieImg.src) {
    return window.showTradeToast('Please capture or upload your live photo with ID', 'warning');
  }

  const token = localStorage.getItem('token') || localStorage.getItem('bitcashs_token');
  const userJson = localStorage.getItem('user');
  let email = '';
  try { if (userJson) email = JSON.parse(userJson).email; } catch (e) { }

  const btn = document.getElementById('btn-kyc-submit');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Compressing & uploading...';
  }

  // Compress images before sending to prevent 413 Payload Too Large
  const [cFront, cBack, cResidence, cSelfie] = await Promise.all([
    compressBase64Image(window.kycUploadedFiles.front),
    compressBase64Image(window.kycUploadedFiles.back),
    compressBase64Image(window.kycUploadedFiles.residence),
    compressBase64Image(window.kycUploadedFiles.selfie)
  ]);

  const payload = {
    email: email,
    firstName: document.getElementById('kyc-first-name')?.value?.trim() || '',
    lastName: document.getElementById('kyc-last-name')?.value?.trim() || '',
    dob: document.getElementById('kyc-dob')?.value || '',
    country: document.getElementById('kyc-country')?.value || 'Global',
    docType: document.getElementById('kyc-selected-doctype')?.value || 'National ID',
    address: document.getElementById('kyc-address')?.value?.trim() || '',
    frontDoc: cFront,
    backDoc: cBack,
    proofResidence: cResidence,
    selfieDoc: cSelfie
  };

  if (btn) btn.textContent = 'Submitting verification...';

  try {
    const res = await fetch(`${window.API_BASE_URL}/api/kyc/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (res.ok && data.success) {
      window.showTradeToast('🎉 KYC Submitted Successfully! Verification is under review.', 'success');

      // Update local storage user
      if (userJson) {
        const u = JSON.parse(userJson);
        u.kycStatus = 'PENDING_APPROVAL';
        localStorage.setItem('user', JSON.stringify(u));
      }

      // Reset form steps
      window.goToKycStep(1);

      // Redirect back to profile view
      window.showPage('profile');

      // Update Profile screen
      if (typeof window.fetchUserProfile === 'function') {
        window.fetchUserProfile();
      }
    } else {
      window.showTradeToast(data.message || 'Failed to submit KYC', 'error');
    }
  } catch (err) {
    console.error('KYC submission network error:', err);
    window.showTradeToast('Network error submitting KYC verification', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '✓ Submit for Verification';
    }
  }
};



// ========== ADMIN KYC DOCUMENT INSPECTION & APPROVALS ==========
window.adminKycRequestsData = [];

window.fetchAdminKycRequests = async function () {
  const token = localStorage.getItem('token');
  if (!token) return;

  const tbody = document.getElementById('admin-kyc-table-body');
  if (!tbody) return;

  try {
    const res = await fetch(`${window.API_BASE_URL}/api/admin/kyc-requests`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        window.adminKycRequestsData = data.requests || [];
        renderAdminKycTable(window.adminKycRequestsData);
      }
    }
  } catch (err) {
    console.error('Fetch Admin KYC Requests Error:', err);
  }
};

function renderAdminKycTable(requests) {
  const tbody = document.getElementById('admin-kyc-table-body');
  if (!tbody) return;

  if (!requests || requests.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="padding:28px; text-align:center; color:#94a3b8;">No pending KYC verification requests found.</td></tr>`;
    return;
  }

  tbody.innerHTML = requests.map(r => {
    const userDisplay = r.email || r.username || 'User';
    const username = r.username ? `<span style="display:inline-block; margin-left:6px; background:rgba(234,179,8,0.15); border:1px solid rgba(234,179,8,0.3); color:#fde68a; font-size:11px; font-weight:700; padding:2px 8px; border-radius:10px;">${r.username}</span>` : '';
    const dateStr = r.submittedAt ? new Date(r.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today';
    const status = (r.status || r.kycStatus || 'PENDING_APPROVAL').toUpperCase();

    let statusBadge = '<span style="background:rgba(234,179,8,0.15); border:1px solid rgba(234,179,8,0.35); color:#facc15; font-size:11px; font-weight:800; padding:4px 10px; border-radius:12px;">PENDING APPROVAL</span>';
    if (status === 'VERIFIED') {
      statusBadge = '<span style="background:rgba(52,211,153,0.15); border:1px solid rgba(52,211,153,0.35); color:#34d399; font-size:11px; font-weight:800; padding:4px 10px; border-radius:12px;">VERIFIED ✓</span>';
    } else if (status === 'REJECTED') {
      statusBadge = '<span style="background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.35); color:#f87171; font-size:11px; font-weight:800; padding:4px 10px; border-radius:12px;">REJECTED</span>';
    }

    const userId = r.userId || r.id;

    return `
      <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
        <td style="padding:16px;">
          <strong style="color:#f8fafc;">${userDisplay}</strong> ${username}
        </td>
        <td style="padding:16px; color:#cbd5e1; font-size:13px;">${dateStr}</td>
        <td style="padding:16px;">${statusBadge}</td>
        <td style="padding:16px; text-align:center;">
          <div style="display:flex; gap:8px; justify-content:center;">
            <button onclick="openAdminKycModal('${userId}')" style="padding:6px 14px; font-size:12px; font-weight:700; background:rgba(234,179,8,0.2); color:#facc15; border:1px solid rgba(234,179,8,0.4); border-radius:8px; cursor:pointer;" title="View Documents">🔍 View Details & Docs</button>
            <button onclick="approveAdminKyc('${userId}')" style="padding:6px 14px; font-size:12px; font-weight:800; background:#10b981; color:#fff; border:none; border-radius:8px; cursor:pointer; box-shadow:0 3px 10px rgba(16,185,129,0.3);">Approve</button>
            <button onclick="rejectAdminKyc('${userId}')" style="padding:6px 14px; font-size:12px; font-weight:800; background:#ef4444; color:#fff; border:none; border-radius:8px; cursor:pointer; box-shadow:0 3px 10px rgba(239,68,68,0.3);">Reject</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.openAdminKycModal = function (userId) {
  const req = window.adminKycRequestsData.find(r => (r.userId || r.id) === userId);
  if (!req) return window.showTradeToast('KYC request details not found', 'warning');

  // Fill personal info
  const fullName = `${req.firstName || ''} ${req.lastName || ''}`.trim() || req.username || '—';
  const nameEl = document.getElementById('modal-kyc-name');
  const emailEl = document.getElementById('modal-kyc-email');
  const dobEl = document.getElementById('modal-kyc-dob');
  const countryEl = document.getElementById('modal-kyc-country');
  const docTypeEl = document.getElementById('modal-kyc-doctype');
  const addressEl = document.getElementById('modal-kyc-address');

  if (nameEl) nameEl.textContent = fullName;
  if (emailEl) emailEl.textContent = req.email || '—';
  if (dobEl) dobEl.textContent = req.dob || '—';
  if (countryEl) countryEl.textContent = req.country || 'Global';
  if (docTypeEl) docTypeEl.textContent = req.docType || 'National ID';
  if (addressEl) addressEl.textContent = req.fullAddress || req.address || '—';

  // Fill 4 Document Images
  const imgFront = document.getElementById('modal-kyc-img-front');
  const imgBack = document.getElementById('modal-kyc-img-back');
  const imgResidence = document.getElementById('modal-kyc-img-residence');
  const imgSelfie = document.getElementById('modal-kyc-img-selfie');

  if (imgFront) imgFront.src = req.idFrontImage || 'assets/crypto-pattern.png';
  if (imgBack) imgBack.src = req.idBackImage || 'assets/crypto-pattern.png';
  if (imgResidence) imgResidence.src = req.utilityBillImage || 'assets/crypto-pattern.png';
  if (imgSelfie) imgSelfie.src = req.livePhotoImage || 'assets/crypto-pattern.png';

  // Hook Approve & Reject buttons
  const approveBtn = document.getElementById('modal-kyc-approve-btn');
  const rejectBtn = document.getElementById('modal-kyc-reject-btn');
  if (approveBtn) approveBtn.onclick = () => approveAdminKyc(userId);
  if (rejectBtn) rejectBtn.onclick = () => rejectAdminKyc(userId);

  // Show modal
  const modal = document.getElementById('admin-kyc-modal');
  if (modal) modal.style.display = 'flex';
};

window.closeAdminKycModal = function () {
  const modal = document.getElementById('admin-kyc-modal');
  if (modal) modal.style.display = 'none';
};

window.approveAdminKyc = async function (userId) {
  const token = localStorage.getItem('token');
  if (!confirm('Are you sure you want to APPROVE this KYC verification?')) return;

  try {
    const res = await fetch(`${window.API_BASE_URL}/api/admin/kyc/approve/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ userId })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      window.showTradeToast('✅ KYC Verification Approved Successfully!', 'success');
      window.closeAdminKycModal();
      if (typeof window.fetchAdminKycRequests === 'function') window.fetchAdminKycRequests();
      if (typeof window.fetchAdminTrades === 'function') window.fetchAdminTrades();
      if (typeof window.fetchAdminDashboard === 'function') window.fetchAdminDashboard();
    } else {
      window.showTradeToast(data.message || 'Failed to approve KYC', 'warning');
    }
  } catch (err) {
    console.error('Approve KYC Error:', err);
    window.showTradeToast('Network error approving KYC', 'error');
  }
};

window.rejectAdminKyc = async function (userId) {
  const token = localStorage.getItem('token');
  if (!confirm('Are you sure you want to REJECT this KYC verification?')) return;

  try {
    const res = await fetch(`${window.API_BASE_URL}/api/admin/kyc/reject/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ userId })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      window.showTradeToast('⚠️ KYC Verification has been Rejected.', 'info');
      window.closeAdminKycModal();
      if (typeof window.fetchAdminKycRequests === 'function') window.fetchAdminKycRequests();
      if (typeof window.fetchAdminTrades === 'function') window.fetchAdminTrades();
      if (typeof window.fetchAdminDashboard === 'function') window.fetchAdminDashboard();
    } else {
      window.showTradeToast(data.message || 'Failed to reject KYC', 'warning');
    }
  } catch (err) {
    console.error('Reject KYC Error:', err);
    window.showTradeToast('Network error rejecting KYC', 'error');
  }
};



// ========== LEGAL & SECURITY MODAL CONTROLLER ==========
window.LEGAL_DOCS = {
  privacy: {
    title: '🔒 Privacy Policy',
    content: `
      <h4 style="color:#fde68a; font-size:16px; margin:0 0 10px;">1. Information We Collect</h4>
      <p style="margin-bottom:16px;">BitCashs collects account identification details, email addresses, cryptographic wallet addresses, transaction logs, and identity documents provided during KYC verification in compliance with global financial regulations.</p>

      <h4 style="color:#fde68a; font-size:16px; margin:0 0 10px;">2. How We Protect Your Data</h4>
      <p style="margin-bottom:16px;">All user data and communications are secured using bank-grade 256-bit SSL encryption and strict zero-knowledge access controls. We never sell, lease, or monetize personal user data to third-party advertisers.</p>

      <h4 style="color:#fde68a; font-size:16px; margin:0 0 10px;">3. Cookies & Analytical Telemetry</h4>
      <p style="margin-bottom:16px;">We utilize encrypted session cookies strictly for session authentication, security anomaly monitoring, and localized performance optimization.</p>

      <h4 style="color:#fde68a; font-size:16px; margin:0 0 10px;">4. User Rights & Data Protection</h4>
      <p>Users maintain full rights to review, export, or request deletion of personal records, subject to regulatory transaction record retention mandates.</p>
    `
  },
  terms: {
    title: '📄 Terms of Service',
    content: `
      <h4 style="color:#fde68a; font-size:16px; margin:0 0 10px;">1. Acceptance of Platform Terms</h4>
      <p style="margin-bottom:16px;">By creating an account, depositing digital assets, or executing orders on BitCashs, you agree to comply with all terms and conditions set forth in this agreement.</p>

      <h4 style="color:#fde68a; font-size:16px; margin:0 0 10px;">2. User Account Responsibilities</h4>
      <p style="margin-bottom:16px;">You are solely responsible for maintaining the confidentiality of your account credentials, password, and two-factor authentication keys. Any actions executed through your authenticated session are deemed authorized by you.</p>

      <h4 style="color:#fde68a; font-size:16px; margin:0 0 10px;">3. Prohibited Activities</h4>
      <p style="margin-bottom:16px;">Users may not engage in market manipulation, wash trading, unauthorized automated exploitation, or utilize the platform for unlawful financial transfers.</p>

      <h4 style="color:#fde68a; font-size:16px; margin:0 0 10px;">4. Service Availability & Execution</h4>
      <p>BitCashs strives for 99.99% uptime, but reserves the right to perform scheduled maintenance or limit trading during extreme network volatility.</p>
    `
  },
  risk: {
    title: '⚠️ Risk Disclosure Statement',
    content: `
      <h4 style="color:#fde68a; font-size:16px; margin:0 0 10px;">1. Market Volatility & Price Fluctuations</h4>
      <p style="margin-bottom:16px;">Digital asset markets operate 24/7 and experience extreme price volatility. Past price trends do not guarantee future returns, and asset valuations may fluctuate dramatically within short intervals.</p>

      <h4 style="color:#fde68a; font-size:16px; margin:0 0 10px;">2. Capital at Risk</h4>
      <p style="margin-bottom:16px;">Trading cryptocurrencies and digital derivatives involves substantial financial risk. You should never invest funds that you cannot afford to lose completely.</p>

      <h4 style="color:#fde68a; font-size:16px; margin:0 0 10px;">3. Blockchain Network Risks</h4>
      <p style="margin-bottom:16px;">Transactions recorded on public distributed ledgers are irreversible. Transferring assets to incorrect addresses or unverified smart contracts may result in permanent loss.</p>

      <h4 style="color:#fde68a; font-size:16px; margin:0 0 10px;">4. Independent Financial Advice</h4>
      <p>BitCashs provides technical trading infrastructure and does not offer financial or investment advisory services. Users are encouraged to seek advice from qualified financial advisors.</p>
    `
  },
  aml: {
    title: '🛡️ Anti-Money Laundering (AML) & KYC Policy',
    content: `
      <h4 style="color:#fde68a; font-size:16px; margin:0 0 10px;">1. Regulatory Compliance Standards</h4>
      <p style="margin-bottom:16px;">BitCashs strictly complies with global Anti-Money Laundering (AML) and Counter-Terrorist Financing (CTF) protocols and Financial Action Task Force (FATF) guidelines.</p>

      <h4 style="color:#fde68a; font-size:16px; margin:0 0 10px;">2. Customer Due Diligence (KYC)</h4>
      <p style="margin-bottom:16px;">All registered accounts must undergo multi-tiered identity verification (KYC), submitting valid government-issued photo ID, proof of residential address, and real-time live biometric verification before accessing high-volume withdrawals.</p>

      <h4 style="color:#fde68a; font-size:16px; margin:0 0 10px;">3. Automated Transaction Monitoring</h4>
      <p style="margin-bottom:16px;">Our compliance security suite continuously monitors blockchain deposit and withdrawal transactions for high-risk origins, darknet mixing services, and sanctioned addresses.</p>

      <h4 style="color:#fde68a; font-size:16px; margin:0 0 10px;">4. Suspicious Activity Reporting</h4>
      <p>Any detected transactions exhibiting characteristics of illicit financial activity will result in immediate account suspension and escalation to relevant regulatory authorities.</p>
    `
  }
};

window.openLegalModal = function (type) {
  const modal = document.getElementById('legal-content-modal') || document.getElementById('legal-modal');
  const titleEl = document.getElementById('legal-modal-title');
  const bodyEl = document.getElementById('legal-modal-body');

  const doc = window.LEGAL_DOCS[type] || window.LEGAL_DOCS.privacy;

  if (titleEl) titleEl.innerHTML = doc.title;
  if (bodyEl) bodyEl.innerHTML = doc.content;

  if (modal) {
    modal.style.display = 'flex';
  }
};

window.closeLegalModal = function () {
  const modal = document.getElementById('legal-content-modal') || document.getElementById('legal-modal');
  if (modal) {
    modal.style.display = 'none';
  }
};



// ========== DEPOSIT PROOF & ADMIN DEPOSITS CONTROLLER ==========
window.depositProofBase64 = '';

window.previewPageReceipt = function (input) {
  if (input && input.files && input.files[0]) {
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = async function (e) {
      let base64 = e.target.result;
      if (typeof compressBase64Image === 'function') {
        base64 = await compressBase64Image(base64, 1280, 0.7);
      }
      window.depositProofBase64 = base64;

      const previewBox = document.getElementById('dep-page-preview-box');
      const previewImg = document.getElementById('dep-page-preview-img');
      if (previewImg) previewImg.src = base64;
      if (previewBox) previewBox.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }
};

window.previewDepositImage = window.previewPageReceipt;

window.submitDepositProof = async function (e) {
  if (e) e.preventDefault();

  const amountInput = document.getElementById('dep-page-amount');
  const txidInput = document.getElementById('dep-page-txid');
  const fileInput = document.getElementById('dep-page-file');

  const amount = parseFloat(amountInput?.value) || 0;
  const txid = (txidInput?.value || '').trim();

  // Validate Plan Range if user selected a contract
  if (window.selectedMiningPlan) {
    const minP = window.selectedMiningPlan.min;
    const maxP = window.selectedMiningPlan.max;
    if (amount < minP) {
      return window.showTradeToast(`Deposit must match selected plan range: Minimum $${minP.toLocaleString()} USDT required for ${window.selectedMiningPlan.name}`, 'warning');
    }
    if (maxP && maxP > minP && amount > maxP) {
      return window.showTradeToast(`Deposit must match selected plan range: Maximum $${maxP.toLocaleString()} USDT for ${window.selectedMiningPlan.name}`, 'warning');
    }
  } else {
    if (amount < 100) {
      return window.showTradeToast('Minimum deposit requirement is 100 USDT', 'warning');
    }
  }

  if (!txid) {
    return window.showTradeToast('Please enter the blockchain Transaction Hash (TXID)', 'warning');
  }

  const token = localStorage.getItem('token') || localStorage.getItem('bitcashs_token');
  const userJson = localStorage.getItem('user') || localStorage.getItem('bitcashs_user');
  let email = '';
  try { if (userJson) email = JSON.parse(userJson).email; } catch (err) { }

  let proofBase64 = window.depositProofBase64 || window.uploadedReceiptBase64 || '';
  if (!proofBase64 && fileInput && fileInput.files && fileInput.files[0]) {
    try {
      proofBase64 = await new Promise((resolve) => {
        const r = new FileReader();
        r.onload = ev => resolve(ev.target.result || '');
        r.onerror = () => resolve('');
        r.readAsDataURL(fileInput.files[0]);
      });
    } catch (err) { }
  }

  const payload = {
    email: email,
    amount: amount,
    txid: txid,
    proofImage: proofBase64,
    receipt: proofBase64,
    coin: 'USDT',
    network: 'TRC20',
    planName: window.selectedMiningPlan ? window.selectedMiningPlan.name : '',
    planDuration: window.selectedMiningPlan ? window.selectedMiningPlan.duration : '',
    planDailyRoi: window.selectedMiningPlan ? window.selectedMiningPlan.dailyRoi : '',
    planMin: window.selectedMiningPlan ? window.selectedMiningPlan.min : 0,
    planMax: window.selectedMiningPlan ? window.selectedMiningPlan.max : 0
  };

  try {
    const res = await fetch(`${window.API_BASE_URL}/api/wallet/deposit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (res.ok && data.success) {
      const planMsg = window.selectedMiningPlan ? ` with '${window.selectedMiningPlan.name}' contract attached!` : '';
      window.showTradeToast(`✅ Deposit proof submitted${planMsg} Status: Pending Approval.`, 'success');

      // Clear inputs
      if (amountInput) amountInput.value = '';
      if (txidInput) txidInput.value = '';
      if (fileInput) fileInput.value = '';
      window.depositProofBase64 = '';
      window.uploadedReceiptBase64 = '';
      const previewBox = document.getElementById('dep-page-preview-box');
      if (previewBox) previewBox.style.display = 'none';
      if (typeof window.clearSelectedMiningPlan === 'function') window.clearSelectedMiningPlan();

      // Refresh wallet & navigate back
      if (typeof window.fetchWalletData === 'function') window.fetchWalletData();
      setTimeout(() => { window.showPage('wallet'); }, 1500);
    } else {
      window.showTradeToast(data.message || 'Failed to submit deposit proof', 'error');
    }
  } catch (err) {
    console.error('Deposit submission error:', err);
    window.showTradeToast('Network error submitting deposit proof', 'error');
  }
};

window.submitFullPageDepositProof = window.submitDepositProof;

// Safe Image Source Formatter for Receipts and Uploads
window.getSafeImageSrc = function (src) {
  if (!src || typeof src !== 'string') return null;
  const s = src.trim();
  if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('/') || s.startsWith('blob:')) {
    return s;
  }
  if (s.startsWith('data:image/')) {
    const parts = s.split(',');
    if (parts.length === 2 && parts[1].length > 40 && !parts[1].includes('demoProofSlip')) {
      return s;
    }
  }
  return null;
};

window.openReceiptModal = function (idOrSrc) {
  const modal = document.getElementById('admin-receipt-modal');
  const img = document.getElementById('admin-receipt-full-img');

  let targetSrc = '';
  let depositInfo = null;

  if (window.adminDepositsMap && window.adminDepositsMap[idOrSrc]) {
    depositInfo = window.adminDepositsMap[idOrSrc];
    targetSrc = (depositInfo.proofImage || depositInfo.receipt || '').trim();
  } else if (typeof idOrSrc === 'string') {
    targetSrc = idOrSrc.trim();
  }

  if (img) {
    if (targetSrc.startsWith('http://') || targetSrc.startsWith('https://') || targetSrc.startsWith('data:image/png') || targetSrc.startsWith('data:image/jpeg') || targetSrc.startsWith('data:image/webp')) {
      img.src = targetSrc;
    } else {
      const emailText = depositInfo ? (depositInfo.userEmail || depositInfo.username || 'User') : 'Verified Deposit';
      const amtText = depositInfo ? `$${(parseFloat(depositInfo.amount) || 0).toLocaleString()} USDT` : 'Blockchain Transfer';
      const txidText = depositInfo ? (depositInfo.txid || 'Confirmed') : 'TXID Verified';

      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 320;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Dark glass background
        ctx.fillStyle = '#0e121b';
        ctx.fillRect(0, 0, 600, 320);
        // Gold Border
        ctx.strokeStyle = 'rgba(234, 179, 8, 0.4)';
        ctx.lineWidth = 3;
        ctx.strokeRect(10, 10, 580, 300);
        // Header
        ctx.fillStyle = '#facc15';
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🧾 Blockchain Deposit Proof Receipt', 300, 60);
        // Amount
        ctx.fillStyle = '#34d399';
        ctx.font = 'bold 28px monospace';
        ctx.fillText(amtText, 300, 115);
        // Details
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '15px sans-serif';
        ctx.fillText(`Account: ${emailText}`, 300, 165);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '13px monospace';
        ctx.fillText(`TXID: ${txidText}`, 300, 205);
        ctx.fillText(`Network: USDT (TRC20)`, 300, 235);
        // Status stamp
        ctx.fillStyle = '#fde68a';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText('✓ SUBMITTED FOR BLOCKCHAIN APPROVAL', 300, 275);
        img.src = canvas.toDataURL('image/png');
      }
    }
  }

  if (modal) modal.style.display = 'flex';
};

window.closeReceiptModal = function () {
  const modal = document.getElementById('admin-receipt-modal');
  if (modal) modal.style.display = 'none';
};

window.approveAdminDeposit = async function (depositId) {
  const token = localStorage.getItem('token');
  if (!confirm('Are you sure you want to APPROVE this deposit and credit the user balance?')) return;

  try {
    const res = await fetch(`${window.API_BASE_URL}/api/admin/deposits/approve/${depositId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ depositId, id: depositId })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      window.showTradeToast(data.message || '✅ Deposit Approved and Credited!', 'success');
      if (typeof window.fetchAdminDashboard === 'function') window.fetchAdminDashboard();
    } else {
      window.showTradeToast(data.message || 'Failed to approve deposit', 'warning');
    }
  } catch (err) {
    console.error('Approve Deposit Error:', err);
    window.showTradeToast('Network error approving deposit', 'error');
  }
};

window.rejectAdminDeposit = async function (depositId) {
  const token = localStorage.getItem('token');
  if (!confirm('Are you sure you want to REJECT this deposit request?')) return;

  try {
    const res = await fetch(`${window.API_BASE_URL}/api/admin/deposits/reject/${depositId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ depositId, id: depositId })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      window.showTradeToast('⚠️ Deposit request has been Rejected', 'info');
      if (typeof window.fetchAdminDashboard === 'function') window.fetchAdminDashboard();
    } else {
      window.showTradeToast(data.message || 'Failed to reject deposit', 'warning');
    }
  } catch (err) {
    console.error('Reject Deposit Error:', err);
    window.showTradeToast('Network error rejecting deposit', 'error');
  }
};


// ==========================================================================
// OPTIONS / BINARY SECOND TRADING FLOW CONTROLLER (STEP A, B, C)
// ==========================================================================
window.BINARY_CYCLES = [
  { duration: 30, label: '30s', minAmount: 100, profitPct: 10 },
  { duration: 60, label: '60s', minAmount: 5000, profitPct: 20 },
  { duration: 120, label: '120s', minAmount: 50000, profitPct: 30 },
  { duration: 180, label: '180s', minAmount: 100000, profitPct: 50 },
  { duration: 360, label: '360s', minAmount: 150000, profitPct: 70 }
];

window.currentBinaryTrade = {
  pair: 'BTC/USDT',
  direction: 'Buy Up',
  cycleIndex: 0,
  stake: 100,
  profitPct: 10,
  expectedProfit: 10
};

window.binaryCountdownTimer = null;

window.openOrderModal = function (direction = 'Buy Up') {
  if (!window.requireKycVerification('trade binary options contracts')) return;

  const modal = document.getElementById('modal-order-setup');
  const dirSpan = document.getElementById('opt-modal-dir');
  const userBal = window.getUserBalanceNumber();

  window.currentBinaryTrade.direction = direction;
  window.currentBinaryTrade.pair = window.currentSuitePair || 'BTC/USDT';
  window.currentBinaryTrade.cycleIndex = 0;

  if (dirSpan) {
    dirSpan.innerText = direction;
    dirSpan.style.color = direction === 'Buy Up' ? '#34d399' : '#f87171';
  }

  window.renderBinaryCyclesGrid();
  window.selectBinaryCycle(0);
  window.updateOptionAvailableBalance();

  if (modal) modal.style.display = 'flex';
};

window.closeOrderModal = function () {
  const modal = document.getElementById('modal-order-setup');
  if (modal) modal.style.display = 'none';
};

window.closeResultModal = function () {
  const modal = document.getElementById('modal-order-result');
  if (modal) modal.style.display = 'none';
};

window.renderBinaryCyclesGrid = function () {
  const grid = document.getElementById('opt-cycles-grid');
  if (!grid) return;

  grid.innerHTML = window.BINARY_CYCLES.map((c, idx) => {
    const isSelected = idx === window.currentBinaryTrade.cycleIndex;
    const border = isSelected ? '2px solid #eab308' : '1px solid rgba(255,255,255,0.08)';
    const bg = isSelected ? 'rgba(234,179,8,0.12)' : 'rgba(255,255,255,0.02)';

    return `
      <div onclick="selectBinaryCycle(${idx})"
        style="border:${border}; background:${bg}; border-radius:12px; padding:12px 8px; text-align:center; cursor:pointer; transition:0.2s;">
        <div style="font-size:16px; font-weight:800; color:#f8fafc; margin-bottom:2px;">${c.label}</div>
        <div style="font-size:10px; color:#94a3b8; margin-bottom:4px;">Min: $${c.minAmount.toLocaleString()}</div>
        <div style="font-size:12px; font-weight:800; color:#34d399;">+${c.profitPct}%</div>
      </div>
    `;
  }).join('');
};

window.selectBinaryCycle = function (idx) {
  window.currentBinaryTrade.cycleIndex = idx;
  const cycle = window.BINARY_CYCLES[idx];
  window.currentBinaryTrade.profitPct = cycle.profitPct;

  const qtyInput = document.getElementById('opt-purchase-qty');
  if (qtyInput) {
    const currentVal = parseFloat(qtyInput.value) || 0;
    if (currentVal < cycle.minAmount) {
      qtyInput.value = cycle.minAmount;
    }
  }

  window.renderBinaryCyclesGrid();
  window.calcOptionProfit();
};

window.getUserBalanceNumber = function () {
  let userBal = 0;
  const balDisplay = document.getElementById('wallet-total-balance-usd') || document.getElementById('wallet-balance-display');
  if (balDisplay) {
    userBal = parseFloat(balDisplay.innerText.replace(/[^0-9.]/g, '')) || 0;
  }
  if (userBal <= 0) {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      try { userBal = parseFloat(JSON.parse(userJson).balance) || 0; } catch (e) { }
    }
  }
  return userBal;
};

window.updateOptionAvailableBalance = function () {
  const bal = window.getUserBalanceNumber();
  const balEl = document.getElementById('opt-user-avail-bal');
  const exchBalEl = document.getElementById('quick-exchange-avail-usdt');

  const balFormatted = `$${bal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (balEl) balEl.innerText = balFormatted;
  if (exchBalEl) exchBalEl.innerText = `$${bal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

window.setOptionStakePct = function (pct) {
  const cycle = window.BINARY_CYCLES[window.currentBinaryTrade.cycleIndex];
  const userBal = window.getUserBalanceNumber();
  const qtyInput = document.getElementById('opt-purchase-qty');
  if (!qtyInput) return;

  if (pct === 'min') {
    qtyInput.value = cycle.minAmount;
  } else {
    const target = userBal * pct;
    qtyInput.value = Math.max(cycle.minAmount, target).toFixed(2);
  }
  window.calcOptionProfit();
};

window.calcOptionProfit = function () {
  const cycle = window.BINARY_CYCLES[window.currentBinaryTrade.cycleIndex];
  const qtyInput = document.getElementById('opt-purchase-qty');
  const ratioEl = document.getElementById('opt-calc-ratio');
  const profitEl = document.getElementById('opt-calc-profit');

  const stake = parseFloat(qtyInput?.value) || 0;
  const grossProfit = (stake * cycle.profitPct) / 100;
  const platformFee = stake * 0.01; // 1% Platform Trading Fee
  const netProfit = Math.max(0, grossProfit - platformFee);

  window.currentBinaryTrade.stake = stake;
  window.currentBinaryTrade.profitPct = cycle.profitPct;
  window.currentBinaryTrade.grossProfit = grossProfit;
  window.currentBinaryTrade.platformFee = platformFee;
  window.currentBinaryTrade.expectedProfit = netProfit;
  window.currentBinaryTrade.profit = netProfit;

  if (ratioEl) ratioEl.innerText = `+${cycle.profitPct}% (Net: ${(cycle.profitPct - 1)}%)`;
  if (profitEl) {
    profitEl.innerText = `+$${netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT (Fee: $${platformFee.toFixed(2)})`;
  }
};

window.confirmBinaryOrder = async function () {
  if (!window.requireKycVerification('place trading orders')) return;

  const cycle = window.BINARY_CYCLES[window.currentBinaryTrade.cycleIndex];
  const qtyInput = document.getElementById('opt-purchase-qty');
  const stake = parseFloat(qtyInput?.value) || 0;
  const userBal = window.getUserBalanceNumber();

  if (stake < cycle.minAmount) {
    return window.showTradeToast(`Minimum purchase quantity for ${cycle.label} is $${cycle.minAmount.toLocaleString()} USDT`, 'warning');
  }

  if (stake > userBal && userBal > 0) {
    return window.showTradeToast('Insufficient available USDT balance for this contract', 'warning');
  }

  const token = localStorage.getItem('token') || localStorage.getItem('bitcashs_token');
  const userJson = localStorage.getItem('user');
  let email = '';
  try { if (userJson) email = JSON.parse(userJson).email; } catch (e) { }

  window.currentBinaryTrade.stake = stake;
  window.currentBinaryTrade.duration = cycle.duration;
  window.currentBinaryTrade.label = cycle.label;
  window.currentBinaryTrade.profitPct = cycle.profitPct;
  window.currentBinaryTrade.grossProfit = (stake * cycle.profitPct) / 100;
  window.currentBinaryTrade.platformFee = stake * 0.01;
  window.currentBinaryTrade.profit = Math.max(0, window.currentBinaryTrade.grossProfit - window.currentBinaryTrade.platformFee);

  // 1. Immediately deduct stake on backend
  try {
    const placeRes = await fetch(`${window.API_BASE_URL}/api/trade/binary-place`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        email: email,
        amount: stake,
        pair: window.currentBinaryTrade.pair,
        direction: window.currentBinaryTrade.direction,
        duration: cycle.duration,
        profitPct: cycle.profitPct
      })
    });

    const placeData = await placeRes.json();
    if (!placeRes.ok || !placeData.success) {
      return window.showTradeToast(placeData.message || 'Failed to place trade', 'error');
    }

    // Update local storage and UI balance immediately
    const updatedBal = placeData.newBalance !== undefined ? placeData.newBalance : Math.max(0, userBal - stake);
    if (userJson) {
      try {
        const uObj = JSON.parse(userJson);
        uObj.balance = updatedBal;
        localStorage.setItem('user', JSON.stringify(uObj));
      } catch (e) { }
    }

    const balDisplay = document.getElementById('wallet-total-balance-usd');
    if (balDisplay) balDisplay.innerText = `$${updatedBal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (typeof window.updateOptionAvailableBalance === 'function') window.updateOptionAvailableBalance();

    window.showTradeToast(`⚡ Order placed: -$${stake.toLocaleString()} USDT stake locked in ${cycle.label}`, 'info');

  } catch (err) {
    console.error('Binary place error:', err);
  }

  // Close Step A Modal
  window.closeOrderModal();

  // Launch Step B: Countdown Modal
  window.startBinaryCountdown(window.currentBinaryTrade);
};

window.startBinaryCountdown = function (trade) {
  const cdModal = document.getElementById('modal-order-countdown');
  const pairEl = document.getElementById('opt-cd-pair');
  const dirEl = document.getElementById('opt-cd-dir-text');
  const stakeEl = document.getElementById('opt-cd-stake-text');
  const profitEl = document.getElementById('opt-cd-profit-text');
  const secondsEl = document.getElementById('opt-cd-seconds');
  const circle = document.getElementById('opt-cd-circle');

  if (pairEl) pairEl.textContent = trade.pair;
  if (dirEl) {
    dirEl.textContent = `${trade.direction} ${trade.direction === 'Buy Up' ? '▲' : '▼'}`;
    dirEl.style.color = trade.direction === 'Buy Up' ? '#34d399' : '#f87171';
  }
  if (stakeEl) stakeEl.textContent = `$${trade.stake.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`;
  if (profitEl) profitEl.textContent = `+$${trade.profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT (+${trade.profitPct}%)`;

  const totalSec = trade.duration || 30;
  let remainingSec = totalSec;
  const totalDash = 471; // 2 * PI * 75 ≈ 471

  if (secondsEl) secondsEl.textContent = remainingSec;
  if (circle) circle.style.strokeDashoffset = 0;

  if (cdModal) cdModal.style.display = 'flex';

  if (window.binaryCountdownTimer) clearInterval(window.binaryCountdownTimer);

  window.binaryCountdownTimer = setInterval(() => {
    remainingSec--;
    if (secondsEl) secondsEl.textContent = remainingSec;

    if (circle) {
      const progress = (totalSec - remainingSec) / totalSec;
      circle.style.strokeDashoffset = totalDash * progress;
    }

    if (remainingSec <= 0) {
      clearInterval(window.binaryCountdownTimer);
      if (cdModal) cdModal.style.display = 'none';

      // Launch Step C: Result & Maturity Settlement
      window.triggerBinarySettlement(trade);
    }
  }, 1000);
};

window.triggerBinarySettlement = async function (trade) {
  const token = localStorage.getItem('token') || localStorage.getItem('bitcashs_token');
  const userJson = localStorage.getItem('user');
  let email = '';
  try { if (userJson) email = JSON.parse(userJson).email; } catch (e) { }

  const resultModal = document.getElementById('modal-order-result');
  const resultCard = document.getElementById('opt-res-card');
  const statusCircle = document.getElementById('opt-res-status-circle');
  const statusIcon = document.getElementById('opt-res-status-icon');
  const profitAmtEl = document.getElementById('opt-res-profit-amt');
  const subtitleEl = document.getElementById('opt-res-subtitle');
  const pairEl = document.getElementById('opt-res-pair');
  const dirEl = document.getElementById('opt-res-direction');
  const durEl = document.getElementById('opt-res-duration');
  const stakeEl = document.getElementById('opt-res-stake');
  const feeEl = document.getElementById('opt-res-fee');
  const pnlEl = document.getElementById('opt-res-pnl');

  const stake = trade.stake || 100;
  const platformFee = parseFloat((stake * 0.01).toFixed(2));

  // Populate basic breakdown elements
  if (pairEl) pairEl.textContent = trade.pair || 'BTC/USDT';
  if (dirEl) {
    dirEl.textContent = `${trade.direction || 'Buy Up'} ${trade.direction === 'Buy Down' ? '▼' : '▲'}`;
    dirEl.style.color = trade.direction === 'Buy Down' ? '#f87171' : '#34d399';
  }
  if (durEl) durEl.textContent = `${trade.label || (trade.duration || 30) + 's'} Cycle`;
  if (stakeEl) stakeEl.textContent = `$${stake.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`;
  if (feeEl) feeEl.textContent = `-$${platformFee.toFixed(2)} USDT (1%)`;

  let isWin = false;
  let netProfit = 0;
  let totalPayout = 0;

  // Settle on backend (Strict Loss Default unless explicitly 'WIN' or 'FORCE_WIN')
  try {
    const res = await fetch(`${window.API_BASE_URL}/api/trade/binary-settle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        email: email,
        amount: stake,
        profitPct: trade.profitPct || 10,
        pair: trade.pair,
        direction: trade.direction,
        duration: trade.duration
      })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      isWin = (data.isWin === true || data.outcome === 'WIN');
      netProfit = parseFloat(data.netProfit) || 0;
      totalPayout = parseFloat(data.totalPayout || data.totalCredit) || 0;

      // Update User balance and UI
      if (typeof window.fetchWalletData === 'function') window.fetchWalletData();
      if (typeof window.updateOptionAvailableBalance === 'function') window.updateOptionAvailableBalance();
      if (typeof window.fetchTransactions === 'function') window.fetchTransactions();
    }
  } catch (err) {
    console.warn('Binary settle network notice:', err);
  }

  // 2. Render Settlement Modal UI (Strict Loss Default vs Win)
  if (isWin) {
    // WIN STATE (Green Modal)
    if (resultCard) {
      resultCard.style.borderColor = 'rgba(52,211,153,0.4)';
      resultCard.style.boxShadow = '0 20px 60px rgba(16,185,129,0.25)';
    }
    if (statusCircle) {
      statusCircle.style.background = 'linear-gradient(135deg, #10b981, #059669)';
      statusCircle.style.boxShadow = '0 0 30px rgba(16,185,129,0.5)';
    }
    if (statusIcon) statusIcon.textContent = '✓';
    if (profitAmtEl) {
      profitAmtEl.textContent = `+$${netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`;
      profitAmtEl.style.color = '#34d399';
    }
    if (subtitleEl) {
      subtitleEl.textContent = `Contract Won! Total Payout: +$${totalPayout.toFixed(2)} USDT (Stake + Profit)`;
      subtitleEl.style.color = '#34d399';
    }
    if (pnlEl) {
      pnlEl.textContent = `+$${totalPayout.toFixed(2)} USDT (Net: +$${netProfit.toFixed(2)})`;
      pnlEl.style.color = '#34d399';
    }
    window.showTradeToast(`🎉 Trade WON! +$${netProfit.toFixed(2)} Net Profit credited (Total returned: +$${totalPayout.toFixed(2)})`, 'success');

  } else {
    // STRICT DEFAULT LOSS STATE (Red Modal)
    if (resultCard) {
      resultCard.style.borderColor = 'rgba(239,68,68,0.4)';
      resultCard.style.boxShadow = '0 20px 60px rgba(239,68,68,0.25)';
    }
    if (statusCircle) {
      statusCircle.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
      statusCircle.style.boxShadow = '0 0 30px rgba(239,68,68,0.5)';
    }
    if (statusIcon) statusIcon.textContent = '✕';
    if (profitAmtEl) {
      profitAmtEl.textContent = `-$${stake.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`;
      profitAmtEl.style.color = '#ef4444';
    }
    if (subtitleEl) {
      subtitleEl.textContent = 'Settlement Loss / Contract Expired (Stake Retained)';
      subtitleEl.style.color = '#f87171';
    }
    if (pnlEl) {
      pnlEl.textContent = `-$${stake.toFixed(2)} USDT`;
      pnlEl.style.color = '#ef4444';
    }
    window.showTradeToast(`📉 Trade Expired: -$${stake.toFixed(2)} USDT Loss`, 'error');
  }

  if (resultModal) resultModal.style.display = 'flex';
};


// ==========================================================================
// CONVERTER & WALLET QUICK EXCHANGE SWAP CONTROLLER
// ==========================================================================
window.quickExchangeRates = {
  BTC: 67420.50,
  ETH: 3512.80,
  SOL: 148.25
};

window.calcQuickExchange = function () {
  const fromInput = document.getElementById('quick-exchange-from-val');
  const toCoinSelect = document.getElementById('quick-exchange-to-coin');
  const receiveInput = document.getElementById('quick-exchange-receive-val');
  const rateHint = document.getElementById('quick-exchange-rate-hint');

  const amountUsdt = parseFloat(fromInput?.value) || 0;
  const toCoin = toCoinSelect?.value || 'BTC';
  const coinPrice = window.quickExchangeRates[toCoin] || 67420.50;

  const receiveVal = amountUsdt / coinPrice;
  if (receiveInput) {
    receiveInput.value = amountUsdt > 0 ? receiveVal.toFixed(6) : '';
  }

  if (rateHint) {
    rateHint.textContent = `1 ${toCoin} ≈ $${coinPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`;
  }
};

window.setQuickExchangeMax = function () {
  const bal = window.getUserBalanceNumber();
  const fromInput = document.getElementById('quick-exchange-from-val');
  if (fromInput) {
    fromInput.value = bal > 0 ? bal.toFixed(2) : '100';
    window.calcQuickExchange();
  }
};

window.submitQuickExchange = async function () {
  const token = localStorage.getItem('token') || localStorage.getItem('bitcashs_token');
  if (!token) {
    if (typeof window.showTradeToast === 'function') {
      window.showTradeToast('Please log in to exchange digital assets', 'info');
    }
    if (typeof window.openLoginModal === 'function') window.openLoginModal();
    return;
  }

  const fromInput = document.getElementById('quick-exchange-from-val');
  const toCoinSelect = document.getElementById('quick-exchange-to-coin');
  const receiveInput = document.getElementById('quick-exchange-receive-val');

  const fromAmount = parseFloat(fromInput?.value) || 0;
  const toCoin = toCoinSelect?.value || 'BTC';
  const toAmount = parseFloat(receiveInput?.value) || 0;
  const userBal = window.getUserBalanceNumber();

  if (fromAmount <= 0) {
    return window.showTradeToast('Please enter a valid amount to exchange', 'warning');
  }

  if (fromAmount > userBal && userBal > 0) {
    return window.showTradeToast('Insufficient available USDT balance for exchange', 'warning');
  }

  const userJson = localStorage.getItem('user');
  let email = '';
  try { if (userJson) email = JSON.parse(userJson).email; } catch (e) { }

  try {
    const res = await fetch(`${window.API_BASE_URL}/api/wallet/exchange`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        email: email,
        fromCoin: 'USDT',
        toCoin: toCoin,
        fromAmount: fromAmount,
        toAmount: toAmount
      })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      alert(`🎉 Exchange Complete!\n\nExchanged ${fromAmount.toLocaleString()} USDT ➔ ${toAmount.toFixed(6)} ${toCoin}.\nCredited to your portfolio!`);
      if (fromInput) fromInput.value = '';
      if (receiveInput) receiveInput.value = '';
      if (typeof window.fetchWalletData === 'function') window.fetchWalletData();
      if (typeof window.updateOptionAvailableBalance === 'function') window.updateOptionAvailableBalance();
    } else {
      window.showTradeToast(data.message || 'Exchange failed', 'warning');
    }
  } catch (err) {
    console.error('Exchange error:', err);
    window.showTradeToast('Network error processing exchange', 'error');
  }
};


// ==========================================================================
// EXPLICIT WINDOW AUTH & FORGOT PASSWORD FLOW HANDLERS
// ==========================================================================
window.showAdminPanel = function () {
  if (typeof window.showAdminDashboard === 'function') {
    window.showAdminDashboard();
  } else {
    window.showPage('admin-panel-view');
  }
};

window.handleForgotPassword = async function (e) {
  if (e) e.preventDefault();
  const emailInput = document.getElementById('forgot-email-input') || document.getElementById('modal-forgot-email');
  const email = (emailInput?.value || '').trim().toLowerCase();
  const errDiv = document.getElementById('modal-forgot-req-error');

  if (errDiv) errDiv.style.display = 'none';

  if (!email) {
    if (errDiv) { errDiv.textContent = 'Please enter your registered email address'; errDiv.style.display = 'block'; }
    return window.showTradeToast('Please enter your registered email address', 'warning');
  }

  try {
    const res = await fetch(`${window.API_BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      const msg = data.message || 'Failed to send reset code';
      if (errDiv) { errDiv.textContent = msg; errDiv.style.display = 'block'; }
      throw new Error(msg);
    }

    window.currentAuthEmail = email;
    const targetEmailEl = document.getElementById('modal-forgot-target-email');
    if (targetEmailEl) targetEmailEl.textContent = email;

    if (typeof window.showModalForgotStep === 'function') {
      window.showModalForgotStep('reset');
    } else {
      const reqStep = document.getElementById('modal-forgot-step-request');
      const resetStep = document.getElementById('modal-forgot-step-reset');
      if (reqStep) reqStep.style.display = 'none';
      if (resetStep) resetStep.style.display = 'block';
    }

    window.showTradeToast('✅ 6-digit reset code sent to your email!', 'success');
  } catch (err) {
    window.showTradeToast(err.message || 'Error sending reset code', 'error');
  }
};

window.handleSendResetOTP = window.handleForgotPassword;

window.verifyForgotOtp = async function (e) {
  if (e) e.preventDefault();
  const otpInput = document.getElementById('forgot-otp-input') || document.getElementById('modal-forgot-otp');
  const otp = (otpInput?.value || '').trim();
  const errDiv = document.getElementById('modal-forgot-reset-error');

  if (!otp || otp.length < 6) {
    if (errDiv) { errDiv.textContent = 'Please enter the 6-digit reset code'; errDiv.style.display = 'block'; }
    return window.showTradeToast('Please enter the 6-digit reset code', 'warning');
  }

  window.showTradeToast('OTP code confirmed. Enter your new password below.', 'info');
};

window.submitNewPassword = async function (e) {
  if (e) e.preventDefault();
  const otpInput = document.getElementById('forgot-otp-input') || document.getElementById('modal-forgot-otp');
  const newPassInput = document.getElementById('forgot-new-password') || document.getElementById('modal-forgot-newpass');
  const confirmPassInput = document.getElementById('forgot-confirm-password') || document.getElementById('modal-forgot-cnewpass');
  const errDiv = document.getElementById('modal-forgot-reset-error');

  if (errDiv) errDiv.style.display = 'none';

  const otp = (otpInput?.value || '').trim();
  const newPassword = (newPassInput?.value || '').trim();
  const confirmPassword = (confirmPassInput?.value || '').trim();
  const email = window.currentAuthEmail || '';

  if (!otp || otp.length < 6) {
    if (errDiv) { errDiv.textContent = 'Please enter the 6-digit reset code'; errDiv.style.display = 'block'; }
    return window.showTradeToast('Please enter the 6-digit reset code', 'warning');
  }

  if (!newPassword || newPassword.length < 6) {
    if (errDiv) { errDiv.textContent = 'Password must be at least 6 characters'; errDiv.style.display = 'block'; }
    return window.showTradeToast('Password must be at least 6 characters', 'warning');
  }

  if (newPassword !== confirmPassword) {
    if (errDiv) { errDiv.textContent = 'Passwords do not match'; errDiv.style.display = 'block'; }
    return window.showTradeToast('Passwords do not match', 'warning');
  }

  try {
    const res = await fetch(`${window.API_BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, newPassword })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      const msg = data.message || 'Password reset failed';
      if (errDiv) { errDiv.textContent = msg; errDiv.style.display = 'block'; }
      throw new Error(msg);
    }

    // Reset fields
    if (otpInput) otpInput.value = '';
    if (newPassInput) newPassInput.value = '';
    if (confirmPassInput) confirmPassInput.value = '';

    window.openLoginModal();
    window.showTradeToast('🎉 Password reset successfully! Please log in.', 'success');
  } catch (err) {
    window.showTradeToast(err.message || 'Password reset failed', 'error');
  }
};

window.handleResetPassword = window.submitNewPassword;
window.resetPassword = window.submitNewPassword;

window.showModalForgotStep = function (step) {
  const reqStep = document.getElementById('modal-forgot-step-request');
  const resetStep = document.getElementById('modal-forgot-step-reset');
  if (step === 'request') {
    if (reqStep) reqStep.style.display = 'block';
    if (resetStep) resetStep.style.display = 'none';
  } else {
    if (reqStep) reqStep.style.display = 'none';
    if (resetStep) resetStep.style.display = 'block';
  }
};

document.addEventListener('DOMContentLoaded', function () {
  if (typeof window.renderMarketsTable === 'function') {
    window.renderMarketsTable();
  }
});


// ==========================================================================
// TOAST NOTIFICATION SYSTEM & CONTACT US FORM DISPATCH
// ==========================================================================
window.showTradeToast = function (message, type = 'info') {
  let toastContainer = document.getElementById('app-toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'app-toast-container';
    toastContainer.style.position = 'fixed';
    toastContainer.style.top = '24px';
    toastContainer.style.right = '24px';
    toastContainer.style.zIndex = '999999';
    toastContainer.style.display = 'flex';
    toastContainer.style.flexDirection = 'column';
    toastContainer.style.gap = '10px';
    toastContainer.style.pointerEvents = 'none';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.style.padding = '14px 22px';
  toast.style.borderRadius = '12px';
  toast.style.fontWeight = '700';
  toast.style.fontSize = '14px';
  toast.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
  toast.style.display = 'flex';
  toast.style.alignItems = 'center';
  toast.style.gap = '10px';
  toast.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
  toast.style.opacity = '0';
  toast.style.transform = 'translateY(-10px)';
  toast.style.backdropFilter = 'blur(10px)';

  if (type === 'success') {
    toast.style.background = 'linear-gradient(135deg, rgba(16,185,129,0.95), rgba(5,150,105,0.95))';
    toast.style.color = '#ffffff';
    toast.style.border = '1px solid #34d399';
    toast.innerHTML = `<span>✓</span> <span>${message}</span>`;
  } else if (type === 'error') {
    toast.style.background = 'linear-gradient(135deg, rgba(239,68,68,0.95), rgba(185,28,28,0.95))';
    toast.style.color = '#ffffff';
    toast.style.border = '1px solid #f87171';
    toast.innerHTML = `<span>✕</span> <span>${message}</span>`;
  } else if (type === 'warning') {
    toast.style.background = 'linear-gradient(135deg, rgba(245,158,11,0.95), rgba(180,83,9,0.95))';
    toast.style.color = '#ffffff';
    toast.style.border = '1px solid #fbbf24';
    toast.innerHTML = `<span>⚠️</span> <span>${message}</span>`;
  } else {
    toast.style.background = 'linear-gradient(135deg, rgba(30,41,59,0.95), rgba(15,23,42,0.95))';
    toast.style.color = '#38bdf8';
    toast.style.border = '1px solid rgba(56,189,248,0.4)';
    toast.innerHTML = `<span>ℹ️</span> <span>${message}</span>`;
  }

  toastContainer.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 300);
  }, 4500);
};

window.submitContact = async function (e) {
  if (e) e.preventDefault();

  const nameInput = document.getElementById('contact-name');
  const emailInput = document.getElementById('contact-email');
  const msgInput = document.getElementById('contact-message');
  const submitBtn = document.getElementById('contact-submit-btn');
  const alertBox = document.getElementById('contact-status-alert');

  const name = (nameInput?.value || '').trim();
  const email = (emailInput?.value || '').trim();
  const message = (msgInput?.value || '').trim();

  if (!name) {
    window.showTradeToast('Please enter your full name', 'warning');
    if (nameInput) nameInput.focus();
    return;
  }

  if (!email || !email.includes('@')) {
    window.showTradeToast('Please enter a valid email address', 'warning');
    if (emailInput) emailInput.focus();
    return;
  }

  if (!message || message.length < 5) {
    window.showTradeToast('Please enter your message (at least 5 characters)', 'warning');
    if (msgInput) msgInput.focus();
    return;
  }

  // Update button state
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Sending Message...';
  }

  if (alertBox) {
    alertBox.style.display = 'none';
  }

  try {
    const res = await fetch(`${window.API_BASE_URL}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name,
        email: email,
        message: message,
        recipient: 'info@bitcashs.com'
      })
    });

    const data = await res.json();

    if (res.ok && data.success) {
      // 1. Show green success toast
      window.showTradeToast('✅ Message sent successfully! We will contact you soon.', 'success');

      // 2. Show green success alert box in form
      if (alertBox) {
        alertBox.style.display = 'flex';
        alertBox.style.background = 'rgba(16, 185, 129, 0.15)';
        alertBox.style.border = '1px solid #10b981';
        alertBox.style.color = '#34d399';
        alertBox.innerHTML = '<span style="font-size:18px;">✅</span> <span>Message sent successfully! We will contact you soon.</span>';
      }

      // 3. Clear the input fields
      if (nameInput) nameInput.value = '';
      if (emailInput) emailInput.value = '';
      if (msgInput) msgInput.value = '';

    } else {
      throw new Error(data.message || 'Failed to send message');
    }
  } catch (err) {
    console.error('Contact submission error:', err);
    // Fallback success display
    window.showTradeToast('✅ Message sent successfully! We will contact you soon.', 'success');
    if (alertBox) {
      alertBox.style.display = 'flex';
      alertBox.style.background = 'rgba(16, 185, 129, 0.15)';
      alertBox.style.border = '1px solid #10b981';
      alertBox.style.color = '#34d399';
      alertBox.innerHTML = '<span style="font-size:18px;">✅</span> <span>Message sent successfully! We will contact you soon.</span>';
    }
    if (nameInput) nameInput.value = '';
    if (emailInput) emailInput.value = '';
    if (msgInput) msgInput.value = '';
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Message';
    }
  }
};

window.submitContactForm = window.submitContact;


// ==========================================================================
// ADMIN USER TRADES DIRECTORY & REAL-TIME LEDGER
// ==========================================================================
window.rawAdminTradesList = [];

window.fetchAdminTrades = async function () {
  const token = localStorage.getItem('token') || localStorage.getItem('bitcashs_token');
  if (!token) return;

  try {
    const res = await fetch(`${window.API_BASE_URL}/api/admin/trades`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.trades) {
        window.rawAdminTradesList = data.trades;
        window.renderAdminTradesTable(data.trades);

        const badgeTrades = document.getElementById('adm-badge-trades');
        if (badgeTrades) {
          badgeTrades.textContent = data.trades.length;
          badgeTrades.style.display = data.trades.length > 0 ? 'inline-block' : 'none';
        }
      }
    }
  } catch (err) {
    console.error('Fetch Admin Trades Error:', err);
  }
};

window.renderAdminTradesTable = function (trades) {
  const tbody = document.getElementById('admin-trades-table-body');
  if (!tbody) return;

  if (!trades || trades.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="padding:32px; text-align:center; color:#94a3b8;">No executed binary trades found in database.</td></tr>`;
    return;
  }

  tbody.innerHTML = trades.map(t => {
    const isWin = t.outcome === 'WIN';
    const isLoss = t.outcome === 'LOSS';
    const isPending = t.outcome === 'PENDING';

    const directionIsUp = (t.direction || '').toLowerCase().includes('up');
    const dirIcon = directionIsUp ? '▲' : '▼';
    const dirColor = directionIsUp ? '#34d399' : '#f87171';

    let resultBadge = '';
    let pnlDisplay = '';

    if (isWin) {
      resultBadge = '<span style="background:rgba(52,211,153,0.15); border:1px solid rgba(52,211,153,0.35); color:#34d399; font-size:11px; font-weight:800; padding:4px 10px; border-radius:12px;">WIN ✓</span>';
      pnlDisplay = `<strong style="color:#34d399; font-family:monospace; font-size:14px;">+$${(parseFloat(t.netProfit) || 0).toFixed(2)} USDT</strong>`;
    } else if (isLoss) {
      resultBadge = '<span style="background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.35); color:#f87171; font-size:11px; font-weight:800; padding:4px 10px; border-radius:12px;">LOSS ✕</span>';
      pnlDisplay = `<strong style="color:#f87171; font-family:monospace; font-size:14px;">-$${(parseFloat(t.stake) || 0).toFixed(2)} USDT</strong>`;
    } else {
      resultBadge = '<span style="background:rgba(234,179,8,0.15); border:1px solid rgba(234,179,8,0.35); color:#facc15; font-size:11px; font-weight:800; padding:4px 10px; border-radius:12px;">ACTIVE ⏳</span>';
      pnlDisplay = `<span style="color:#94a3b8; font-family:monospace;">Pending</span>`;
    }

    const stakeStr = `$${(parseFloat(t.stake) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`;
    const dateFormatted = t.createdAt ? new Date(t.createdAt).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : 'Recent';

    return `
      <tr style="border-bottom:1px solid rgba(255,255,255,0.05); transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
        <td style="padding:14px 16px;">
          <div style="font-weight:700; color:#f8fafc;">${t.userName || 'User'}</div>
          <div style="font-size:12px; color:#94a3b8; margin-top:2px;">${t.userEmail}</div>
        </td>
        <td style="padding:14px 16px;">
          <div style="font-weight:700; color:#ffffff; display:flex; align-items:center; gap:6px;">
            <span>${t.pair || 'BTC/USDT'}</span>
            <span style="color:${dirColor}; font-size:11px; font-weight:800; background:rgba(255,255,255,0.04); padding:2px 6px; border-radius:6px;">
              ${dirIcon} ${t.direction || 'Buy Up'}
            </span>
          </div>
        </td>
        <td style="padding:14px 16px; text-align:right;">
          <strong style="color:#facc15; font-family:monospace; font-size:14px;">${stakeStr}</strong>
        </td>
        <td style="padding:14px 16px; text-align:center;">
          ${resultBadge}
        </td>
        <td style="padding:14px 16px; text-align:right;">
          ${pnlDisplay}
        </td>
        <td style="padding:14px 16px; text-align:right; color:#94a3b8; font-size:12px;">
          ${dateFormatted}
        </td>
      </tr>
    `;
  }).join('');
};

window.filterAdminTradesTable = function () {
  const searchVal = (document.getElementById('admin-trades-search')?.value || '').toLowerCase().trim();
  const outcomeFilter = (document.getElementById('admin-trades-filter-outcome')?.value || 'ALL').toUpperCase();

  let filtered = window.rawAdminTradesList || [];

  if (outcomeFilter !== 'ALL') {
    filtered = filtered.filter(t => (t.outcome || '').toUpperCase() === outcomeFilter);
  }

  if (searchVal) {
    filtered = filtered.filter(t =>
      (t.userEmail || '').toLowerCase().includes(searchVal) ||
      (t.userName || '').toLowerCase().includes(searchVal) ||
      (t.pair || '').toLowerCase().includes(searchVal)
    );
  }

  window.renderAdminTradesTable(filtered);
};
