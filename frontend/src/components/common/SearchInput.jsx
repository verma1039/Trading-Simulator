import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";

export default function SearchInput({
  ariaLabel = "Search",
  className = "",
  onChange,
  onSubmit,
  placeholder = "Search",
  value = "",
}) {
  return (
    <form
      className={className}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.(value);
      }}
    >
      <div className="relative min-w-[240px]">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          aria-label={ariaLabel}
          className="pl-9"
          onChange={(event) => onChange?.(event.target.value)}
          placeholder={placeholder}
          value={value}
        />
      </div>
    </form>
  );
}
