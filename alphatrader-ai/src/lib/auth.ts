import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const startTime = Date.now();
        try {
          if (!credentials?.email || !credentials?.password) {
            console.error("[Auth] Missing credentials");
            return null;
          }

          const email = credentials.email as string;
          const password = credentials.password as string;

          // Optimized: Only fetch required fields to reduce DB payload
          const user = await prisma.user.findUnique({
            where: { email },
            select: {
              id: true,
              email: true,
              name: true,
              password: true,
            },
          });

          const dbQueryTime = Date.now() - startTime;
          console.log(`[Auth] DB query took ${dbQueryTime}ms`);

          if (!user) {
            console.error("[Auth] User not found:", email);
            return null;
          }

          const bcryptStart = Date.now();
          const isPasswordValid = await bcrypt.compare(password, user.password);
          const bcryptTime = Date.now() - bcryptStart;
          console.log(`[Auth] Bcrypt took ${bcryptTime}ms`);

          if (!isPasswordValid) {
            console.error("[Auth] Invalid password for user:", email);
            return null;
          }

          const totalTime = Date.now() - startTime;
          console.log(`[Auth] Login successful for ${email} (total: ${totalTime}ms)`);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        } catch (error) {
          const totalTime = Date.now() - startTime;
          console.error(`[Auth] Authorization error after ${totalTime}ms:`, error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // Optimize JWT token operations
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
});
