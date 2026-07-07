// components/admin/ConfirmDialog.tsx
'use client';

import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  destructive?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Hapus",
  cancelLabel = "Batal",
  onConfirm,
  destructive = true,
}: Props) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        style={{ background: "var(--admin-surface)", border: "1px solid var(--admin-border)" }}
      >
        <AlertDialogHeader>
          <div className="flex items-start gap-3">
            {destructive && (
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                   style={{ background: "rgba(248, 113, 113, 0.12)" }}>
                <AlertTriangle className="w-5 h-5 text-[#F87171]" />
              </div>
            )}
            <div className="flex-1">
              <AlertDialogTitle className="text-lg" style={{ color: "var(--admin-text)", fontFamily: "var(--font-cormorant)" }}>
                {title}
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-1.5" style={{ color: "var(--admin-text-muted)" }}>
                {description}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel
            className="border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:bg-[var(--admin-surface-2)]"
          >
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={
              destructive
                ? "bg-[#F87171] hover:bg-[#EF4444] text-white border-0"
                : "btn-gold border-0"
            }
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
