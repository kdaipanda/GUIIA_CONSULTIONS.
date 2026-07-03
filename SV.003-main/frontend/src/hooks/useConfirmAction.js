import { useCallback, useRef, useState } from "react";

/**
 * Diálogo de confirmación accesible (reemplaza window.confirm).
 * @returns {{ confirm: (opts) => Promise<boolean>, dialogProps: object }}
 */
export function useConfirmAction() {
  const [config, setConfig] = useState(null);
  const resolveRef = useRef(null);

  const confirm = useCallback(
    ({
      title,
      description,
      confirmLabel = "Confirmar",
      cancelLabel = "Cancelar",
      destructive = false,
    }) =>
      new Promise((resolve) => {
        resolveRef.current = resolve;
        setConfig({ title, description, confirmLabel, cancelLabel, destructive });
      }),
    [],
  );

  const close = useCallback((result) => {
    resolveRef.current?.(result);
    resolveRef.current = null;
    setConfig(null);
  }, []);

  const handleOpenChange = useCallback(
    (open) => {
      if (!open) close(false);
    },
    [close],
  );

  const handleConfirm = useCallback(() => {
    close(true);
  }, [close]);

  return {
    confirm,
    dialogProps: {
      open: Boolean(config),
      title: config?.title ?? "",
      description: config?.description ?? "",
      confirmLabel: config?.confirmLabel ?? "Confirmar",
      cancelLabel: config?.cancelLabel ?? "Cancelar",
      destructive: config?.destructive ?? false,
      onOpenChange: handleOpenChange,
      onConfirm: handleConfirm,
    },
  };
}
