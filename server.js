const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1', '1.0.0.1']);
} catch (e) {
  console.warn('DNS setup warning:', e.message);
}

const path = require('path');
require('dotenv').config();

// Polyfill global crypto for Node 18 compatibility with Mongoose / MongoDB driver
if (!globalThis.crypto) {
  try {
    globalThis.crypto = require('crypto').webcrypto || require('crypto');
  } catch (e) {
    console.warn('Crypto polyfill warning:', e.message);
  }
}

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const mongoose = require('mongoose');
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);
const cloudinary = require('cloudinary').v2;

// ========== CLOUDINARY CONFIGURATION ==========
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function uploadToCloudinary(fileData, folder = 'bitcashs_uploads') {
  if (!fileData || typeof fileData !== 'string') return '';
  // If already hosted URL, return as-is
  if (fileData.startsWith('http://') || fileData.startsWith('https://')) {
    return fileData;
  }
  try {
    const result = await cloudinary.uploader.upload(fileData, {
      folder: folder,
      resource_type: 'auto'
    });
    console.log(`☁️ [CLOUDINARY UPLOAD SUCCESS] Folder: ${folder} | Secure URL: ${result.secure_url}`);
    return result.secure_url;
  } catch (err) {
    console.error(`☁️ [CLOUDINARY UPLOAD ERROR] (${folder}):`, err.message);
    return fileData; // Fallback to raw string if upload fails
  }
}

// ========== NODEMAILER SMTP TRANSPORTER CONFIGURATION ==========


async function sendMailHelper({ to, subject, text, html }) {
  if (process.env.RESEND_API_KEY) {
    try {
      const info = await resend.emails.send({
        from: 'BitCashs Exchange <info@bitcashs.com>',
        to,
        subject,
        text,
        html
      });
      console.log(`[RESEND EMAIL SENT] To: ${to} | ID: ${info?.data?.id || 'N/A'}`);
      return true;
    } catch (err) {
      console.error(`[RESEND EMAIL ERROR] Could not send email to ${to}:`, err.message);
      return false;
    }
  } else {
    console.log(`[SIMULATED EMAIL] To: ${to} | Subject: ${subject}`);
    return true;
  }
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname)));

// Golden circular icon (#eab308) matching BitCashs brand
const FAVICON_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABfUlEQVR4nGNgGGrg1WYOUSD2AOJsIK6F4myomCitLGWBWnLkVBfLf3wYpAaqloValoMMe0HIYiwOeQHSS4nFoKDehGzo/+ucRGE0h2wiOWqAGtSA+Brc4iucZGEkR1wDmUmKzxGWX+SkCKM5gnBIIAf7/3OcVMHI0UHI8my45ac4qYqRHIE9YUKzGji1/z/OQROMlDswsyiK749w0ATjDQVYIfPnIAdNMaywwkj5MNf92MdBU4wUCqLIDvCASXzZxUFTjOQAD6zx/2E7B00x1nQAqtFgEm+2cNAUIzmgFqsDnm9kpynG5QB4FDxex05TjCsK4Inw/mp2mmJciRCeDW8vZ6cpxpoNkQui60vYaYqxFkTo6eDyQnaaYEJFMbwyOjePnSYYb2WEHgqnZrNRFxOqjpEcAW+QHJvORhVMdIMEliOQm2SHprBRhElukkEdgdIo3TeRjSxMVqMULSRQmuU7+9iIwhQ3y9EcMjAdEzRHDFzXDItj6N85pSUAAFTx+v3ZVgHRAAAAAElFTkSuQmCC';
const faviconBuffer = Buffer.from(FAVICON_BASE64, 'base64');

app.get(['/api/favicon.ico', '/favicon.ico'], (req, res) => {
  res.set('Content-Type', 'image/x-icon');
  res.set('Cache-Control', 'public, max-age=86400');
  res.send(faviconBuffer);
});
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'bitcashs_secret_key_12345';
const MONGO_URI = process.env.MONGO_URI;

// 1. MongoDB Connection & Options Setup
const mongooseOptions = {
  serverSelectionTimeoutMS: 15000,
  socketTimeoutMS: 45000,
  family: 4 // Use IPv4
};

// Disable bufferCommands to fail fast if disconnected instead of hanging queries
// mongoose.set('bufferCommands', false); // Enabled buffering for query resilience

// Connection Event Listeners
mongoose.connection.on('connected', async () => {
  console.log('MongoDB connection successful');

  try {
    // Sanitize any dummy corrupt proof strings
    if (mongoose.models.Deposit) {
      await Deposit.updateMany(
        { $or: [{ proofImage: { $regex: 'demoProofSlip' } }, { receipt: { $regex: 'demoProofSlip' } }] },
        { $set: { proofImage: '', receipt: '' } }
      ).catch(() => { });
    }
  } catch (e) { }
});

// Automatic Admin Seeder on DB Connection
async function seedDefaultAdmin() {
  try {
    const adminEmail = 'admin@bitcashs.com';
    let admin = await User.findOne({ email: adminEmail });
    const hashedPass = await bcrypt.hash('adminpassword123', 10);

    if (!admin) {
      admin = new User({
        username: 'admin',
        fullName: 'BitCashs Administrator',
        email: adminEmail,
        mobile: '+18005550199',
        country: 'Global',
        password: hashedPass,
        role: 'ADMIN',
        isAdmin: true,
        kycStatus: 'VERIFIED',
        balance: 100000
      });
      await admin.save();
      console.log('👑 [ADMIN SEEDED] Default admin created: admin@bitcashs.com (Role: ADMIN)');
    } else {
      let needsSave = false;
      if (admin.role !== 'ADMIN' && admin.role !== 'admin') {
        admin.role = 'ADMIN';
        admin.isAdmin = true;
        needsSave = true;
      }
      if (admin.kycStatus !== 'VERIFIED') {
        admin.kycStatus = 'VERIFIED';
        needsSave = true;
      }
      const match = await bcrypt.compare('adminpassword123', admin.password).catch(() => false);
      if (!match && admin.password !== 'adminpassword123') {
        admin.password = hashedPass;
        needsSave = true;
      }
      if (needsSave) {
        await admin.save();
        console.log('👑 [ADMIN VERIFIED] Admin account verified with ADMIN role & verified KYC.');
      }
    }
  } catch (err) {
    console.warn('Admin seed notice:', err.message);
  }
}

mongoose.connection.on('connected', () => {
  seedDefaultAdmin();
});


mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Reconnecting in 3s...');
  setTimeout(connectMongoDB, 3000);
});

// Connect to MongoDB function with resilient retry
function connectMongoDB() {
  if (!MONGO_URI) {
    console.error('CRITICAL: MONGO_URI is not defined in .env!');
    return;
  }
  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) return;
  mongoose.connect(MONGO_URI, mongooseOptions)
    .catch(err => {
      console.error('MongoDB Connection Error:', err.message);
      setTimeout(connectMongoDB, 5000);
    });
}

connectMongoDB();

// 2. User Schema & Model
const UserSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  mobile: {
    type: String,
    default: "",
    trim: true
  },
  country: {
    type: String,
    default: "Pakistan",
    trim: true
  },
  kycData: { type: Object, default: {} },
  kycSubmittedAt: { type: Date },
  kycStatus: {
    type: String,
    default: "UNVERIFIED",
    trim: true
  },
  userId: {
    type: String,
    default: function () { return 'IM' + Math.floor(1000 + Math.random() * 9000); }
  },
  referredBy: {
    type: String,
    default: ""
  },
  referralCode: {
    type: String,
    default: function () { return (this.username || this.fullName || 'BIT' + Math.floor(1000 + Math.random() * 9000)).toLowerCase().replace(/[^a-z0-9]/g, ''); }
  },
  role: {
    type: String,
    default: "user"
  },
  password: {
    type: String,
    required: true
  },
  balance: { type: Number, default: 0.00 },
  dailyEarnings: { type: Number, default: 0.00 },
  totalProfit: { type: Number, default: 0.00 },
  activePlans: { type: Array, default: [] },
  activePlansCount: { type: Number, default: 0 },
  totalInvested: { type: Number, default: 0.00 },
  totalDeposits: { type: Number, default: 0.00 },
  teamSize: { type: Number, default: 0 },
  teamVolume: { type: Number, default: 0.00 },
  assets: {
    btc: { available: { type: Number, default: 0 }, inOrder: { type: Number, default: 0 } },
    eth: { available: { type: Number, default: 0 }, inOrder: { type: Number, default: 0 } },
    usdt: { available: { type: Number, default: 0 }, inOrder: { type: Number, default: 0 } },
    sol: { available: { type: Number, default: 0 }, inOrder: { type: Number, default: 0 } },
    xrp: { available: { type: Number, default: 0 }, inOrder: { type: Number, default: 0 } }
  },
  transactions: [
    {
      type: { type: String },
      coin: { type: String },
      amount: { type: Number },
      status: { type: String, default: 'Completed' },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  tradeOutcome: {
    type: String,
    default: "DEFAULT",
    enum: ["DEFAULT", "WIN", "LOSS"]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Safe pre-save hook that prevents double-hashing
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  // Only hash if NOT already hashed (bcrypt hashes start with $2a$ or $2b$)
  if (this.password && !this.password.startsWith('$2a$') && !this.password.startsWith('$2b$')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

// Persistent System Settings Schema (Global Win/Loss Outcome, Platform Total Earnings & 0% Deposit/Withdrawal Fees)
const SettingsSchema = new mongoose.Schema({
  key: { type: String, unique: true, default: 'global_config' },
  treasuryAddress: { type: String, default: 'TRBuYjnRoj9jM3WheB2k4X1t3SdxsYGr2j' },
  depositFee: { type: Number, default: 0 },
  withdrawFee: { type: Number, default: 0 },
  platformTotalEarnings: { type: Number, default: 0 },
  globalTradeOutcome: { type: String, default: 'LOSS', enum: ['LOSS', 'WIN'] }
}, { timestamps: true });

const SystemSettings = mongoose.models.SystemSettings || mongoose.model('SystemSettings', SettingsSchema);

let inMemoryGlobalTradeOutcome = 'LOSS';

// 2b. Deposit Schema & Model
const DepositSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userEmail: { type: String, required: true },
  username: { type: String },
  amount: { type: Number, required: true },
  coin: { type: String, default: 'USDT' },
  network: { type: String, default: 'TRC20' },
  txid: { type: String, required: true },
  receipt: { type: String },
  proofImage: { type: String },
  planName: { type: String, default: '' },
  planDuration: { type: String, default: '' },
  planDailyRoi: { type: String, default: '' },
  planMin: { type: Number, default: 0 },
  planMax: { type: Number, default: 0 },
  status: { type: String, default: 'Pending' }, // 'Pending', 'Approved', 'Rejected'
  createdAt: { type: Date, default: Date.now }
});

const Deposit = mongoose.models.Deposit || mongoose.model('Deposit', DepositSchema);

// 2c. Withdrawal Schema & Model
const WithdrawalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userEmail: { type: String, required: true },
  fullName: { type: String, default: '' },
  username: { type: String },
  amount: { type: Number, required: true },
  coin: { type: String, default: 'USDT' },
  network: { type: String, default: 'TRC20' },
  address: { type: String, required: true },
  fee: { type: Number, default: 0 },
  status: { type: String, default: 'Pending' }, // 'Pending', 'Approved', 'Rejected'
  createdAt: { type: Date, default: Date.now }
});

