import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extract readable text from Lexical editor state JSON for document previews
 */
export function extractTextFromLexicalJSON(content: any): string {
  if (!content) return "No content yet...";

  // If content is a string, try to parse it as JSON
  if (typeof content === "string") {
    try {
      content = JSON.parse(content);
    } catch {
      // If it's not JSON, treat it as plain text
      return content.substring(0, 150) + (content.length > 150 ? "..." : "");
    }
  }

  // Navigate through Lexical structure to extract text
  function extractTextFromNode(node: any): string {
    if (!node) return "";

    // If node has text property, return it
    if (typeof node.text === "string") {
      return node.text;
    }

    // If node has children, recursively extract text
    if (Array.isArray(node.children)) {
      const childTexts = node.children
        .map((child: any) => extractTextFromNode(child))
        .filter((text: string | any[]) => text.length > 0);

      // Add appropriate separators for different node types
      let separator = " ";
      if (node.type === "paragraph" || node.type === "heading") {
        separator = "\n"; // Line break for paragraphs and headings
      } else if (node.type === "list" || node.type === "listitem") {
        separator = " "; // Space for list items
      }
      return childTexts.join(separator).trim();
    }

    return "";
  }

  try {
    // Start from root node
    let text = "";
    if (content.root && content.root.children) {
      text = extractTextFromNode(content.root);
    } else if (Array.isArray(content.children)) {
      text = extractTextFromNode(content);
    } else if (content.children) {
      text = extractTextFromNode(content);
    }

    // Clean up the text - preserve line breaks but normalize spaces
    text = text
      .replace(/[ \t]+/g, " ") // Replace multiple spaces/tabs with single space
      .replace(/\n\s*\n/g, "\n") // Remove empty lines
      .trim();

    // If no actual text content, return placeholder
    if (!text || text.length === 0) {
      return "No content yet...";
    }

    // Split into lines and take first 2-3 lines for preview
    const lines = text.split("\n").filter(line => line.trim().length > 0);
    const previewLines = lines.slice(0, 3); // First 3 lines
    let preview = previewLines.join(" ");

    // Truncate if too long
    if (preview.length > 150) {
      preview = preview.substring(0, 150) + "...";
    } else if (lines.length > 3) {
      // Add ellipsis if there are more lines
      preview += "...";
    }

    return preview || "No content yet...";
  } catch (error) {
    console.warn("Failed to extract text from Lexical content:", error);
    return "Error reading content...";
  }
}
