import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  type TouchableOpacityProps,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { cn } from "@/lib/utils";

interface ButtonProps extends TouchableOpacityProps {
  label?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "glow";
  size?: "default" | "sm" | "lg" | "icon";
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  label,
  variant = "default",
  size = "default",
  loading = false,
  leftIcon,
  rightIcon,
  className,
  style,
  children,
  ...props
}: ButtonProps) {
  
  const variants = {
    default: "bg-emerald-500",
    glow: "bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]",
    destructive: "bg-rose-500",
    outline: "border border-emerald-500/30 bg-emerald-500/5",
    secondary: "bg-slate-800",
    ghost: "bg-transparent",
    link: "bg-transparent underline",
  };

  const sizes = {
    default: "h-11 px-6 rounded-md",
    sm: "h-9 px-3 rounded-md",
    lg: "h-13 px-8 rounded-md",
    icon: "h-11 w-11 rounded-md justify-center items-center p-0",
  };

  const textSizes = {
    default: "text-sm font-semibold",
    sm: "text-xs font-semibold",
    lg: "text-base font-bold",
    icon: "text-sm",
  };

  const currentVariant = variants[variant];
  const currentSize = sizes[size];
  const currentTextSize = textSizes[size];

  const content = (
    <>
      {leftIcon}
      {label ? (
        <Text
          className={cn(
            currentTextSize,
            variant === "outline" ? "text-emerald-400" : "text-white",
            variant === "link" && "text-emerald-500",
            variant === "ghost" && "text-slate-400"
          )}
        >
          {label}
        </Text>
      ) : (
        children
      )}
      {rightIcon}
    </>
  );

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={loading || props.disabled}
      className={cn(
        "relative flex-row items-center justify-center gap-2 overflow-hidden",
        currentSize,
        variant !== "default" && variant !== "glow" && currentVariant,
        (loading || props.disabled) && "opacity-50",
        className
      )}
      {...props}
    >
      {(variant === "default" || variant === "glow") && (
        <LinearGradient
          colors={['#10b981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
      )}
      
      {loading ? (
        <ActivityIndicator color="white" />
      ) : (
        content
      )}
    </TouchableOpacity>
  );
}
