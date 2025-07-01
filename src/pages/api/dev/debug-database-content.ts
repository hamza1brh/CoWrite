import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { docId } = req.query;

  if (!docId || typeof docId !== "string") {
    return res.status(400).json({ error: "Document ID is required" });
  }

  try {
    const document = await prisma.document.findUnique({
      where: { id: docId },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        collaborators: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    let contentAnalysis = null;
    if (document.content) {
      try {
        const contentStr = JSON.stringify(document.content);
        contentAnalysis = {
          type: typeof document.content,
          stringLength: contentStr.length,
          structure: document.content,
          textExtraction: extractTextFromLexical(document.content),
          nodeCount: countNodes(document.content),
        };
      } catch (err) {
        contentAnalysis = {
          error:
            err instanceof Error ? err.message : "Failed to analyze content",
        };
      }
    }

    let yjsAnalysis = null;
    if (document.yjsState) {
      yjsAnalysis = {
        exists: true,
        byteLength: document.yjsState.length,
        firstBytes: Array.from(document.yjsState.slice(0, 10))
          .map(b => b.toString(16).padStart(2, "0"))
          .join(" "),
        isEmpty: document.yjsState.length === 0,
      };
    } else {
      yjsAnalysis = {
        exists: false,
        isNull: document.yjsState === null,
      };
    }

    const result = {
      document: {
        id: document.id,
        title: document.title,
        isPublic: document.isPublic,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
      },
      owner: document.owner,
      collaborators: document.collaborators,
      comments: document.comments,
      content: contentAnalysis,
      yjsState: yjsAnalysis,
      stats: {
        collaboratorCount: document.collaborators.length,
        commentCount: document.comments.length,
        hasContent: !!document.content,
        hasYjsState: !!document.yjsState,
      },
    };

    return res.status(200).json(result);
  } catch (error) {
    console.error("Database debug endpoint error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

function extractTextFromLexical(content: any): string {
  if (!content || typeof content !== "object") return "";

  let text = "";

  function traverse(node: any) {
    if (node.text) {
      text += node.text;
    }

    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        traverse(child);
        if (child.type === "paragraph" || child.type === "heading") {
          text += "\n";
        }
      }
    }
  }

  if (content.root) {
    traverse(content.root);
  } else {
    traverse(content);
  }

  return text.trim();
}

function countNodes(content: any): number {
  if (!content || typeof content !== "object") return 0;

  let count = 0;

  function traverse(node: any) {
    count++;
    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }

  if (content.root) {
    traverse(content.root);
  } else {
    traverse(content);
  }

  return count;
}
