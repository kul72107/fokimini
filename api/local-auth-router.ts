import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { localUsers } from "@db/schema";
import { eq } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import * as cookie from "cookie";

const LOCAL_AUTH_COOKIE = "local_auth_token";

function getJwtSecret(): Uint8Array {
  const secret = process.env.APP_SECRET || "cyberpaw-secret-key-change-in-production";
  return new TextEncoder().encode(secret);
}

function getCookieOptions(): cookie.SerializeOptions {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: false,
    maxAge: 7 * 24 * 60 * 60,
  };
}

function getCookieOptionsClear(): cookie.SerializeOptions {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: false,
    expires: new Date(0),
  };
}

async function createToken(userId: number): Promise<string> {
  return new SignJWT({ sub: String(userId), type: "local" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret());
}

async function verifyToken(token: string): Promise<number | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), { clockTolerance: 60 });
    const userId = Number(payload.sub);
    return isNaN(userId) ? null : userId;
  } catch {
    return null;
  }
}

export const localAuthRouter = createRouter({
  register: publicQuery
    .input(
      z.object({
        username: z
          .string()
          .min(3, "Username must be at least 3 characters")
          .max(32, "Username must be at most 32 characters")
          .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
        password: z
          .string()
          .min(6, "Password must be at least 6 characters")
          .max(100, "Password must be at most 100 characters"),
        displayName: z
          .string()
          .min(2, "Display name must be at least 2 characters")
          .max(32, "Display name must be at most 32 characters"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      // Check if username already exists
      const existing = await db
        .select()
        .from(localUsers)
        .where(eq(localUsers.username, input.username))
        .limit(1);

      if (existing.length > 0) {
        return { success: false, error: "Username already taken" };
      }

      // Hash password
      const passwordHash = await bcrypt.hash(input.password, 12);

      // Insert user
      const result = await db.insert(localUsers).values({
        username: input.username,
        passwordHash,
        displayName: input.displayName,
      });

      const userId = Number(result[0].insertId);
      const token = await createToken(userId);

      // Set cookie
      const cookieOpts = getCookieOptions();
      ctx.resHeaders.append(
        "set-cookie",
        cookie.serialize(LOCAL_AUTH_COOKIE, token, cookieOpts),
      );

      return { success: true, token };
    }),

  login: publicQuery
    .input(
      z.object({
        username: z.string().min(1, "Username is required"),
        password: z.string().min(1, "Password is required"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      const rows = await db
        .select()
        .from(localUsers)
        .where(eq(localUsers.username, input.username))
        .limit(1);

      if (rows.length === 0) {
        return { success: false, error: "Invalid username or password" };
      }

      const user = rows[0];
      const valid = await bcrypt.compare(input.password, user.passwordHash);

      if (!valid) {
        return { success: false, error: "Invalid username or password" };
      }

      const token = await createToken(user.id);

      // Set cookie
      const cookieOpts = getCookieOptions();
      ctx.resHeaders.append(
        "set-cookie",
        cookie.serialize(LOCAL_AUTH_COOKIE, token, cookieOpts),
      );

      return { success: true, token };
    }),

  me: publicQuery.query(async ({ ctx }) => {
    // Read token from cookie or x-local-auth-token header
    const cookieHeader = ctx.req.headers.get("cookie") || "";
    const cookies = cookie.parse(cookieHeader);
    let token = cookies[LOCAL_AUTH_COOKIE];

    if (!token) {
      token = ctx.req.headers.get("x-local-auth-token") || "";
    }

    if (!token) {
      return null;
    }

    const userId = await verifyToken(token);
    if (!userId) {
      return null;
    }

    const db = getDb();
    const rows = await db
      .select()
      .from(localUsers)
      .where(eq(localUsers.id, userId))
      .limit(1);

    if (rows.length === 0) {
      return null;
    }

    const user = rows[0];

    // Return shape compatible with existing auth system
    return {
      id: user.id,
      name: user.displayName,
      displayName: user.displayName,
      username: user.username,
      avatar: user.avatar,
      level: user.level,
      totalXp: user.totalXp,
      role: user.role,
    };
  }),

  logout: publicQuery.mutation(async ({ ctx }) => {
    const cookieOpts = getCookieOptionsClear();
    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize(LOCAL_AUTH_COOKIE, "", cookieOpts),
    );
    return { success: true };
  }),
});
