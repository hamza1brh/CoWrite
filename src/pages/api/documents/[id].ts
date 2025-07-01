import { NextApiRequest, NextApiResponse } from "next";
import { syncUserToDatabase, checkDocumentPermissions } from "@/lib/user-sync";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Invalid document ID" });
  }

  // Handle GET requests
  if (req.method === "GET") {
    try {
      const user = await syncUserToDatabase(req);
      const { hasAccess, document } = await checkDocumentPermissions(
        id,
        user,
        false
      );

      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      return res.json(document);
    } catch (error) {
      console.error("Error fetching document:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // Handle PUT requests for saving documents (metadata only - Yjs handles content)
  if (req.method === "PUT") {
    try {
      const { content, title } = req.body;
      const user = await syncUserToDatabase(req);
      const { hasAccess, document } = await checkDocumentPermissions(
        id,
        user,
        true
      );

      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      if (!hasAccess) {
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
      }

      const updatedDocument = await prisma.document.update({
        where: { id },
        data: updateData,
      });

      console.log(`✅ Document metadata updated: ${id}`);
      return res.json({ success: true, document: updatedDocument });
    } catch (error) {
      console.error("Error saving document:", error);
      return res.status(500).json({ error: "Failed to save document" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
