import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth-config";
import { prisma } from "./prisma";

export async function getServerAuthSession(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return await getServerSession(req, res, authOptions);
}

export async function getUserFromRequest(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerAuthSession(req, res);

  console.log(
    "🔍 getUserFromRequest - Full session:",
    JSON.stringify(session, null, 2)
  );

  if (!session?.user?.id) {
    console.log("❌ No session or user ID found");
    throw new Error("Unauthorized");
  }

  // Additional security: Validate user ID format
  const userId = session.user.id;
  if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
    console.log("❌ Invalid user ID format:", userId);
    throw new Error("Invalid user session");
  }

  console.log("🔍 getUserFromRequest - User ID from session:", userId);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      imageUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (user) {
    // Additional security: Validate user data integrity
    if (!user.email || !user.id) {
      console.log("❌ User data integrity check failed:", {
        hasId: !!user.id,
        hasEmail: !!user.email,
      });
      throw new Error("Invalid user data");
    }

    console.log("✅ User found in database:", {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });
    return user;
  }

  console.log("❌ User not found in database by ID:", userId);

  // Try to find by email as fallback (but validate session email)
  if (session.user.email && typeof session.user.email === "string") {
    const sessionEmail = session.user.email.trim().toLowerCase();
    if (sessionEmail.length > 0) {
      console.log("🔍 Trying to find user by email:", sessionEmail);
      const userByEmail = await prisma.user.findUnique({
        where: { email: sessionEmail },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          imageUrl: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (userByEmail) {
        console.log("✅ Found user by email:", userByEmail.id);
        return userByEmail;
      }
    }
  }

  throw new Error("User not found in database");
}

export async function requireAuth(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerAuthSession(req, res);

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return session.user.id;
}
