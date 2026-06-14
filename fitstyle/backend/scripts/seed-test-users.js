import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDatabase } from "../src/db.js";
import { User } from "../src/models/User.js";

dotenv.config();

const seedUsers = [
  {
    name: "FitStyle Admin",
    email: "admin@fitstyle.test",
    password: "Admin@123456",
    role: "admin"
  },
  {
    name: "FitStyle Customer",
    email: "customer@fitstyle.test",
    password: "Customer@123456",
    role: "customer"
  }
];

try {
  await connectDatabase();

  for (const seedUser of seedUsers) {
    const passwordHash = await bcrypt.hash(seedUser.password, 10);
    await User.findOneAndUpdate(
      { email: seedUser.email },
      {
        $set: {
          name: seedUser.name,
          email: seedUser.email,
          passwordHash,
          role: seedUser.role
        }
      },
      {
        upsert: true,
        returnDocument: "after",
        setDefaultsOnInsert: true
      }
    );
  }

  const users = await User.find({ email: { $in: seedUsers.map((user) => user.email) } })
    .select("name email role createdAt updatedAt")
    .sort({ role: 1 })
    .lean();

  console.log(JSON.stringify({ ok: true, users }, null, 2));
} catch (error) {
  console.error(JSON.stringify({ ok: false, message: error.message }, null, 2));
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
