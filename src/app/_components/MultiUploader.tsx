"use client";

import { useDropzone } from "@uploadthing/react";
import { useCallback, useState } from "react";
import {
  generateClientDropzoneAccept,
  generatePermittedFileTypes,
} from "uploadthing/client";

import { useUploadThing } from "~/server/utils/uploadthing";

export function MultiUploader() {
  const [files, setFiles] = useState<File[]>([]);
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
  }, []);

  const { startUpload, routeConfig } = useUploadThing("imageUploader", {
    onClientUploadComplete: () => {
      alert("uploaded successfully!");
    },
    onUploadError: () => {
      alert("error occurred while uploading");
    },
    onUploadBegin: (payload: any) => {
      console.log("upload has begun for", payload);
    },
  });

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: generateClientDropzoneAccept(
      generatePermittedFileTypes(routeConfig).fileTypes,
    ),
  });

  return (
    <div className="bg-gray-700" {...getRootProps()}>
      <input className="bg-red-400" {...getInputProps()} />
      <div>
        {files.length > 0 && (
          <button className="bg-lime-500" onClick={() => startUpload(files)}>
            Upload {files.length} files
          </button>
        )}
      </div>
      Drop files here!
    </div>
  );
}
