"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, Star, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { DocumentCardData } from "@/lib/types/api";
import type { ViewMode } from "./SearchAndFilters";

interface DocumentCardProps {
  document: DocumentCardData;
  viewMode: ViewMode;
}

export function DocumentCard({ document: doc, viewMode }: DocumentCardProps) {
  // Safety check for owner
  const ownerName = doc.owner
    ? `${doc.owner.firstName || ""} ${doc.owner.lastName || ""}`.trim() ||
      "Unknown User"
    : "Unknown User";

  const ownerInitials = doc.owner
    ? `${doc.owner.firstName?.[0] || ""}${doc.owner.lastName?.[0] || ""}` || "U"
    : "U";

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Link href={`/editor/${doc.id}`}>
        <Card className="card-hover surface-elevated group cursor-pointer overflow-hidden">
          {viewMode === "grid" && (
            <div className="relative overflow-hidden">
              <div className="flex h-48 w-full items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 dark:from-slate-800 dark:to-slate-700">
                <div className="line-clamp-6 text-center text-sm text-slate-600 dark:text-slate-400">
                  {doc.preview}
                </div>
              </div>
              <div className="absolute right-3 top-3">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={`rounded-full p-2 transition-colors ${
                    doc.isStarred
                      ? "bg-yellow-500 text-white"
                      : "bg-white/80 text-slate-600 hover:bg-yellow-500 hover:text-white"
                  }`}
                  onClick={e => {
                    e.preventDefault();
                    // TODO: Implement star functionality
                  }}
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
                  onClick={e => {
                    e.preventDefault();
                    // TODO: Implement star functionality
                  }}
                >
                  <Star className="h-4 w-4" />
                </motion.button>
              )}
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {viewMode === "list" && (
              <p className="mb-3 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
                {doc.preview}
              </p>
            )}

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
                {/* Owner avatar */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Avatar className="h-8 w-8 border-2 border-white dark:border-slate-800">
                    <AvatarImage
                      src={doc.owner?.imageUrl || "/placeholder.svg"}
                      alt={ownerName}
                    />
                    <AvatarFallback>{ownerInitials}</AvatarFallback>
                  </Avatar>
                </motion.div>

                {/* Collaborators - Only render if they exist and have user data */}
                {doc.collaborators &&
                  doc.collaborators.length > 0 &&
                  doc.collaborators.slice(0, 2).map((collaborator, index) => {
                    // Safety check for collaborator.user
                    if (!collaborator.user) return null;

                    return (
                      <motion.div
                        key={collaborator.id}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: (index + 1) * 0.1 }}
                      >
                        <Avatar className="h-8 w-8 border-2 border-white dark:border-slate-800">
                          <AvatarImage
                            src={
                              collaborator.user.imageUrl || "/placeholder.svg"
                            }
                            alt={`${collaborator.user.firstName || ""} ${
                              collaborator.user.lastName || ""
                            }`}
                          />
                          <AvatarFallback>
                            {collaborator.user.firstName?.[0] || ""}
                            {collaborator.user.lastName?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                      </motion.div>
                    );
                  })}

                {/* Show +X for additional collaborators */}
                {doc.collaborators && doc.collaborators.length > 2 && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-700 dark:text-slate-300">
                    +{doc.collaborators.length - 2}
                  </div>
                )}
              </div>

              <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                <Users className="mr-1 h-4 w-4" />
                {(doc.collaborators?.length || 0) + 1} {/* +1 for owner */}
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
