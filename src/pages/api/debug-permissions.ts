import { NextApiRequest, NextApiResponse } from "next";
import { syncUserToDatabase, checkDocumentPermissions } from "@/lib/user-sync";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { documentId } = req.query;

    console.log("🔍 DEBUG PERMISSIONS - Starting permission debug");
    console.log(
      "🔍 Document ID from query:",
      documentId,
      "Type:",
      typeof documentId
    );

    // Get user
    let user = null;
    let userError = null;

    try {
      user = await syncUserToDatabase(req, res);
      console.log("✅ DEBUG PERMISSIONS - Got user:", {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
      });
    } catch (error) {
      userError = error instanceof Error ? error.message : String(error);
      console.log("❌ DEBUG PERMISSIONS - User error:", userError);
    }

    if (!user) {
      return res.json({
        status: "No user found",
        userError,
        user: null,
        document: null,
        permissions: null,
      });
    }

    // Get all documents for this user
    const userDocuments = await prisma.document.findMany({
      where: {
        OR: [
          { ownerId: user.id },
          {
            collaborators: {
              some: { userId: user.id },
            },
          },
          { isPublic: true },
        ],
      },
      include: {
        owner: true,
        collaborators: {
          include: {
            user: true,
          },
        },
      },
    });

    console.log(
      `🔍 DEBUG PERMISSIONS - Found ${userDocuments.length} documents for user ${user.email}`
    );
    userDocuments.forEach(doc => {
      console.log(
        `  - Document: ${doc.id} (${doc.title}) - Owner: ${doc.ownerId === user.id ? "YES" : "NO"}`
      );
    });

    let specificDocPermissions = null;
    let specificDocument = null;

    // If specific document ID provided, check permissions for it
    if (documentId && typeof documentId === "string") {
      console.log(
        `🔍 DEBUG PERMISSIONS - Checking specific document: ${documentId}`
      );

      try {
        // First, let's manually check if the document exists and user owns it
        const manualCheck = await prisma.document.findUnique({
          where: { id: documentId },
          include: {
            owner: true,
            collaborators: {
              include: { user: true },
            },
          },
        });

        console.log("🔍 DEBUG PERMISSIONS - Manual document lookup:", {
          found: !!manualCheck,
          documentId: manualCheck?.id,
          ownerId: manualCheck?.ownerId,
          userIdMatches: manualCheck?.ownerId === user.id,
          isPublic: manualCheck?.isPublic,
          collaboratorsCount: manualCheck?.collaborators?.length || 0,
        });

        // Now use our permission function
        const { hasAccess, document, userRole } =
          await checkDocumentPermissions(
            documentId,
            user,
            false // read access
          );

        specificDocument = document;
        specificDocPermissions = {
          hasReadAccess: hasAccess,
          userRole,
          isOwner: document?.ownerId === user.id,
          hasCollaboration: document?.collaborators?.some(
            (c: any) => c.userId === user.id
          ),
          isPublic: document?.isPublic,
          manualOwnershipCheck: manualCheck?.ownerId === user.id,
          documentFoundInPermissionCheck: !!document,
          hasEditAccess: false, // Will be updated below
        };

        // Also check edit permissions
        const { hasAccess: hasEditAccess } = await checkDocumentPermissions(
          documentId,
          user,
          true // edit access
        );

        specificDocPermissions.hasEditAccess = hasEditAccess;

        console.log(
          "🔍 DEBUG PERMISSIONS - Final permissions result:",
          specificDocPermissions
        );
      } catch (error) {
        console.log(
          "❌ DEBUG PERMISSIONS - Error checking specific document:",
          error
        );
        specificDocPermissions = {
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }

    return res.json({
      status: "Permission debug complete",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      userDocuments: userDocuments.map(doc => ({
        id: doc.id,
        title: doc.title,
        ownerId: doc.ownerId,
        isOwner: doc.ownerId === user.id,
        isPublic: doc.isPublic,
        collaborators: doc.collaborators.length,
        hasCollaboration: doc.collaborators.some(c => c.userId === user.id),
      })),
      specificDocument: specificDocument
        ? {
            id: specificDocument.id,
            title: specificDocument.title,
            ownerId: specificDocument.ownerId,
            isPublic: specificDocument.isPublic,
            collaborators: specificDocument.collaborators?.length || 0,
          }
        : null,
      specificDocPermissions,
      queryDocumentId: documentId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("DEBUG PERMISSIONS ERROR:", error);
    return res.status(500).json({
      error: "Permission debug failed",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
