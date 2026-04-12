import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          // Semantic variants — DS tokens: left accent bar (3px) + tinted bg + icon color
          // !border-l-{color} overrides !border-{color}/25 for the left side (directional wins cascade)
          success: "!bg-success/10 !border-success/25 !border-l-[3px] !border-l-success [&>[data-icon]]:text-success",
          error:   "!bg-destructive/10 !border-destructive/25 !border-l-[3px] !border-l-destructive [&>[data-icon]]:text-destructive",
          warning: "!bg-warning/10 !border-warning/25 !border-l-[3px] !border-l-warning [&>[data-icon]]:text-warning",
          info:    "!bg-info/10 !border-info/25 !border-l-[3px] !border-l-info [&>[data-icon]]:text-info",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
