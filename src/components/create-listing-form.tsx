"use client";

import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { createListingAction, updateListingAction } from "@/app/actions";
import { MultiImageUploadInput } from "@/components/multi-image-upload-input";
import { Button } from "@/components/ui/button";
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

interface CreateListingFormProps {
  defaultContactEmail: string;
  redirectTo?: string;
  onCancel?: () => void;
  initialValues?: {
    id: string;
    category: ListableItem;
    subCategory: string;
    itemInfo: string;
    pricePerMonth: number;
    minAgreementMonths: number;
    city: string;
    pincode: string;
    contactEmail: string;
    contactPhone: string | null;
  };
}

export function CreateListingForm({
  defaultContactEmail,
  redirectTo = "/my-account",
  onCancel,
  initialValues,
}: CreateListingFormProps) {
  const initialCategory: ListableItem = "AC";
  const editMode = Boolean(initialValues);
  const resolvedInitialCategory = initialValues?.category ?? initialCategory;
  const initialSubCategory =
    initialValues?.subCategory ??
    CATEGORY_SUBCATEGORY_OPTIONS[resolvedInitialCategory][0] ??
    "General";
  const initialItemInfo =
    initialValues?.itemInfo ??
    (CATEGORY_ITEM_INFO_PRESET_OPTIONS[resolvedInitialCategory] ?? [])[0] ??
    "";

  const [category, setCategory] = useState<ListableItem>(resolvedInitialCategory);
  const [subCategory, setSubCategory] = useState(initialSubCategory);
  const [itemInfo, setItemInfo] = useState(initialItemInfo);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subCategoryOptions = CATEGORY_SUBCATEGORY_OPTIONS[category];
  const itemInfoPresetOptions = CATEGORY_ITEM_INFO_PRESET_OPTIONS[category] ?? [];
  const formAction = editMode ? updateListingAction : createListingAction;
  const submitLabel = editMode ? "Save" : "Done";
  const submitProgressLabel = editMode ? "Please wait, updating listing..." : "Please wait, creating listing...";

  const handleCategoryChange = (nextCategory: ListableItem) => {
    setCategory(nextCategory);
    const nextSubCategory = CATEGORY_SUBCATEGORY_OPTIONS[nextCategory][0] ?? "General";
    const nextItemInfo = (CATEGORY_ITEM_INFO_PRESET_OPTIONS[nextCategory] ?? [])[0] ?? "";
    setSubCategory(nextSubCategory);
    setItemInfo(nextItemInfo);
  };

  return (
    <form
      action={formAction}
      onSubmit={() => setIsSubmitting(true)}
      className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6"
    >
      <input type="hidden" name="redirectTo" value={redirectTo} />
      {editMode ? <input type="hidden" name="listingId" value={initialValues?.id} /> : null}

      <fieldset disabled={isSubmitting} className="space-y-5">
        <section className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-sm font-semibold text-zinc-900">Item Info</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm text-zinc-700">
              <span>
                Category
                <RequiredMark />
              </span>
              <Select name="category" required value={category} onChange={(event) => handleCategoryChange(event.target.value as ListableItem)}>
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
              <Select name="subCategory" required value={subCategory} onChange={(event) => setSubCategory(event.target.value)}>
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
                <Select name="itemInfo" required value={itemInfo} onChange={(event) => setItemInfo(event.target.value)}>
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
                defaultValue={initialValues?.pricePerMonth ?? ""}
                placeholder="Enter monthly rent"
              />
            </label>

            <label className="space-y-1 text-sm text-zinc-700">
              <span>
                Minimum Rent Agreement (Months)
                <RequiredMark />
              </span>
              <Select name="minAgreementMonths" required defaultValue={String(initialValues?.minAgreementMonths ?? 1)}>
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
              {editMode ? null : <RequiredMark />}
            </span>
            <MultiImageUploadInput required={!editMode} />
          </label>
          <p className="text-xs text-zinc-500">
            {editMode
              ? "Upload up to 4 images only if you want to replace existing photos."
              : "Upload up to 4 images. At least 1 image is mandatory."}
          </p>
        </section>

        <section className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-sm font-semibold text-zinc-900">Address Details</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm text-zinc-700">
              <span>
                City
                <RequiredMark />
              </span>
              <Select name="city" required defaultValue={initialValues?.city ?? ""}>
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
              <Input
                name="pincode"
                required
                inputMode="numeric"
                pattern="\d{6}"
                minLength={6}
                maxLength={6}
                defaultValue={initialValues?.pincode ?? ""}
              />
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
                defaultValue={initialValues?.contactEmail ?? defaultContactEmail}
                autoComplete="email"
              />
            </label>
            <label className="space-y-1 text-sm text-zinc-700">
              Phone Number
              <Input
                name="contactPhone"
                type="tel"
                inputMode="tel"
                placeholder="Optional"
                defaultValue={initialValues?.contactPhone ?? ""}
              />
            </label>
          </div>
        </section>

        {onCancel ? (
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
            <Button type="submit" className={cn("w-full sm:w-auto", CATEGORY_DONE_BUTTON_CLASS[category])}>
              {submitLabel}
            </Button>
            <Button type="button" variant="secondary" onClick={onCancel} className="w-full sm:w-auto">
              Cancel
            </Button>
          </div>
        ) : (
          <Button type="submit" className={cn("w-full", CATEGORY_DONE_BUTTON_CLASS[category])}>
            {submitLabel}
          </Button>
        )}
      </fieldset>

      {isSubmitting ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-zinc-950/55 px-4">
          <div className="inline-flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-2xl">
            <LoaderCircle className="h-5 w-5 animate-spin text-zinc-700" />
            <p className="text-sm font-medium text-zinc-900">{submitProgressLabel}</p>
          </div>
        </div>
      ) : null}
    </form>
  );
}
