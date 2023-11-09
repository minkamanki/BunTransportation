import { Elysia, t } from "elysia";
import { cookie } from "@elysiajs/cookie";
import { jwt } from "@elysiajs/jwt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const app = new Elysia()
  .group("/api", (app) =>
    app
      .use(
        jwt({
          name: "jwt",
          secret: Bun.env.SECRET_KEY!,
        })
      )
      .use(cookie())
      .post(
        "/signup",
        async ({ body, set }) => {
          const { username, password } = body;

          // validate duplicate username
          const usernameExists = await prisma.user.findUnique({
            where: {
              username,
            },
            select: {
              id: true,
            },
          });

          if (usernameExists) {
            set.status = 400;
            return {
              success: false,
              data: null,
              message: "Someone already taken this username.",
            };
          }

          // handle password
          const hash = await Bun.password.hash(password);

          const newUser = await prisma.user.create({
            data: {
              password: hash,
              username,
            },
          });

          return {
            success: true,
            message: "Account created",
            data: {
              user: newUser,
            },
          };
        },
        {
          body: t.Object({
            username: t.String(),
            password: t.String(),
          }),
        }
      )
      .post(
        "/login",
        async ({ body, set, jwt, setCookie }) => {
          const { username, password } = body;
          // verify email/username
          const user = await prisma.user.findFirst({
            where: {
              username,
            },
            select: {
              id: true,
              password: true,
            },
          });

          if (!user) {
            set.status = 400;
            return {
              success: false,
              data: null,
              message: "Invalid credentials",
            };
          }

          // verify password
          const hash = await Bun.password.hash(password);
          const match = await Bun.password.verify(password, hash);
          if (!match) {
            set.status = 400;
            return {
              success: false,
              data: null,
              message: "Invalid credentials",
            };
          }

          // generate access 

          const accessToken = await jwt.sign({
            userId: user.id,
          });

          setCookie("access_token", accessToken, {
            maxAge: 15 * 60, // 15 minutes
            path: "/",
          });


          return {
            success: true,
            data: null,
            message: "Account login successfully",
          };
        },
        {
          body: t.Object({
            username: t.String(),
            password: t.String(),
          }),
        }
      )
      .get("/user", async ({ jwt, set, cookie: { auth } }) => {
        const profile = await jwt.verify(auth)

        if (!profile) {
          set.status = 401
          return {
            success: false,
            data: null,
            message: "Unauthorized.",
          }
        }
        // Remove sensitive information (e.g., password) before sending the user data
        const userData = {
          username: profile.username,
        };

        return {
          success: true,
          message: "Fetch authenticated user details",
          data: {
            userData,
          },
        }
      })
      .post("/submit-transportation", async ({ jwt, set, cookie: { auth }, body }) => {
        const user = await jwt.verify(auth)

        if (!user) {
          set.status = 401
          return {
            success: false,
            data: null,
            message: "Unauthorized.",
          }
        }

        const transportation = await prisma.transportation.create({
          data: body
        });

        return {
          success: true,
          message: "Transportation added",
          data: {
            transportation,
          },
        };
      },
        {
          body: t.Object({
            userId: t.String(),
            vehicle: t.String(),
            amount: t.Integer(),
            measurement: t.String(),
          }),
        })
      .get("/transportations/:user", async ({ jwt, set, cookie: { auth } }) => {
        const user = await jwt.verify(auth)

        if (!user) {
          set.status = 401
          return {
            success: false,
            data: null,
            message: "Unauthorized.",
          }
        }
        const transportations = await prisma.transportation.findMany({ where: { userId: user._id } });

        return {
          success: true,
          message: "Transportations found",
          data: {
            transportations,
          },
        };
      })
  )
  .listen(8080);
console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

/*import { Elysia } from "elysia";
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

// MongoDB connection
await mongoose.connect('mongodb+srv://minkatahvanainen:sDrm1Hl10eAKLXGG@transportationtracker.327za8e.mongodb.net/?retryWrites=true&w=majority');


const app = new Elysia()
  .use(
    jwt({
      name: 'jwt',
      secret: 'HvNIZBs13Wi5QP0L+uQx5JKJUiVtMbg47yzHhHVICyChDgPHeZd9NhEQUNtDIaiGGm1XczOP7+LIc+T7YpRGEu0lZIbbr8HxkGz8+gvTVlPIxRsEX2ysN3r6TG0WhFznK88O+QtL6ZjtUYu3LqbfyWALWZ+T24E+0xJuVw=='
    })
  )
  .use(cookie())
  .get("/", async () => {
    // Render your React app or other content here
  })
  .post("/register", async (req: any) => {
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
  })
  .post('/login', async ({ jwt, setCookie, req }): Promise<LoginResponse> => {
    // Replace this logic with your actual login authentication logic
    const { username, password } = req.body as { username: string; password: string };

    // Check if the username and password are correct
    if (username === 'validUsername' && password === 'validPassword') {
      // Assuming a successful login, you can sign a token and return it
      const token = await jwt.sign({ username });

      // Set the token as a cookie
      setCookie('auth', token, {
        httpOnly: true,
        maxAge: 7 * 86400,
      });

      return { token }; // Return the token in the response
    } else {
      // If login is unsuccessful, return an error response
      return { error: 'Invalid credentials' };
    }
  })
  .listen(8000, () => {
    console.log("Server running on port 8000");
  });*/