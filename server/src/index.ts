import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { PrismaClient } from "@prisma/client";
import { cors } from '@elysiajs/cors'

const prisma = new PrismaClient();

const app = new Elysia()
  .use(cors())
  .use(
    jwt({
      name: "jwt",
      secret: Bun.env.SECRET_KEY!,
    })
  )
  .post(
    "/register",
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
    async ({ body, set, jwt }) => {
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

      return {
        success: true,
        accessToken: accessToken,
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
  .get("/profile", async ({ jwt, set, headers }) => {
    const authorizationHeader = headers.authorization || "";
    if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
      set.status = 401;
      return {
        success: false,
        data: null,
        message: "Unauthorized. Token missing or invalid.",
      };
    }

    const token = authorizationHeader.substring(7); // Remove "Bearer " from the token

    const profile = await jwt.verify(token);
    if (!profile || !profile.userId) {
      set.status = 401
      return {
        success: false,
        data: null,
        message: "Unauthorized.",
      }
    }
    const user = await prisma.user.findUnique({
      where: {
        id: profile.userId,
      },
    })

    if (!user) {
      set.status = 400
      return {
        success: false,
        data: null,
        message: "User not found.",
      }
    }
    // Remove sensitive information (e.g., password) before sending the user data
    const userData = {
      username: user.username,
    };

    return {
      success: true,
      message: "Fetch authenticated user details",
      data: {
        userData,
      },
    }
  })
  .post("/submit-transportation", async ({ jwt, set, headers, body }) => {
    const authorizationHeader = headers.authorization || "";
    if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
      set.status = 401;
      return {
        success: false,
        data: null,
        message: "Unauthorized. Token missing or invalid.",
      };
    }

    const token = authorizationHeader.substring(7); // Remove "Bearer " from the token

    const profile = await jwt.verify(token);
    if (!profile || !profile.userId) {
      set.status = 401
      return {
        success: false,
        data: null,
        message: "Unauthorized.",
      }
    }


    const transportation = await prisma.transportation.create({
      data: {
        userId: profile.userId,
        ...body,
      }
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
        vehicle: t.String(),
        amount: t.Integer(),
        measurement: t.String(),
      }),
    })
  .get("/transportations", async ({ jwt, set, headers }) => {
    const authorizationHeader = headers.authorization || "";
    if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
      set.status = 401;
      return {
        success: false,
        data: null,
        message: "Unauthorized. Token missing or invalid.",
      };
    }

    const token = authorizationHeader.substring(7); // Remove "Bearer " from the token

    const profile = await jwt.verify(token);
    if (!profile || !profile.userId) {
      set.status = 401
      return {
        success: false,
        data: null,
        message: "Unauthorized.",
      }
    }
    const transportations = await prisma.transportation.findMany({ where: { userId: profile.userId } });
    return {
      success: true,
      message: "Transportations found",
      data: {
        transportations,
      },
    };
  })

  .listen(8080);
console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