const Withdrawal = mongoose.models.Withdrawal || mongoose.model('Withdrawal', WithdrawalSchema);

// 2d. Contact Inquiry Schema & Model
const ContactMessageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  recipient: { type: String, default: 'info@bitcashs.com' },
  status: { type: String, default: 'Received' },
  createdAt: { type: Date, default: Date.now }
});
const ContactMessage = mongoose.models.ContactMessage || mongoose.model('ContactMessage', ContactMessageSchema);

// ========== NODEMAILER SMTP & OTP VERIFICATION LOGIC ==========
// ========== RESEND EMAIL OTP VERIFICATION LOGIC ==========
const pendingOTPs = {};

async function sendEmailOTP(email, otpCode) {
  console.log(`[OTP DISPATCH] Send 6-digit OTP code ${otpCode} to email: ${email}`);

  if (!process.env.RESEND_API_KEY) {
    console.log(`⚡ [RESEND NOTICE] RESEND_API_KEY not set in .env. OTP Code for ${email} is: ${otpCode}`);
    return true;
  }

  try {
    await resend.emails.send({
      from: 'BitCashs Security <info@bitcashs.com>',
      to: email,
      subject: 'BitCashs Account Signup Verification OTP',
      html: `
        <div style="font-family:sans-serif; background:#0b0e14; color:#f8fafc; padding:30px; border-radius:12px; max-width:500px; margin:0 auto; border:1px solid rgba(234,179,8,0.3);">
          <h2 style="color:#facc15; margin-top:0;">⚡ BitCashs Verification Code</h2>
          <p style="color:#cbd5e1; font-size:14px;">Your 6-digit OTP verification code for creating a BitCashs account is:</p>
          <div style="font-size:32px; font-weight:800; color:#fde68a; letter-spacing:4px; padding:15px; background:rgba(234,179,8,0.15); border-radius:8px; text-align:center; margin:20px 0; border:1px solid rgba(234,179,8,0.4);">${otpCode}</div>
          <p style="font-size:12px; color:#94a3b8;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
        </div>
      `
    });
    console.log(`✅ [RESEND SUCCESS] OTP email dispatched to ${email}`);
    return true;
  } catch (err) {
    console.warn(`⚠️ [RESEND ERROR] Failed to send email: ${err.message}. Local OTP code is: ${otpCode}`);
    return true;
  }
}


// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health Check Endpoint
app.get('/', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  res.json({
    status: 'ok',
    message: 'BitCashs Node.js API is running',
    databaseConnected: isConnected,
    databaseName: isConnected ? mongoose.connection.name : 'Disconnected'
  });
});

// Default Market Cache with Realistic Initial Data
const defaultMarketCache = [
  { sym: 'BTC', name: 'Bitcoin', symbol: 'BTCUSDT', icon: '₿', baseCap: 1240000000000, price: 67420.50, change: 2.45, high: 68100.00, low: 66200.00, volVal: 28400000000 },
  { sym: 'ETH', name: 'Ethereum', symbol: 'ETHUSDT', icon: 'Ξ', baseCap: 225000000000, price: 3512.80, change: 1.82, high: 3580.00, low: 3450.00, volVal: 14200000000 },
  { sym: 'SOL', name: 'Solana', symbol: 'SOLUSDT', icon: '◎', baseCap: 35200000000, price: 148.25, change: -3.12, high: 154.00, low: 145.50, volVal: 3800000000 },
  { sym: 'XRP', name: 'XRP', symbol: 'XRPUSDT', icon: '✕', baseCap: 58100000000, price: 0.6241, change: 0.95, high: 0.6400, low: 0.6120, volVal: 1900000000 },
  { sym: 'DOGE', name: 'Dogecoin', symbol: 'DOGEUSDT', icon: '🐕', baseCap: 10200000000, price: 0.1248, change: -1.45, high: 0.1300, low: 0.1210, volVal: 980000000 },
  { sym: 'ADA', name: 'Cardano', symbol: 'ADAUSDT', icon: '₳', baseCap: 6400000000, price: 0.4850, change: 1.20, high: 0.4980, low: 0.4720, volVal: 620000000 },
  { sym: 'AVAX', name: 'Avalanche', symbol: 'AVAXUSDT', icon: '🔺', baseCap: 2600000000, price: 28.40, change: -0.80, high: 29.50, low: 27.80, volVal: 480000000 },
  { sym: 'DOT', name: 'Polkadot', symbol: 'DOTUSDT', icon: '●', baseCap: 9600000000, price: 7.20, change: 0.45, high: 7.45, low: 7.05, volVal: 310000000 },
  { sym: 'LTC', name: 'Litecoin', symbol: 'LTCUSDT', icon: 'Ł', baseCap: 6300000000, price: 82.50, change: 1.15, high: 84.20, low: 81.00, volVal: 420000000 },
  { sym: 'NEAR', name: 'NEAR Protocol', symbol: 'NEARUSDT', icon: 'Ⓝ', baseCap: 5800000000, price: 5.45, change: -2.10, high: 5.70, low: 5.30, volVal: 390000000 },
  { sym: 'SUI', name: 'Sui', symbol: 'SUIUSDT', icon: '💧', baseCap: 4200000000, price: 1.85, change: 4.60, high: 1.95, low: 1.74, volVal: 510000000 },
  { sym: 'FTM', name: 'Fantom', symbol: 'FTMUSDT', icon: '👻', baseCap: 1800000000, price: 0.72, change: 2.30, high: 0.75, low: 0.69, volVal: 220000000 },
  { sym: 'BNB', name: 'BNB', symbol: 'BNBUSDT', icon: '🔶', baseCap: 87000000000, price: 575.20, change: 0.85, high: 582.00, low: 568.00, volVal: 1400000000 },
  { sym: 'LINK', name: 'Chainlink', symbol: 'LINKUSDT', icon: '⬡', baseCap: 9400000000, price: 14.80, change: -1.10, high: 15.20, low: 14.40, volVal: 340000000 },
  { sym: 'MATIC', name: 'Polygon', symbol: 'MATICUSDT', icon: '💜', baseCap: 5100000000, price: 0.52, change: 0.60, high: 0.54, low: 0.50, volVal: 280000000 },
  { sym: 'TRX', name: 'TRON', symbol: 'TRXUSDT', icon: '🔴', baseCap: 11200000000, price: 0.155, change: 0.35, high: 0.158, low: 0.152, volVal: 460000000 }
];

let cachedTickerData = {};

async function fetchLatestBinanceTickers() {
  try {
    const res = await axios.get('https://api.binance.com/api/v3/ticker/24hr', { timeout: 3500 });
    if (res.data && Array.isArray(res.data)) {
      res.data.forEach(t => {
        cachedTickerData[t.symbol] = t;
      });
      return true;
    }
  } catch (err) {
    // Silent notice; fall back to cached / default values
  }
  return false;
}

// Background poller every 60s
setInterval(fetchLatestBinanceTickers, 60000);
fetchLatestBinanceTickers();

// GET /api/market/prices - Live Prices (resilient with fallback)
app.get('/api/market/prices', async (req, res) => {
  try {
    const targets = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'DOGEUSDT', 'ADAUSDT', 'AVAXUSDT'];
    const formatted = targets.map(sym => {
      const name = sym.replace('USDT', '');
      const t = cachedTickerData[sym];
      const def = defaultMarketCache.find(d => d.symbol === sym) || {};

      const priceVal = t ? parseFloat(t.lastPrice) : (def.price || 100);
      const changeVal = t ? parseFloat(t.priceChangePercent) : (def.change || 0);
      const isUp = changeVal >= 0;

      let priceStr = '';
      if (priceVal >= 1000) {
        priceStr = '$' + priceVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      } else if (priceVal >= 1) {
        priceStr = '$' + priceVal.toFixed(2);
      } else {
        priceStr = '$' + priceVal.toFixed(4);
      }

      const changeStr = (isUp ? '+' : '') + changeVal.toFixed(2) + '%';

      return {
        name,
        symbol: sym,
        price: priceStr,
        change: changeStr,
        up: isUp,
        rawPrice: priceVal,
        rawChange: changeVal
      };
    });

    formatted.push({
      name: 'USDT',
      symbol: 'USDT',
      price: '$1.0000',
      change: '+0.01%',
      up: true,
      rawPrice: 1.0,
      rawChange: 0.01
    });

    res.json({ success: true, data: formatted });
  } catch (error) {
    res.json({ success: true, data: [] });
  }
});

