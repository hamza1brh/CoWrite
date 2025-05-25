import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Search,
  Plus,
  Users,
  Clock,
  Star,
  Filter,
  Grid3X3,
  List,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface Collaborator {
  name: string;
  avatar: string;
}

interface Document {
  id: number;
  title: string;
  preview: string;
  lastModified: string;
  collaborators: Collaborator[];
  isStarred: boolean;
  comments: number;
}

const documents: Document[] = [
  {
    id: 1,
    title: "Product Requirements Document",
    preview: "/placeholder.svg?height=200&width=300",
    lastModified: "2 hours ago",
    collaborators: [
      { name: "Alice Johnson", avatar: "/placeholder.svg?height=32&width=32" },
      { name: "Bob Smith", avatar: "/placeholder.svg?height=32&width=32" },
      { name: "Carol Davis", avatar: "/placeholder.svg?height=32&width=32" },
    ],
    isStarred: true,
    comments: 12,
  },
  {
    id: 2,
    title: "Marketing Strategy 2024",
    preview: "/placeholder.svg?height=200&width=300",
    lastModified: "1 day ago",
    collaborators: [
      { name: "David Wilson", avatar: "/placeholder.svg?height=32&width=32" },
      { name: "Eva Brown", avatar: "/placeholder.svg?height=32&width=32" },
    ],
    isStarred: false,
    comments: 8,
  },
  {
    id: 3,
    title: "Technical Architecture",
    preview: "/placeholder.svg?height=200&width=300",
    lastModified: "3 days ago",
    collaborators: [
      { name: "Frank Miller", avatar: "/placeholder.svg?height=32&width=32" },
      { name: "Grace Lee", avatar: "/placeholder.svg?height=32&width=32" },
      { name: "Henry Taylor", avatar: "/placeholder.svg?height=32&width=32" },
      { name: "Ivy Chen", avatar: "/placeholder.svg?height=32&width=32" },
    ],
    isStarred: true,
    comments: 24,
  },
];

type ViewMode = "grid" | "list";

export default function Dashboard() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="light-gradient-bg dark:dark-gradient-bg min-h-screen">
          {/* Header */}
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
                  <h1 className="text-gradient text-2xl font-bold">
                    Dashboard
                  </h1>
                </motion.div>

                <div className="flex items-center space-x-4">
                  <ThemeToggle />
                  <Avatar className="h-8 w-8 ring-2 ring-blue-100 dark:ring-slate-700">
                    <AvatarImage
                      src="/placeholder.svg?height=32&width=32"
                      alt="User avatar"
                    />
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="container mx-auto px-6 py-8">
            {/* Hero Section */}
            <motion.div
              className="mb-12 text-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="mb-4 text-4xl font-bold text-slate-900 dark:text-white">
                Welcome back, John
              </h2>
              <p className="mb-8 text-xl text-slate-600 dark:text-slate-300">
                Continue working on your documents or start something new
              </p>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link href="/editor/new">
                  <Button
                    size="lg"
                    className="button-gradient rounded-xl px-8 py-3 text-white shadow-elevation-2 transition-all duration-300 hover:shadow-elevation-3"
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Create New Document
                  </Button>
                </Link>
              </motion.div>
            </motion.div>

            {/* Search and Filters */}
            <motion.div
              className="mb-8 flex flex-col gap-4 sm:flex-row"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="surface-elevated focus-ring pl-10"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="surface-elevated focus-ring"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>

                <div className="surface-elevated flex rounded-lg p-1">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="focus-ring px-3"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="focus-ring px-3"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Documents Grid */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className={`grid gap-6 ${
                viewMode === "grid"
                  ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                  : "grid-cols-1"
              }`}
            >
              {documents.map(doc => (
                <motion.div
                  key={doc.id}
                  variants={itemVariants}
                  whileHover={{ y: -5, scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link href={`/editor/${doc.id}`}>
                    <Card className="card-hover surface-elevated group cursor-pointer overflow-hidden">
                      {viewMode === "grid" && (
                        <div className="relative overflow-hidden">
                          <Image
                            src={doc.preview || "/placeholder.svg"}
                            alt={doc.title}
                            className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute right-3 top-3">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className={`rounded-full p-2 transition-colors ${
                                doc.isStarred
                                  ? "bg-yellow-500 text-white"
                                  : "bg-white/80 text-slate-600 hover:bg-yellow-500 hover:text-white"
                              }`}
                            >
                              <Star className="h-4 w-4" />
                            </motion.button>
                          </div>
                        </div>
                      )}

                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg font-semibold text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                            {doc.title}
                          </CardTitle>
                          {viewMode === "list" && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className={`rounded-full p-1 transition-colors ${
                                doc.isStarred
                                  ? "text-yellow-500"
                                  : "text-slate-400 hover:text-yellow-500"
                              }`}
                            >
                              <Star className="h-4 w-4" />
                            </motion.button>
                          )}
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0">
                        <div className="mb-4 flex items-center justify-between">
                          <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                            <Clock className="mr-1 h-4 w-4" />
                            {doc.lastModified}
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {doc.comments} comments
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex -space-x-2">
                            {doc.collaborators
                              .slice(0, 3)
                              .map((collaborator, index) => (
                                <motion.div
                                  key={index}
                                  initial={{ opacity: 0, scale: 0 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: index * 0.1 }}
                                >
                                  <Avatar className="h-8 w-8 border-2 border-white dark:border-slate-800">
                                    <AvatarImage
                                      src={
                                        collaborator.avatar ||
                                        "/placeholder.svg"
                                      }
                                      alt={collaborator.name}
                                    />
                                    <AvatarFallback>
                                      {collaborator.name
                                        .split(" ")
                                        .map(n => n[0])
                                        .join("")}
                                    </AvatarFallback>
                                  </Avatar>
                                </motion.div>
                              ))}
                            {doc.collaborators.length > 3 && (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-700 dark:text-slate-300">
                                +{doc.collaborators.length - 3}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                            <Users className="mr-1 h-4 w-4" />
                            {doc.collaborators.length}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </motion.div>

            {/* AI Suggestions */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-12"
            >
              <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 dark:border-purple-700/50 dark:bg-slate-800/30 dark:from-purple-900/30 dark:to-blue-900/30 dark:backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-purple-900 dark:text-purple-100">
                    <Sparkles className="mr-2 h-5 w-5" />
                    AI Suggestions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-purple-700 dark:text-purple-300">
                    Based on your recent activity, here are some suggestions to
                    boost your productivity:
                  </p>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="rounded-lg border border-purple-200 bg-white p-4 dark:border-purple-700/50 dark:bg-slate-800/50 dark:backdrop-blur-sm"
                    >
                      <h4 className="mb-2 font-medium text-slate-900 dark:text-white">
                        Complete your PRD
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        Add user stories and acceptance criteria to finalize
                        your product requirements.
                      </p>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="rounded-lg border border-purple-200 bg-white p-4 dark:border-purple-700/50 dark:bg-slate-800/50 dark:backdrop-blur-sm"
                    >
                      <h4 className="mb-2 font-medium text-slate-900 dark:text-white">
                        Review team feedback
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        You have 5 unread comments across your documents that
                        need attention.
                      </p>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
