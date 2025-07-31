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
      return res.status(400).json({ error: "Invalid comment ID" });
    }

    if (req.method === "PUT") {
      const { content, resolved } = req.body;

      const existingComment = await prisma.comment.findUnique({
        where: { id: id },
        include: {
          document: {
            select: {
              ownerId: true,
              collaborators: {
                select: { userId: true },
              },
            },
          },
        },
      });

      if (!existingComment) {
        return res.status(404).json({ error: "Comment not found" });
      }

      const isCommentAuthor = existingComment.authorId === user.id;
      const isDocumentOwner = existingComment.document.ownerId === user.id;
      const isCollaborator = existingComment.document.collaborators.some(
        collab => collab.userId === user.id
      );

      if (!isCommentAuthor && !isDocumentOwner && !isCollaborator) {
        return res.status(403).json({
          error: "You don't have permission to update this comment",
        });
      }

      const comment = await prisma.comment.update({
        where: { id: id },
        data: {
          ...(content && { content }),
          ...(typeof resolved === "boolean" && { resolved }),
          updatedAt: new Date(),
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              firstName: true,
              lastName: true,
              email: true,
              imageUrl: true,
            },
          },
        },
      });

      console.log("✅ Comment updated:", comment.id);
      return res.json(comment);
    }

    if (req.method === "DELETE") {
      const existingComment = await prisma.comment.findUnique({
        where: { id: id },
        select: {
          authorId: true,
          document: {
            select: { ownerId: true },
          },
        },
      });

      if (!existingComment) {
        return res.status(404).json({ error: "Comment not found" });
      }

      const canDelete =
        existingComment.authorId === user.id ||
        existingComment.document.ownerId === user.id;

      if (!canDelete) {
        return res.status(403).json({
          error: "You don't have permission to delete this comment",
        });
      }

      await prisma.comment.delete({
        where: { id: id },
      });

      console.log("✅ Comment deleted:", id);
      return res.json({ success: true });
    }

    res.setHeader("Allow", ["PUT", "DELETE"]);
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("❌ Comments API error:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (
      error instanceof Error &&
      error.message === "User not found in database"
    ) {
      return res.status(404).json({
        error: "User not synced to database. Please refresh and try again.",
      });
    }

    return res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}
