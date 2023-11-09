import { Elysia } from "elysia";
import { cookie } from '@elysiajs/cookie';
import { jwt } from '@elysiajs/jwt';
import mongoose, { Document } from "mongoose";

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

const app = new Elysia().use(
  jwt({
    name: 'jwt',
    secret: 'HvNIZBs13Wi5QP0L+uQx5JKJUiVtMbg47yzHhHVICyChDgPHeZd9NhEQUNtDIaiGGm1XczOP7+LIc+T7YpRGEu0lZIbbr8HxkGz8+gvTVlPIxRsEX2ysN3r6TG0WhFznK88O+QtL6ZjtUYu3LqbfyWALWZ+T24E+0xJuVw=='
  })
)
  .use(cookie())

// MongoDB connection
mongoose.connect('mongodb+srv://minkatahvanainen:sDrm1Hl10eAKLXGG@transportationtracker.327za8e.mongodb.net/?retryWrites=true&w=majority');

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

    const hashedPassword = await Bun.password.hash(password);

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

    const passwordMatch = await Bun.password.verify(password, user.password);

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

app.listen(8000, () => {
  console.log("Server running on port 8000");
});