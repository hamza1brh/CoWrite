import { NextApiRequest, NextApiResponse } from "next";
import { getUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const user = await getUserFromRequest(req, res);

    const { id } = req.query;
    if (typeof id !== "string") {
      return res.status(400).json({ error: "Invalid document ID" });
    }

    const document = await prisma.document.findFirst({
      where: {
        id: id,
        OR: [
          { ownerId: user.id },
          { collaborators: { some: { userId: user.id } } },
          { isPublic: true },
        ],
      },
    });

    if (!document) {
      return res.status(404).json({
        error: "Document not found or access denied",
      });
    }

    if (req.method === "GET") {
      const collaborators = await prisma.documentCollaborator.findMany({
        where: { documentId: id },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              imageUrl: true,
            },
          },
        },
        orderBy: { joinedAt: "asc" },
      });

      const owner = await prisma.user.findUnique({
        where: { id: document.ownerId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          imageUrl: true,
        },
      });

      const allCollaborators = [
        {
          id: `owner-${document.ownerId}`,
          role: "OWNER" as const,
          joinedAt: document.createdAt.toISOString(),
          documentId: id,
          userId: document.ownerId,
          user: owner!,
        },
        // Regular collaborators
        ...collaborators,
      ];

      console.log(
        ` Found ${allCollaborators.length} collaborators for document:`,
        id
      );
      return res.json(allCollaborators);
    }

    if (req.method === "POST") {
      const { email, role } = req.body;

      if (!email || !role) {
        return res.status(400).json({ error: "email and role are required" });
      }

      //  Only owner and editors can add collaborators
      const isOwner = document.ownerId === user.id;
      const userCollaboration = await prisma.documentCollaborator.findUnique({
        where: {
          documentId_userId: {
            documentId: id,
            userId: user.id,
          },
        },
      });

      const canAddCollaborators =
        isOwner || userCollaboration?.role === "EDITOR";

      if (!canAddCollaborators) {
        return res.status(403).json({
          error: "You don't have permission to add collaborators",
        });
      }

      //  Find user by email
      const targetUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });

      if (!targetUser) {
        return res.status(404).json({
          error: "User not found. They may need to sign up first.",
        });
      }

      //  Check if user is already a collaborator
      const existingCollaboration =
        await prisma.documentCollaborator.findUnique({
          where: {
            documentId_userId: {
              documentId: id,
              userId: targetUser.id,
            },
          },
        });

      if (existingCollaboration) {
        return res.status(409).json({
          error: "User is already a collaborator on this document",
        });
      }

      //  Don't add owner as collaborator
      if (targetUser.id === document.ownerId) {
        return res.status(400).json({
          error: "Document owner cannot be added as collaborator",
        });
      }

      //  Create collaboration
      const collaborator = await prisma.documentCollaborator.create({
        data: {
          documentId: id,
          userId: targetUser.id,
          role: role as "EDITOR" | "VIEWER",
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              imageUrl: true,
            },
          },
        },
      });

      console.log(" Collaborator added:", collaborator.user.email, "as", role);
      return res.status(201).json(collaborator);
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("❌ Collaborators API error:", error);

    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return res.status(401).json({ error: "Authentication required" });
      }

      if (error.message === "User not found in database") {
        return res.status(404).json({
          error: "User not synced to database. Please refresh and try again.",
        });
      }

      return res.status(500).json({
        error: error.message,
      });
    }

    return res.status(500).json({
      error: "Internal server error",
    });
  }
}
