const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');

const JSON_DB_PATH = path.join(__dirname, '..', 'users.json');

let isMongoConnected = false;

// Disable Mongoose buffering so operations fail fast if DB is disconnected
mongoose.set('bufferCommands', false);

async function initDb(mongoUri) {
  if (!mongoUri) {
    console.log('⚡ MONGO_URI not provided. Running in Persistent File Database mode (users.json).');
    return;
  }

  try {
    console.log('🔄 Attempting to connect to MongoDB Atlas...');
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 4000 // Fast 4s timeout for Atlas IP check
    });
    isMongoConnected = true;
    console.log('✅ Successfully connected to MongoDB Atlas!');
  } catch (err) {
    isMongoConnected = false;
    console.warn('⚠️ MongoDB Atlas connection error:', err.message);
    console.log('⚡ Automatic Fallback Enabled: User accounts are permanently saved in users.json!');
  }
}

// Local JSON Database Helper
function getLocalUsers() {
  try {
    if (!fs.existsSync(JSON_DB_PATH)) {
      fs.writeFileSync(JSON_DB_PATH, JSON.stringify([]), 'utf-8');
      return [];
    }
    const raw = fs.readFileSync(JSON_DB_PATH, 'utf-8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    console.error('Error reading local JSON database:', err);
    return [];
  }
}

function saveLocalUsers(users) {
  try {
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving local JSON database:', err);
  }
}

// Unified User Queries
async function findUser({ email, mobile, emailOrMobile }) {
  if (isMongoConnected) {
    try {
      const query = [];
      if (email) query.push({ email });
      if (mobile) query.push({ mobile });
      if (emailOrMobile) query.push({ email: emailOrMobile }, { mobile: emailOrMobile });
      
      if (query.length === 0) return null;
      return await User.findOne({ $or: query });
    } catch (err) {
      console.warn('Mongo findUser failed, falling back to local storage:', err.message);
    }
  }

  // Fallback: Local JSON storage
  const users = getLocalUsers();
  return users.find(u => 
    (email && u.email === email) ||
    (mobile && u.mobile === mobile) ||
    (emailOrMobile && (u.email === emailOrMobile || u.mobile === emailOrMobile))
  ) || null;
}

async function createUser({ fullName, email, mobile, password }) {
  if (isMongoConnected) {
    try {
      const newUser = new User({
        fullName: fullName || '',
        email: email || undefined,
        mobile: mobile || undefined,
        password
      });
      await newUser.save();
      return {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        mobile: newUser.mobile,
        createdAt: newUser.createdAt
      };
    } catch (err) {
      console.warn('Mongo createUser failed, falling back to local storage:', err.message);
    }
  }

  // Fallback: Local JSON storage
  const users = getLocalUsers();
  const newUser = {
    id: 'usr_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    fullName: fullName || '',
    email: email || '',
    mobile: mobile || '',
    password,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveLocalUsers(users);

  return {
    id: newUser.id,
    fullName: newUser.fullName,
    email: newUser.email,
    mobile: newUser.mobile,
    createdAt: newUser.createdAt
  };
}

module.exports = {
  initDb,
  findUser,
  createUser,
  getIsMongoConnected: () => isMongoConnected
};
