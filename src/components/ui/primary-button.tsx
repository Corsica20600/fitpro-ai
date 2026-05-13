import type { ButtonHTMLAttributes, ReactNode } from "react";

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  fullWidth?: boolean;
};

export function PrimaryButton({ children, className = "", fullWidth = true, ...props }: PrimaryButtonProps) {
  return (
    <button
      {...props}
      className={`primary-button ${fullWidth ? "full-width" : ""} ${className}`.trim()}
    >
      {children}
    </button>
  );
}
