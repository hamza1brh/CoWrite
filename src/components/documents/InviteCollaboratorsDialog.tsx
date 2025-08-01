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
      <DialogContent className="surface-elevated max-w-md border-border/50 shadow-elevation-3 backdrop-blur-sm dark:shadow-dark-elevation-3">
        <DialogHeader className="space-y-2">
          <DialogTitle className="flex items-center gap-2 font-sans text-sm font-semibold text-foreground">
            <UserPlus className="h-4 w-4 text-blue-500" />
            Invite collaborator
          </DialogTitle>
          <DialogDescription className="font-sans text-sm text-muted-foreground">
            Send an invitation to collaborate on this document.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {errorMessage && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 backdrop-blur-sm">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />
                <div>
                  <p className="font-sans text-sm font-medium text-destructive-foreground">
                    Invitation failed
                  </p>
                  <p className="mt-1 font-sans text-sm text-destructive-foreground">
                    {errorMessage}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="font-sans text-sm font-medium text-foreground">
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
                  className={`border-border/50 bg-background/50 font-sans text-sm placeholder:text-muted-foreground focus:border-blue-300 dark:focus:border-blue-700 ${
                    errorMessage
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }`}
                />
              </div>
              <Select
                value={role}
                onValueChange={(value: "EDITOR" | "VIEWER") => setRole(value)}
              >
                <SelectTrigger className="w-24 border-border/50 bg-background/50 font-sans text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-border/50 bg-popover backdrop-blur-md">
                  <SelectItem value="EDITOR">
                    <div className="flex items-center gap-2">
                      <Edit3 className="h-3 w-3 text-blue-500" />
                      <span className="font-sans text-sm">Editor</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="VIEWER">
                    <div className="flex items-center gap-2">
                      <Eye className="h-3 w-3 text-muted-foreground" />
                      <span className="font-sans text-sm">Viewer</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {!errorMessage && (
            <div className="rounded-lg border border-blue-200/50 bg-blue-50/50 p-3 backdrop-blur-sm dark:bg-blue-950/20">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 h-3 w-3 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                <p className="font-sans text-sm text-blue-700 dark:text-blue-300">
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
            className="h-8 border-border/50 px-3 font-sans text-sm hover:bg-accent/50"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSendInvite}
            disabled={!email.trim() || isInviting}
            className="button-gradient h-8 px-3 font-sans text-sm disabled:cursor-not-allowed disabled:opacity-50"
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
