import { NextApiRequest, NextApiResponse } from "next";
import { syncUserToDatabase, checkDocumentPermissions } from "@/lib/user-sync";
import { prisma } from "@/lib/prisma";
import * as Y from "yjs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Document ID is required" });
  }

  try {
    const currentUser = await syncUserToDatabase(req, res);

    switch (req.method) {
      case "GET":
        const { hasAccess: hasReadAccess, document } =
          await checkDocumentPermissions(id, currentUser, false);

        if (!document) {
          return res.status(404).json({ error: "Document not found" });
        }

        if (!hasReadAccess) {
          return res.status(403).json({ error: "Access denied" });
        }

        return handleGetYjsState(res, document);

      case "PUT":
      case "POST":
        const { hasAccess: hasWriteAccess, document: writeDocument } =
          await checkDocumentPermissions(id, currentUser, true);

        if (!writeDocument) {
          return res.status(404).json({ error: "Document not found" });
        }

        if (!hasWriteAccess) {
          return res.status(403).json({ error: "Write access denied" });
        }

        return handlePutYjsState(req, res, writeDocument);

      case "DELETE":
        if (process.env.NODE_ENV !== "development") {
          return res.status(404).json({ error: "Not found" });
        }

        const { hasAccess: hasDeleteAccess, document: deleteDocument } =
          await checkDocumentPermissions(id, currentUser, true);

        if (!deleteDocument) {
          return res.status(404).json({ error: "Document not found" });
        }

        if (!hasDeleteAccess) {
          return res.status(403).json({ error: "Write access denied" });
        }

        return handleDeleteYjsState(res, deleteDocument);

      default:
        res.setHeader("Allow", ["GET", "PUT", "POST", "DELETE"]);
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("API Error (/api/documents/[id]/yjs):", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleGetYjsState(res: NextApiResponse, document: any) {
  try {
    if (
      document.yjsState &&
      (Buffer.isBuffer(document.yjsState) ||
        document.yjsState instanceof Uint8Array)
    ) {
      try {
        const testDoc = new Y.Doc();
        const stateData = Buffer.isBuffer(document.yjsState)
          ? new Uint8Array(document.yjsState)
          : document.yjsState;

        Y.applyUpdate(testDoc, stateData);

        const responseBuffer = Buffer.isBuffer(document.yjsState)
          ? document.yjsState
          : Buffer.from(document.yjsState);

        res.setHeader("Content-Type", "application/octet-stream");
        res.setHeader("Content-Length", responseBuffer.length.toString());
        return res.status(200).send(responseBuffer);
      } catch (validationError) {
        console.warn(
          `Corrupted Yjs state detected for ${document.id}, creating fresh state`
        );
      }
    }

    const doc = new Y.Doc();
    const update = Y.encodeStateAsUpdate(doc);
    const buf = Buffer.from(update);

    await prisma.document.update({
      where: { id: document.id },
      data: { yjsState: buf },
    });

    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Length", buf.length.toString());
    return res.status(200).send(buf);
  } catch (error) {
    console.error("Error in handleGetYjsState:", error);
    return res.status(500).json({ error: "Failed to get document state" });
  }
}

async function getRawBody(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalSize = 0;

    const timeout = setTimeout(() => {
      reject(new Error("Request timeout"));
    }, 15000);

    req.on("data", chunk => {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      chunks.push(buffer);
      totalSize += buffer.length;

      if (totalSize > 10 * 1024 * 1024) {
        clearTimeout(timeout);
        reject(new Error("Request too large"));
        return;
      }
    });

    req.on("end", () => {
      clearTimeout(timeout);
      const result = Buffer.concat(chunks, totalSize);
      resolve(result);
    });

    req.on("error", error => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

async function handlePutYjsState(
  req: NextApiRequest,
  res: NextApiResponse,
  document: any
) {
  try {
    const rawBody = await getRawBody(req);

    if (!rawBody || rawBody.length === 0) {
      return res.status(400).json({ error: "Empty Yjs state data" });
    }

    try {
      const testDoc = new Y.Doc();
      Y.applyUpdate(testDoc, rawBody);
    } catch (validationError) {
      console.error("Invalid Yjs data:", validationError);
      return res.status(400).json({ error: "Invalid Yjs data format" });
    }

    const result = await prisma.document.update({
      where: { id: document.id },
      data: {
        yjsState: rawBody,
        updatedAt: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      size: rawBody.length,
      timestamp: result.updatedAt,
    });
  } catch (error) {
    console.error("Error in handlePutYjsState:", error);
    return res.status(500).json({ error: "Failed to save document state" });
  }
}

async function handleDeleteYjsState(res: NextApiResponse, document: any) {
  try {
    await prisma.document.update({
      where: { id: document.id },
      data: { yjsState: null },
    });

    return res.status(200).json({
      success: true,
      message: "Yjs state cleared",
    });
  } catch (error) {
    console.error("Error clearing Yjs state:", error);
    return res.status(500).json({ error: "Failed to clear document state" });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
