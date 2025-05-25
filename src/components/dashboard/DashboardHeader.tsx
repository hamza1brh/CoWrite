"use client";

import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface DashboardHeaderProps {
  userName?: string;
}

export function DashboardHeader({ userName = "JD" }: DashboardHeaderProps) {
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
            <Avatar className="h-8 w-8 ring-2 ring-blue-100 dark:ring-slate-700">
              <AvatarImage
                src="/placeholder.svg?height=32&width=32"
                alt="User avatar"
              />
              <AvatarFallback>{userName}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  );
}
