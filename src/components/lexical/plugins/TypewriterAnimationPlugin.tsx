import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  $getRoot,
  $createTextNode,
} from "lexical";
import { useEffect, useImperativeHandle, forwardRef, useCallback } from "react";

export interface TypewriterAnimationRef {
  applyTextWithAnimation: (
    originalText: string,
    newText: string
  ) => Promise<void>;
}

interface TypewriterAnimationPluginProps {
  onRef?: (ref: TypewriterAnimationRef) => void;
}

const TypewriterAnimationPlugin = forwardRef<
  TypewriterAnimationRef,
  TypewriterAnimationPluginProps
>(({ onRef }, ref) => {
  const [editor] = useLexicalComposerContext();

  const applyTextWithAnimation = useCallback(
    async (originalText: string, newText: string): Promise<void> => {
      if (!originalText || !newText) return;

      try {
        await new Promise<void>(resolve => {
          editor.update(() => {
            const root = $getRoot();
            const allText = root.getTextContent();

            const startIndex = allText.indexOf(originalText);

            if (startIndex === -1) {
              resolve();
              return;
            }

            let selection = $getSelection();

            if (!$isRangeSelection(selection)) {
              resolve();
              return;
            }

            selection.insertText("");
            resolve();
          });
        });

        for (let i = 0; i <= newText.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 30));

          const partialText = newText.substring(0, i);

          await new Promise<void>(editorResolve => {
            editor.update(() => {
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                selection.insertText(partialText[i - 1] || "");
              }
              editorResolve();
            });
          });
        }
      } catch (error) {
        console.error("Error in typewriter animation:", error);
      }
    },
    [editor]
  );

  // Expose the function through ref
  useImperativeHandle(ref, () => ({
    applyTextWithAnimation,
  }));

  // Also call onRef if provided
  useEffect(() => {
    if (onRef) {
      onRef({ applyTextWithAnimation });
    }
  }, [onRef, applyTextWithAnimation]);

  return null; // This plugin doesn't render anything
});

TypewriterAnimationPlugin.displayName = "TypewriterAnimationPlugin";

export default TypewriterAnimationPlugin;
