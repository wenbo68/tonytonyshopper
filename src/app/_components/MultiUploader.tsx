"use client";

import { useDropzone } from "@uploadthing/react";
import { useCallback, useState } from "react";
import {
  generateClientDropzoneAccept,
  generatePermittedFileTypes,
} from "uploadthing/client";

import { useUploadThing } from "~/server/utils/uploadthing";
import type { UploadThingRoute } from "~/type";

interface MultiUploaderProps {
  uploadThingRoute: UploadThingRoute;
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
        className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded border border-gray-800 bg-gray-900 p-4 text-center transition-colors hover:bg-gray-900/50"
      >
        <input {...getInputProps()} />
        <p className="">{label || "+"}</p>
      </div>

      {files.length > 0 && (
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
          className="cursor-pointer rounded bg-indigo-600 px-3 py-2 text-xs font-semibold text-gray-300 hover:bg-indigo-700 disabled:cursor-default disabled:bg-gray-600"
        >
          {isUploading ? "Uploading" : `Upload ${files.length}`}
        </button>
      )}
    </div>
  );
}
