import { prisma } from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextApiRequest } from "next";

export interface SyncedUser {
  id: string;
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
}

/**
 * Centralized user sync utility
 * Handles both development and production environments
 */
export async function syncUserToDatabase(
  req: NextApiRequest
): Promise<SyncedUser | null> {
  const { userId } = getAuth(req);

  if (!userId) {
    return null;
  }

  try {
    // Try to find existing user first
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (user) {
      return user;
    }

    // User doesn't exist, create them with actual Clerk data
    console.log(`🔄 Syncing new user to database: ${userId}`);

    // Get actual Clerk user data from the request headers
    // Clerk passes user data in the request when authenticated
    let userData = {
      clerkId: userId,
      email: `user-${userId.slice(-8)}@temp.com`, // Fallback
      firstName: "User",
      lastName: userId.slice(-4),
      imageUrl: "",
    };

    // Try to get user data from Clerk's current user endpoint
    try {
      const { clerkClient } = await import("@clerk/nextjs/server");
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(userId);

      if (clerkUser) {
        userData = {
          clerkId: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || userData.email,
          firstName: clerkUser.firstName || "User",
          lastName: clerkUser.lastName || "",
          imageUrl: clerkUser.imageUrl || "",
        };
        console.log(`✅ Got Clerk user data:`, {
          email: userData.email,
          name: `${userData.firstName} ${userData.lastName}`.trim(),
        });
      }
    } catch (clerkError: any) {
      console.warn(
        `⚠️ Could not fetch Clerk user data, using fallback:`,
        clerkError?.message || clerkError
      );
    }

    user = await prisma.user.create({
      data: userData,
    });

    console.log(`✅ User synced to database:`, {
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`.trim(),
    });

    return user;
  } catch (error) {
    console.error("❌ Failed to sync user to database:", error);
    return null;
  }
}

/**
 * Check if user has access to a document with proper permissions
 */
export async function checkDocumentPermissions(
  documentId: string,
  user: SyncedUser | null,
  requireEdit: boolean = false
): Promise<{ hasAccess: boolean; document?: any; userRole?: string }> {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      owner: true,
      collaborators: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!document) {
    return { hasAccess: false };
  }

  if (!user) {
    // Check if document is public for read access
    if (!requireEdit && document.isPublic) {
      return { hasAccess: true, document, userRole: "viewer" };
    }
    return { hasAccess: false, document };
  }

  const isOwner = document.ownerId === user.id;
  const collaboration = document.collaborators.find(c => c.userId === user.id);

  // Determine user role
  let userRole = "viewer";
  if (isOwner) {
    userRole = "owner";
  } else if (collaboration) {
    userRole = collaboration.role.toLowerCase();
  } else if (document.isPublic) {
    userRole = "viewer";
  }

  // Check access permissions
  const hasReadAccess = !!(isOwner || document.isPublic || collaboration);

  if (!requireEdit) {
    return { hasAccess: hasReadAccess, document, userRole };
  }

  // Check edit permissions
  const hasEditAccess = !!(
    isOwner ||
    (collaboration && collaboration.role !== "VIEWER")
  );

  return { hasAccess: hasEditAccess, document, userRole };
}

/**
 * Utility to ensure user is synced before proceeding with any operation
 */
export async function requireSyncedUser(
  req: NextApiRequest
): Promise<SyncedUser> {
  const user = await syncUserToDatabase(req);

  if (!user) {
    throw new Error("User authentication required");
  }

  return user;
}
