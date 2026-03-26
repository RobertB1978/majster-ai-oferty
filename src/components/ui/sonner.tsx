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
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-token-md",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-token-sm group-[.toast]:font-semibold",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-token-sm",
          success:
            "group-[.toaster]:!bg-[var(--state-success)] group-[.toaster]:!text-white group-[.toaster]:!border-green-600",
          error:
            "group-[.toaster]:!bg-[var(--state-error)] group-[.toaster]:!text-white group-[.toaster]:!border-red-700",
          warning:
            "group-[.toaster]:!bg-[var(--accent-amber-subtle)] group-[.toaster]:!text-[var(--text-primary)] group-[.toaster]:!border-[var(--accent-amber)]",
          info:
            "group-[.toaster]:!bg-[var(--accent-blue-subtle)] group-[.toaster]:!text-[var(--text-primary)] group-[.toaster]:!border-[var(--accent-blue)]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
