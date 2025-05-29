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
  CAN_UNDO_COMMAND,
  CAN_REDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
} from "lexical";
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
import { mergeRegister } from "@lexical/utils";

import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
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

const FONT_FAMILY_OPTIONS: [string, string][] = [
  ["Arial", "Arial"],
  ["Courier New", "Courier New"],
  ["Georgia", "Georgia"],
  ["Times New Roman", "Times New Roman"],
  ["Trebuchet MS", "Trebuchet MS"],
  ["Verdana", "Verdana"],
];

const FONT_SIZE_OPTIONS: [string, string][] = [
  ["10px", "10px"],
  ["11px", "11px"],
  ["12px", "12px"],
  ["13px", "13px"],
  ["14px", "14px"],
  ["15px", "15px"],
  ["16px", "16px"],
  ["17px", "17px"],
  ["18px", "18px"],
  ["19px", "19px"],
  ["20px", "20px"],
];

function dropDownActiveClass(active: boolean) {
  if (active) {
    return "active dropdown-item-active";
  } else {
    return "";
  }
}

// Font dropdown component using shadcn/ui Select
function FontDropDown({
  editor,
  value,
  style,
  disabled = false,
}: {
  editor: any;
  value: string;
  style: string;
  disabled?: boolean;
}): JSX.Element {
  const handleValueChange = useCallback(
    (selectedValue: string) => {
      editor.update(() => {
        const selection = $getSelection();
        if (selection !== null) {
          $patchStyleText(selection, {
            [style]: selectedValue,
          });
        }
      });
    },
    [editor, style]
  );

  const options =
    style === "font-family" ? FONT_FAMILY_OPTIONS : FONT_SIZE_OPTIONS;

  return (
    <Select value={value} onValueChange={handleValueChange} disabled={disabled}>
      <SelectTrigger className="h-8 w-auto min-w-[120px]">
        <SelectValue
          placeholder={style === "font-family" ? "Font Family" : "Font Size"}
        />
      </SelectTrigger>
      <SelectContent>
        {options.map(([optionValue, displayText]) => (
          <SelectItem key={optionValue} value={optionValue}>
            {displayText}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// FontSize component exactly from playground
function FontSize({
  selectionFontSize,
  editor,
  disabled = false,
}: {
  selectionFontSize: string;
  editor: any;
  disabled?: boolean;
}): JSX.Element {
  const [inputValue, setInputValue] = useState<string>(selectionFontSize);
  const [inputFontSize, setInputFontSize] = useState<string>(selectionFontSize);

  const calculateNextFontSize = useCallback(
    (currentFontSize: number, updateType: string) => {
      if (!updateType || updateType === "") {
        return currentFontSize;
      }

      let updatedFontSize: number = currentFontSize;
      switch (updateType) {
        case "inc":
          switch (true) {
            case currentFontSize < 12:
              updatedFontSize = currentFontSize + 1;
              break;
            case currentFontSize < 20:
              updatedFontSize = currentFontSize + 2;
              break;
            case currentFontSize < 36:
              updatedFontSize = currentFontSize + 4;
              break;
            case currentFontSize <= 90:
              updatedFontSize = currentFontSize + 8;
              break;
            default:
              updatedFontSize = currentFontSize;
              break;
          }
          break;

        case "dec":
          switch (true) {
            case currentFontSize <= 12:
              updatedFontSize = currentFontSize - 1;
              break;
            case currentFontSize <= 20:
              updatedFontSize = currentFontSize - 2;
              break;
            case currentFontSize <= 36:
              updatedFontSize = currentFontSize - 4;
              break;
            case currentFontSize <= 90:
              updatedFontSize = currentFontSize - 8;
              break;
            default:
              updatedFontSize = currentFontSize;
              break;
          }
          break;

        default:
          break;
      }
      return updatedFontSize;
    },
    []
  );

  const updateFontSizeInSelection = useCallback(
    (newFontSize: string, updateType: string) => {
      const getNextFontSize = (currentStyleValue: string | null): string => {
        let prevFontSize = currentStyleValue;
        if (!prevFontSize) {
          prevFontSize = "15px";
        }
        prevFontSize = prevFontSize.slice(0, -2);
        const nextFontSize = calculateNextFontSize(
          Number(prevFontSize),
          updateType
        );
        return String(nextFontSize) + "px";
      };

      editor.update(() => {
        if (editor.isEditable()) {
          const selection = $getSelection();
          if (selection !== null) {
            $patchStyleText(selection, {
              "font-size": updateType === "" ? newFontSize : getNextFontSize,
            });
          }
        }
      });
    },
    [calculateNextFontSize, editor]
  );

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const inputValueNumber = Number(inputValue);

    if (["e", "E", "+", "-"].includes(e.key) || isNaN(inputValueNumber)) {
      e.preventDefault();
      setInputValue("");
      return;
    }
    setInputFontSize(inputValue);
    if (e.key === "Enter") {
      e.preventDefault();

      let nextFontSize = inputValue !== "" ? inputValue : inputFontSize;

      nextFontSize = Number(nextFontSize) > 100 ? "100" : nextFontSize;
      nextFontSize = Number(nextFontSize) < 1 ? "1" : nextFontSize;

      updateFontSizeInSelection(nextFontSize + "px", "");
      setInputValue("");
    }
  };

  const handleInputBlur = () => {
    if (inputValue !== "" && Number(inputValue) > 0) {
      let nextFontSize = inputValue !== "" ? inputValue : inputFontSize;

      nextFontSize = Number(nextFontSize) > 100 ? "100" : nextFontSize;
      nextFontSize = Number(nextFontSize) < 1 ? "1" : nextFontSize;

      updateFontSizeInSelection(nextFontSize + "px", "");
    }
    setInputValue("");
  };

  const handleButtonClick = (updateType: string) => {
    if (inputValue !== "") {
      let nextFontSize = inputValue !== "" ? inputValue : inputFontSize;

      nextFontSize = Number(nextFontSize) > 100 ? "100" : nextFontSize;
      nextFontSize = Number(nextFontSize) < 1 ? "1" : nextFontSize;

      updateFontSizeInSelection(nextFontSize + "px", "");
      setInputValue("");
    } else {
      updateFontSizeInSelection("", updateType);
    }
  };

  useEffect(() => {
    setInputFontSize(selectionFontSize);
  }, [selectionFontSize]);

  return (
    <div className="flex items-center space-x-1">
      <button
        type="button"
        disabled={disabled}
        onClick={() => handleButtonClick("dec")}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-sm text-foreground transition-colors hover:bg-accent/50 focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        -
      </button>
      <input
        type="number"
        disabled={disabled}
        className="h-8 w-16 rounded-md border border-border bg-background px-2 text-center text-sm text-foreground transition-colors [appearance:textfield] placeholder:text-muted-foreground hover:bg-accent/50 focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        placeholder={selectionFontSize}
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={handleKeyPress}
        onBlur={handleInputBlur}
        min="1"
        max="100"
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => handleButtonClick("inc")}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-sm text-foreground transition-colors hover:bg-accent/50 focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        +
      </button>
    </div>
  );
}

export default function LexicalToolbar() {
  const [editor] = useLexicalComposerContext();

  // Text formatting states
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isCode, setIsCode] = useState(false);

  // Font states - exactly from playground
  const [fontFamily, setFontFamily] = useState<string>("Arial");
  const [fontSize, setFontSize] = useState<string>("15px");

  // History states
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Update toolbar function exactly from playground
  const $updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      // Update text format
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));
      setIsStrikethrough(selection.hasFormat("strikethrough"));
      setIsCode(selection.hasFormat("code"));

      // Handle font properties exactly as in playground
      setFontFamily(
        $getSelectionStyleValueForProperty(selection, "font-family", "Arial")
      );
      setFontSize(
        $getSelectionStyleValueForProperty(selection, "font-size", "15px")
      );
    }
  }, []);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      (_payload, newEditor) => {
        $updateToolbar();
        return false;
      },
      COMMAND_PRIORITY_CRITICAL
    );
  }, [editor, $updateToolbar]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          $updateToolbar();
        });
      }),
      editor.registerCommand<boolean>(
        CAN_UNDO_COMMAND,
        payload => {
          setCanUndo(payload);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      editor.registerCommand<boolean>(
        CAN_REDO_COMMAND,
        payload => {
          setCanRedo(payload);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL
      )
    );
  }, [$updateToolbar, editor]);

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

      {/* Font Controls - Using shadcn/ui Select components */}
      <div className="flex items-center space-x-2">
        <FontDropDown
          editor={editor}
          value={fontFamily}
          style="font-family"
          disabled={false}
        />
        <FontSize
          selectionFontSize={fontSize.slice(0, -2)}
          editor={editor}
          disabled={false}
        />
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
