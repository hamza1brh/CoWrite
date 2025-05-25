"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import LexicalEditor from "@/components/lexical/editor/LexicalEditor";
import EditorHeader from "@/components/documents/EditorHeader";
import CommentsPanel from "@/components/documents/CommentsPanel";
import AiAssistantPanel from "@/components/documents/AiAssistantPanel";

// Mock data
const collaborators = [
  {
    id: 1,
    name: "Alice Johnson",
    avatar: "/placeholder.svg?height=32&width=32",
    status: "online" as const,
    cursor: { x: 45, y: 23 },
  },
  {
    id: 2,
    name: "Bob Smith",
    avatar: "/placeholder.svg?height=32&width=32",
    status: "online" as const,
    cursor: { x: 67, y: 45 },
  },
  {
    id: 3,
    name: "Carol Davis",
    avatar: "/placeholder.svg?height=32&width=32",
    status: "away" as const,
    cursor: null,
  },
];

const comments = [
  {
    id: 1,
    author: "Alice Johnson",
    avatar: "/placeholder.svg?height=32&width=32",
    content: "This section needs more detail about the user journey.",
    timestamp: "2 hours ago",
    resolved: false,
  },
  {
    id: 2,
    author: "Bob Smith",
    avatar: "/placeholder.svg?height=32&width=32",
    content:
      "Great point about the technical constraints. Should we add a diagram?",
    timestamp: "1 hour ago",
    resolved: false,
  },
  {
    id: 3,
    author: "Carol Davis",
    avatar: "/placeholder.svg?height=32&width=32",
    content: "Updated the requirements based on stakeholder feedback.",
    timestamp: "30 minutes ago",
    resolved: true,
  },
];

const aiSuggestions = [
  "Add a section about accessibility requirements",
  "Consider including performance metrics",
  "Expand on the security considerations",
  "Add user personas to better define the target audience",
];

export default function DocumentEditor({ params }: { params: { id: string } }) {
  const [showComments, setShowComments] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [documentTitle, setDocumentTitle] = useState(
    "Product Requirements Document"
  );

  const unreadCommentsCount = comments.filter(c => !c.resolved).length;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="dark:dark-gradient-bg flex min-h-screen flex-col bg-slate-50">
          <EditorHeader
            documentTitle={documentTitle}
            onTitleChange={setDocumentTitle}
            collaborators={collaborators}
            showAI={showAI}
            showComments={showComments}
            onToggleAI={() => setShowAI(!showAI)}
            onToggleComments={() => setShowComments(!showComments)}
            unreadCommentsCount={unreadCommentsCount}
          />

          <div className="flex flex-1 overflow-hidden">
            {/* Main Editor */}
            <div className="flex flex-1 flex-col">
              {/* Toolbar */}
              <div className="surface-elevated border-b border-slate-200/50 px-6 py-3 dark:border-slate-700/50">
                {/* <LexicalToolbar /> */}
              </div>

              {/* Editor Content */}
              <div className="relative flex-1">
                {/* Collaborative Cursors */}
                {collaborators.map(
                  collaborator =>
                    collaborator.cursor && (
                      <motion.div
                        key={collaborator.id}
                        className="pointer-events-none absolute z-10"
                        style={{
                          left: `${collaborator.cursor.x}%`,
                          top: `${collaborator.cursor.y}%`,
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <div className="flex items-center space-x-1">
                          <div className="h-6 w-0.5 bg-blue-500" />
                          <div className="whitespace-nowrap rounded bg-blue-500 px-2 py-1 text-xs text-white">
                            {collaborator.name}
                          </div>
                        </div>
                      </motion.div>
                    )
                )}
                <LexicalEditor showToolbar={true} />
                {/* <div className="surface-elevated h-full p-8">
                  <div className="mx-auto max-w-4xl">
                    <div className="prose prose-lg max-w-none dark:prose-invert">
                      <h1>Product Requirements Document</h1>
                      <h2>Overview</h2>
                      <p>
                        This document outlines the requirements for our new
                        collaborative document editing platform. The platform
                        will enable real-time collaboration, AI-powered
                        suggestions, and seamless document management.
                      </p>

                      <h2>User Stories</h2>
                      <ul>
                        <li>
                          As a user, I want to create and edit documents in
                          real-time with my team
                        </li>
                        <li>
                          As a user, I want to see who else is editing the
                          document
                        </li>
                        <li>
                          As a user, I want to add comments and suggestions
                        </li>
                        <li>
                          As a user, I want AI assistance for writing and
                          editing
                        </li>
                      </ul>

                      <h2>Technical Requirements</h2>
                      <p>
                        The platform should be built using modern web
                        technologies including React, Next.js, and WebSocket for
                        real-time collaboration. The editor should be based on
                        Lexical for rich text editing capabilities.
                      </p>

                      <h2>Success Metrics</h2>
                      <ul>
                        <li>
                          User engagement: 80% of users return within 7 days
                        </li>
                        <li>
                          Collaboration: Average of 3+ collaborators per
                          document
                        </li>
                        <li>Performance: Document load time under 2 seconds</li>
                      </ul>
                    </div>
                  </div>
                </div> */}
              </div>
            </div>

            {/* AI Assistant Panel */}
            <AiAssistantPanel
              isOpen={showAI}
              onClose={() => setShowAI(false)}
              suggestions={aiSuggestions}
            />

            {/* Comments Panel */}
            <CommentsPanel
              isOpen={showComments}
              onClose={() => setShowComments(false)}
              comments={comments}
            />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
