/**
 * Lexical Editor Theme Configuration
 * Defines styling classes for various Lexical elements
 */
export const lexicalTheme = {
  paragraph: "mb-4 text-gray-900 dark:text-gray-100 leading-relaxed",

  heading: {
    h1: "text-4xl font-bold mb-6 mt-8 text-gray-900 dark:text-gray-100 leading-tight",
    h2: "text-3xl font-semibold mb-4 mt-6 text-gray-900 dark:text-gray-100 leading-tight",
    h3: "text-2xl font-medium mb-3 mt-5 text-gray-900 dark:text-gray-100 leading-tight",
  },

  list: {
    nested: {
      listitem: "list-none",
    },
    ol: "list-decimal ml-6 mb-4 space-y-2",
    ul: "list-disc ml-6 mb-4 space-y-2",
    listitem: "leading-relaxed text-gray-900 dark:text-gray-100",
  },

  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline",
    strikethrough: "line-through",
    code: "bg-gray-100 dark:bg-gray-800 rounded px-1 py-0.5 font-mono text-sm",
  },

  code: "bg-gray-100 dark:bg-gray-800 rounded-lg p-4 font-mono text-sm mb-4",

  quote:
    "border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic mb-4 text-gray-700 dark:text-gray-300",

  link: "text-blue-600 dark:text-blue-400 underline hover:no-underline",
} as const;

/**
 * Alternative theme configurations for different use cases
 */
export const compactTheme = {
  ...lexicalTheme,
  paragraph: "mb-2 text-gray-900 dark:text-gray-100 leading-normal",
  heading: {
    h1: "text-3xl font-bold mb-4 mt-6 text-gray-900 dark:text-gray-100 leading-tight",
    h2: "text-2xl font-semibold mb-3 mt-4 text-gray-900 dark:text-gray-100 leading-tight",
    h3: "text-xl font-medium mb-2 mt-3 text-gray-900 dark:text-gray-100 leading-tight",
  },
} as const;

export const minimalTheme = {
  ...lexicalTheme,
  paragraph: "mb-3 text-gray-800 dark:text-gray-200",
  heading: {
    h1: "text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100",
    h2: "text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100",
    h3: "text-lg font-medium mb-2 text-gray-900 dark:text-gray-100",
  },
} as const;
