// Authentication configuration with NextAuth
// Supports email/password, phone/OTP, and Google OAuth

import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./prisma";
import { verifyPassword } from "./utils";

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Email + Password login
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) {
          return null;
        }

        // Check if account is approved
        if (user.status !== "APPROVED") {
          throw new Error("Account not approved");
        }

        const passwordMatch = await verifyPassword(
          credentials.password as string,
          user.password
        );

        if (!passwordMatch) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName || ""}`,
          role: user.role,
          status: user.status,
        };
      },
    }),

    // Google OAuth (structure ready)
    ...(process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      }),
    ] : []),
  ],

  pages: {
    signIn: "/login",
    error: "/login?error=true",
  },

  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        const userWithRole = user as { role?: string; status?: string };
        token.role = userWithRole.role;
        token.status = userWithRole.status;
        token.id = (user as { id?: string }).id;
      }

      if (!token.id && token.sub) {
        token.id = token.sub;
      }

      return token;
    },

    async session({ session, token }: any) {
      if (session.user) {
        const userWithRole = session.user as { role?: string; status?: string };
        userWithRole.role = token.role as string;
        userWithRole.status = token.status as string;
        (session.user as { id?: string }).id = token.id as string | undefined;
      }
      return session;
    },

    async redirect({ url, baseUrl }: any) {
      // Redirect to dashboard after login
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },

  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },
};
