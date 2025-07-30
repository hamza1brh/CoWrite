import { NextApiRequest, NextApiResponse } from "next";
import { requireAuthenticatedUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const user = await requireAuthenticatedUser(req, res);

    const { id, collaboratorId } = req.query;
    if (typeof id !== "string" || typeof collaboratorId !== "string") {
      return res.status(400).json({ error: "Invalid parameters" });
    }

    // Verify document access
    const document = await prisma.document.findFirst({
      where: {
        id: id,
        OR: [
          { ownerId: user.id },
          { collaborators: { some: { userId: user.id } } },
        ],
      },
    });

    if (!document) {
      return res.status(404).json({
        error: "Document not found or access denied",
      });
    }

    if (req.method === "DELETE") {
      // Only owner can remove collaborators
      if (document.ownerId !== user.id) {
        return res.status(403).json({
          error: "Only document owner can remove collaborators",
        });
      }

      await prisma.documentCollaborator.delete({
        where: { id: collaboratorId },
      });

      console.log("Collaborator removed:", collaboratorId);
      return res.json({ success: true });
    }

    if (req.method === "PUT") {
      const { role } = req.body;

      if (!role || !["EDITOR", "VIEWER"].includes(role)) {
        return res.status(400).json({ error: "Valid role is required" });
      }

      // Only owner can change roles
      if (document.ownerId !== user.id) {
        return res.status(403).json({
          error: "Only document owner can change collaborator roles",
        });
      }

      const updatedCollaborator = await prisma.documentCollaborator.update({
        where: { id: collaboratorId },
        data: { role: role as "EDITOR" | "VIEWER" },
        include: {
          user: {
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

      console.log(
        "Collaborator role updated:",
        updatedCollaborator.user.email,
        "to",
        role
      );
      return res.json(updatedCollaborator);
    }

    res.setHeader("Allow", ["DELETE", "PUT"]);
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("❌ Collaborator management API error:", error);

    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return res.status(401).json({ error: "Authentication required" });
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
