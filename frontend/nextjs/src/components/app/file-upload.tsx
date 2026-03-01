"use client";

import { useCallback, useState, useRef } from "react";
import { Upload, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  multiple?: boolean;
  accept?: string;
  maxFiles?: number;
  className?: string;
}

export function FileUpload({
  onFilesSelected,
  multiple = false,
  accept = ".pdf,.docx,.doc,.txt",
  maxFiles = 50,
  className,
}: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (incoming: FileList | null) => {
      if (!incoming) return;
      const arr = Array.from(incoming).slice(0, multiple ? maxFiles : 1);
      setFiles(arr);
      onFilesSelected(arr);
    },
    [multiple, maxFiles, onFilesSelected]
  );

  const removeFile = (idx: number) => {
    const next = files.filter((_, i) => i !== idx);
    setFiles(next);
    onFilesSelected(next);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div
        className={cn(
          "relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 transition-all duration-300 cursor-pointer",
          dragOver
            ? "border-[#FCC200] bg-[#FCC200]/5 shadow-[0_0_30px_-10px_rgba(252,194,0,0.2)]"
            : "border-white/[0.12] bg-black/30 hover:border-[#FCC200]/30 hover:bg-black/40"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#FCC200]/10 border border-[#FCC200]/30">
          <Upload className="h-6 w-6 text-[#FCC200]" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-white">
            Drop {multiple ? "files" : "a file"} here or{" "}
            <span className="text-[#FCC200]">browse</span>
          </p>
          <p className="mt-1 text-xs text-[#CBD5E1]">
            PDF, DOCX, or TXT • Max 10MB{multiple ? ` • Up to ${maxFiles} files` : ""}
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f, i) => (
            <div
              key={`${f.name}-${i}`}
              className="flex items-center gap-3 rounded-xl bg-black/50 border border-white/[0.08] px-4 py-2.5 shadow-sm"
            >
              <FileText className="h-4 w-4 text-[#FCC200] shrink-0" />
              <span className="flex-1 truncate font-mono text-xs text-white">
                {f.name}
              </span>
              <span className="text-xs text-[#94A3B8]">
                {(f.size / 1024).toFixed(1)} KB
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(i);
                }}
                className="ml-1 p-1 rounded-md hover:bg-white/10 transition-colors"
              >
                <X className="h-3.5 w-3.5 text-[#94A3B8]" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
