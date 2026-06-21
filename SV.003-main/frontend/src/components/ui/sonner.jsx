import { useEffect, useState } from "react";
import { Toaster as Sonner, toast } from "sonner";
import { readStoredTheme } from "@/lib/themeSync";

const Toaster = ({ ...props }) => {
  const [theme, setTheme] = useState(() => readStoredTheme());

  useEffect(() => {
    const sync = () => setTheme(readStoredTheme());
    sync();
    window.addEventListener("storage", sync);
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "class"],
    });
    return () => {
      window.removeEventListener("storage", sync);
      observer.disconnect();
    };
  }, []);

  return (
    <Sonner
      theme={theme === "dark" ? "dark" : "light"}
      position="top-right"
      closeButton
      richColors
      expand
      visibleToasts={4}
      gap={10}
      className="guiaa-toaster"
      toastOptions={{
        classNames: {
          toast:
            "guiaa-toast group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