// GET /api/markets - Real-time Comprehensive Markets Dataset (resilient with fallback)
app.get('/api/markets', async (req, res) => {
  try {
    let gainersCount = 0;
    let losersCount = 0;
    let totalVolumeUSD = 0;

    const formattedMarkets = defaultMarketCache.map((def, idx) => {
      const t = cachedTickerData[def.symbol];
      const priceVal = t ? parseFloat(t.lastPrice) : def.price;
      const changeVal = t ? parseFloat(t.priceChangePercent) : def.change;
      const highVal = t ? parseFloat(t.highPrice) : (def.high || priceVal * 1.02);
      const lowVal = t ? parseFloat(t.lowPrice) : (def.low || priceVal * 0.98);
      const volVal = t ? parseFloat(t.quoteVolume) : def.volVal;

      totalVolumeUSD += volVal;
      if (changeVal >= 0) gainersCount++;
      else losersCount++;

      let volStr = '';
      if (volVal >= 1000000000) {
        volStr = '$' + (volVal / 1000000000).toFixed(1) + 'B';
      } else if (volVal >= 1000000) {
        volStr = '$' + (volVal / 1000000).toFixed(0) + 'M';
      } else {
        volStr = '$' + Math.round(volVal).toLocaleString();
      }

      const estCapVal = def.baseCap * (priceVal / (def.baseCap > 100000000000 ? 60000 : 100));
      let capStr = '';
      if (estCapVal >= 1000000000000) {
        capStr = '$' + (estCapVal / 1000000000000).toFixed(2) + 'T';
      } else if (estCapVal >= 1000000000) {
        capStr = '$' + (estCapVal / 1000000000).toFixed(1) + 'B';
      } else {
        capStr = '$' + (estCapVal / 1000000).toFixed(0) + 'M';
      }

      return {
        rank: idx + 1,
        sym: def.sym,
        name: def.name,
        pair: `${def.sym}/USDT`,
        symbol: def.symbol,
        icon: def.icon,
        price: priceVal,
        lastPrice: priceVal,
        change: changeVal,
        priceChangePercent: changeVal,
        high: highVal,
        low: lowVal,
        volVal,
        vol: volStr,
        volume: volStr,
        cap: capStr
      };
    });

    const totalVolumeFormatted = '$' + (totalVolumeUSD / 1000000000).toFixed(1) + 'B';

    res.json({
      success: true,
      stats: {
        gainers: gainersCount,
        losers: losersCount,
        volume: totalVolumeFormatted,
        pairs: formattedMarkets.length
      },
      markets: formattedMarkets
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to format markets: ' + error.message });
  }
});

// GET /api/converter/rates - Combined Live Fiat & Crypto Rates (per 1 USD)
app.get('/api/converter/rates', async (req, res) => {
  try {
    const rates = {
      USD: 1,
      EUR: 0.92,
      GBP: 0.79,
      PKR: 278.5,
      INR: 83.4,
      AED: 3.67,
      SAR: 3.75,
      USDT: 1
    };

    const cryptoPrices = {
      BTC: 67420.50,
      ETH: 3512.80,
      SOL: 148.25,
      XRP: 0.6241,
      DOGE: 0.1248,
      USDT: 1.00
    };

    defaultMarketCache.forEach(def => {
      const t = cachedTickerData[def.symbol];
      const p = t ? parseFloat(t.lastPrice) : def.price;
      if (p > 0) {
        rates[def.sym] = 1 / p;
        cryptoPrices[def.sym] = p;
      }
    });

    res.json({ success: true, rates, cryptoPrices });
  } catch (error) {
    res.json({ success: true, rates: { USD: 1, USDT: 1 } });
  }
});

// GET /api/market/charts - Real or Synthesized 7-Day Trend Chart Data
app.get('/api/market/charts', async (req, res) => {
  try {
    const symbols = [
      { sym: 'BTC', name: 'Bitcoin (BTC)', symbol: 'BTCUSDT', base: 67420 },
      { sym: 'ETH', name: 'Ethereum (ETH)', symbol: 'ETHUSDT', base: 3512 },
      { sym: 'SOL', name: 'Solana (SOL)', symbol: 'SOLUSDT', base: 148 },
      { sym: 'XRP', name: 'XRP', symbol: 'XRPUSDT', base: 0.62 },
      { sym: 'DOGE', name: 'Dogecoin (DOGE)', symbol: 'DOGEUSDT', base: 0.125 },
      { sym: 'ADA', name: 'Cardano (ADA)', symbol: 'ADAUSDT', base: 0.48 },
      { sym: 'AVAX', name: 'Avalanche (AVAX)', symbol: 'AVAXUSDT', base: 28.4 }
    ];

    const chartResults = symbols.map(item => {
      const t = cachedTickerData[item.symbol];
      const lastP = t ? parseFloat(t.lastPrice) : item.base;
      const changeP = t ? parseFloat(t.priceChangePercent) : 2.5;
      const isUp = changeP >= 0;

      // Generate 24 data points for smooth line representation
      const prices = [];
      let cur = lastP * (1 - (changeP / 100));
      const step = (lastP - cur) / 24;
      for (let i = 0; i < 24; i++) {
        const noise = (Math.random() - 0.5) * (lastP * 0.01);
        prices.push(parseFloat((cur + step * i + noise).toFixed(2)));
      }
      prices.push(lastP);

      let priceStr = lastP >= 1000 ? '$' + lastP.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '$' + lastP.toFixed(2);
      let changeStr = (isUp ? '+' : '') + changeP.toFixed(2) + '%';

      return {
        sym: item.sym,
        name: item.name,
        pair: 'USDT',
        price: priceStr,
        change: changeStr,
        up: isUp,
        prices: prices
      };
    });

    res.json({ success: true, charts: chartResults });
  } catch (err) {
    res.json({ success: true, charts: [] });
  }
});


// 3. POST /api/auth/register - Initiate Signup & Dispatch OTP
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, mobile, phone, country, password, referredBy } = req.body;
    const emailInput = (email || '').toLowerCase().trim();
    const userInput = (username || emailInput.split('@')[0] || '').trim();
    const mobileInput = (mobile || phone || '').trim();

    if (!emailInput || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const existingUser = await User.findOne({
      $or: [
        { email: emailInput },
        { username: userInput.toLowerCase() },
        ...(mobileInput ? [{ mobile: mobileInput }] : [])
      ]
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email or username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    pendingOTPs[emailInput] = {
      username: userInput,
      email: emailInput,
      mobile: mobileInput,
      country: country || 'Global',
      password: hashedPassword,
      referredBy: (referredBy || '').trim(),
      otp: otpCode,
      expiresAt: Date.now() + 600000
    };

    await sendEmailOTP(emailInput, otpCode);

    res.status(200).json({
      success: true,
      requiresOtp: true,
      email: emailInput,
      message: '6-digit OTP verification code sent to your email'
    });
  } catch (error) {
    console.error('Registration Error:', error.message);
    res.status(500).json({ success: false, message: 'Registration failed: ' + error.message });
  }
});

// 3b. POST /api/auth/verify-signup - Verify OTP and Complete Registration
app.post('/api/auth/verify-signup', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const emailKey = (email || '').toLowerCase().trim();

    const pending = pendingOTPs[emailKey];
    if (!pending) {
      return res.status(400).json({ success: false, message: 'No pending registration found for this email. Please sign up again.' });
    }

    if (pending.otp !== (otp || '').trim()) {
      return res.status(400).json({ success: false, message: 'Invalid OTP code. Please check and try again.' });
    }

    const newUser = new User({
      username: pending.username,
      fullName: pending.username,
      email: pending.email,
      mobile: pending.mobile,
      country: pending.country,
      password: pending.password,
      referredBy: pending.referredBy,
      role: 'user',
      kycStatus: 'UNVERIFIED'
    });

    await newUser.save();
    delete pendingOTPs[emailKey];

    res.status(200).json({
      success: true,
      message: 'Account verified successfully! Please log in.'
    });
  } catch (error) {
    console.error('Verify Signup Error:', error.message);
    res.status(500).json({ success: false, message: 'OTP verification failed: ' + error.message });
  }
});


const pendingResetOTPs = {};

// 3c. POST /api/auth/forgot-password - Send Reset OTP
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const emailInput = (email || '').toLowerCase().trim();

    if (!emailInput) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }

    const user = await User.findOne({ $or: [{ email: emailInput }, { email: { $regex: new RegExp('^' + emailInput.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') } }] });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email address' });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    pendingResetOTPs[emailInput] = {
      otp: otpCode,
      expiresAt: Date.now() + 600000
    };

    await sendEmailOTP(emailInput, otpCode);

    res.status(200).json({
      success: true,
      message: 'Password reset OTP code sent to your email'
    });
  } catch (error) {
    console.error('Forgot Password Error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to send reset code: ' + error.message });
  }
});

// 3d. POST /api/auth/reset-password - Verify OTP and Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const emailKey = (email || '').toLowerCase().trim();

    const pending = pendingResetOTPs[emailKey];
    if (!pending) {
      return res.status(400).json({ success: false, message: 'No reset request found for this email. Please request a new code.' });
    }

    if (pending.otp !== (otp || '').trim()) {
      return res.status(400).json({ success: false, message: 'Invalid OTP code. Please check and try again.' });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.updateOne({ email: emailKey }, { password: hashedPassword });
    delete pendingResetOTPs[emailKey];

    res.status(200).json({
      success: true,
      message: 'Password reset successfully! Please log in with your new password.'
    });
  } catch (error) {
    console.error('Reset Password Error:', error.message);
    res.status(500).json({ success: false, message: 'Password reset failed: ' + error.message });
  }
});


// 3e. POST /api/auth/verify-forgot-otp - Verify Reset OTP Code
app.post(['/api/auth/verify-forgot-otp', '/api/auth/verify-reset-otp'], (req, res) => {
  const { email, otp } = req.body;
  const emailKey = (email || '').toLowerCase().trim();
  const pending = pendingResetOTPs[emailKey];

  if (!pending) {
    return res.status(400).json({ success: false, message: 'No reset request found for this email. Please request a new code.' });
  }

  if (pending.otp !== (otp || '').trim()) {
    return res.status(400).json({ success: false, message: 'Invalid OTP code. Please check and try again.' });
  }

  if (Date.now() > pending.expiresAt) {
    delete pendingResetOTPs[emailKey];
    return res.status(400).json({ success: false, message: 'OTP code has expired. Please request a new code.' });
  }

  res.status(200).json({ success: true, message: 'OTP verified successfully' });
});

// 4. POST /api/auth/login - Authenticate User with Bcrypt & Direct Plain Password Compatibility
app.post('/api/auth/login', async (req, res) => {
  try {
    const rawEmail = req.body.email || req.body.emailOrMobile || req.body.username || '';
    const email = rawEmail.trim().toLowerCase();
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email/Username and password are required' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database is connecting. Please retry in a few moments.'
      });
    }

    const escapedInput = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const inputRegex = new RegExp('^' + escapedInput + '$', 'i');

    let user = await User.findOne({
      $or: [
        { email: email },
        { email: { $regex: inputRegex } },
        { username: { $regex: inputRegex } },
        { fullName: { $regex: inputRegex } },
        ...(email === 'admin' ? [{ email: 'admin@bitcashs.com' }, { role: { $in: ['ADMIN', 'admin'] } }] : []),
        { mobile: rawEmail.trim() }
      ]
    });

    // Fallback: Check local users.json for older accounts and auto-migrate to MongoDB
    if (!user) {
      try {
        const jsonPath = path.join(__dirname, 'users.json');
        if (fs.existsSync(jsonPath)) {
          const localUsers = JSON.parse(fs.readFileSync(jsonPath, 'utf-8') || '[]');
          const localUser = localUsers.find(u => (u.email && u.email.toLowerCase() === email) || (u.mobile && u.mobile === rawEmail.trim()));
          if (localUser) {
            user = new User({
              fullName: localUser.fullName || localUser.username || email.split('@')[0],
              username: localUser.username || localUser.fullName || email.split('@')[0],
              email: localUser.email.toLowerCase(),
              mobile: localUser.mobile || '',
              password: localUser.password,
              role: 'USER',
              kycStatus: 'UNVERIFIED'
            });
            await user.save();
            console.log(`📦 [USER MIGRATED] Imported user ${localUser.email} from users.json to MongoDB`);
          }
        }
      } catch (err) {
        console.warn('Local users.json migration notice:', err.message);
      }
    }

    if (!user) {
      console.warn(`⚠️ [LOGIN FAILED] User not found for: "${rawEmail}"`);
      return res.status(400).json({ success: false, message: 'User not found. Please sign up or check your email/username.' });
    }

    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, user.password);
    } catch (e) {
      isMatch = false;
    }

    // Fallback for plain-text / old admin password
    if (!isMatch && user.password === password) {
      isMatch = true;
      user.password = password; // pre('save') hook will safely hash this
      await user.save();
      console.log(`🔒 [PASSWORD MIGRATED] Plain-text password safely hashed for ${user.email}`);
    }

    if (!isMatch) {
      console.warn(`⚠️ [LOGIN FAILED] Invalid credentials for user: "${user.email}"`);
      return res.status(400).json({ success: false, message: 'Invalid credentials. Please verify your password.' });
    }

    // Auto-promote default admin account
    if (user.email === 'admin@bitcashs.com' && user.role !== 'ADMIN' && user.role !== 'admin') {
      user.role = 'ADMIN';
      user.isAdmin = true;
      await user.save();
    }

    const roleFormatted = (user.role === 'admin' || user.role === 'ADMIN') ? 'ADMIN' : (user.role || 'USER');
    const isAdmin = roleFormatted === 'ADMIN' || user.isAdmin === true || user.email === 'admin@bitcashs.com';

    const token = jwt.sign(
      { id: user._id, email: user.email, role: roleFormatted, isAdmin },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`🔑 [LOGIN SUCCESS] User: ${user.email} (Role: ${roleFormatted})`);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        _id: user._id,
        role: roleFormatted,
        isAdmin: isAdmin,
        email: user.email,
        username: user.username || user.fullName || user.email.split('@')[0],
        fullName: user.fullName || user.username,
        walletBalance: user.balance || 0,
        balance: user.balance || 0,
        kycStatus: user.kycStatus || 'UNVERIFIED',
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(500).json({ success: false, message: 'Login failed: ' + error.message });
  }
});

