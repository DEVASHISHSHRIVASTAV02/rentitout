"use client";

import Image from "next/image";
import { LoaderCircle, X } from "lucide-react";
import { useMemo, useState } from "react";
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
const MAX_LISTING_IMAGES = 4;

function normalizeListingImageSrc(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  if (trimmed.startsWith("/api/uploads/")) {
    return trimmed;
  }
  if (trimmed.startsWith("/uploads/")) {
    return `/api${trimmed}`;
  }
  return trimmed;
}

interface CreateListingFormProps {
  defaultContactEmail: string;
  redirectTo?: string;
  onCancel?: () => void;
  initialValues?: {
    id: string;
    listingPublicId?: string;
    category: ListableItem;
    subCategory: string;
    itemInfo: string;
    pricePerMonth: number;
    minAgreementMonths: number;
    city: string;
    pincode: string;
    contactEmail: string;
    contactPhone: string | null;
    imageUrls?: string[];
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
  const initialImageUrls = initialValues?.imageUrls ?? [];

  const [category, setCategory] = useState<ListableItem>(resolvedInitialCategory);
  const [subCategory, setSubCategory] = useState(initialSubCategory);
  const [itemInfo, setItemInfo] = useState(initialItemInfo);
  const [keptImageUrls, setKeptImageUrls] = useState<string[]>(initialImageUrls);
  const [newImageCount, setNewImageCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subCategoryOptions = CATEGORY_SUBCATEGORY_OPTIONS[category];
  const itemInfoPresetOptions = CATEGORY_ITEM_INFO_PRESET_OPTIONS[category] ?? [];
  const formAction = editMode ? updateListingAction : createListingAction;
  const submitLabel = editMode ? "Save" : "Done";
  const submitProgressLabel = editMode ? "Please wait, updating listing..." : "Please wait, creating listing...";
  const remainingUploadSlots = Math.max(0, MAX_LISTING_IMAGES - keptImageUrls.length);
  const removedImageUrls = useMemo(
    () => initialImageUrls.filter((url) => !keptImageUrls.includes(url)),
    [initialImageUrls, keptImageUrls],
  );
  const totalVisibleImages = keptImageUrls.length + newImageCount;
  const canRemoveExistingImage = totalVisibleImages > 1;

  const handleCategoryChange = (nextCategory: ListableItem) => {
    setCategory(nextCategory);
    const nextSubCategory = CATEGORY_SUBCATEGORY_OPTIONS[nextCategory][0] ?? "General";
    const nextItemInfo = (CATEGORY_ITEM_INFO_PRESET_OPTIONS[nextCategory] ?? [])[0] ?? "";
    setSubCategory(nextSubCategory);
    setItemInfo(nextItemInfo);
  };

  const markExistingImageForRemoval = (imageUrl: string) => {
    if (!canRemoveExistingImage) {
      return;
    }
    setKeptImageUrls((current) => current.filter((entry) => entry !== imageUrl));
  };

  return (
    <form
      action={formAction}
      onSubmit={() => setIsSubmitting(true)}
      className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 sm:space-y-5 sm:p-6"
    >
      <input type="hidden" name="redirectTo" value={redirectTo} />
      {editMode ? <input type="hidden" name="listingId" value={initialValues?.id} /> : null}
      {removedImageUrls.map((imageUrl) => (
        <input key={imageUrl} type="hidden" name="removeImageUrl" value={imageUrl} />
      ))}

      <fieldset disabled={isSubmitting} className="space-y-5">
        <section className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 sm:p-4">
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

        <section className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 sm:p-4">
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

        <section className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 sm:p-4">
          <p className="text-sm font-semibold text-zinc-900">Pictures</p>

          {editMode ? (
            <div className="space-y-2">
              <p className="text-sm text-zinc-700">Current photos</p>
              {keptImageUrls.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {keptImageUrls.map((imageUrl, index) => {
                    const src = normalizeListingImageSrc(imageUrl);
                    return (
                      <div key={imageUrl} className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white">
                        <div className="relative aspect-square">
                          {src ? (
                            <Image
                              src={src}
                              alt={`Listing photo ${index + 1}`}
                              fill
                              className="object-cover"
                              sizes="120px"
                              quality={55}
                            />
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => markExistingImageForRemoval(imageUrl)}
                          disabled={!canRemoveExistingImage}
                          className="absolute right-1.5 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full border border-zinc-200 bg-white/95 text-zinc-700 shadow-sm hover:bg-zinc-100 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={`Remove photo ${index + 1}`}
                          title={
                            canRemoveExistingImage
                              ? "Remove photo (applies when you click Save)"
                              : "At least 1 photo is required"
                          }
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-zinc-500">No current photos kept. Upload at least 1 photo before saving.</p>
              )}
              {removedImageUrls.length > 0 ? (
                <p className="text-xs text-amber-700">
                  {removedImageUrls.length} photo{removedImageUrls.length === 1 ? "" : "s"} marked for removal. Changes
                  apply only when you click Save.
                </p>
              ) : null}
            </div>
          ) : null}

          <label className="space-y-1 text-sm text-zinc-700">
            <span>
              {editMode ? "Add More Photos" : "Upload Product Images"}
              {editMode ? null : <RequiredMark />}
            </span>
            <MultiImageUploadInput
              required={!editMode || keptImageUrls.length === 0}
              maxFiles={editMode ? remainingUploadSlots : MAX_LISTING_IMAGES}
              onSelectionChange={(files) => setNewImageCount(files.length)}
            />
          </label>
          <p className="!mt-2.5 text-xs text-zinc-500">
            Add at least 1 image to continue.
            <br />
            You can upload up to 4 images. You can also remove or replace images at any time.
          </p>
        </section>

        <section className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 sm:p-4">
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

        <section className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 sm:p-4">
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
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <Button type="button" variant="secondary" onClick={onCancel} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" className={cn("w-full sm:w-auto", CATEGORY_DONE_BUTTON_CLASS[category])}>
              {submitLabel}
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
          <div className="inline-flex max-w-md items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-2xl">
            <LoaderCircle className="h-5 w-5 animate-spin text-zinc-700" />
            <p className="text-sm font-medium text-zinc-900">{submitProgressLabel}</p>
          </div>
        </div>
      ) : null}
    </form>
  );
}
