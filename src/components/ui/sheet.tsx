"use client";

import * as React from "react";
import { Dialog as SheetPrimitive } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;
const SheetTitle = SheetPrimitive.Title;

function SheetContent({
  className,
  children,
  lado = "left",
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & { lado?: "left" | "right" | "bottom" }) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50" />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "fixed z-50 flex flex-col shadow-lg outline-none",
          lado === "left" && "inset-y-0 left-0 h-full w-[85%] max-w-xs",
          lado === "right" && "inset-y-0 right-0 h-full w-[85%] max-w-xs",
          lado === "bottom" && "inset-x-0 bottom-0 max-h-[85dvh] rounded-t-2xl",
          className,
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close className="absolute top-4 right-4 rounded-sm opacity-80 hover:opacity-100 focus-visible:outline-none">
          <X className="size-5" />
          <span className="sr-only">Cerrar</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetTitle };
