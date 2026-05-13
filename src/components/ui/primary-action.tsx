import type { ButtonHTMLAttributes, ReactNode } from "react";
import { PrimaryButton } from "@/src/components/ui/primary-button";

type PrimaryActionProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  className?: string;
};

export function PrimaryAction({ children, className = "", ...props }: PrimaryActionProps) {
  return (
    <PrimaryButton {...props} className={`primary-action ${className}`.trim()}>
      {children}
    </PrimaryButton>
  );
}
