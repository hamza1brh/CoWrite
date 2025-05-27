/**
 * Responsive Design System
 * Centralized breakpoints and responsive utilities
 */

export const breakpoints = {
  sm: "640px", // Small devices (landscape phones)
  md: "768px", // Medium devices (tablets)
  lg: "1024px", // Large devices (desktops)
  xl: "1280px", // Extra large devices
  "2xl": "1536px", // 2X large devices
} as const;

/**
 * Common responsive patterns for reuse
 */
export const responsivePatterns = {
  // Container patterns
  container: {
    padding: "px-4 sm:px-6 lg:px-8",
    maxWidth: "max-w-7xl mx-auto",
    section: "py-8 sm:py-12 lg:py-16",
  },

  // Typography patterns
  typography: {
    hero: "text-3xl sm:text-4xl lg:text-5xl xl:text-6xl",
    heading: "text-2xl sm:text-3xl lg:text-4xl",
    subheading: "text-lg sm:text-xl lg:text-2xl",
    body: "text-sm sm:text-base",
  },

  // Layout patterns
  layout: {
    grid: {
      auto: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
      responsive: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    },
    flex: {
      stack: "flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4",
      center: "flex flex-col sm:flex-row items-center justify-center",
    },
    spacing: {
      section: "space-y-6 sm:space-y-8 lg:space-y-12",
      element: "space-y-3 sm:space-y-4",
    },
  },

  // Component patterns
  components: {
    card: "p-4 sm:p-6 lg:p-8",
    button: {
      sm: "px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm",
      md: "px-4 py-2 text-sm sm:px-6 sm:py-3 sm:text-base",
      lg: "px-6 py-3 text-base sm:px-8 sm:py-4 sm:text-lg",
    },
    input: "px-3 py-2 text-sm sm:px-4 sm:py-3 sm:text-base",
    avatar: {
      sm: "h-6 w-6 sm:h-8 sm:w-8",
      md: "h-8 w-8 sm:h-10 sm:w-10",
      lg: "h-10 w-10 sm:h-12 sm:w-12",
    },
  },

  // Editor-specific patterns
  editor: {
    header: {
      padding: "px-3 py-3 sm:px-6 sm:py-4",
      title: "text-sm sm:text-base lg:text-lg",
      actions: "gap-1 sm:gap-2 lg:gap-3",
    },
    toolbar: {
      padding: "px-3 py-2 sm:px-6 sm:py-3",
      buttons: "gap-1 sm:gap-2",
    },
    content: {
      padding: "p-4 sm:p-6 lg:p-8",
      maxWidth: "max-w-3xl sm:max-w-4xl lg:max-w-5xl xl:max-w-6xl",
    },
    panels: {
      width: "w-80 sm:w-96 lg:w-80 xl:w-96",
      padding: "p-3 sm:p-4 lg:p-6",
    },
  },

  // Navigation patterns
  navigation: {
    sidebar: {
      mobile: "w-full sm:w-64 lg:w-72",
      desktop: "hidden sm:flex sm:w-64 lg:w-72",
    },
    header: {
      height: "h-14 sm:h-16 lg:h-18",
      padding: "px-4 sm:px-6 lg:px-8",
    },
  },
} as const;

/**
 * Responsive utility functions
 */
export const responsive = {
  /**
   * Get responsive classes for common patterns
   */
  getPattern: (category: keyof typeof responsivePatterns, key: string) => {
    const pattern = responsivePatterns[category] as any;
    return pattern?.[key] || "";
  },

  /**
   * Hide/show elements at different breakpoints
   */
  visibility: {
    hideOnMobile: "hidden sm:block",
    hideOnTablet: "block md:hidden lg:block",
    hideOnDesktop: "block lg:hidden",
    showOnMobile: "block sm:hidden",
    showOnTablet: "hidden md:block lg:hidden",
    showOnDesktop: "hidden lg:block",
  },

  /**
   * Common responsive spacing utilities
   */
  spacing: {
    xs: "space-y-2 sm:space-y-3",
    sm: "space-y-3 sm:space-y-4",
    md: "space-y-4 sm:space-y-6",
    lg: "space-y-6 sm:space-y-8",
    xl: "space-y-8 sm:space-y-12",
  },

  /**
   * Responsive text sizing
   */
  text: {
    xs: "text-xs sm:text-sm",
    sm: "text-sm sm:text-base",
    md: "text-base sm:text-lg",
    lg: "text-lg sm:text-xl",
    xl: "text-xl sm:text-2xl",
  },
} as const;

/**
 * Mobile-first responsive hook patterns
 */
export const mobileFirst = {
  // Stacking patterns
  stack: {
    vertical: "flex flex-col",
    horizontal: "flex flex-col sm:flex-row",
    reverseOnMobile: "flex flex-col-reverse sm:flex-row",
  },

  // Grid patterns
  grid: {
    single: "grid grid-cols-1",
    double: "grid grid-cols-1 sm:grid-cols-2",
    triple: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    auto: "grid grid-cols-1 sm:grid-cols-auto",
  },

  // Common component patterns
  button: {
    responsive: "w-full sm:w-auto",
    icon: "p-2 sm:px-4 sm:py-2",
  },

  input: {
    responsive: "w-full sm:max-w-xs lg:max-w-sm",
  },
} as const;

/**
 * Helper to combine responsive classes
 */
export const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(" ");
};

export type ResponsivePattern = keyof typeof responsivePatterns;
export type ResponsiveSize = "xs" | "sm" | "md" | "lg" | "xl";
