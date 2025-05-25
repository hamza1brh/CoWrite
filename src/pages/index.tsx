import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Plus } from "lucide-react";
import Link from "next/link";

// Components
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import {
  SearchAndFilters,
  type ViewMode,
} from "@/components/dashboard/SearchAndFilters";
import { DocumentCard } from "@/components/dashboard/DocumentCard";
import { AISuggestions } from "@/components/dashboard/AISuggestions";

// Data
import { getDocuments, type Document } from "@/data/mockDocuments";

export default function Dashboard() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch documents on mount
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const docs = await getDocuments();
        setDocuments(docs);
      } catch (error) {
        console.error("Failed to fetch documents:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  // Filter documents based on search query
  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="light-gradient-bg dark:dark-gradient-bg min-h-screen">
            <DashboardHeader />
            <main className="container mx-auto px-6 py-8">
              <div className="flex h-64 items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                  <p className="text-slate-600 dark:text-slate-400">
                    Loading documents...
                  </p>
                </div>
              </div>
            </main>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="light-gradient-bg dark:dark-gradient-bg min-h-screen">
          <DashboardHeader userName="John" />

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
            <SearchAndFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />

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
              {filteredDocuments.map(doc => (
                <motion.div key={doc.id} variants={itemVariants}>
                  <DocumentCard document={doc} viewMode={viewMode} />
                </motion.div>
              ))}
            </motion.div>

            {/* Empty State */}
            {filteredDocuments.length === 0 && (
              <motion.div
                className="py-12 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <p className="text-lg text-slate-600 dark:text-slate-400">
                  {searchQuery
                    ? `No documents found matching "${searchQuery}"`
                    : "No documents found"}
                </p>
              </motion.div>
            )}

            {/* AI Suggestions */}
            <AISuggestions />
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
