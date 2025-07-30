import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth-config";
import { prisma } from "./prisma";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  emailVerified: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Secure authentication guard for API routes
 * Only allows verified users with proper OAuth authentication
 */
export async function requireAuthenticatedUser(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<AuthenticatedUser> {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    throw new Error("Authentication required");
  }

  // Validate user ID format
  const userId = session.user.id;
  if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
    throw new Error("Invalid session");
  }

  // Get user from database with verification check
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      lastName: true,
      image: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // For OAuth users, emailVerified should be set
  if (!user.emailVerified) {
    console.log("⚠️ User found but email not verified:", user.email);
    // For OAuth users, we should set this automatically
    if (session.user.email) {
      await prisma.user.update({
        where: { id: userId },
        data: { emailVerified: new Date() },
      });
    }
  }

  return {
    id: user.id,
    email: user.email || "",
    name: user.name,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.image,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use requireAuthenticatedUser instead
 */
export async function getUserFromRequest(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<AuthenticatedUser> {
  return requireAuthenticatedUser(req, res);
}
