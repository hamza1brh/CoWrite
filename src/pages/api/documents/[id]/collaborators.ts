import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id } = req.query;
  if (typeof id !== "string") {
    return res.status(400).json({ error: "Invalid document ID" });
  }

  if (req.method === "GET") {
    const collaborators = await prisma.documentCollaborator.findMany({
      where: { documentId: id },
      include: {
        user: true,
      },
    });
    return res.json(collaborators);
  }

  if (req.method === "POST") {
    const { userId: collaboratorUserId, role } = req.body;

    if (!collaboratorUserId || !role) {
      return res.status(400).json({ error: "userId and role are required" });
    }

    const collaborator = await prisma.documentCollaborator.create({
      data: {
        documentId: id,
        userId: collaboratorUserId,
        role: role,
      },
      include: {
        user: true,
      },
    });
    return res.status(201).json(collaborator);
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ error: "Method not allowed" });
}
