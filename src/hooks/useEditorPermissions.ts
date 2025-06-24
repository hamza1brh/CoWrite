// Create src/hooks/useEditorPermissions.ts
import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

export function useEditorPermissions(userRole: "owner" | "editor" | "viewer") {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor) return;

    const isEditable = userRole === "owner" || userRole === "editor";
    const wasEditable = editor.isEditable();

    console.log("🔍 Editor permissions update:", {
      userRole,
      isEditable,
      wasEditable,
      needsUpdate: isEditable !== wasEditable,
    });

    if (isEditable !== wasEditable) {
      editor.setEditable(isEditable);

      if (isEditable && !wasEditable) {
        setTimeout(() => {
          if (editor.isEditable()) {
            console.log("✅ Editor is now editable");
          }
        }, 100);
      }

      if (!isEditable && wasEditable) {
        editor.blur();
        console.log("✅ Editor is now read-only");
      }
    }
  }, [editor, userRole]);

  return {
    isEditable: userRole === "owner" || userRole === "editor",
    isReadOnly: userRole === "viewer",
  };
}
