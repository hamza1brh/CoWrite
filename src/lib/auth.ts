import { getAuth } from "@clerk/nextjs/server";
import { NextApiRequest } from "next";
import { prisma } from "./prisma";

export async function getUserFromRequest(req: NextApiRequest) {
  const { userId } = getAuth(req);

  if (!userId) {
    throw new Error("Unauthorized");
  }

  console.log("🔍 getUserFromRequest - Clerk ID:", userId);


  let user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (user) {
    console.log("✅ User found by Clerk ID:", user.email);
    return user;
  }

  // Strategy 2: If not found, this might be a different environment

  console.log("❌ User not found by Clerk ID:", userId);
  console.log("💡 Hint: User might need to be synced between environments");

  throw new Error("User not found in database");
}

export function requireAuth(req: NextApiRequest) {
  const { userId } = getAuth(req);

  if (!userId) {
    throw new Error("Unauthorized");
  }

  return userId;
}
