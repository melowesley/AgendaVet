import { View, Text, type ViewProps, type TextProps } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { cn } from "@/lib/utils";

interface CardProps extends ViewProps {}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <View
      className={cn(
        "bg-card border border-border rounded-xl overflow-hidden",
        className
      )}
      {...props}
    >
      <View>{children}</View>
    </View>
  );
}

export function CardHeader({ className, ...props }: ViewProps) {
  return <View className={cn("p-6 pb-3", className)} {...props} />;
}

export function CardTitle({ className, children, ...props }: TextProps) {
  return (
    <Text className={cn("text-base font-semibold text-foreground tracking-tight", className)} {...props}>
      {children}
    </Text>
  );
}

export function CardDescription({ className, children, ...props }: TextProps) {
  return (
    <Text className={cn("text-sm text-muted-foreground", className)} {...props}>
      {children}
    </Text>
  );
}

export function CardContent({ className, ...props }: ViewProps) {
  return <View className={cn("p-6 pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }: ViewProps) {
  return <View className={cn("p-6 pt-0 flex-row items-center", className)} {...props} />;
}
