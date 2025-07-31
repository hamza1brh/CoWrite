import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection, SELECTION_CHANGE_COMMAND, COMMAND_PRIORITY_LOW } from "lexical";
import { useEffect } from "react";
import { mergeRegister } from "@lexical/utils";

interface SelectionChangePluginProps {
  onSelectionChange?: (selectedText: string) => void;
}

export default function SelectionChangePlugin({ onSelectionChange }: SelectionChangePluginProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!onSelectionChange) {
      return;
    }

    return mergeRegister(
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          const selection = $getSelection();
          
          if ($isRangeSelection(selection)) {
            const selectedText = selection.getTextContent();
            onSelectionChange(selectedText);
          } else {
            onSelectionChange("");
          }
          
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          const selection = $getSelection();
          
          if ($isRangeSelection(selection)) {
            const selectedText = selection.getTextContent();
            onSelectionChange(selectedText);
          } else {
            onSelectionChange("");
          }
        });
      })
    );
  }, [editor, onSelectionChange]);

  return null;
}
