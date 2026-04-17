import { HTMLAttributes } from "react";

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "max-w-2xl",
  md: "max-w-4xl",
  lg: "max-w-6xl",
};

export default function Container({
  size = "lg",
  className = "",
  children,
  ...props
}: ContainerProps) {
  return (
    <div
      className={`mx-auto w-full px-6 ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