// 5. GET /api/user/profile - Fetch Real User Profile from MongoDB
app.get('/api/user/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let userId = null;
    let userEmail = req.query.email;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
      } catch (e) { }
    }

    if (!userId && !userEmail) {
      return res.status(401).json({ success: false, message: 'Unauthorized profile request' });
    }

    const query = userId ? { _id: userId } : { email: (userEmail || '').toLowerCase() };
    const user = await User.findOne(query).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile not found' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username || user.fullName || user.email.split('@')[0],
        fullName: user.fullName || user.username || user.email.split('@')[0],
        email: user.email,
        mobile: user.mobile || "",
        country: user.country || "Global",
        kycStatus: user.kycStatus || "UNVERIFIED",
        userId: user.userId || ('IM' + String(user._id).slice(-4)),
        role: user.role || "user",
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Fetch Profile Error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch profile: ' + error.message });
  }
});

// 6. PUT /api/user/profile - Update User Profile in MongoDB
app.put('/api/user/profile', async (req, res) => {
  try {
    const { email, username, fullName, country, mobile, phone } = req.body;
    const authHeader = req.headers.authorization;
    let userId = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
      } catch (e) { }
    }

    const query = userId ? { _id: userId } : { email: (email || '').toLowerCase() };

    if (!query._id && !query.email) {
      return res.status(400).json({ success: false, message: 'User email or authorization required' });
    }

    const user = await User.findOne(query);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (username) user.username = username.trim();
    if (fullName) user.fullName = fullName.trim();
    if (country) user.country = country.trim();
    if (mobile || phone) user.mobile = (mobile || phone).trim();
    if (email) user.email = email.trim().toLowerCase();

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        mobile: user.mobile,
        country: user.country,
        kycStatus: user.kycStatus,
        userId: user.userId || ('IM' + String(user._id).slice(-4)),
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Update Profile Error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to update profile: ' + error.message });
  }
});




