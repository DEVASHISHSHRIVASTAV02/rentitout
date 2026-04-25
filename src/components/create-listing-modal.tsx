"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useState } from "react";
import { createListingAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { MultiImageUploadInput } from "@/components/multi-image-upload-input";
import { Input } from "@/components/ui/input";
import { RequiredMark } from "@/components/ui/required-mark";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { LISTABLE_ITEMS, type ListableItem } from "@/lib/listable-items";
import { SUPPORTED_CITIES } from "@/lib/cities";
import {
  CATEGORY_DONE_BUTTON_CLASS,
  CATEGORY_ITEM_INFO_LABEL,
  CATEGORY_ITEM_INFO_PRESET_OPTIONS,
  CATEGORY_SUBCATEGORY_LABEL,
  CATEGORY_SUBCATEGORY_OPTIONS,
} from "@/lib/listing-form-config";

const AGREEMENT_MONTH_OPTIONS = Array.from({ length: 24 }, (_, index) => index + 1);

interface CreateListingModalProps {
  isSignedIn: boolean;
  defaultContactEmail: string;
  autoOpen?: boolean;
}

export function CreateListingModal({ isSignedIn, defaultContactEmail, autoOpen = false }: CreateListingModalProps) {
  const initialCategory: ListableItem = "AC";
  const initialSubCategory = CATEGORY_SUBCATEGORY_OPTIONS[initialCategory][0] ?? "General";
  const initialItemInfo = (CATEGORY_ITEM_INFO_PRESET_OPTIONS[initialCategory] ?? [])[0] ?? "";

  const [isOpen, setIsOpen] = useState(autoOpen);
  const [category, setCategory] = useState<ListableItem>(initialCategory);
  const [subCategory, setSubCategory] = useState(initialSubCategory);
  const [itemInfo, setItemInfo] = useState(initialItemInfo);

  const subCategoryOptions = CATEGORY_SUBCATEGORY_OPTIONS[category];
  const itemInfoPresetOptions = CATEGORY_ITEM_INFO_PRESET_OPTIONS[category] ?? [];

  const handleCategoryChange = (nextCategory: ListableItem) => {
    setCategory(nextCategory);
    const nextSubCategory = CATEGORY_SUBCATEGORY_OPTIONS[nextCategory][0] ?? "General";
    const nextItemInfo = (CATEGORY_ITEM_INFO_PRESET_OPTIONS[nextCategory] ?? [])[0] ?? "";
    setSubCategory(nextSubCategory);
    setItemInfo(nextItemInfo);
  };

  if (!isSignedIn) {
    return (
      <Link href="/auth/sign-in?next=/browse" className="w-full sm:w-auto">
        <Button className="w-full sm:w-auto">Create A Listing</Button>
      </Link>
    );
  }

  return (
    <>
      <Button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full sm:w-auto"
      >
        Create A Listing
      </Button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-zinc-950/50 px-4 py-8 sm:py-12">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">New Listing</p>
                <h2 className="mt-1 text-xl font-semibold text-zinc-950 sm:text-2xl">Create A Listing</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                aria-label="Close listing form"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form action={createListingAction} className="space-y-5">
              <input type="hidden" name="redirectTo" value="/browse" />

              <section className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-sm font-semibold text-zinc-900">Item Info</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1 text-sm text-zinc-700">
                    <span>
                      Category
                      <RequiredMark />
                    </span>
                    <Select
                      name="category"
                      required
                      value={category}
                      onChange={(event) => handleCategoryChange(event.target.value as ListableItem)}
                    >
                      {LISTABLE_ITEMS.map((entry) => (
                        <option key={entry} value={entry}>
                          {entry}
                        </option>
                      ))}
                    </Select>
                  </label>

                  <label className="space-y-1 text-sm text-zinc-700">
                    <span>
                      {CATEGORY_SUBCATEGORY_LABEL[category]}
                      <RequiredMark />
                    </span>
                    <Select
                      name="subCategory"
                      required
                      value={subCategory}
                      onChange={(event) => setSubCategory(event.target.value)}
                    >
                      {subCategoryOptions.map((entry) => (
                        <option key={entry} value={entry}>
                          {entry}
                        </option>
                      ))}
                    </Select>
                  </label>

                  {itemInfoPresetOptions.length > 0 ? (
                    <label className="space-y-1 text-sm text-zinc-700 sm:col-span-2">
                      <span>
                        {CATEGORY_ITEM_INFO_LABEL[category]}
                        <RequiredMark />
                      </span>
                      <Select
                        name="itemInfo"
                        required
                        value={itemInfo}
                        onChange={(event) => setItemInfo(event.target.value)}
                      >
                        {itemInfoPresetOptions.map((entry) => (
                          <option key={entry} value={entry}>
                            {entry}
                          </option>
                        ))}
                      </Select>
                    </label>
                  ) : (
                    <label className="space-y-1 text-sm text-zinc-700 sm:col-span-2">
                      <span>
                        {CATEGORY_ITEM_INFO_LABEL[category]}
                        <RequiredMark />
                      </span>
                      <Input
                        name="itemInfo"
                        required
                        value={itemInfo}
                        onChange={(event) => setItemInfo(event.target.value)}
                        placeholder={category === "AC" ? "1 Ton / 1.5 Ton / 2 Ton" : "Enter item details"}
                      />
                    </label>
                  )}
                </div>
              </section>

              <section className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-sm font-semibold text-zinc-900">Pricing & Agreement</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1 text-sm text-zinc-700">
                    <span>
                      Price Per Month (INR)
                      <RequiredMark />
                    </span>
                    <Input
                      name="pricePerMonth"
                      type="number"
                      min={1}
                      step={1}
                      required
                      placeholder="Enter monthly rent"
                    />
                  </label>

                  <label className="space-y-1 text-sm text-zinc-700">
                    <span>
                      Minimum Rent Agreement (Months)
                      <RequiredMark />
                    </span>
                    <Select name="minAgreementMonths" required defaultValue="1">
                      {AGREEMENT_MONTH_OPTIONS.map((months) => (
                        <option key={months} value={months}>
                          {months} {months === 1 ? "month" : "months"}
                        </option>
                      ))}
                    </Select>
                  </label>
                </div>
              </section>

              <section className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-sm font-semibold text-zinc-900">Pictures</p>
                <label className="space-y-1 text-sm text-zinc-700">
                  <span>
                    Upload Product Images
                    <RequiredMark />
                  </span>
                  <MultiImageUploadInput required />
                </label>
                <p className="text-xs text-zinc-500">Upload up to 4 images. At least 1 image is mandatory.</p>
              </section>

              <section className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-sm font-semibold text-zinc-900">Address Details</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1 text-sm text-zinc-700">
                    <span>
                      City
                      <RequiredMark />
                    </span>
                    <Select name="city" required defaultValue="">
                      <option value="" disabled>
                        Select city
                      </option>
                      {SUPPORTED_CITIES.map((entry) => (
                        <option key={entry} value={entry}>
                          {entry}
                        </option>
                      ))}
                    </Select>
                  </label>
                  <label className="space-y-1 text-sm text-zinc-700">
                    <span>
                      Pincode
                      <RequiredMark />
                    </span>
                    <Input name="pincode" required inputMode="numeric" pattern="\d{6}" minLength={6} maxLength={6} />
                  </label>
                </div>
              </section>

              <section className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-sm font-semibold text-zinc-900">Contact Details</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1 text-sm text-zinc-700">
                    <span>
                      Mail ID
                      <RequiredMark />
                    </span>
                    <Input
                      name="contactEmail"
                      type="email"
                      required
                      defaultValue={defaultContactEmail}
                      autoComplete="email"
                    />
                  </label>
                  <label className="space-y-1 text-sm text-zinc-700">
                    Phone Number
                    <Input name="contactPhone" type="tel" inputMode="tel" placeholder="Optional" />
                  </label>
                </div>
              </section>

              <Button type="submit" className={cn("w-full", CATEGORY_DONE_BUTTON_CLASS[category])}>
                Done
              </Button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
