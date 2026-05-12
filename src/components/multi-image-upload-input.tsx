"use client";

import { X } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import { Input } from "@/components/ui/input";

interface MultiImageUploadInputProps {
  name?: string;
  required?: boolean;
  maxFiles?: number;
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

export function MultiImageUploadInput({ name = "images", required = false, maxFiles = 4 }: MultiImageUploadInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [limitMessage, setLimitMessage] = useState("");

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

  const handleFileSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const incomingFiles = Array.from(event.currentTarget.files ?? []);
    if (incomingFiles.length === 0) {
      return;
    }

    if (!CAN_MUTATE_FILE_INPUT_LIST) {
      const cappedFiles = incomingFiles.slice(0, maxFiles);
      const capped = incomingFiles.length > maxFiles;
      setSelectedFiles(cappedFiles);
      setLimitMessage(capped ? `You can upload up to ${maxFiles} images only.` : "");
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

      if (merged.length >= maxFiles) {
        capped = true;
        break;
      }

      merged.push(file);
      existingSignatures.add(signature);
    }

    setSelectedFiles(merged);
    setLimitMessage(capped ? `You can upload up to ${maxFiles} images only.` : "");
    const didSyncFiles = syncInputFiles(merged);
    if (didSyncFiles) {
      event.currentTarget.value = "";
    }
  };

  const removeFile = (index: number) => {
    if (!CAN_MUTATE_FILE_INPUT_LIST) {
      setLimitMessage("Reselect your images to change this list on your device.");
      return;
    }

    const nextFiles = selectedFiles.filter((_, currentIndex) => currentIndex !== index);
    setSelectedFiles(nextFiles);
    setLimitMessage("");
    syncInputFiles(nextFiles);
  };

  return (
    <div className="space-y-2">
      <Input
        ref={inputRef}
        name={name}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        multiple
        required={required && selectedFiles.length === 0}
        onChange={handleFileSelection}
      />

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
    </div>
  );
}
