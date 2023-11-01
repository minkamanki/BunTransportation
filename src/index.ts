import { Elysia } from "elysia";
import { staticPlugin } from "@elysiajs/static";
import mongoose, { Document } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";
import dotenv from "dotenv";

interface UserDocument extends Document {
  username: string;
  password: string;
}

interface TransportationDocument extends Document {
  user: mongoose.Schema.Types.ObjectId;
  vehicle: string;
  amount: number;
  measurement: string;
}

const app = new Elysia()
  .use(staticPlugin())
  .use(cors())
  .listen(3000);

dotenv.config();

// MongoDB connection
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
});

const User = mongoose.model<UserDocument>("User", UserSchema);

const TransportationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  vehicle: String,
  amount: Number,
  measurement: String,
});

const Transportation = mongoose.model<TransportationDocument>(
  "Transportation",
  TransportationSchema
);

app.get("/", async () => {
  // Render your React app or other content here
});

app.post("/register", async (req: any) => {
  const { username, password } = req.body as {
    username: string;
    password: string;
  };

  try {
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: "Username already taken" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ username, password: hashedPassword });
    await user.save();

    return new Response(
      JSON.stringify({ message: "User registered successfully" }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

app.post("/login", async (req: any) => {
  const { username, password } = req.body as { username: string; password: string };

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Authentication failed" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return new Response(
        JSON.stringify({ error: "Authentication failed" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const token = jwt.sign({ username }, process.env.SECRET_KEY, {
      expiresIn: "1h",
    });

    return new Response(
      JSON.stringify({ token }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});