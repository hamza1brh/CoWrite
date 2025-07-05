import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { NextApiRequest, NextApiResponse } from "next";

export interface SyncedUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
}

/**
 * Utility to ensure user is authenticated and get their data
 * NextAuth handles user sync automatically in the session callback
 */
export async function syncUserToDatabase(
  req: NextApiRequest,
  res?: NextApiResponse
): Promise<SyncedUser> {
  const user = await getUserFromRequest(req, res!);

  if (!user) {
    throw new Error("User authentication required");
  }

  return user;
}

/**
 * Alternative name for the same function for compatibility
 */
export async function requireSyncedUser(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<SyncedUser> {
  return syncUserToDatabase(req, res);
}

/**
 * Check if user has access to a document with proper permissions
 * This function is critical for security - it validates all document access
 */
export async function checkDocumentPermissions(
  documentId: string,
  user: SyncedUser | null,
  requireEdit: boolean = false
): Promise<{ hasAccess: boolean; document?: any; userRole?: string }> {
  // Input validation
  if (!documentId || typeof documentId !== "string") {
    console.log(`❌ Invalid document ID: ${documentId}`);
    return { hasAccess: false };
  }

  // Sanitize document ID (prevent injection attacks)
  const sanitizedDocumentId = documentId.trim();
  if (sanitizedDocumentId.length === 0) {
    console.log(`❌ Empty document ID after sanitization`);
    return { hasAccess: false };
  }

  console.log(
    `🔍 Checking permissions for document ${sanitizedDocumentId}, user: ${user?.email}, requireEdit: ${requireEdit}`
  );

  const document = await prisma.document.findUnique({
    where: { id: sanitizedDocumentId },
    include: {
      owner: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      collaborators: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  if (!document) {
    console.log(`❌ Document ${sanitizedDocumentId} not found`);
    return { hasAccess: false };
  }

  // Additional security: Verify document owner exists and is valid
  if (!document.owner || !document.owner.id) {
    console.log(`❌ Document ${sanitizedDocumentId} has invalid owner`);
    return { hasAccess: false };
  }

  if (!user) {
    // Check if document is public for read access
    if (!requireEdit && document.isPublic) {
      console.log(
        `✅ Public document access granted for ${sanitizedDocumentId}`
      );
      return { hasAccess: true, document, userRole: "viewer" };
    }
    console.log(
      `❌ No user and document is not public: ${sanitizedDocumentId}`
    );
    return { hasAccess: false, document };
  }

  // Additional user validation
  if (!user.id || !user.email) {
    console.log(`❌ Invalid user data for document access`);
    return { hasAccess: false, document };
  }

  const isOwner = document.ownerId === user.id;
  const collaboration = document.collaborators.find(c => c.userId === user.id);

  console.log(
    `🔍 User ${user.email} - Owner: ${isOwner}, Collaboration: ${!!collaboration}, Role: ${collaboration?.role || "none"}`
  );

  // Determine user role with strict validation
  let userRole = "viewer";
  if (isOwner) {
    userRole = "owner";
  } else if (collaboration) {
    // Validate collaboration role
    const validRoles = ["OWNER", "EDITOR", "VIEWER"];
    if (!validRoles.includes(collaboration.role)) {
      console.log(`❌ Invalid collaboration role: ${collaboration.role}`);
      return { hasAccess: false, document };
    }
    userRole = collaboration.role.toLowerCase();
  } else if (document.isPublic) {
    userRole = "viewer";
  }

  console.log(`👤 User role determined: ${userRole}`);

  // Check access permissions with strict validation
  const hasReadAccess = !!(isOwner || document.isPublic || collaboration);

  if (!requireEdit) {
    console.log(
      `✅ Read access granted: ${hasReadAccess} for ${sanitizedDocumentId}`
    );
    return { hasAccess: hasReadAccess, document, userRole };
  }

  // Check edit permissions - only owners and editors can edit
  const hasEditAccess = !!(
    isOwner ||
    (collaboration && collaboration.role === "EDITOR")
  );

  console.log(
    `✅ Edit access granted: ${hasEditAccess} for ${sanitizedDocumentId}`
  );
  return { hasAccess: hasEditAccess, document, userRole };
}
