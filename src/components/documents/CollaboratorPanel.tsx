"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
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
import InviteCollaboratorsDialog from "./InviteCollaboratorsDialog";

interface Collaborator {
  id: string;
  userId?: string;
  name: string;
  email: string;
  avatar?: string;
  status: "online" | "away" | "offline";
  role: "owner" | "editor" | "viewer";
}

interface CollaboratorItemProps {
  collaborator: Collaborator;
  index: number;
  isOnline: boolean;
  canManageCollaborators: boolean;
  changingRoleForId: string | null;
  onChangeRole: (collaboratorId: string, role: "EDITOR" | "VIEWER") => void;
  onRemove: (collaborator: Collaborator) => void;
  getRoleIcon: (role: string) => React.ReactNode;
  getRealAvatarUrl: (collaborator: Collaborator) => string | undefined;
  session: any;
}

function CollaboratorItem({
  collaborator,
  index,
  isOnline,
  canManageCollaborators,
  changingRoleForId,
  onChangeRole,
  onRemove,
  getRoleIcon,
  getRealAvatarUrl,
  session,
}: CollaboratorItemProps) {
  const isCurrentUser = collaborator.userId === session?.user?.id;
  const realAvatarUrl = getRealAvatarUrl(collaborator);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`cursor-pointer rounded-lg border p-3 transition-colors ${
        isOnline
          ? "border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-700 dark:hover:bg-slate-600"
          : "border-slate-200/50 bg-slate-50/50 opacity-60 hover:bg-slate-100/50 dark:border-slate-600/50 dark:bg-slate-700/50 dark:hover:bg-slate-600/50"
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Avatar with status */}
        <div className="relative">
          <Avatar
            className={`h-8 w-8 ${
              isCurrentUser
                ? "ring-2 ring-blue-500 ring-offset-1 dark:ring-blue-400"
                : ""
            }`}
          >
            <AvatarImage src={realAvatarUrl} alt={collaborator.name} />
            <AvatarFallback className="text-xs">
              {collaborator.name
                .split(" ")
                .map(n => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div
            className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-slate-800 ${
              isOnline ? "bg-green-500" : "bg-gray-400"
            }`}
          />
          {isCurrentUser && (
            <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full border border-white bg-blue-500 dark:border-slate-800">
              <div className="h-full w-full animate-pulse rounded-full bg-blue-500" />
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <p className="truncate text-sm font-medium">{collaborator.name}</p>
            {getRoleIcon(collaborator.role)}
          </div>
          <p className="truncate text-xs text-slate-600 dark:text-slate-300">
            {collaborator.email}
          </p>
          <p className="text-xs text-slate-500">
            {isOnline ? "Online" : "Offline"}
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
        ) : canManageCollaborators ? (
          <Select
            value={collaborator.role.toUpperCase()}
            onValueChange={(value: "EDITOR" | "VIEWER") =>
              onChangeRole(collaborator.id, value)
            }
            disabled={changingRoleForId === collaborator.id}
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
            variant={collaborator.role === "editor" ? "default" : "outline"}
            className="text-xs"
          >
            {collaborator.role === "editor" ? "Editor" : "Viewer"}
          </Badge>
        )}

        {/* Remove Action */}
        {collaborator.role !== "owner" && canManageCollaborators && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onRemove(collaborator)}
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
  );
}

