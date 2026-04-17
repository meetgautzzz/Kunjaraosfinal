import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
}

export default function Card({
  padded = true,
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`bg-card border border-white/10 rounded-xl ${padded ? "p-6" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
