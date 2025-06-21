"use client";

import { motion } from "framer-motion";
import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface DashboardHeaderProps {
  userName?: string;
}

export function DashboardHeader({ userName = "User" }: DashboardHeaderProps) {
  return (
    <header className="glass-effect sticky top-0 z-50 border-b border-slate-200/50 dark:border-slate-700/50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <motion.div
            className="flex items-center space-x-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <SidebarTrigger className="focus-ring" />
            <h1 className="text-gradient text-2xl font-bold">Dashboard</h1>
          </motion.div>

          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8 ring-2 ring-blue-100 dark:ring-slate-700",
                  userButtonPopoverCard: "shadow-lg border-0",
                  userButtonPopoverActions: "p-2",
                  userButtonPopoverActionButton:
                    "rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700",
                  userButtonPopoverFooter: "hidden", // Hide the footer if you want
                },
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
