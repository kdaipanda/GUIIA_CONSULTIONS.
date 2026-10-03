import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import "./combobox.css";

/**
 * Combobox searchable (estilo shadcn) con UIX GUIAA.
 * @param {{ value: string, label: string, disabled?: boolean }[]} options
 */
export function Combobox({
  options = [],
  value = "",
  onValueChange,
  placeholder = "Seleccionar…",
  searchPlaceholder = "Buscar…",
  emptyText = "Sin resultados",
  disabled = false,
  className,
  triggerClassName,
  contentClassName,
  id,
  "aria-label": ariaLabel,
  allowClear = false,
}) {
  const [open, setOpen] = React.useState(false);

  const selected = React.useMemo(
    () => options.find((opt) => String(opt.value) === String(value)),
    [options, value],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={ariaLabel || placeholder}
          disabled={disabled}
          className={cn("guiaa-combobox-trigger", triggerClassName, className)}
        >
          <span
            className={cn(
              "guiaa-combobox-value",
              !selected && "guiaa-combobox-value--placeholder",
            )}
          >
            {selected ? selected.label : placeholder}
          </span>
          <ChevronsUpDown className="guiaa-combobox-chevrons" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn("guiaa-combobox-content p-0", contentClassName)}
        align="start"
      >
        <Command className="guiaa-combobox-command">
          <CommandInput placeholder={searchPlaceholder} className="guiaa-combobox-search" />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {allowClear && value ? (
                <CommandItem
                  value="__clear__"
                  className="guiaa-combobox-item"
                  onSelect={() => {
                    onValueChange?.("");
                    setOpen(false);
                  }}
                >
                  <Check className="guiaa-combobox-check opacity-0" aria-hidden />
                  <span className="text-muted-foreground">{placeholder}</span>
                </CommandItem>
              ) : null}
              {options.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <CommandItem
                    key={String(opt.value)}
                    value={`${opt.label} ${opt.value}`}
                    disabled={opt.disabled}
                    className="guiaa-combobox-item"
                    onSelect={() => {
                      onValueChange?.(String(opt.value));
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "guiaa-combobox-check",
                        isSelected ? "opacity-100" : "opacity-0",
                      )}
                      aria-hidden
                    />
                    {opt.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Drop-in para &lt;select&gt; nativo: acepta &lt;option&gt; children y onChange tipo evento.
 */
export function FormCombobox({
  children,
  value = "",
  onChange,
  className,
  required,
  disabled,
  id,
  name,
  placeholder,
  searchPlaceholder,
  emptyText,
  "aria-label": ariaLabel,
  ...rest
}) {
  const options = React.useMemo(() => {
    const list = [];
    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return;
      if (child.type !== "option") return;
      const optValue = child.props.value ?? "";
      const label =
        typeof child.props.children === "string" || typeof child.props.children === "number"
          ? String(child.props.children)
          : React.Children.toArray(child.props.children).join("");
      list.push({
        value: String(optValue),
        label: label || String(optValue),
        disabled: Boolean(child.props.disabled),
      });
    });
    return list;
  }, [children]);

  const placeholderOption = options.find((o) => o.value === "");
  const selectable = options.filter((o) => o.value !== "");
  const resolvedPlaceholder =
    placeholder || placeholderOption?.label || "Seleccionar…";

  const handleValueChange = (next) => {
    if (!onChange) return;
    const event = {
      target: { value: next, name: name || "", id: id || "" },
      currentTarget: { value: next, name: name || "", id: id || "" },
    };
    onChange(event);
  };

  return (
    <div className={cn("guiaa-form-combobox", className)} {...rest}>
      {required ? (
        <input
          tabIndex={-1}
          aria-hidden
          className="guiaa-combobox-required-mirror"
          value={value ?? ""}
          required
          onChange={() => {}}
        />
      ) : null}
      <Combobox
        id={id}
        options={selectable}
        value={value ?? ""}
        onValueChange={handleValueChange}
        placeholder={resolvedPlaceholder}
        searchPlaceholder={searchPlaceholder || "Buscar…"}
        emptyText={emptyText || "Sin resultados"}
        disabled={disabled}
        aria-label={ariaLabel || resolvedPlaceholder}
        allowClear={!required && Boolean(placeholderOption)}
        className="w-full"
      />
    </div>
  );
}

export default Combobox;
