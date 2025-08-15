import { useRef, useState } from "react";

type Props = { onFile: (file: File) => void; disabled?: boolean };

export default function Dropzone({ onFile, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [drag, setDrag] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files || !files[0]) return;
    onFile(files[0]);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
      className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition
        ${drag ? "border-blue-500 bg-blue-50" : "border-gray-300"} ${disabled ? "opacity-60 pointer-events-none":""}`}
      onClick={() => inputRef.current?.click()}
      role="button"
      aria-label="Upload CSV or Excel"
    >
      <input
        ref={inputRef}
        className="hidden"
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={disabled}
      />
      <div className="text-lg font-medium">Drop CSV/XLSX here or click to upload</div>
      <div className="text-sm text-gray-600 mt-1">We’ll analyze up to 200 rows for the preview.</div>
    </div>
  );
}
