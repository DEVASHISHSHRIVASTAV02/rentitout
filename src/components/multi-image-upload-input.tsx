"use client";

import { X } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import { createPortal } from "react-dom";

interface MultiImageUploadInputProps {
  name?: string;
  required?: boolean;
  maxFiles?: number;
  onSelectionChange?: (files: File[]) => void;
}

function getFileSignature(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function canMutateFileInputList() {
  if (typeof DataTransfer === "undefined") {
    return false;
  }

  try {
    const dataTransfer = new DataTransfer();
    return typeof dataTransfer.items.add === "function";
  } catch {
    return false;
  }
}

const CAN_MUTATE_FILE_INPUT_LIST = canMutateFileInputList();
const AT_LIMIT_MESSAGE = "Max images are already uploaded delete 1 to upload new";

export function MultiImageUploadInput({
  name = "images",
  required = false,
  maxFiles = 4,
  onSelectionChange,
}: MultiImageUploadInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [limitMessage, setLimitMessage] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const resolvedMaxFiles = Math.max(0, maxFiles);
  const isAtUploadLimit = resolvedMaxFiles <= 0 || selectedFiles.length >= resolvedMaxFiles;
  const isBrowser = typeof document !== "undefined";

  const syncInputFiles = (files: File[]) => {
    if (!inputRef.current || !CAN_MUTATE_FILE_INPUT_LIST) {
      return false;
    }

    try {
      const dataTransfer = new DataTransfer();
      for (const file of files) {
        dataTransfer.items.add(file);
      }
      inputRef.current.files = dataTransfer.files;
      return true;
    } catch {
      return false;
    }
  };

  const commitFiles = (files: File[], capped = false) => {
    setSelectedFiles(files);
    setLimitMessage(capped ? `You can upload up to ${resolvedMaxFiles} images only.` : "");
    onSelectionChange?.(files);
    syncInputFiles(files);
  };

  const openFilePicker = () => {
    if (isAtUploadLimit) {
      setPopupMessage(AT_LIMIT_MESSAGE);
      return;
    }
    inputRef.current?.click();
  };

  const handleFileSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const incomingFiles = Array.from(event.currentTarget.files ?? []);
    if (incomingFiles.length === 0) {
      return;
    }

    if (resolvedMaxFiles <= 0) {
      event.currentTarget.value = "";
      setPopupMessage(AT_LIMIT_MESSAGE);
      return;
    }

    if (!CAN_MUTATE_FILE_INPUT_LIST) {
      const cappedFiles = incomingFiles.slice(0, resolvedMaxFiles);
      const capped = incomingFiles.length > resolvedMaxFiles;
      commitFiles(cappedFiles, capped);
      if (capped) {
        setPopupMessage(AT_LIMIT_MESSAGE);
      }
      return;
    }

    const existingSignatures = new Set(selectedFiles.map(getFileSignature));
    const merged = [...selectedFiles];
    let capped = false;

    for (const file of incomingFiles) {
      const signature = getFileSignature(file);
      if (existingSignatures.has(signature)) {
        continue;
      }

      if (merged.length >= resolvedMaxFiles) {
        capped = true;
        break;
      }

      merged.push(file);
      existingSignatures.add(signature);
    }

    commitFiles(merged, capped);
    if (capped) {
      setPopupMessage(AT_LIMIT_MESSAGE);
    }
  };

  const removeFile = (index: number) => {
    if (!CAN_MUTATE_FILE_INPUT_LIST) {
      setLimitMessage("Reselect your images to change this list on your device.");
      return;
    }

    const nextFiles = selectedFiles.filter((_, currentIndex) => currentIndex !== index);
    commitFiles(nextFiles);
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        name={name}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.avif,.heic,.heif,image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif"
        multiple
        required={required && selectedFiles.length === 0}
        onChange={handleFileSelection}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />

      <button
        type="button"
        onClick={openFilePicker}
        className="flex w-full items-center rounded-xl border border-zinc-300 bg-white px-3 py-2 text-left text-sm text-zinc-900 outline-none transition hover:border-zinc-400 focus:border-zinc-500"
      >
        click to upload
      </button>

      {selectedFiles.length > 0 ? (
        <div className="text-xs text-zinc-600">
          <span className="font-medium text-zinc-700">Selected:</span>{" "}
          {selectedFiles.map((file, index) => (
            <span key={getFileSignature(file)} className="inline-flex items-center">
              <span>{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-zinc-300 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                aria-label={`Remove ${file.name}`}
              >
                <X className="h-3 w-3" />
              </button>
              {index < selectedFiles.length - 1 ? <span className="mx-1">,</span> : null}
            </span>
          ))}
        </div>
      ) : null}

      {!CAN_MUTATE_FILE_INPUT_LIST ? (
        <p className="text-xs text-zinc-500">On this device, select all images in a single pick.</p>
      ) : null}

      {limitMessage ? <p className="text-xs text-rose-700">{limitMessage}</p> : null}

      {isBrowser && popupMessage
        ? createPortal(
            <div className="fixed inset-0 z-[80] flex items-center justify-center bg-zinc-950/60 px-4">
              <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="image-limit-popup-title"
                aria-describedby="image-limit-popup-message"
                className="w-full max-w-lg rounded-2xl border border-zinc-300 bg-white p-6 shadow-2xl"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 id="image-limit-popup-title" className="text-xl font-semibold text-rose-700">
                    Error
                  </h2>
                  <button
                    type="button"
                    onClick={() => setPopupMessage("")}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-300 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                    aria-label="Close error"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <p id="image-limit-popup-message" className="mt-3 text-sm text-rose-700 sm:text-base">
                  {popupMessage}
                </p>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
