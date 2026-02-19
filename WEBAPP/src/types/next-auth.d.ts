import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string | null;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string | null;
      isProfileComplete?: boolean;
    };
  }

  interface User {
    role?: string;
    isProfileComplete?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    id?: string;
    isProfileComplete?: boolean;
  }
}
