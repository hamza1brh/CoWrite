"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Edit3, Eye, UserPlus, Info } from "lucide-react";
import { toast } from "sonner";

interface InviteCollaboratorsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddCollaborator: (
    email: string,
    role: "EDITOR" | "VIEWER"
  ) => Promise<void>;
}

export default function InviteCollaboratorsDialog({
  open,
  onOpenChange,
  onAddCollaborator,
}: InviteCollaboratorsDialogProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"EDITOR" | "VIEWER">("EDITOR");
  const [isInviting, setIsInviting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendInvite = async () => {
    setErrorMessage("");

    if (!email.trim()) {
      setErrorMessage("Please enter an email address");
      return;
    }

    if (!validateEmail(email)) {
      setErrorMessage("Please enter a valid email address");
      return;
    }

    try {
      setIsInviting(true);
      await onAddCollaborator(email.trim(), role);

      toast.success(`Invitation sent to ${email}`);

      setEmail("");
      setRole("EDITOR");
      setErrorMessage("");
      onOpenChange(false);
    } catch (error: any) {
      console.error("Failed to send invite:", error);

      let userErrorMessage = "";

      if (error?.message) {
        const message = error.message.toLowerCase();

        if (
          message.includes("user not found") ||
          message.includes("not registered") ||
          message.includes("no user found")
        ) {
          userErrorMessage =
            "This email isn't registered. They need to create an account first.";
        } else if (
          message.includes("already a collaborator") ||
          message.includes("already exists")
        ) {
          userErrorMessage =
            "This person is already a collaborator on this document.";
        } else if (message.includes("invalid email")) {
          userErrorMessage = "Please enter a valid email address.";
        } else if (
          message.includes("permission denied") ||
          message.includes("unauthorized")
        ) {
          userErrorMessage =
            "You don't have permission to invite collaborators.";
        } else {
          userErrorMessage = "Unable to send invitation. Please try again.";
        }
      } else {
        userErrorMessage = "Unable to send invitation. Please try again.";
      }

      // Show error message but keep email in the field
      setErrorMessage(userErrorMessage);
      toast.error(userErrorMessage);
    } finally {
      setIsInviting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendInvite();
    }
  };

  const handleClose = () => {
    setEmail("");
    setRole("EDITOR");
    setErrorMessage("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <DialogHeader className="space-y-2">
          <DialogTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            <UserPlus className="h-4 w-4 text-blue-500" />
            Invite collaborator
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-600 dark:text-slate-400">
            Send an invitation to collaborate on this document.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600 dark:text-red-400" />
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    Invitation failed
                  </p>
                  <p className="mt-1 text-xs text-red-700 dark:text-red-300">
                    {errorMessage}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Email address and permission
            </Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@company.com"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage("");
                  }}
                  onKeyDown={handleKeyDown}
                  className={`border-slate-200 text-sm placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:placeholder:text-slate-500 ${
                    errorMessage
                      ? "border-red-300 focus-visible:ring-red-500"
                      : ""
                  }`}
                />
              </div>
              <Select
                value={role}
                onValueChange={(value: "EDITOR" | "VIEWER") => setRole(value)}
              >
                <SelectTrigger className="w-24 border-slate-200 text-xs dark:border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EDITOR">
                    <div className="flex items-center gap-2">
                      <Edit3 className="h-3 w-3 text-blue-500" />
                      <span className="text-xs">Editor</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="VIEWER">
                    <div className="flex items-center gap-2">
                      <Eye className="h-3 w-3 text-slate-500" />
                      <span className="text-xs">Viewer</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {!errorMessage && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 h-3 w-3 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  The person must have an account to receive the invitation.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={isInviting}
            className="border-slate-200 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSendInvite}
            disabled={!email.trim() || isInviting}
            className="bg-blue-600 text-xs text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            {isInviting ? (
              <>
                <div className="mr-2 h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                Sending...
              </>
            ) : (
              "Send invitation"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
