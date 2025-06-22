import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/router";

// Components
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import {
  SearchAndFilters,
  type ViewMode,
} from "@/components/dashboard/SearchAndFilters";
import { DocumentCard } from "@/components/dashboard/DocumentCard";
import { AISuggestions } from "@/components/dashboard/AISuggestions";

// Types
import { DocumentWithOwner, DocumentCardData } from "@/lib/types/api";

function transformDocumentForCard(doc: DocumentWithOwner): DocumentCardData {
  return {
    id: doc.id,
    title: doc.title,
    preview: doc.content
      ? typeof doc.content === "string"
        ? doc.content.substring(0, 100) + "..."
        : "Document content..."
      : "No content yet...",
    lastModified: new Date(doc.updatedAt).toLocaleDateString(),
    owner: {
      firstName: doc.owner.firstName,
      lastName: doc.owner.lastName,
      imageUrl: doc.owner.imageUrl,
    },
    collaborators: [], // Will be populated when we implement collaborators
    isStarred: false, // Will be implemented later
    comments: doc._count.comments,
  };
}

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [documents, setDocuments] = useState<DocumentCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Redirect unauthenticated users to welcome page
  useEffect(() => {
    if (isLoaded && !user) {
      router.replace("/welcome");
    }
  }, [isLoaded, user, router]);

  // Fetch documents from API
  useEffect(() => {
    if (!isLoaded || !user) return;

    const fetchDocuments = async () => {
      try {
        console.log("Fetching documents...");
        const response = await fetch("/api/documents");
        console.log("Response status:", response.status);
        console.log("Response ok:", response.ok);

        if (response.ok) {
          const apiDocs: DocumentWithOwner[] = await response.json();
          console.log("API returned documents:", apiDocs);
          console.log("Number of documents:", apiDocs.length);

          const transformedDocs = apiDocs.map(transformDocumentForCard);
          console.log("Transformed documents:", transformedDocs);
          setDocuments(transformedDocs);
        } else {
          const errorText = await response.text();
          console.error(
            "Failed to fetch documents:",
            response.status,
            errorText
          );
        }
      } catch (error) {
        console.error("Failed to fetch documents:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [isLoaded, user]);

  // Create new document
  const handleCreateDocument = async () => {
    setCreating(true);
    try {
      console.log("Creating document...");
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Untitled Document",
        }),
      });
      console.log("wa33333333");
      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (response.ok) {
        const newDoc: DocumentWithOwner = await response.json();
        console.log("Created document:", newDoc);
        // Redirect to the new document editor
        router.push(`/editor/${newDoc.id}`);
      } else {
        const errorData = await response.json();
        console.error("Failed to create document:", errorData);
      }
    } catch (error) {
      console.error("Error creating document:", error);
    } finally {
      setCreating(false);
    }
  };

  // Show loading while checking auth or redirecting
  if (!isLoaded || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

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

  // Show loading state for documents
  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="light-gradient-bg dark:dark-gradient-bg min-h-screen">
            <DashboardHeader userName={user?.firstName || "User"} />
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
          <DashboardHeader userName={user?.firstName || "User"} />

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
                Welcome back, {user?.firstName || "User"}
              </h2>
              <p className="mb-8 text-xl text-slate-600 dark:text-slate-300">
                Continue working on your documents or start something new
              </p>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  onClick={handleCreateDocument}
                  disabled={creating}
                  className="button-gradient rounded-xl px-8 py-3 text-white shadow-elevation-2 transition-all duration-300 hover:shadow-elevation-3 disabled:opacity-50"
                >
                  {creating ? (
                    <>
                      <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-5 w-5" />
                      Create New Document
                    </>
                  )}
                </Button>
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
                    : "No documents found. Create your first document!"}
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
