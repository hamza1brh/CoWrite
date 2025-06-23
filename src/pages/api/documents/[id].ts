import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { Role } from "@prisma/client"; 

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Document ID is required" });
  }

  console.log("Document API called:", req.method, "for ID:", id);

  if (req.method === "GET") {
    try {
      const user = await getUserFromRequest(req);
      console.log("Fetching document as user:", user.email);

      const document = await prisma.document.findUnique({
        where: { id },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              imageUrl: true,
              email: true,
            },
          },
          _count: {
            select: { comments: true },
          },
          collaborators: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  imageUrl: true,
                },
              },
            },
          },
        },
      });

      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

    
      const hasAccess =
        document.ownerId === user.id || // User owns the document
        document.collaborators.some(collab => collab.userId === user.id) || // User is a collaborator (any role)
        document.isPublic; // Document is public

      if (!hasAccess) {
        console.log(
          `❌ Access denied for user ${user.email} to document ${document.title}`
        );
        return res.status(403).json({ error: "Access denied" });
      }

      console.log("✅ Access granted - Found document:", document.title);
      return res.json(document);
    } catch (error) {
      console.error("GET document error:", error);

      if (error instanceof Error && error.message === "Unauthorized") {
        return res.status(401).json({ error: "Authentication required" });
      }

      if (
        error instanceof Error &&
        error.message === "User not found in database"
      ) {
        return res.status(404).json({ error: "User not synced to database" });
      }

      return res.status(500).json({
        error:
          error instanceof Error ? error.message : "Failed to fetch document",
      });
    }
  }

  if (req.method === "PUT") {
    try {
      const user = await getUserFromRequest(req);
      console.log("Updating document as user:", user.email);

      // ✅ First check if document exists and user has permission
      const existingDocument = await prisma.document.findUnique({
        where: { id },
        include: {
          collaborators: {
            select: { userId: true, role: true },
          },
        },
      });

      if (!existingDocument) {
        return res.status(404).json({ error: "Document not found" });
      }

      //  Check if user can edit this document 
      const isOwner = existingDocument.ownerId === user.id;
      const isEditor = existingDocument.collaborators.some(
        collab => collab.userId === user.id && collab.role === Role.EDITOR 
      );

      if (!isOwner && !isEditor) {
        console.log(
          `❌ Edit access denied for user ${user.email} to document ${existingDocument.title}`
        );
        return res.status(403).json({
          error: "You don't have permission to edit this document",
        });
      }

      const { title, content } = req.body;
      console.log("Update data:", {
        title: title?.substring(0, 50),
        hasContent: !!content,
      });

      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (content !== undefined) updateData.content = content;

      const document = await prisma.document.update({
        where: { id },
        data: updateData,
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              imageUrl: true,
              email: true,
            },
          },
        },
      });

      console.log("✅ Document updated successfully:", document.title);
      return res.json(document);
    } catch (error) {
      console.error("PUT document error:", error);

      if (error instanceof Error && error.message === "Unauthorized") {
        return res.status(401).json({ error: "Authentication required" });
      }

      if (
        error instanceof Error &&
        error.message === "User not found in database"
      ) {
        return res.status(404).json({ error: "User not synced to database" });
      }

      return res.status(500).json({
        error:
          error instanceof Error ? error.message : "Failed to update document",
      });
    }
  }

  res.setHeader("Allow", ["GET", "PUT"]);
  return res.status(405).json({ error: "Method not allowed" });
}
