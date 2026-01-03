"use client";

import { useDropzone } from "@uploadthing/react";
import { useCallback, useState } from "react";
import {
  generateClientDropzoneAccept,
  generatePermittedFileTypes,
} from "uploadthing/client";

import { useUploadThing } from "~/server/utils/uploadthing";

interface MultiUploaderProps {
  uploadThingRoute: "variantImageUploader" | "variantVideoUploader";
  onUploadSuccess: (files: { key: string; url: string }[]) => void;
  availability: number;
  label?: string;
  className?: string;
}

export function MultiUploader({
  uploadThingRoute,
  onUploadSuccess,
  availability,
  label,
  className,
}: MultiUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
  }, []);

  const { startUpload, routeConfig, isUploading } = useUploadThing(
    uploadThingRoute,
    {
      onClientUploadComplete: (res) => {
        if (res) {
          onUploadSuccess(res.map((f) => ({ key: f.key, url: f.ufsUrl })));
          setFiles([]); // Clear files after successful upload
        }
      },
      onUploadError: (e) => {
        alert(`Error uploading: ${e.message}`);
      },
    },
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: generateClientDropzoneAccept(
      generatePermittedFileTypes(routeConfig).fileTypes,
    ),
  });

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div
        {...getRootProps()}
        className="flex cursor-pointer flex-col items-center justify-center rounded border border-dashed border-gray-600 bg-gray-800/50 p-4 text-center transition-colors hover:bg-gray-800"
      >
        <input {...getInputProps()} />
        <p className="text-xs text-gray-400">
          {label || "Drop file here or click"}
        </p>
      </div>

      {files.length > 0 && (
        <div className="flex items-center justify-between gap-2 rounded bg-gray-800 p-2">
          <span className="truncate text-xs text-gray-300">
            {files.length} file(s) selected
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              if (files.length > availability) {
                alert(`Too many files. You can only add ${availability} more.`);
                return;
              }
              startUpload(files);
            }}
            disabled={isUploading}
            className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-500 disabled:bg-gray-600"
          >
            {isUploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      )}
    </div>
  );
}
