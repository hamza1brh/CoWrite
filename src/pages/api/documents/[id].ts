import { NextApiRequest, NextApiResponse } from "next";
import { requireAuthenticatedUser } from "@/lib/auth-guards";
import { checkDocumentPermissions } from "@/lib/user-sync";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  console.log("🔍 DOCUMENT API - Request started", {
    method: req.method,
    documentId: id,
    timestamp: new Date().toISOString(),
  });

  if (!id || typeof id !== "string") {
    console.log("❌ DOCUMENT API - Invalid document ID:", id);
    return res.status(400).json({ error: "Invalid document ID" });
  }

  // Handle GET requests
  if (req.method === "GET") {
    try {
      console.log("🔍 DOCUMENT API - Starting GET request for document:", id);

      const user = await requireAuthenticatedUser(req, res);
      console.log("✅ DOCUMENT API - User authenticated:", user.email);

      const { hasAccess, document } = await checkDocumentPermissions(
        id,
        user,
        false
      );
      console.log("🔍 DOCUMENT API - Permission check result:", {
        hasAccess,
        documentFound: !!document,
        documentTitle: document?.title,
      });

      if (!document) {
        console.log("❌ DOCUMENT API - Document not found:", id);
        return res.status(404).json({ error: "Document not found" });
      }

      if (!hasAccess) {
        console.log(
          "❌ DOCUMENT API - Access denied for user:",
          user.email,
          "to document:",
          id
        );
        return res.status(403).json({ error: "Access denied" });
      }

      console.log("✅ DOCUMENT API - Returning document:", document.title);
      return res.json(document);
    } catch (error) {
      console.error("❌ DOCUMENT API - Error in GET handler:", error);
      console.error(
        "❌ DOCUMENT API - Error stack:",
        error instanceof Error ? error.stack : "No stack trace"
      );

      // Handle authentication errors specifically
      if (
        error instanceof Error &&
        (error.message.includes("Authentication required") ||
          error.message.includes("Invalid session") ||
          error.message.includes("User not found"))
      ) {
        return res.status(401).json({ error: "Authentication required" });
      }

      return res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Handle PUT requests for saving documents (metadata only - Yjs handles content)
  if (req.method === "PUT") {
    try {
      console.log("🔍 DOCUMENT API - Starting PUT request for document:", id);

      const { content, title } = req.body;
      const user = await requireAuthenticatedUser(req, res);
      console.log("✅ DOCUMENT API - User authenticated for PUT:", user.email);

      const { hasAccess, document } = await checkDocumentPermissions(
        id,
        user,
        true
      );

      if (!document) {
        console.log("❌ DOCUMENT API - Document not found for PUT:", id);
        return res.status(404).json({ error: "Document not found" });
      }

      if (!hasAccess) {
        console.log(
          "❌ DOCUMENT API - No edit permissions for user:",
          user.email,
          "to document:",
          id
        );
        return res.status(403).json({ error: "No edit permissions" });
      }

      // Prepare update data - only allow metadata updates
      const updateData: any = {
        updatedAt: new Date(),
      };

      // ✅ IMPORTANT: Yjs handles all content persistence
      if (content !== undefined) {
        console.log(
          `⚠️ Ignoring content update for ${id} - Yjs handles content persistence`
        );
      }

      // Only allow title updates
      if (title !== undefined) {
        updateData.title = title;
        console.log("🔍 DOCUMENT API - Updating title to:", title);
      }

      const updatedDocument = await prisma.document.update({
        where: { id },
        data: updateData,
      });

      console.log(`✅ Document metadata updated: ${id}`);
      return res.json({ success: true, document: updatedDocument });
    } catch (error) {
      console.error("❌ DOCUMENT API - Error in PUT handler:", error);
      console.error(
        "❌ DOCUMENT API - Error stack:",
        error instanceof Error ? error.stack : "No stack trace"
      );

      // Handle authentication errors specifically
      if (
        error instanceof Error &&
        (error.message.includes("Authentication required") ||
          error.message.includes("Invalid session") ||
          error.message.includes("User not found"))
      ) {
        return res.status(401).json({ error: "Authentication required" });
      }

      return res.status(500).json({
        error: "Failed to save document",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  console.log("❌ DOCUMENT API - Method not allowed:", req.method);
  return res.status(405).json({ error: "Method not allowed" });
}
