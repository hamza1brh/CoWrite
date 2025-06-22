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
    return res.status(400).json({ error: "Invalid comment ID" });
  }

  if (req.method === "PUT") {
    const { content, resolved } = req.body;

    const comment = await prisma.comment.update({
      where: {
        id: id,
        authorId: userId,
      },
      data: {
        ...(content && { content }),
        ...(typeof resolved === "boolean" && { resolved }),
        updatedAt: new Date(),
      },
      include: {
        author: true,
      },
    });
    return res.json(comment);
  }

  if (req.method === "DELETE") {
    await prisma.comment.delete({
      where: {
        id: id,
        authorId: userId,
      },
    });
    return res.json({ success: true });
  }

  res.setHeader("Allow", ["PUT", "DELETE"]);
  return res.status(405).json({ error: "Method not allowed" });
}
