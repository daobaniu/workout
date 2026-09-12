"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type ConfirmDialogProps = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** destructive：危险操作（删除/清空） */
  tone?: "default" | "destructive";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** 触发器元素（配合 children 作为文案） */
  trigger?: React.ReactElement;
  children?: React.ReactNode;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
};

/**
 * 统一确认弹窗（基于 shadcn AlertDialog）
 * — 通体同色、细分割线、遮罩分层，全站危险操作共用。
 */
export function ConfirmDialog({
  title,
  description,
  confirmLabel = "确认",
  cancelLabel = "取消",
  tone = "destructive",
  open,
  onOpenChange,
  trigger,
  children,
  loading,
  onConfirm,
}: ConfirmDialogProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const busy = loading ?? internalLoading;

  async function handleConfirm() {
    setInternalLoading(true);
    try {
      await onConfirm();
      onOpenChange?.(false);
    } finally {
      setInternalLoading(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {trigger ? (
        <AlertDialogTrigger render={trigger}>{children}</AlertDialogTrigger>
      ) : null}
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            variant={tone === "destructive" ? "destructive" : "default"}
            disabled={busy}
            onClick={() => {
              void handleConfirm();
            }}
          >
            {busy ? "处理中…" : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** 可选：用 Button 作触发器的快捷写法 */
export function ConfirmDialogButton({
  buttonLabel,
  buttonVariant = "outline",
  buttonSize = "sm",
  buttonClassName,
  disabled,
  ...props
}: Omit<ConfirmDialogProps, "trigger" | "children"> & {
  buttonLabel: React.ReactNode;
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
  buttonSize?: React.ComponentProps<typeof Button>["size"];
  buttonClassName?: string;
  disabled?: boolean;
}) {
  return (
    <ConfirmDialog
      {...props}
      trigger={
        <Button
          variant={buttonVariant}
          size={buttonSize}
          className={buttonClassName}
          disabled={disabled}
        />
      }
    >
      {buttonLabel}
    </ConfirmDialog>
  );
}
