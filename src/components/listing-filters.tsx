import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { LISTABLE_ITEMS_WITH_ALL } from "@/lib/listable-items";

interface ListingFiltersProps {
  city?: string;
  category?: string;
  q?: string;
}

export function ListingFilters({ city, category, q }: ListingFiltersProps) {
  return (
    <form className="grid gap-3 rounded-2xl border border-zinc-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
      <label className="relative sm:col-span-2 lg:col-span-1">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-600" />
        <Input name="q" defaultValue={q} placeholder="Search appliance name or description" className="pl-9" />
      </label>
      <Input name="city" defaultValue={city} placeholder="City (e.g. Bengaluru)" />
      <Select name="category" defaultValue={category ?? "All"}>
        {LISTABLE_ITEMS_WITH_ALL.map((entry) => (
          <option key={entry} value={entry}>
            {entry}
          </option>
        ))}
      </Select>
      <Button type="submit" variant="primary" className="h-[42px] sm:col-span-2 lg:col-span-1 lg:w-auto">
        Apply
      </Button>
    </form>
  );
}
