import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/db";
import { compare } from "bcryptjs";

const handler = NextAuth({
	adapter: PrismaAdapter(prisma),
	session: {
		strategy: "jwt",
		maxAge: 30 * 24 * 60 * 60, // 30 days (automatic expiration)
		updateAge: 24 * 60 * 60,    // 24 hours (refresh session if user is active)
	},
	// Use default cookie settings for better ngrok compatibility
	cookies: {
		sessionToken: {
			name: `next-auth.session-token`,
			options: {
				httpOnly: true,
				sameSite: 'lax',
				path: '/',
				// Allow cookies over HTTP for ngrok testing
				secure: process.env.NEXTAUTH_URL?.startsWith('https://') ?? false,
				maxAge: 30 * 24 * 60 * 60, // 30 days
			}
		},
		callbackUrl: {
			name: `next-auth.callback-url`,
			options: {
				httpOnly: true,
				sameSite: 'lax',
				path: '/',
				secure: process.env.NEXTAUTH_URL?.startsWith('https://') ?? false,
			}
		},
		csrfToken: {
			name: `next-auth.csrf-token`,
			options: {
				httpOnly: true,
				sameSite: 'lax',
				path: '/',
				secure: process.env.NEXTAUTH_URL?.startsWith('https://') ?? false,
			}
		}
	},
	// Trust proxy for ngrok
	useSecureCookies: process.env.NEXTAUTH_URL?.startsWith('https://') ?? false,
	providers: [
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

				const isValid = await compare(credentials.password, user.password);
				if (!isValid) return null;

				return {
					id: user.id,
					email: user.email,
					role: user.role,
				};
			},
		}),
	],
	callbacks: {
		async jwt({ token, user }) {
			// Add user role to token on signin
			if (user) {
				const u = user as { role?: string };
				token.role = u.role;
			}
			
			// Check if token is expired (server-side validation)
			const now = Date.now() / 1000;
			const expTime = token.exp as number;
			if (expTime && now > expTime) {
				// Token is expired, but we can't return null in JWT callback
				// NextAuth will handle expiration automatically
				console.log('JWT token expired for user:', token.sub);
			}
			
			return token;
		},
		async session({ session, token }) {
			// Add role to session
			if (token && session.user) {
				(session.user as { role?: string }).role = typeof token.role === 'string' ? token.role : undefined;
			}
			return session;
		},
	},
	events: {
		async signOut(message) {
			// Log signout events for security monitoring
			console.log('User signed out at:', new Date().toISOString());
			if (message.session) {
				console.log('Session ended for user:', message.session.user?.email);
			}
		},
		async session(message) {
			// Log session access for monitoring (only in development)
			if (process.env.NODE_ENV === 'development') {
				console.log('Session accessed:', message.session?.user?.email, 'at', new Date().toISOString());
			}
		},
		async signIn(message) {
			// Log successful sign-ins
			console.log('User signed in:', message.user.email, 'at', new Date().toISOString());
		}
	},
	pages: {
		signIn: "/auth/signin",
	},
});

export { handler as GET, handler as POST };