// 13. POST /api/trade/binary-place - Immediate Stake Deduction on Trade Placement
app.post(['/api/trade/binary-place', '/api/trade/binary-execute', '/api/wallet/binary-place'], async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let userId = null;
    let userEmail = req.body.email;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
      } catch (e) { }
    }

    let user = null;
    if (userId) {
      user = await User.findById(userId);
    } else if (userEmail) {
      user = await User.findOne({ email: userEmail.toLowerCase() });
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'User authentication required' });
    }

    const { amount, pair, direction, duration, profitPct } = req.body;
    const numAmount = parseFloat(amount) || 0;

    if (numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid trade stake amount' });
    }

    const currentBal = parseFloat(user.balance) || 0;
    if (currentBal < numAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance! Available: $${currentBal.toFixed(2)} USDT, Required: $${numAmount.toFixed(2)} USDT`
      });
    }

    // 1. Immediately deduct stake from user balance in MongoDB
    user.balance = parseFloat((currentBal - numAmount).toFixed(2));

    // 2. Log pending trade placement in transactions
    user.transactions = user.transactions || [];
    user.transactions.push({
      type: 'Binary Trade Placed',
      coin: `${pair || 'BTC/USDT'} (${direction || 'Buy Up'})`,
      amount: `-${numAmount.toFixed(2)}`,
      stake: numAmount,
      duration: duration || 30,
      profitPct: profitPct || 10,
      status: 'Pending',
      createdAt: new Date()
    });

    user.markModified('transactions');
    await user.save();

    console.log(`⚡ [TRADE PLACED] Deducted $${numAmount} from ${user.email}. New Balance: $${user.balance}`);

    res.json({
      success: true,
      message: `Stake of $${numAmount.toFixed(2)} USDT deducted. Trade active!`,
      newBalance: user.balance,
      deductedAmount: numAmount
    });
  } catch (error) {
    console.error('Binary Place Error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to place trade: ' + error.message });
  }
});

// Helper: Extract distinct trades and compute mathematically strict 1% fee revenue
function getDistinctTradesAndFees(allUsers) {
  let allTrades = [];
  let totalTradeVolume = 0;

  allUsers.forEach(u => {
    if (u.transactions && Array.isArray(u.transactions)) {
      // Find all settlement transactions
      const settlements = u.transactions.filter(t => {
        const tType = (t.type || '').toLowerCase();
        return tType.includes('settlement') || tType.includes('(win)') || tType.includes('(loss)');
      });

      // Find any placed trades that are STILL pending (not yet settled)
      const pendingPlaced = u.transactions.filter(t => {
        const tType = (t.type || '').toLowerCase();
        return (tType.includes('placed') || tType === 'binary trade placed') && (t.status === 'Pending' || t.status === 'Active');
      });

      // If settlements exist, each represents 1 distinct trade.
      // If there are extra pending placed records without settlements, include them as active pending trades.
      const tradeRecords = [...settlements];
      if (pendingPlaced.length > settlements.length) {
        tradeRecords.push(...pendingPlaced.slice(settlements.length));
      } else if (settlements.length === 0 && pendingPlaced.length > 0) {
        tradeRecords.push(...pendingPlaced);
      }

      tradeRecords.forEach(t => {
        const tType = (t.type || '').toLowerCase();
        const isWin = tType.includes('win');
        const isLoss = tType.includes('loss');
        const outcome = isWin ? 'WIN' : (isLoss ? 'LOSS' : 'PENDING');

        const stake = parseFloat(t.stake) || Math.abs(parseFloat(t.amount)) || 100;
        const fee = parseFloat((stake * 0.01).toFixed(2));
        const netProfit = parseFloat(t.netProfit) || (isWin ? (stake * 0.09) : 0);
        const totalPayout = parseFloat(t.totalPayout) || (isWin ? (stake + netProfit) : 0);

        totalTradeVolume += stake;

        let pair = 'BTC/USDT';
        let direction = 'Buy Up';

        if (t.coin) {
          const match = t.coin.match(/(.*?)\s*\((.*?)\)/);
          if (match) {
            pair = match[1].trim();
            direction = match[2].trim();
          } else {
            pair = t.coin;
          }
        }

        allTrades.push({
          id: t._id || t.id || `${u._id}_${t.createdAt || Date.now()}`,
          userId: u._id,
          userName: u.fullName || u.username || u.email.split('@')[0],
          userEmail: u.email,
          pair: pair,
          direction: direction,
          stake: stake,
          grossProfit: parseFloat(t.grossProfit) || (isWin ? (stake * 0.1) : 0),
          platformFee: fee,
          netProfit: netProfit,
          totalPayout: totalPayout,
          outcome: outcome,
          status: t.status || (isWin ? 'Completed' : (isLoss ? 'Settlement Loss' : 'Active')),
          createdAt: t.createdAt || u.createdAt || new Date()
        });
      });
    }
  });

  return {
    allTrades,
    totalTradeVolume: parseFloat(totalTradeVolume.toFixed(2)),
    totalPlatformFee: parseFloat((totalTradeVolume * 0.01).toFixed(2))
  };
}

// 14. POST /api/trade/binary-settle - Binary Options Settlement (Strict Loss Default & Exact 1% Single Fee)
app.post(['/api/trade/binary-settle', '/api/wallet/binary-settle'], async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let userId = null;
    let userEmail = req.body.email;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
      } catch (e) { }
    }

    let user = null;
    if (userId) {
      user = await User.findById(userId);
    } else if (userEmail) {
      user = await User.findOne({ email: userEmail.toLowerCase() });
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'User authentication required' });
    }

    const { amount, profitPct, pair, direction, duration } = req.body;
    const numAmount = parseFloat(amount) || 0;
    const numProfitPct = parseFloat(profitPct) || 10;

    // Exact 1% Platform Trading Fee calculated ONCE per trade: fee = tradeAmount * 0.01
    const grossProfit = parseFloat(((numAmount * numProfitPct) / 100).toFixed(2));
    const platformFee = parseFloat((numAmount * 0.01).toFixed(2)); // Exactly 1% fee (e.g. $100 -> $1.00)
    const netProfit = parseFloat(Math.max(0, grossProfit - platformFee).toFixed(2));
    const totalPayout = parseFloat((numAmount + netProfit).toFixed(2)); // Stake + Net Profit

    // STRICT OUTCOME DECISION:
    // Default outcome is strictly LOSS unless explicitly 'WIN' or 'FORCE_WIN'
    let config = await SystemSettings.findOne({ key: 'global_config' });
    if (!config) {
      config = new SystemSettings({ key: 'global_config', platformTotalEarnings: 0, globalTradeOutcome: 'LOSS' });
    }

    const userOutcome = (user.tradeOutcome || 'DEFAULT').toUpperCase();
    const globalMode = (config.globalTradeOutcome || inMemoryGlobalTradeOutcome || 'LOSS').toUpperCase();

    let isWin = false;
    if (userOutcome === 'WIN' || userOutcome === 'FORCE_WIN') {
      isWin = true;
    } else if (userOutcome === 'LOSS' || userOutcome === 'FORCE_LOSS') {
      isWin = false;
    } else {
      // User is 'DEFAULT': strictly follow globalMode
      isWin = (globalMode === 'WIN' || globalMode === 'FORCE_WIN');
    }

    user.transactions = user.transactions || [];

    // Find if there is a pending placement transaction to update cleanly without creating duplicates
    const pendingIdx = user.transactions.findIndex(t =>
      (t.type || '').toLowerCase().includes('placed') && (t.status === 'Pending' || t.status === 'Active')
    );

    const settlementTransaction = {
      type: isWin ? 'Binary Settlement (WIN)' : 'Binary Settlement (LOSS)',
      coin: `${pair || 'BTC/USDT'} (${direction || 'Buy Up'})`,
      amount: isWin ? `+${totalPayout.toFixed(2)}` : `-${numAmount.toFixed(2)}`,
      stake: numAmount,
      grossProfit: isWin ? grossProfit : 0,
      platformFee: platformFee,
      netProfit: isWin ? netProfit : 0,
      totalPayout: isWin ? totalPayout : 0,
      status: isWin ? 'Completed' : 'Settlement Loss',
      createdAt: new Date()
    };

    if (pendingIdx !== -1) {
      user.transactions[pendingIdx] = {
        ...settlementTransaction,
        createdAt: user.transactions[pendingIdx].createdAt || settlementTransaction.createdAt
      };
    } else {
      user.transactions.push(settlementTransaction);
    }

    if (isWin) {
      // WIN: Add back (Invested Stake + Net Profit) to User Balance
      user.balance = parseFloat(((parseFloat(user.balance) || 0) + totalPayout).toFixed(2));
      user.totalEarnings = parseFloat(((parseFloat(user.totalEarnings) || 0) + netProfit).toFixed(2));
    }

    user.markModified('transactions');
    await user.save();

    // Recalculate exact sum of all trade amounts * 0.01 across the system
    const allUsers = await User.find();
    const tradeStats = getDistinctTradesAndFees(allUsers);
    config.platformTotalEarnings = tradeStats.totalPlatformFee;
    await config.save();

    console.log(`💵 [PLATFORM REVENUE] Trade Settle (1% Fee: $${platformFee}). Total Recalculated Platform Revenue: $${config.platformTotalEarnings} (Volume: $${tradeStats.totalTradeVolume})`);

    if (isWin) {
      console.log(`🏆 [BINARY WIN] User ${user.email} WON trade: +$${netProfit} USDT net profit (after $${platformFee} 1% fee). Total returned: $${totalPayout}. New Bal: $${user.balance}`);

      return res.json({
        success: true,
        outcome: 'WIN',
        isWin: true,
        stake: numAmount,
        grossProfit,
        platformFee,
        netProfit,
        totalPayout,
        totalCredit: totalPayout,
        newBalance: user.balance,
        platformTotalEarnings: config.platformTotalEarnings,
        message: `Trade Won! Payout +$${totalPayout.toFixed(2)} USDT credited (Net Profit: +$${netProfit.toFixed(2)} USDT after 1% fee)`
      });

    } else {
      console.log(`📉 [STRICT DEFAULT LOSS] User ${user.email} settled LOSS: -$${numAmount} USDT kept deducted (1% Fee: $${platformFee}). Bal: $${user.balance}`);

      return res.json({
        success: true,
        outcome: 'LOSS',
        isWin: false,
        stake: numAmount,
        grossProfit: 0,
        platformFee,
        netProfit: 0,
        totalPayout: 0,
        totalCredit: 0,
        newBalance: user.balance,
        platformTotalEarnings: config.platformTotalEarnings,
        message: `Settlement Loss / Contract Expired: -$${numAmount.toFixed(2)} USDT (1% Platform Fee: $${platformFee})`
      });
    }

  } catch (error) {
    console.error('Binary Settle Error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to settle binary trade: ' + error.message });
  }
});

// Admin Trade Outcome Toggle per user: accepts 'DEFAULT' | 'WIN' | 'LOSS'
app.post(['/api/admin/user/trade-outcome', '/api/admin/users/trade-outcome', '/api/admin/users/outcome'], async (req, res) => {
  try {
    const { userId, email, outcome, tradeOutcome } = req.body;
    let targetOutcome = (outcome || tradeOutcome || 'DEFAULT').toUpperCase();
    if (!['DEFAULT', 'WIN', 'LOSS', 'FORCE_WIN', 'FORCE_LOSS'].includes(targetOutcome)) {
      targetOutcome = 'DEFAULT';
    }

    let query = {};
    if (userId) query._id = userId;
    else if (email) query.email = email.toLowerCase();
    else return res.status(400).json({ success: false, message: 'userId or email required' });

    const user = await User.findOne(query);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.tradeOutcome = targetOutcome;
    await user.save();

    console.log(`⚙️ [ADMIN TRADE CONTROL] User ${user.email} trade outcome set to: ${targetOutcome}`);
    res.json({ success: true, message: `Trade outcome for ${user.email} set to ${targetOutcome}`, tradeOutcome: targetOutcome });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin User Balance Adjustment
app.post(['/api/admin/users/balance', '/api/admin/user/balance', '/api/admin/users/update-balance'], async (req, res) => {
  try {
    const { userId, email, balance, newBalance } = req.body;
    const targetBalance = parseFloat(balance !== undefined ? balance : newBalance) || 0;

    let query = {};
    if (userId) query._id = userId;
    else if (email) query.email = email.toLowerCase();
    else return res.status(400).json({ success: false, message: 'userId or email is required' });

    const user = await User.findOne(query);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.balance = targetBalance;
    if (!user.assets) user.assets = { btc: { available: 0 }, eth: { available: 0 }, usdt: { available: 0 } };
    if (!user.assets.usdt) user.assets.usdt = { available: 0, inOrder: 0 };
    user.assets.usdt.available = targetBalance;

    await user.save();
    console.log(`💰 [ADMIN BALANCE] Updated balance for ${user.email} to $${user.balance}`);
    res.json({ success: true, message: `Balance updated for ${user.email} to $${user.balance}`, newBalance: user.balance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin Settings: Get & Update Global Outcome & Fees & Revenue
app.get(['/api/admin/settings', '/api/admin/trade-settings'], async (req, res) => {
  try {
    let config = await SystemSettings.findOne({ key: 'global_config' });
    if (!config) {
      config = await SystemSettings.create({
        key: 'global_config',
        treasuryAddress: 'TRBuYjnRoj9jM3WheB2k4X1t3SdxsYGr2j',
        depositFee: 0,
        withdrawFee: 0,
        platformTotalEarnings: 0,
        globalTradeOutcome: 'LOSS'
      });
    }
    res.json({
      success: true,
      treasuryAddress: config.treasuryAddress || 'TRBuYjnRoj9jM3WheB2k4X1t3SdxsYGr2j',
      depositFee: 0,
      withdrawFee: 0,
      platformTotalEarnings: config.platformTotalEarnings || 0,
      globalTradeOutcome: config.globalTradeOutcome || 'LOSS'
    });
  } catch (err) {
    res.json({
      success: true,
      treasuryAddress: 'TRBuYjnRoj9jM3WheB2k4X1t3SdxsYGr2j',
      depositFee: 0,
      withdrawFee: 0,
      platformTotalEarnings: 0,
      globalTradeOutcome: inMemoryGlobalTradeOutcome || 'LOSS'
    });
  }
});

app.post(['/api/admin/settings', '/api/admin/trade-settings'], async (req, res) => {
  try {
    const { treasuryAddress, globalTradeOutcome } = req.body;
    let config = await SystemSettings.findOne({ key: 'global_config' });
    if (!config) {
      config = new SystemSettings({ key: 'global_config' });
    }
    if (treasuryAddress) config.treasuryAddress = treasuryAddress.trim();
    if (globalTradeOutcome) {
      config.globalTradeOutcome = globalTradeOutcome.toUpperCase() === 'WIN' ? 'WIN' : 'LOSS';
      inMemoryGlobalTradeOutcome = config.globalTradeOutcome;
    }
    config.depositFee = 0;
    config.withdrawFee = 0;
    await config.save();

    console.log(`⚙️ [ADMIN SETTINGS] Global Trade Outcome: ${config.globalTradeOutcome}, Revenue: $${config.platformTotalEarnings}, Deposit Fee: 0%, Withdraw Fee: 0%`);
    res.json({
      success: true,
      message: 'Platform settings saved successfully!',
      treasuryAddress: config.treasuryAddress,
      depositFee: 0,
      withdrawFee: 0,
      platformTotalEarnings: config.platformTotalEarnings || 0,
      globalTradeOutcome: config.globalTradeOutcome
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});



// 8. GET /api/admin/overview & /api/admin/stats - Real Metrics from MongoDB & Dynamically Computed 1% Platform Fees
app.get(['/api/admin/overview', '/api/admin/stats'], async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: { $nin: ['admin', 'ADMIN'] }, isAdmin: { $ne: true } });
    const pendingDepositsCount = await Deposit.countDocuments({ status: 'Pending' });

    const allUsers = await User.find();
    let totalPlatformBalance = 0;

    allUsers.forEach(u => {
      totalPlatformBalance += (parseFloat(u.balance) || 0);
    });

    // Strictly calculate total 1% platform fee revenue as: (Sum of all trade amounts * 0.01)
    const tradeStats = getDistinctTradesAndFees(allUsers);
    const platformFeeRevenue = tradeStats.totalPlatformFee;

    let config = await SystemSettings.findOne({ key: 'global_config' });
    if (!config) {
      config = await SystemSettings.create({
        key: 'global_config',
        platformTotalEarnings: platformFeeRevenue,
        globalTradeOutcome: 'LOSS'
      });
    } else {
      config.platformTotalEarnings = platformFeeRevenue;
      await config.save();
    }

    res.json({
      success: true,
      totalUsers: totalUsers,
      pendingDeposits: pendingDepositsCount,
      platformFeeRevenue: platformFeeRevenue,
      platformTotalEarnings: platformFeeRevenue,
      platformBalance: parseFloat(totalPlatformBalance.toFixed(2)),
      globalTradeOutcome: config.globalTradeOutcome || 'LOSS',
      stats: {
        totalUsers: totalUsers,
        pendingDeposits: pendingDepositsCount,
        approvedVolume: '$' + totalPlatformBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        platformBalance: '$' + totalPlatformBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        platformFeeRevenue: '$' + platformFeeRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' USDT',
        platformTotalEarnings: platformFeeRevenue,
        globalTradeOutcome: config.globalTradeOutcome || 'LOSS'
      }
    });
  } catch (error) {
    console.error('Admin Stats Error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch admin stats: ' + error.message });
  }
});

// 9. GET /api/admin/users - Real User Directory from MongoDB
app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({
      success: true,
      users: users.map(u => ({
        _id: u._id,
        id: u._id,
        username: u.username || u.fullName || u.email.split('@')[0],
        fullName: u.fullName || u.username,
        email: u.email,
        phone: u.mobile || u.phone || '',
        mobile: u.mobile || u.phone || '',
        country: u.country || 'Global',
        balance: u.balance || 0,
        kycStatus: u.kycStatus || 'UNVERIFIED',
        tradeOutcome: u.tradeOutcome || 'DEFAULT',
        role: u.role || 'user',
        createdAt: u.createdAt
      }))
    });
  } catch (error) {
    console.error('Admin Users Error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch admin users: ' + error.message });
  }
});

// 10. POST /api/admin/users/update-balance & /api/admin/user/balance
app.post(['/api/admin/users/update-balance', '/api/admin/user/balance', '/api/admin/user/update-balance'], async (req, res) => {
  try {
    const { userId, id, email, newBalance, balance } = req.body;
    const targetBal = parseFloat(newBalance !== undefined ? newBalance : balance);

    if (isNaN(targetBal)) {
      return res.status(400).json({ success: false, message: 'Valid balance number required' });
    }

    let query = {};
    if (userId || id) query._id = userId || id;
    else if (email) query.email = email.toLowerCase();
    else return res.status(400).json({ success: false, message: 'User ID or email required' });

    const updatedUser = await User.findOneAndUpdate(query, { balance: targetBal }, { new: true });
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    console.log(`💰 [ADMIN BALANCE] Updated balance for ${updatedUser.email} to $${targetBal}`);
    res.json({ success: true, message: `Balance updated to $${targetBal.toFixed(2)} USDT`, user: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 11. POST /api/admin/users/toggle-kyc & /api/admin/user/kyc
app.post(['/api/admin/users/toggle-kyc', '/api/admin/user/kyc', '/api/admin/user/toggle-kyc'], async (req, res) => {
  try {
    const { userId, id, email, kycStatus, status } = req.body;
    const targetStatus = (kycStatus || status || 'VERIFIED').toUpperCase();

    let query = {};
    if (userId || id) query._id = userId || id;
    else if (email) query.email = email.toLowerCase();
    else return res.status(400).json({ success: false, message: 'User ID or email required' });

    const updatedUser = await User.findOneAndUpdate(query, { kycStatus: targetStatus }, { new: true });
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    console.log(`🆔 [ADMIN KYC] Updated KYC for ${updatedUser.email} to ${targetStatus}`);
    res.json({ success: true, message: `KYC status set to ${targetStatus}`, user: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 11b. POST /api/admin/user/trade-outcome & /api/admin/users/trade-outcome
app.post(['/api/admin/user/trade-outcome', '/api/admin/users/trade-outcome', '/api/admin/users/outcome'], async (req, res) => {
  try {
    const { userId, id, email, outcome, tradeOutcome } = req.body;
    const targetOutcome = (tradeOutcome || outcome || 'DEFAULT').toUpperCase();

    let query = {};
    if (userId || id) query._id = userId || id;
    else if (email) query.email = email.toLowerCase();
    else return res.status(400).json({ success: false, message: 'User ID or email required' });

    const updatedUser = await User.findOneAndUpdate(query, { tradeOutcome: targetOutcome }, { new: true });
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    console.log(`⚙️ [ADMIN TRADE CONTROL] User ${updatedUser.email} trade outcome set to: ${targetOutcome}`);
    res.json({ success: true, message: `User outcome set to ${targetOutcome}`, user: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 11c. POST /api/admin/global-outcome - Global Master Trade Outcome Switch
app.post(['/api/admin/global-outcome', '/api/admin/settings/trade-outcome'], async (req, res) => {
  try {
    const { outcome, globalTradeOutcome } = req.body;
    const targetOutcome = (globalTradeOutcome || outcome || 'LOSS').toUpperCase();

    inMemoryGlobalTradeOutcome = targetOutcome;
    let config = await SystemSettings.findOne({ key: 'global_config' });
    if (!config) {
      config = new SystemSettings({ key: 'global_config', platformTotalEarnings: 0, globalTradeOutcome: targetOutcome });
    } else {
      config.globalTradeOutcome = targetOutcome;
    }
    await config.save();

    console.log(`🌐 [GLOBAL TRADE CONTROL] Global outcome set to: ${targetOutcome}`);
    res.json({ success: true, message: `Global outcome set to ${targetOutcome}`, globalTradeOutcome: targetOutcome });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});



// 18. GET /api/admin/trades & /api/admin/user-trades - All Executed Binary Trades Across All Users (Cleaned Distinct Trades)
app.get(['/api/admin/trades', '/api/admin/user-trades'], async (req, res) => {
  try {
    const users = await User.find({ 'transactions.0': { $exists: true } }).select('fullName username email transactions createdAt');

    const tradeStats = getDistinctTradesAndFees(users);
    const allTrades = tradeStats.allTrades;

    // Sort descending by trade date
    allTrades.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      trades: allTrades,
      totalTrades: allTrades.length,
      totalVolume: tradeStats.totalTradeVolume,
      platformFeeRevenue: tradeStats.totalPlatformFee
    });
  } catch (error) {
    console.error('Admin Trades Error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch user trades: ' + error.message });
  }
});

// 17. POST /api/contact & /api/contact-us - Contact Us Form Submission to info@bitcashs.com
app.post(['/api/contact', '/api/contact-us', '/api/support/contact'], async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email address, and message are required fields.'
      });
    }

    // Save inquiry to MongoDB
    const newMsg = await ContactMessage.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      message: message.trim(),
      recipient: 'info@bitcashs.com',
      status: 'Received',
      createdAt: new Date()
    });

    console.log(`📩 [CONTACT US] New inquiry from ${name} <${email}> -> info@bitcashs.com: "${message.substring(0, 80)}..."`);

    // Return success confirmation response
    res.json({
      success: true,
      message: 'Message sent successfully! We will contact you soon.',
      inquiryId: newMsg._id
    });
  } catch (error) {
    console.error('Contact Form Error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to send message: ' + error.message });
  }
});

// 12a. POST /api/wallet/deposit & /api/deposit/submit - User Submit Deposit Proof with Optional Plan
app.post(['/api/wallet/deposit', '/api/deposit/submit', '/api/user/deposit'], async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let userId = null;
    let userEmail = req.body.email;
    let username = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
      } catch (e) { }
    }

    let user = null;
    if (userId) {
      user = await User.findById(userId);
    } else if (userEmail) {
      user = await User.findOne({ email: userEmail.toLowerCase() });
    }

    if (user) {
      userId = user._id;
      userEmail = user.email;
      username = user.username || user.fullName;
    }

    if (!userEmail) {
      return res.status(401).json({ success: false, message: 'Authentication required to submit deposit' });
    }

    const { amount, txid, proofImage, receipt, network, coin, planName, planDuration, planDailyRoi, planMin, planMax } = req.body;
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount < 100) {
      return res.status(400).json({ success: false, message: 'Minimum deposit amount is 100 USDT' });
    }

    // Plan validation if user selected a contract
    if (planName) {
      const minP = parseFloat(planMin) || 0;
      const maxP = parseFloat(planMax) || 0;
      if (minP > 0 && numAmount < minP) {
        return res.status(400).json({ success: false, message: `Deposit must match selected plan range (Min $${minP.toLocaleString()} USDT)` });
      }
      if (maxP > 0 && numAmount > maxP) {
        return res.status(400).json({ success: false, message: `Deposit must match selected plan range (Max $${maxP.toLocaleString()} USDT)` });
      }
    }

    if (!txid || !txid.trim()) {
      return res.status(400).json({ success: false, message: 'Transaction Hash (TXID) is required' });
    }

    const proofBase64 = proofImage || receipt;
    if (!proofBase64) {
      return res.status(400).json({ success: false, message: 'Proof screenshot image is required' });
    }

    // Upload deposit proof screenshot to Cloudinary in 'bitcashs_uploads'
    const uploadedProofUrl = await uploadToCloudinary(proofBase64, 'bitcashs_uploads');

    const newDeposit = new Deposit({
      userId: userId || undefined,
      userEmail: userEmail,
      username: username || userEmail.split('@')[0],
      amount: numAmount,
      coin: coin || 'USDT',
      network: network || 'TRC20',
      txid: txid.trim(),
      receipt: uploadedProofUrl,
      proofImage: uploadedProofUrl,
      planName: planName || '',
      planDuration: planDuration || '',
      planDailyRoi: planDailyRoi || '',
      planMin: parseFloat(planMin) || 0,
      planMax: parseFloat(planMax) || 0,
      status: 'Pending',
      createdAt: new Date()
    });

    await newDeposit.save();

    // Log pending transaction in user history
    if (user) {
      user.transactions = user.transactions || [];
      user.transactions.push({
        type: planName ? `Deposit (${planName})` : 'Deposit',
        coin: `${coin || 'USDT'} (${network || 'TRC20'})`,
        amount: `+${numAmount.toFixed(2)}`,
        status: 'Pending',
        createdAt: new Date()
      });
      await user.save();
    }

    console.log(`📥 [DEPOSIT SUBMISSION] User ${userEmail} submitted ${numAmount} USDT deposit (TXID: ${txid.trim()})${planName ? ` for plan: ${planName}` : ''}`);

    res.status(200).json({
      success: true,
      message: `Deposit proof of $${numAmount} USDT submitted successfully! Status: Pending Approval.`,
      depositId: newDeposit._id,
      deposit: newDeposit,
      planName: planName || null
    });
  } catch (error) {
    console.error('Deposit Submission Error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to submit deposit: ' + error.message });
  }
});

function formatSafeProofUrl(img) {
  if (!img || typeof img !== 'string') return '';
  const s = img.trim();
  if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('data:image/png') || s.startsWith('data:image/jpeg') || s.startsWith('data:image/webp')) {
    return s;
  }
  return '';
}

// 12b. GET /api/admin/deposits & /api/admin/deposits/pending - Fetch all deposits
app.get(['/api/admin/deposits', '/api/admin/deposits/pending'], async (req, res) => {
  try {
    const deposits = await Deposit.find().sort({ createdAt: -1 });
    const pendingDeposits = deposits.filter(d => d.status === 'Pending');

    res.json({
      success: true,
      deposits: deposits.map(d => {
        const safeProof = formatSafeProofUrl(d.proofImage || d.receipt);
        return {
          _id: d._id,
          id: d._id,
          userId: d.userId,
          userEmail: d.userEmail,
          username: d.username || d.userEmail.split('@')[0],
          amount: d.amount,
          coin: d.coin || 'USDT',
          network: d.network || 'TRC20',
          txid: d.txid,
          planName: d.planName || '',
          planDuration: d.planDuration || '',
          proofImage: safeProof,
          receipt: safeProof,
          status: d.status || 'Pending',
          createdAt: d.createdAt
        };
      }),
      pendingDeposits: pendingDeposits.map(d => {
        const safeProof = formatSafeProofUrl(d.proofImage || d.receipt);
        return {
          _id: d._id,
          id: d._id,
          userId: d.userId,
          userEmail: d.userEmail,
          username: d.username || d.userEmail.split('@')[0],
          amount: d.amount,
          coin: d.coin || 'USDT',
          network: d.network || 'TRC20',
          txid: d.txid,
          planName: d.planName || '',
          planDuration: d.planDuration || '',
          proofImage: safeProof,
          receipt: safeProof,
          status: d.status || 'Pending',
          createdAt: d.createdAt
        };
      })
    });
  } catch (error) {
    console.error('Admin Deposits Error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch deposits: ' + error.message });
  }
});

// 12c. POST /api/admin/deposits/approve/:id & /api/admin/deposits/approve - Admin Approves Deposit & Activates Plan in User's Wallet
app.post(['/api/admin/deposits/approve/:id', '/api/admin/deposits/approve'], async (req, res) => {
  try {
    const depositId = req.params.id || req.body.depositId || req.body.id;
    if (!depositId) return res.status(400).json({ success: false, message: 'Deposit ID required' });

    const deposit = await Deposit.findById(depositId);
    if (!deposit) return res.status(404).json({ success: false, message: 'Deposit request not found' });

    if (deposit.status === 'Approved') {
      return res.json({ success: true, message: 'Deposit already approved', deposit });
    }

    deposit.status = 'Approved';
    await deposit.save();

    // Find and update User
    const userQuery = deposit.userId ? { _id: deposit.userId } : { email: deposit.userEmail.toLowerCase() };
    const user = await User.findOne(userQuery);

    let planActivated = false;
    let activatedPlanName = '';

    if (user) {
      // 1. Credit wallet balance
      user.balance = parseFloat(((parseFloat(user.balance) || 0) + deposit.amount).toFixed(2));
      user.totalDeposits = parseFloat(((parseFloat(user.totalDeposits) || 0) + deposit.amount).toFixed(2));

      // 2. If deposit had an associated Mining Plan, activate it in user's profile
      if (deposit.planName) {
        planActivated = true;
        activatedPlanName = `${deposit.planName} (${deposit.planDuration || '30 Days'})`;

        user.activePlans = user.activePlans || [];
        user.activePlans.push({
          planName: deposit.planName,
          displayName: activatedPlanName,
          duration: deposit.planDuration || '30 Days',
          amount: deposit.amount,
          dailyRoi: deposit.planDailyRoi || '0.75%',
          status: 'Active',
          activatedAt: new Date()
        });

        user.activePlansCount = user.activePlans.length;
        user.totalInvested = parseFloat(((parseFloat(user.totalInvested) || 0) + deposit.amount).toFixed(2));
      }

      // 3. Update User Transaction ledger
      user.transactions = user.transactions || [];
      const matchTx = user.transactions.find(t => t.type.includes('Deposit') && Math.abs(parseFloat(t.amount)) === deposit.amount && t.status === 'Pending');
      if (matchTx) {
        matchTx.status = 'Approved';
      } else {
        user.transactions.push({
          type: deposit.planName ? `Deposit (${deposit.planName})` : 'Deposit',
          coin: `${deposit.coin || 'USDT'} (${deposit.network || 'TRC20'})`,
          amount: `+${deposit.amount.toFixed(2)}`,
          status: 'Approved',
          createdAt: new Date()
        });
      }

      user.markModified('transactions');
      user.markModified('activePlans');
      await user.save();

      console.log(`✅ [DEPOSIT APPROVED] Added $${deposit.amount} to user ${user.email}. New Balance: $${user.balance}${planActivated ? ` | Activated Plan: ${activatedPlanName}` : ''}`);
    }

    res.json({
      success: true,
      message: `Deposit of $${deposit.amount.toFixed(2)} Approved!${planActivated ? ` Plan '${activatedPlanName}' is now ACTIVE in user's wallet!` : ''}`,
      deposit,
      user: user ? {
        email: user.email,
        balance: user.balance,
        activePlansCount: user.activePlansCount,
        totalInvested: user.totalInvested,
        activePlans: user.activePlans
      } : null
    });
  } catch (error) {
    console.error('Deposit Approval Error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to approve deposit: ' + error.message });
  }
});

// 12d. POST /api/admin/deposits/reject/:id & /api/admin/deposits/reject
app.post(['/api/admin/deposits/reject/:id', '/api/admin/deposits/reject'], async (req, res) => {
  try {
    const depositId = req.params.id || req.body.depositId || req.body.id;
    if (!depositId) return res.status(400).json({ success: false, message: 'Deposit ID required' });

    const deposit = await Deposit.findById(depositId);
    if (!deposit) return res.status(404).json({ success: false, message: 'Deposit request not found' });

    deposit.status = 'Rejected';
    await deposit.save();

    console.log(`⚠️ [DEPOSIT REJECTED] Deposit ${deposit._id} for ${deposit.userEmail} was marked as Rejected`);

    res.json({
      success: true,
      message: 'Deposit request marked as Rejected',
      deposit
    });
  } catch (error) {
    console.error('Deposit Rejection Error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to reject deposit: ' + error.message });
  }
});




// 13. POST /api/kyc/submit - Submit KYC Verification Data
app.post('/api/kyc/submit', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let userId = null;
    let userEmail = req.body.email;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
      } catch (e) { }
    }

    if (!userId && !userEmail) {
      return res.status(401).json({ success: false, message: 'Unauthorized KYC submission' });
    }

    const query = userId ? { _id: userId } : { email: (userEmail || '').toLowerCase() };
    const user = await User.findOne(query);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found for KYC submission' });
    }

    // Update user personal details and KYC status to PENDING_APPROVAL
    const { firstName, lastName, dob, country, docType, address, frontDoc, backDoc, proofResidence, selfieDoc } = req.body;

    if (firstName && lastName) {
      user.fullName = `${firstName} ${lastName}`.trim();
    }
    if (country) user.country = country;
    user.kycStatus = 'PENDING_APPROVAL';
    user.kycSubmittedAt = new Date();

    // Upload submitted verification documents to Cloudinary in 'bitcashs_uploads'
    const [uploadedFront, uploadedBack, uploadedResidence, uploadedSelfie] = await Promise.all([
      uploadToCloudinary(frontDoc, 'bitcashs_uploads'),
      uploadToCloudinary(backDoc, 'bitcashs_uploads'),
      uploadToCloudinary(proofResidence, 'bitcashs_uploads'),
      uploadToCloudinary(selfieDoc, 'bitcashs_uploads')
    ]);

    user.kycData = {
      firstName: firstName || '',
      lastName: lastName || '',
      dob: dob || '',
      country: country || 'Global',
      docType: docType || 'National ID',
      address: address || '',
      frontDoc: uploadedFront || '',
      backDoc: uploadedBack || '',
      proofResidence: uploadedResidence || '',
      selfieDoc: uploadedSelfie || ''
    };

    user.markModified && user.markModified('kycData');
    user.markModified && user.markModified('kycStatus');
    await user.save();

    console.log(`✅ [KYC SUBMISSION] User ${user.email} submitted KYC. Status updated to PENDING_APPROVAL.`);

    res.status(200).json({
      success: true,
      message: 'KYC submitted successfully for review!',
      kycStatus: 'PENDING_APPROVAL',
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        kycStatus: 'PENDING_APPROVAL',
        country: user.country
      }
    });
  } catch (error) {
    console.error('KYC Submission Error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to process KYC submission: ' + error.message });
  }
});



// 14. GET /api/admin/kyc-requests - Fetch all pending KYC requests from MongoDB
app.get('/api/admin/kyc-requests', async (req, res) => {
  try {
    const pendingUsers = await User.find({
      $or: [
        { kycStatus: 'PENDING_APPROVAL' },
        { 'kycData.frontDoc': { $exists: true, $ne: '' } }
      ]
    }).sort({ kycSubmittedAt: -1, createdAt: -1 });

    const requests = pendingUsers.map(u => {
      const kd = u.kycData || {};
      return {
        userId: u._id,
        id: u._id,
        username: u.username || u.fullName || u.email.split('@')[0],
        email: u.email,
        submittedAt: u.kycSubmittedAt || u.createdAt || new Date(),
        status: u.kycStatus || 'PENDING_APPROVAL',
        kycStatus: u.kycStatus || 'PENDING_APPROVAL',
        firstName: kd.firstName || u.fullName?.split(' ')[0] || '',
        lastName: kd.lastName || u.fullName?.split(' ')[1] || '',
        dob: kd.dob || '—',
        country: kd.country || u.country || 'Global',
        fullAddress: kd.address || '—',
        address: kd.address || '—',
        docType: kd.docType || 'National ID',
        idFrontImage: kd.frontDoc || '',
        idBackImage: kd.backDoc || '',
        utilityBillImage: kd.proofResidence || '',
        livePhotoImage: kd.selfieDoc || ''
      };
    });

    res.json({ success: true, requests });
  } catch (error) {
    console.error('Admin KYC Requests Error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch KYC requests: ' + error.message });
  }
});

// 15. POST /api/admin/kyc/approve/:userId & /api/admin/kyc/approve
app.post(['/api/admin/kyc/approve/:userId', '/api/admin/kyc/approve'], async (req, res) => {
  try {
    const userId = req.params.userId || req.body.userId;
    if (!userId) return res.status(400).json({ success: false, message: 'User ID required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.kycStatus = 'VERIFIED';
    user.markModified && user.markModified('kycStatus');
    await user.save();

    console.log(`✅ [KYC APPROVAL] Admin approved KYC for user ${user.email}`);

    res.json({ success: true, message: 'KYC verified and approved successfully!', kycStatus: 'VERIFIED' });
  } catch (error) {
    console.error('KYC Approval Error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to approve KYC: ' + error.message });
  }
});

// 16. POST /api/admin/kyc/reject/:userId & /api/admin/kyc/reject
app.post(['/api/admin/kyc/reject/:userId', '/api/admin/kyc/reject'], async (req, res) => {
  try {
    const userId = req.params.userId || req.body.userId;
    if (!userId) return res.status(400).json({ success: false, message: 'User ID required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.kycStatus = 'REJECTED';
    user.markModified && user.markModified('kycStatus');
    await user.save();

    console.log(`⚠️ [KYC REJECTION] Admin rejected KYC for user ${user.email}`);

    res.json({ success: true, message: 'KYC request has been rejected', kycStatus: 'REJECTED' });
  } catch (error) {
    console.error('KYC Rejection Error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to reject KYC: ' + error.message });
  }
});



// ==========================================================================
// 17. GET /api/user/wallet & /api/wallet/data - Comprehensive Dynamic User Wallet
// ==========================================================================
app.get(['/api/user/wallet', '/api/wallet/data', '/api/wallet/summary'], async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let userId = null;
    let userEmail = req.query.email || req.query.userEmail;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
      } catch (e) { }
    }

    let user = null;
    if (userId) {
      user = await User.findById(userId);
    } else if (userEmail) {
      user = await User.findOne({ email: userEmail.toLowerCase() });
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found or unauthenticated' });
    }

    const balance = parseFloat(user.balance) || 0;
    const liveBtcPrice = 64500.0;
    const btcVal = (balance / liveBtcPrice).toFixed(4);

    // Calculate Daily Earnings and Total Profit (Only actual Net Profit from WIN trades, never adding stake)
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);

    let dailyEarnings = 0;
    let totalProfit = 0;

    if (user.transactions && Array.isArray(user.transactions)) {
      user.transactions.forEach(t => {
        const tDate = new Date(t.createdAt || Date.now());
        const tType = (t.type || '').toLowerCase();

        // Accumulate Net Profit ONLY on winning settlements (strictly exclude stake)
        if (tType.includes('win') || tType.includes('settlement (win)')) {
          let np = 0;
          if (t.netProfit !== undefined && !isNaN(parseFloat(t.netProfit))) {
            np = parseFloat(t.netProfit);
          } else if (t.grossProfit !== undefined && t.platformFee !== undefined) {
            np = parseFloat(t.grossProfit) - parseFloat(t.platformFee);
          } else if (t.stake !== undefined && t.totalPayout !== undefined) {
            np = parseFloat(t.totalPayout) - parseFloat(t.stake);
          } else {
            const rawAmt = Math.abs(parseFloat(String(t.amount || 0).replace(/[^0-9.]/g, '')) || 0);
            const stk = parseFloat(t.stake) || (rawAmt >= 100 ? 100 : 0);
            np = (rawAmt > stk && stk > 0) ? (rawAmt - stk) : (rawAmt * 0.09);
          }

          if (np > 0) {
            totalProfit = parseFloat((totalProfit + np).toFixed(2));
            if (tDate >= startOfToday) {
              dailyEarnings = parseFloat((dailyEarnings + np).toFixed(2));
            }
          }
        }
      });
    }

    // Calculate Total Approved Deposits from Deposit collection
    const approvedDeposits = await Deposit.find({
      $or: [
        { userId: user._id },
        { userEmail: user.email.toLowerCase() }
      ],
      status: 'Approved'
    });

    let totalDepositsSum = 0;
    approvedDeposits.forEach(d => { totalDepositsSum += (parseFloat(d.amount) || 0); });
    if (totalDepositsSum === 0 && user.totalDeposits) {
      totalDepositsSum = parseFloat(user.totalDeposits) || 0;
    }

    // Fetch user withdrawals
    const userWithdrawals = await Withdrawal.find({
      $or: [
        { userId: user._id },
        { userEmail: user.email.toLowerCase() }
      ]
    }).sort({ createdAt: -1 });

    // Fetch all user deposits
    const allUserDeposits = await Deposit.find({
      $or: [
        { userId: user._id },
        { userEmail: user.email.toLowerCase() }
      ]
    }).sort({ createdAt: -1 });

    // Merge transactions
    let allTx = [];

    // Add Deposits
    allUserDeposits.forEach(d => {
      allTx.push({
        id: d._id,
        type: 'Deposit',
        coin: `${d.coin || 'USDT'} (${d.network || 'TRC20'})`,
        amount: `+${parseFloat(d.amount).toFixed(2)} USDT`,
        rawAmount: parseFloat(d.amount),
        status: d.status || 'Pending',
        txid: d.txid,
        date: new Date(d.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        createdAt: d.createdAt
      });
    });

    // Add Withdrawals
    userWithdrawals.forEach(w => {
      allTx.push({
        id: w._id,
        type: 'Withdrawal',
        coin: `${w.coin || 'USDT'} (${w.network || 'TRC20'})`,
        amount: `-${parseFloat(w.amount).toFixed(2)} USDT`,
        rawAmount: -parseFloat(w.amount),
        status: w.status || 'Pending',
        address: w.address,
        date: new Date(w.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        createdAt: w.createdAt
      });
    });

    // Add Trades
    if (user.transactions && Array.isArray(user.transactions)) {
      user.transactions.forEach(t => {
        if (!t.type?.toLowerCase().includes('deposit') && !t.type?.toLowerCase().includes('withdrawal')) {
          const isWin = t.type?.toLowerCase().includes('win');
          const isLoss = t.type?.toLowerCase().includes('loss');
          allTx.push({
            id: t._id || Math.random().toString(),
            type: isWin ? 'Trade (Win)' : (isLoss ? 'Trade (Loss)' : t.type),
            coin: t.coin || 'BTC/USDT',
            amount: `${parseFloat(t.amount) >= 0 ? '+' : ''}${parseFloat(t.amount).toFixed(2)} USDT`,
            rawAmount: parseFloat(t.amount),
            status: t.status || 'Completed',
            date: new Date(t.createdAt || Date.now()).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            createdAt: t.createdAt || new Date()
          });
        }
      });
    }

    // Sort by date descending
    allTx.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      balance: balance,
      activePlansCount: (user.activePlans && user.activePlans.length) || user.activePlansCount || 0,
      totalInvestedUsd: user.totalInvested || 0,
      wallet: {
        totalBalanceUsd: balance,
        totalBalanceBtc: btcVal,
        dailyEarningsUsd: dailyEarnings,
        totalProfitUsd: totalProfit > 0 ? totalProfit : 0,
        activePlansCount: (user.activePlans && user.activePlans.length) || user.activePlansCount || 0,
        activePlans: user.activePlans || [],
        latestActivePlan: (user.activePlans && user.activePlans.length > 0) ? user.activePlans[user.activePlans.length - 1] : null,
        totalInvestedUsd: user.totalInvested || 0,
        totalDepositedUsd: totalDepositsSum,
        trc20Address: 'TRBuYjnRoj9jM3WheB2k4X1t3SdxsYGr2j'
      },
      assets: [
        { name: 'Tether', symbol: 'USDT', balance: balance, inOrder: 0.00, usdValue: balance, btcValue: btcVal, icon: '₮' },
        { name: 'Bitcoin', symbol: 'BTC', balance: 0.00, inOrder: 0.00, usdValue: 0.00, btcValue: 0.00, icon: '₿' },
        { name: 'Ethereum', symbol: 'ETH', balance: 0.00, inOrder: 0.00, usdValue: 0.00, btcValue: 0.00, icon: 'Ξ' },
        { name: 'Solana', symbol: 'SOL', balance: 0.00, inOrder: 0.00, usdValue: 0.00, btcValue: 0.00, icon: '◎' }
      ],
      transactions: allTx
    });
  } catch (error) {
    console.error('Wallet Endpoint Error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch wallet data: ' + error.message });
  }
});


// ==========================================================================
// 18. POST /api/wallet/withdraw - User Submit Withdrawal Request (Min $500, 0% Fee)
// ==========================================================================
app.post(['/api/wallet/withdraw', '/api/user/withdraw'], async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let userId = null;
    let userEmail = req.body.email;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
      } catch (e) { }
    }

    let user = null;
    if (userId) {
      user = await User.findById(userId);
    } else if (userEmail) {
      user = await User.findOne({ email: userEmail.toLowerCase() });
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { amount, coin, network, address, name, fullName } = req.body;
    const numAmount = parseFloat(amount);
    const applicantName = (fullName || name || user.fullName || user.username || '').trim();

    if (!applicantName) {
      return res.status(400).json({ success: false, message: 'Account Holder Name is required' });
    }

    if (isNaN(numAmount) || numAmount < 500) {
      return res.status(400).json({ success: false, message: 'Minimum withdrawal amount is $500.00 USDT' });
    }

    const currentBalance = parseFloat(user.balance) || 0;
    if (numAmount > currentBalance) {
      return res.status(400).json({ success: false, message: `Insufficient available balance ($${currentBalance.toFixed(2)} USDT available)` });
    }

    if (!address || !address.trim()) {
      return res.status(400).json({ success: false, message: 'Wallet Address / Income ID is required' });
    }

    // 1. Immediately deduct amount from user balance
    user.balance = parseFloat((currentBalance - numAmount).toFixed(2));

    // 2. Add record to User's Transaction History (Status: Pending, 0% Fee)
    user.transactions = user.transactions || [];
    user.transactions.push({
      type: 'Withdrawal',
      coin: `${coin || 'USDT'} (${network || 'TRC20'})`,
      amount: -numAmount,
      fee: 0,
      status: 'Pending',
      createdAt: new Date()
    });
    await user.save();

    // 3. Create persistent Withdrawal record for Admin Panel
    const withdrawal = new Withdrawal({
      userId: user._id,
      userEmail: user.email,
      fullName: applicantName,
      username: user.username || applicantName,
      amount: numAmount,
      coin: coin || 'USDT',
      network: network || 'TRC20',
      address: address.trim(),
      fee: 0,
      status: 'Pending',
      createdAt: new Date()
    });
    await withdrawal.save();

    console.log(`📤 [WITHDRAWAL SUBMITTED] User ${user.email} (${applicantName}) requested $${numAmount} USDT to ${address.trim()}. New Bal: $${user.balance}`);

    res.json({
      success: true,
      message: `✅ Withdrawal request of $${numAmount.toFixed(2)} USDT submitted! Your funds are under review and will be processed shortly.`,
      newBalance: user.balance,
      withdrawal
    });
  } catch (error) {
    console.error('Withdrawal Submission Error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to process withdrawal request: ' + error.message });
  }
});

// ==========================================================================
// 19. ADMIN WITHDRAWALS MANAGEMENT (GET & APPROVE / REJECT WITH REFUND)
// ==========================================================================
app.get(['/api/admin/withdrawals', '/api/admin/withdrawals/pending'], async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find().sort({ createdAt: -1 });
    const pendingWithdrawals = withdrawals.filter(w => w.status === 'Pending');

    res.json({
      success: true,
      withdrawals: withdrawals.map(w => ({
        _id: w._id,
        id: w._id,
        userId: w.userId,
        userEmail: w.userEmail,
        fullName: w.fullName || w.username || 'User',
        username: w.username || w.userEmail.split('@')[0],
        amount: w.amount,
        coin: w.coin || 'USDT',
        network: w.network || 'TRC20',
        address: w.address,
        fee: w.fee || 0,
        status: w.status || 'Pending',
        createdAt: w.createdAt
      })),
      pendingWithdrawals
    });
  } catch (error) {
    console.error('Admin Withdrawals Error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch withdrawals: ' + error.message });
  }
});

// Admin Approve Withdrawal
app.post(['/api/admin/withdrawals/approve/:id', '/api/admin/withdrawals/approve'], async (req, res) => {
  try {
    const withdrawalId = req.params.id || req.body.withdrawalId || req.body.id;
    if (!withdrawalId) return res.status(400).json({ success: false, message: 'Withdrawal ID required' });

    const withdrawal = await Withdrawal.findById(withdrawalId);
    if (!withdrawal) return res.status(404).json({ success: false, message: 'Withdrawal request not found' });

    if (withdrawal.status === 'Approved') {
      return res.json({ success: true, message: 'Withdrawal already approved', withdrawal });
    }

    withdrawal.status = 'Approved';
    await withdrawal.save();

    // Update user's transaction record
    const userQuery = withdrawal.userId ? { _id: withdrawal.userId } : { email: withdrawal.userEmail.toLowerCase() };
    const user = await User.findOne(userQuery);
    if (user && user.transactions) {
      const matchTx = user.transactions.find(t => t.type === 'Withdrawal' && Math.abs(parseFloat(t.amount)) === withdrawal.amount && t.status === 'Pending');
      if (matchTx) {
        matchTx.status = 'Approved';
        user.markModified('transactions');
        await user.save();
      }
    }

    console.log(`✅ [WITHDRAWAL APPROVED] Admin approved $${withdrawal.amount} USDT payout for ${withdrawal.userEmail}`);

    res.json({
      success: true,
      message: `Withdrawal of $${withdrawal.amount.toFixed(2)} USDT Approved successfully!`,
      withdrawal
    });
  } catch (error) {
    console.error('Withdrawal Approval Error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to approve withdrawal: ' + error.message });
  }
});

// Admin Reject Withdrawal & Refund back to User
app.post(['/api/admin/withdrawals/reject/:id', '/api/admin/withdrawals/reject'], async (req, res) => {
  try {
    const withdrawalId = req.params.id || req.body.withdrawalId || req.body.id;
    if (!withdrawalId) return res.status(400).json({ success: false, message: 'Withdrawal ID required' });

    const withdrawal = await Withdrawal.findById(withdrawalId);
    if (!withdrawal) return res.status(404).json({ success: false, message: 'Withdrawal request not found' });

    if (withdrawal.status === 'Rejected') {
      return res.json({ success: true, message: 'Withdrawal already rejected', withdrawal });
    }

    withdrawal.status = 'Rejected';
    await withdrawal.save();

    // Refund amount back to user's balance
    const userQuery = withdrawal.userId ? { _id: withdrawal.userId } : { email: withdrawal.userEmail.toLowerCase() };
    const user = await User.findOne(userQuery);

    if (user) {
      user.balance = parseFloat(((parseFloat(user.balance) || 0) + withdrawal.amount).toFixed(2));
      user.transactions = user.transactions || [];
      user.transactions.push({
        type: 'Withdrawal Refund',
        coin: `${withdrawal.coin || 'USDT'} (${withdrawal.network || 'TRC20'})`,
        amount: withdrawal.amount,
        status: 'Completed',
        createdAt: new Date()
      });
      await user.save();
      console.log(`↩️ [WITHDRAWAL REFUND] Refunded $${withdrawal.amount} USDT back to user ${user.email}. Restored Bal: $${user.balance}`);
    }

    res.json({
      success: true,
      message: `Withdrawal rejected and $${withdrawal.amount.toFixed(2)} USDT refunded back to user balance.`,
      withdrawal
    });
  } catch (error) {
    console.error('Withdrawal Rejection Error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to reject withdrawal: ' + error.message });
  }
});

// Start listening on port 5000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
