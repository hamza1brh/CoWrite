import { NextApiRequest, NextApiResponse } from "next";
import * as Y from "yjs";
import { prisma } from "@/lib/prisma";

interface SharedTypeInfo {
  key: string;
  type: string;
  length: number;
}

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
      select: {
        id: true,
        title: true,
        content: true,
        yjsState: true,
      },
    });

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    const result: any = {
      documentId: docId,
      title: document.title,
      hasContent: !!document.content,
      hasYjsState: !!document.yjsState,
      contentSize: document.content
        ? JSON.stringify(document.content).length
        : 0,
      yjsStateSize: document.yjsState ? document.yjsState.length : 0,
    };

    if (document.yjsState && document.yjsState.length > 0) {
      try {
        const ydoc = new Y.Doc();
        const update = new Uint8Array(document.yjsState);

        Y.applyUpdate(ydoc, update);

        let xmlFragment: Y.XmlFragment | undefined;
        let xmlContent = "";
        let xmlError = null;

        try {
          xmlFragment = ydoc.getXmlFragment("root");
          xmlContent = xmlFragment.toString();
        } catch (xmlErr) {
          xmlError = xmlErr instanceof Error ? xmlErr.message : String(xmlErr);
        }

        let textContent = "";
        let textError = null;

        try {
          const ytext = ydoc.getText("lexical");
          textContent = ytext.toString();
        } catch (textErr) {
          textError =
            textErr instanceof Error ? textErr.message : String(textErr);
        }

        const sharedMaps: SharedTypeInfo[] = [];
        ydoc.share.forEach((value, key) => {
          sharedMaps.push({
            key,
            type: value.constructor.name,
            length: (value as any)._length || 0,
          });
        });

        result.yjsContent = {
          textContent,
          textLength: textContent.length,
          textError,
          xmlContent,
          xmlError,
          xmlFragmentExists: !!xmlFragment,
          xmlFragmentLength: xmlFragment?.length || 0,
          sharedTypes: sharedMaps,
        };

        try {
          if (xmlFragment) {
            const xmlString = xmlFragment.toString();
            result.yjsContent.xmlString = xmlString;
          }
        } catch (xmlStringError) {
          // XML string conversion failed, ignore
        }
      } catch (yjsError) {
        result.yjsError =
          yjsError instanceof Error ? yjsError.message : String(yjsError);
      }
    }

    if (document.content) {
      result.originalContent = {
        structure: document.content,
        textExtraction: extractTextFromLexical(document.content),
      };
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Debug endpoint error:", error);
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
