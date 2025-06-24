"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Users,
  Plus,
  Crown,
  Edit3,
  Eye,
  MoreHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import InviteCollaboratorsDialog from "@/components/documents/InviteCollaboratorsDialog";

interface Collaborator {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: "online" | "away" | "offline";
  role: "owner" | "editor" | "viewer";
}

interface CollaboratorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  collaborators: Collaborator[];
  currentUserRole: "owner" | "editor" | "viewer";
  onAddCollaborator?: (
    email: string,
    role: "EDITOR" | "VIEWER"
  ) => Promise<void>;
  onRemoveCollaborator?: (collaboratorId: string) => Promise<void>;
  onChangeRole?: (
    collaboratorId: string,
    role: "EDITOR" | "VIEWER"
  ) => Promise<void>;
}

export default function CollaboratorPanel({
  isOpen,
  onClose,
  collaborators,
  currentUserRole,
  onAddCollaborator,
  onRemoveCollaborator,
  onChangeRole,
}: CollaboratorPanelProps) {
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [collaboratorToRemove, setCollaboratorToRemove] =
    useState<Collaborator | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const canManageCollaborators = currentUserRole === "owner";

  const handleRemoveConfirm = async () => {
    if (!collaboratorToRemove || !onRemoveCollaborator) return;

    try {
      setIsRemoving(true);
      await onRemoveCollaborator(collaboratorToRemove.id);
      toast.success(`${collaboratorToRemove.name} removed from document`);
      setCollaboratorToRemove(null);
    } catch (error) {
      console.error("Failed to remove collaborator:", error);
      toast.error("Failed to remove collaborator");
    } finally {
      setIsRemoving(false);
    }
  };

  const handleRoleChange = async (
    collaboratorId: string,
    newRole: "EDITOR" | "VIEWER"
  ) => {
    if (!onChangeRole) return;

    try {
      await onChangeRole(collaboratorId, newRole);
      toast.success("Permission updated successfully");
    } catch (error) {
      console.error("Failed to change role:", error);
      toast.error("Failed to update permission");
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="h-4 w-4 text-amber-500" />;
      case "editor":
        return <Edit3 className="h-4 w-4 text-blue-500" />;
      case "viewer":
        return <Eye className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "online":
        return "Online";
      case "away":
        return "Away";
      default:
        return "Offline";
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="surface-elevated flex flex-col overflow-hidden border-l border-slate-200/50 dark:border-slate-700/50"
            style={{ height: "calc(100vh - 73px)" }}
          >
            {/* Header - Fixed */}
            <div className="flex-shrink-0 border-b border-slate-200 p-4 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center font-semibold">
                  <Users className="mr-2 h-4 w-4 text-blue-500" />
                  Collaborators ({collaborators.length})
                </h3>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Scrollable Content */}
            <ScrollArea className="flex-1">
              <div className="space-y-4 p-4">
                {/* Info Banner */}
                <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Manage who has access to this document and their
                    permissions.
                  </p>
                </div>

                {/* Invite Button */}
                {(currentUserRole === "owner" ||
                  currentUserRole === "editor") &&
                  onAddCollaborator && (
                    <div>
                      <h4 className="mb-2 font-medium">Quick Actions</h4>
                      <Button
                        onClick={() => setShowInviteDialog(true)}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Invite collaborator
                      </Button>
                    </div>
                  )}

                {/* Collaborators List */}
                <div>
                  <h4 className="mb-2 font-medium">People with access</h4>
                  <div className="space-y-3">
                    {collaborators.length > 0 ? (
                      collaborators.map((collaborator, index) => (
                        <motion.div
                          key={collaborator.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 p-3 transition-colors hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-700 dark:hover:bg-slate-600"
                        >
                          <div className="flex items-center gap-3">
                            {/* Avatar with status */}
                            <div className="relative">
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={collaborator.avatar}
                                  alt={collaborator.name}
                                />
                                <AvatarFallback className="text-xs">
                                  {collaborator.name
                                    .split(" ")
                                    .map(n => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div
                                className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-slate-800 ${getStatusDotColor(collaborator.status)}`}
                              />
                            </div>

                            {/* User Info */}
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex items-center gap-2">
                                <p className="truncate text-sm font-medium">
                                  {collaborator.name}
                                </p>
                                {getRoleIcon(collaborator.role)}
                              </div>
                              <p className="truncate text-xs text-slate-600 dark:text-slate-300">
                                {collaborator.email}
                              </p>
                              <p className="text-xs text-slate-500">
                                {getStatusText(collaborator.status)}
                              </p>
                            </div>
                          </div>

                          {/* Role & Actions */}
                          <div className="mt-3 flex items-center justify-between">
                            {/* Role Selector or Badge */}
                            {collaborator.role === "owner" ? (
                              <Badge
                                variant="default"
                                className="border-amber-200 bg-amber-100 text-xs text-amber-800 dark:bg-amber-900/20 dark:text-amber-400"
                              >
                                Owner
                              </Badge>
                            ) : canManageCollaborators && onChangeRole ? (
                              <Select
                                value={collaborator.role.toUpperCase()}
                                onValueChange={(value: "EDITOR" | "VIEWER") =>
                                  handleRoleChange(collaborator.id, value)
                                }
                              >
                                <SelectTrigger className="h-7 w-20 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="EDITOR">
                                    <div className="flex items-center gap-1">
                                      <Edit3 className="h-3 w-3" />
                                      Editor
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="VIEWER">
                                    <div className="flex items-center gap-1">
                                      <Eye className="h-3 w-3" />
                                      Viewer
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge
                                variant={
                                  collaborator.role === "editor"
                                    ? "default"
                                    : "outline"
                                }
                                className="text-xs"
                              >
                                {collaborator.role === "editor"
                                  ? "Editor"
                                  : "Viewer"}
                              </Badge>
                            )}

                            {/* Remove Action */}
                            {collaborator.role !== "owner" &&
                              canManageCollaborators && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() =>
                                        setCollaboratorToRemove(collaborator)
                                      }
                                      className="text-red-600 focus:text-red-600"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Remove access
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center text-slate-500 dark:text-slate-400">
                        <Users className="mx-auto mb-2 h-8 w-8 opacity-50" />
                        <p className="text-sm">No collaborators yet</p>
                        <p className="text-xs">Invite people to collaborate!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invite Dialog */}
      {onAddCollaborator && (
        <InviteCollaboratorsDialog
          open={showInviteDialog}
          onOpenChange={setShowInviteDialog}
          onAddCollaborator={onAddCollaborator}
        />
      )}

      {/* Remove Confirmation */}
      <AlertDialog
        open={!!collaboratorToRemove}
        onOpenChange={() => setCollaboratorToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove collaborator?</AlertDialogTitle>
            <AlertDialogDescription>
              {collaboratorToRemove && (
                <>
                  Remove <strong>{collaboratorToRemove.name}</strong> from this
                  document? They will no longer be able to access it.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveConfirm}
              disabled={isRemoving}
              className="bg-red-600 hover:bg-red-700"
            >
              {isRemoving ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
