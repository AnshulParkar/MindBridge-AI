import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/db";
import { compare, hash } from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NEXTAUTH_URL?.startsWith("https://") ?? false,
        maxAge: 30 * 24 * 60 * 60,
      },
    },
    callbackUrl: {
      name: "next-auth.callback-url",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NEXTAUTH_URL?.startsWith("https://") ?? false,
      },
    },
    csrfToken: {
      name: "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NEXTAUTH_URL?.startsWith("https://") ?? false,
      },
    },
  },
  useSecureCookies: process.env.NEXTAUTH_URL?.startsWith("https://") ?? false,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findFirst({
          where: {
            email: credentials.email,
            role: credentials.role || "patient",
          },
        });

        if (!user) return null;
        if (user.isBanned) return null;

        const isValid = await compare(credentials.password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
          isProfileComplete: user.isProfileComplete,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
          include: { accounts: true },
        });

        if (existingUser) {
          if (existingUser.isBanned) return false;

          const hasGoogleAccount = existingUser.accounts.some(
            (acc) => acc.provider === "google"
          );
          if (!hasGoogleAccount) {
            await prisma.account.create({
              data: {
                userId: existingUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token as string | undefined,
                refresh_token: account.refresh_token as string | undefined,
                expires_at: account.expires_at as number | undefined,
                token_type: account.token_type as string | undefined,
                scope: account.scope as string | undefined,
                id_token: account.id_token as string | undefined,
                session_state: account.session_state as string | undefined,
              },
            });
          }

          user.id = existingUser.id;
          return true;
        }

        const randomPassword = await hash(Math.random().toString(36), 10);
        const newUser = await prisma.user.create({
          data: {
            email: user.email!,
            name: user.name || null,
            password: randomPassword,
            role: "patient",
            image: user.image || null,
            isProfileComplete: false,
          },
        });

        await prisma.account.create({
          data: {
            userId: newUser.id,
            type: account.type,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            access_token: account.access_token as string | undefined,
            refresh_token: account.refresh_token as string | undefined,
            expires_at: account.expires_at as number | undefined,
            token_type: account.token_type as string | undefined,
            scope: account.scope as string | undefined,
            id_token: account.id_token as string | undefined,
            session_state: account.session_state as string | undefined,
          },
        });

        user.id = newUser.id;
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        const u = user as { role?: string; id?: string; isProfileComplete?: boolean };
        token.role = u.role;
        token.id = u.id;
        token.isProfileComplete = u.isProfileComplete;
      }

      if (account?.provider === "google" && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email as string },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.id = dbUser.id;
          token.name = dbUser.name || token.name;
          token.isProfileComplete = dbUser.isProfileComplete;
        }
      }

      const now = Date.now() / 1000;
      const expTime = token.exp as number;
      if (expTime && now > expTime) {
        console.log("JWT token expired for user:", token.sub);
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as { role?: string; id?: string; isProfileComplete?: boolean }).role =
          typeof token.role === "string" ? token.role : undefined;
        (session.user as { id?: string }).id = typeof token.id === "string" ? token.id : undefined;
        (session.user as { isProfileComplete?: boolean }).isProfileComplete = !!token.isProfileComplete;
      }
      return session;
    },
  },
  events: {
    async signOut(message) {
      console.log("User signed out at:", new Date().toISOString());
      if (message.session) {
        console.log("Session ended for user:", message.session.user?.email);
      }
    },
    async session(message) {
      if (process.env.NODE_ENV === "development") {
        console.log("Session accessed:", message.session?.user?.email, "at", new Date().toISOString());
      }
    },
    async signIn(message) {
      console.log("User signed in:", message.user.email, "at", new Date().toISOString());
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
};