interface CollaboratorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  collaborators: Collaborator[];
  currentUserRole: "owner" | "editor" | "viewer";
  provider?: any;
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
  provider,
  onAddCollaborator,
  onRemoveCollaborator,
  onChangeRole,
}: CollaboratorPanelProps) {
  const { data: session } = useSession();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [collaboratorToRemove, setCollaboratorToRemove] =
    useState<Collaborator | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [changingRoleForId, setChangingRoleForId] = useState<string | null>(
    null
  );

  const canManageCollaborators = currentUserRole === "owner";

  const [awarenessUsers, setAwarenessUsers] = useState<any[]>([]);
  const [userProfiles, setUserProfiles] = useState<
    Record<string, { image?: string; name?: string; email?: string }>
  >({});
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  // Fetch user profiles for all collaborators to get their real avatars
  useEffect(() => {
    const fetchUserProfiles = async () => {
      const userIds = collaborators
        .map(c => c.userId)
        .filter((id): id is string => Boolean(id));

      if (userIds.length === 0) return;

      setLoadingProfiles(true);
      try {
        const response = await fetch("/api/users/profiles", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userIds }),
        });

        if (response.ok) {
          const profiles = await response.json();
          setUserProfiles(profiles);
          console.log("✅ User profiles fetched:", profiles);
        } else {
          console.error("Failed to fetch user profiles:", response.status);
        }
      } catch (error) {
        console.error("Failed to fetch user profiles:", error);
      } finally {
        setLoadingProfiles(false);
      }
    };

    fetchUserProfiles();
  }, [collaborators]);

  // Enhanced helper function to get real avatar URL for a collaborator
  const getRealAvatarUrl = (collaborator: Collaborator) => {
    // Check if this is the current user
    const isCurrentUser = collaborator.userId === session?.user?.id;
    if (isCurrentUser && session?.user?.image) {
      return session.user.image;
    }

    // First, check fetched user profiles (most reliable)
    if (collaborator.userId && userProfiles[collaborator.userId]?.image) {
      return userProfiles[collaborator.userId].image;
    }

    // Second, check awareness users (for real-time updates)
    for (const [, state] of awarenessUsers) {
      const userId = state.user?.id || state.userId || state.id;
      if (userId === collaborator.userId) {
        // Check multiple possible avatar fields from awareness
        const avatarUrl =
          state.user?.image || state.user?.imageUrl || state.user?.avatar;
        if (avatarUrl) {
          return avatarUrl;
        }
      }
    }

    // Final fallback to the stored avatar in collaborator data
    return collaborator.avatar;
  };

  const onlineUserIds = new Set<string>();
  for (const [, state] of awarenessUsers) {
    const userId = state.user?.id || state.userId || state.id;
    if (userId && typeof userId === "string") {
      onlineUserIds.add(userId);
    }
  }

  const onlineCollaborators = collaborators.filter(
    collab => collab.userId && onlineUserIds.has(collab.userId)
  );
  const offlineCollaborators = collaborators.filter(
    collab => !collab.userId || !onlineUserIds.has(collab.userId)
  );

  useEffect(() => {
    if (!provider) {
      return;
    }

    const updateProviderInfo = () => {
      try {
        if (provider.awareness) {
          const awarenessStates = Array.from(
            provider.awareness.getStates().entries()
          );
          setAwarenessUsers(awarenessStates);
        }
      } catch (error) {
        console.error(
          "❌ CollaboratorPanel: Error updating provider info:",
          error
        );
      }
    };

    updateProviderInfo();

    const intervalId = setInterval(updateProviderInfo, 1000);

    const onAwarenessChange = () => {
      updateProviderInfo();
    };

    if (provider.awareness) {
      provider.awareness.on("change", onAwarenessChange);
    }

    return () => {
      clearInterval(intervalId);
      if (provider.awareness) {
        provider.awareness.off("change", onAwarenessChange);
      }
    };
  }, [provider]);

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
    if (!onChangeRole) {
      console.error("❌ onChangeRole function not provided");
      return;
    }

    const collaborator = collaborators.find(c => c.id === collaboratorId);
    if (!collaborator) {
      console.error("❌ Collaborator not found:", collaboratorId);
      return;
    }

    const currentRole = collaborator.role.toUpperCase();

    console.log("🔄 Role change request:", {
      collaboratorId,
      collaboratorName: collaborator.name,
      currentRole,
      newRole,
      hasChange: currentRole !== newRole,
    });

    if (currentRole === newRole) {
      console.log("✅ No role change needed");
      return;
    }

    setChangingRoleForId(collaboratorId);

    try {
      await onChangeRole(collaboratorId, newRole);

      console.log("✅ Role change successful:", {
        collaboratorId,
        from: currentRole,
        to: newRole,
      });

      toast.success(
        `${collaborator.name}'s permission updated to ${newRole.toLowerCase()}`
      );
    } catch (error) {
      console.error("❌ Failed to change role:", error);
      toast.error("Failed to update permission. Please try again.");
    } finally {
      setChangingRoleForId(null);
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

                {/* Online Users Section */}
                {onlineCollaborators.length > 0 && (
                  <div>
                    <h4 className="mb-2 flex items-center gap-2 font-medium">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      Online ({onlineCollaborators.length})
                    </h4>
                    <div className="space-y-3">
                      {onlineCollaborators.map((collaborator, index) => (
                        <CollaboratorItem
                          key={collaborator.id}
                          collaborator={collaborator}
                          index={index}
                          isOnline={true}
                          canManageCollaborators={canManageCollaborators}
                          changingRoleForId={changingRoleForId}
                          onChangeRole={handleRoleChange}
                          onRemove={setCollaboratorToRemove}
                          getRoleIcon={getRoleIcon}
                          getRealAvatarUrl={getRealAvatarUrl}
                          session={session}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Offline Users Section */}
                {offlineCollaborators.length > 0 && (
                  <div>
                    <h4 className="mb-2 flex items-center gap-2 font-medium">
                      <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                      Offline ({offlineCollaborators.length})
                    </h4>
                    <div className="space-y-3">
                      {offlineCollaborators.map((collaborator, index) => (
                        <CollaboratorItem
                          key={collaborator.id}
                          collaborator={collaborator}
                          index={index}
                          isOnline={false}
                          canManageCollaborators={canManageCollaborators}
                          changingRoleForId={changingRoleForId}
                          onChangeRole={handleRoleChange}
                          onRemove={setCollaboratorToRemove}
                          getRoleIcon={getRoleIcon}
                          getRealAvatarUrl={getRealAvatarUrl}
                          session={session}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* No Collaborators */}
                {collaborators.length === 0 && (
                  <div className="text-center text-slate-500 dark:text-slate-400">
                    <Users className="mx-auto mb-2 h-8 w-8 opacity-50" />
                    <p className="text-sm">No collaborators yet</p>
                    <p className="text-xs">Invite people to collaborate!</p>
                  </div>
                )}
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
