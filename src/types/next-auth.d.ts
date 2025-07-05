import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      dbUser?: {
        id: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
        imageUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
      };
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
  }
}
