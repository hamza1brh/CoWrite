import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_CHECK_LIST_COMMAND,
} from "@lexical/list";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createHeadingNode,
  $createQuoteNode,
  HeadingNode,
} from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import { INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/react/LexicalHorizontalRuleNode";
import {
  $getSelectionStyleValueForProperty,
  $patchStyleText,
} from "@lexical/selection";

import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
} from "lexical";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Plus,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo,
  Redo,
  ChevronDown,
} from "lucide-react";
import { useState, useCallback, useEffect } from "react";

// Add the missing FONT_FAMILY_OPTIONS array and FontFamilySelect component
const FONT_FAMILY_OPTIONS: [string, string][] = [
  ["Arial", "Arial"],
  ["Courier New", "Courier New"],
  ["Georgia", "Georgia"],
  ["Times New Roman", "Times New Roman"],
  ["Trebuchet MS", "Trebuchet MS"],
  ["Verdana", "Verdana"],
];

export default function LexicalToolbar() {
  const [editor] = useLexicalComposerContext();

  // Text formatting states
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isCode, setIsCode] = useState(false);

  // Add font states
  const [fontFamily, setFontFamily] = useState<string>("Arial");
  const [fontSize, setFontSize] = useState<string>("15px");

  // History states
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Parse font size to just the number for display
  const getFontSizeNumber = (size: string): string => {
    return size.replace("px", "");
  };

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));
      setIsStrikethrough(selection.hasFormat("strikethrough"));
      setIsCode(selection.hasFormat("code"));

      // Add font property detection
      setFontFamily(
        $getSelectionStyleValueForProperty(selection, "font-family", "Arial")
      );
      setFontSize(
        $getSelectionStyleValueForProperty(selection, "font-size", "15px")
      );
    }
  }, []);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar();
      });
    });
  }, [editor, updateToolbar]);

  // Text formatting functions
  const formatText = (
    format: "bold" | "italic" | "underline" | "strikethrough" | "code"
  ) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  // Block formatting functions
  const formatHeading = (headingSize: "h1" | "h2" | "h3") => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode(headingSize));
      }
    });
  };

  const formatQuote = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createQuoteNode());
      }
    });
  };

  // List functions
  const formatList = (listType: "bullet" | "number" | "check") => {
    if (listType === "bullet") {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else if (listType === "number") {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    } else if (listType === "check") {
      editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
    }
  };

  // Alignment functions
  const formatAlignment = (
    alignment: "left" | "center" | "right" | "justify"
  ) => {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment);
  };

  // Insert horizontal rule
  const insertHorizontalRule = () => {
    editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
  };

  // History functions
  const handleUndo = () => {
    editor.dispatchCommand(UNDO_COMMAND, undefined);
  };

  const handleRedo = () => {
    editor.dispatchCommand(REDO_COMMAND, undefined);
  };

  // Font styling functions
  const applyStyleText = useCallback(
    (styles: Record<string, string>) => {
      editor.update(() => {
        const selection = $getSelection();
        if (selection !== null) {
          $patchStyleText(selection, styles);
        }
      });
    },
    [editor]
  );

  const handleFontFamilyChange = (family: string) => {
    applyStyleText({ "font-family": family });
  };

  const handleFontSizeChange = (size: string) => {
    applyStyleText({ "font-size": size });
  };

  const FontFamilySelect = () => (
    <Select value={fontFamily} onValueChange={handleFontFamilyChange}>
      <SelectTrigger className="toolbar-select w-36">
        <SelectValue placeholder="Font Family" />
      </SelectTrigger>
      <SelectContent className="toolbar-select-content">
        {FONT_FAMILY_OPTIONS.map(([value, label]) => (
          <SelectItem key={value} value={value} className="toolbar-select-item">
            <span style={{ fontFamily: value }}>{label}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const FontSizeControl = () => (
    <div className="relative">
      <input
        type="number"
        min="1"
        max="999"
        value={getFontSizeNumber(fontSize)}
        onChange={e => {
          const value = e.target.value;
          if (value && parseInt(value) >= 1 && parseInt(value) <= 999) {
            handleFontSizeChange(value + "px");
          }
        }}
        className="h-8 w-16 rounded-md border border-border bg-background px-2 text-center text-sm text-foreground transition-colors [appearance:textfield] placeholder:text-muted-foreground hover:bg-accent/50 focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        placeholder="14"
        title="Font size in pixels"
      />
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
        px
      </span>
    </div>
  );

  return (
    <div className="flex flex-wrap items-center space-x-4">
      {/* History Controls */}
      <div className="flex items-center space-x-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleUndo}
          disabled={!canUndo}
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRedo}
          disabled={!canRedo}
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-4" />

      {/* Font Controls */}
      <div className="flex items-center space-x-2">
        <FontFamilySelect />
        <FontSizeControl />
      </div>

      <Separator orientation="vertical" className="h-4" />

      {/* Text Formatting */}
      <div className="flex items-center space-x-1">
        <Button
          variant={isBold ? "default" : "ghost"}
          size="sm"
          onClick={() => formatText("bold")}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant={isItalic ? "default" : "ghost"}
          size="sm"
          onClick={() => formatText("italic")}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant={isUnderline ? "default" : "ghost"}
          size="sm"
          onClick={() => formatText("underline")}
          title="Underline"
        >
          <Underline className="h-4 w-4" />
        </Button>
        <Button
          variant={isStrikethrough ? "default" : "ghost"}
          size="sm"
          onClick={() => formatText("strikethrough")}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <Button
          variant={isCode ? "default" : "ghost"}
          size="sm"
          onClick={() => formatText("code")}
          title="Code"
        >
          <Code className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-4" />

      {/* Headings & Quote */}
      <div className="flex items-center space-x-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => formatHeading("h1")}
          title="Heading 1"
        >
          H1
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => formatHeading("h2")}
          title="Heading 2"
        >
          H2
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => formatHeading("h3")}
          title="Heading 3"
        >
          H3
        </Button>
        <Button variant="ghost" size="sm" onClick={formatQuote} title="Quote">
          <Quote className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-4" />

      {/* Lists */}
      <div className="flex items-center space-x-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => formatList("bullet")}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => formatList("number")}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => formatList("check")}
          title="Check List"
        >
          <ListChecks className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-4" />

      {/* Alignment */}
      <div className="flex items-center space-x-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => formatAlignment("left")}
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => formatAlignment("center")}
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => formatAlignment("right")}
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => formatAlignment("justify")}
          title="Justify"
        >
          <AlignJustify className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-4" />

      {/* Insert Elements */}
      <div className="flex items-center space-x-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={insertHorizontalRule}
          title="Insert Horizontal Rule"
        >
          <Minus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
