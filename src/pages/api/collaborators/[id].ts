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
    return res.status(400).json({ error: "Invalid collaborator ID" });
  }

  if (req.method === "PUT") {
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ error: "Role is required" });
    }

    const collaborator = await prisma.documentCollaborator.update({
      where: { id: id },
      data: {
        role: role,
      },
      include: {
        user: true,
      },
    });
    return res.json(collaborator);
  }

  if (req.method === "DELETE") {
    await prisma.documentCollaborator.delete({
      where: { id: id },
    });
    return res.json({ success: true });
  }

  res.setHeader("Allow", ["PUT", "DELETE"]);
  return res.status(405).json({ error: "Method not allowed" });
}
