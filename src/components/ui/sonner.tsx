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
          // Semantic variants — DS token-aligned, override base bg/border via !important
          success: "!bg-success/10 !border-success/30 [&>[data-icon]]:text-success",
          error:   "!bg-destructive/10 !border-destructive/30 [&>[data-icon]]:text-destructive",
          warning: "!bg-warning/10 !border-warning/30 [&>[data-icon]]:text-warning",
          info:    "!bg-info/10 !border-info/30 [&>[data-icon]]:text-info",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
