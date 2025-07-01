import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import * as Y from "yjs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (process.env.NODE_ENV !== "development") {
    return res.status(404).json({ error: "Not found" });
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { documentId } = req.query;

  if (!documentId || typeof documentId !== "string") {
    return res.status(400).json({ error: "Document ID is required" });
  }

  try {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        title: true,
        content: true,
        yjsState: true,
        updatedAt: true,
      },
    });

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    let yjsStateInfo = null;
    if (document.yjsState && Buffer.isBuffer(document.yjsState)) {
      try {
        const testDoc = new Y.Doc();
        Y.applyUpdate(testDoc, document.yjsState);
        const yjsText = testDoc.getText("lexical");
        const content = yjsText.toString();

        yjsStateInfo = {
          bufferSize: document.yjsState.length,
          hasValidState: true,
          textContent: content,
          textLength: content.length,
          isEmpty: content.length === 0,
        };
      } catch (error) {
        yjsStateInfo = {
          bufferSize: document.yjsState.length,
          hasValidState: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }

    let lexicalContentInfo = null;
    if (document.content) {
      try {
        const lexicalContent =
          typeof document.content === "string"
            ? JSON.parse(document.content)
            : document.content;

        lexicalContentInfo = {
          rawContent: lexicalContent,
          hasRoot: !!lexicalContent.root,
          hasChildren: !!lexicalContent.root?.children,
          childrenCount: lexicalContent.root?.children?.length || 0,
          childrenTypes:
            lexicalContent.root?.children?.map((child: any) => child.type) ||
            [],
          firstChild: lexicalContent.root?.children?.[0] || null,
          extractedText: extractTextFromLexical(lexicalContent),
        };
      } catch (error) {
        lexicalContentInfo = {
          error: "Failed to parse Lexical content",
          details: error instanceof Error ? error.message : String(error),
        };
      }
    }

    return res.json({
      document: {
        id: document.id,
        title: document.title,
        hasContent: !!document.content,
        hasYjsState: !!document.yjsState,
        lastUpdated: document.updatedAt,
      },
      lexicalContent: lexicalContentInfo,
      yjsState: yjsStateInfo,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error checking Yjs state:", error);
    return res.status(500).json({
      error: "Failed to check document state",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

function extractTextFromLexical(lexicalContent: any): string {
  try {
    if (
      !lexicalContent ||
      !lexicalContent.root ||
      !lexicalContent.root.children
    ) {
      return "";
    }

    const extractTextFromNode = (node: any): string => {
      if (node.type === "text") {
        return node.text || "";
      }

      if (node.children && Array.isArray(node.children)) {
        return node.children.map(extractTextFromNode).join("");
      }

      return "";
    };

    const textParts = lexicalContent.root.children.map((child: any) => {
      const text = extractTextFromNode(child);
      if (child.type === "paragraph" || child.type === "heading") {
        return text + "\n";
      }
      return text;
    });

    return textParts.join("").trim();
  } catch (error) {
    console.error("Error extracting text from Lexical content:", error);
    return "";
  }
}
