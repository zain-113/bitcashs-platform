const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://admin:myadmin12@cluster0.soo8jkv.mongodb.net/bitcashs?authSource=admin&appName=Cluster0";

const UserSchema = new mongoose.Schema({
  fullName: { type: String, default: "Admin" },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "admin" },
  kycStatus: { type: String, default: "VERIFIED" }
}, { strict: false });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function seedAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB Atlas");

    const email = "admin@bitcashs.com";
    const plainPassword = "adminpassword123";
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    let user = await User.findOne({ email });

    if (user) {
      user.password = hashedPassword;
      user.role = "admin";
      user.kycStatus = "VERIFIED";
      await user.save();
      console.log(`SUCCESS: Updated admin user credentials -> Email: ${email} | Password: ${plainPassword}`);
    } else {
      user = new User({
        fullName: "System Admin",
        username: "admin",
        email: email,
        mobile: "+1 800 555 0199",
        password: hashedPassword,
        role: "admin",
        kycStatus: "VERIFIED",
        balance: 100000.00
      });
      await user.save();
      console.log(`SUCCESS: Created admin user credentials -> Email: ${email} | Password: ${plainPassword}`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
}

seedAdmin();
