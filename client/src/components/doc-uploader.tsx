import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { AlertCircle, Camera, Eye, FileText, Loader2, RefreshCw, Upload } from "lucide-react";
import { DocumentStatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";

const MIME: Record<string, string[]> = {
  pdf: ["application/pdf"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  png: ["image/png"],
  webp: ["image/webp"],
};
const SERVER_MAX_MB = 10;

type Props = {
  label: string;
  description?: string;
  required?: boolean;
  acceptedFormats?: string[];
  maxSizeMb?: number;
  status?: string;
  rejectionReason?: string | null;
  fileUrl?: string;
  fileName?: string;
  mimeType?: string;
  disabled?: boolean;
  onUpload: (file: File) => Promise<void>;
};

export function DocUploader({
  label,
  description,
  required = true,
  acceptedFormats = ["pdf", "jpg", "png"],
  maxSizeMb = 5,
  status,
  rejectionReason,
  fileUrl,
  fileName,
  mimeType,
  disabled,
  onUpload,
}: Props) {
  const id = useId();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const maxMb = Math.min(maxSizeMb, SERVER_MAX_MB);
  const formats = acceptedFormats.map((f) => f.toLowerCase());
  const accept = Object.fromEntries(
    formats.flatMap((f) => (MIME[f] ?? []).map((m) => [m, [`.${f}`]])),
  ) as Record<string, string[]>;
  const needsReplacement = status === "rejected" || status === "replacement_requested";

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const onDrop = useCallback(
    async (files: File[], rejections: FileRejection[]) => {
      setError(null);
      if (rejections.length) {
        const code = rejections[0].errors[0]?.code;
        setError(
          code === "file-too-large"
            ? `Ce fichier dépasse ${maxMb} Mo. Réduisez sa taille ou photographiez le document de nouveau.`
            : `Format non accepté. Formats possibles : ${formats.map((f) => f.toUpperCase()).join(", ")}.`,
        );
        return;
      }
      const file = files[0];
      if (!file) return;
      setUploading(true);
      try {
        await onUpload(file);
        setPreview(file.type.startsWith("image/") ? URL.createObjectURL(file) : null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "L'envoi a échoué. Réessayez.");
      } finally {
        setUploading(false);
      }
    },
    [onUpload, maxMb, formats],
  );

  // Photo taken with the phone camera: same checks as the file picker.
  const cameraRef = useRef<HTMLInputElement>(null);
  const acceptsImages = formats.some((f) => ["jpg", "jpeg", "png", "webp"].includes(f));
  const onCamera = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const allowedTypes = Object.keys(accept);
    if (!allowedTypes.includes(file.type)) {
      setError(`Format non accepté. Formats possibles : ${formats.map((f) => f.toUpperCase()).join(", ")}.`);
      return;
    }
    if (file.size > maxMb * 1024 * 1024) {
      setError(`Cette photo dépasse ${maxMb} Mo. Reprenez-la avec une résolution plus faible.`);
      return;
    }
    onDrop([file], []);
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    multiple: false,
    accept,
    maxSize: maxMb * 1024 * 1024,
    disabled: disabled || uploading,
    noClick: !!fileUrl,
    // The visible button is the keyboard entry point; the drop zone itself is not a tab stop.
    noKeyboard: true,
  });

  const isImage = (mimeType ?? "").startsWith("image/");
  const thumb = preview ?? (isImage && fileUrl ? fileUrl : null);

  return (
    <div className={cn("rounded-2xl border p-4 sm:p-5", needsReplacement ? "border-[var(--st-warning)]/50 bg-[var(--st-warning-bg)]/40" : "border-brand-line bg-white")}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p id={`${id}-label`} className="font-semibold text-brand-ink">
            {label}
            <span className="ml-2 text-sm font-normal text-brand-ink-2">{required ? "Obligatoire" : "Facultative"}</span>
          </p>
          {description && <p className="text-[0.9375rem] text-brand-ink-2">{description}</p>}
          <p id={`${id}-rules`} className="mt-1 text-sm text-brand-ink-2">
            {formats.map((f) => f.toUpperCase()).join(", ")} · {maxMb} Mo maximum
          </p>
        </div>
        {status && <DocumentStatusBadge status={status} />}
      </div>

      {needsReplacement && rejectionReason && (
        <p className="mt-3 flex gap-2 rounded-xl bg-white p-3 text-[0.9375rem] text-brand-ink">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--st-warning)]" aria-hidden="true" />
          <span>
            <span className="font-semibold">Motif : </span>
            {rejectionReason}
          </span>
        </p>
      )}

      <div {...getRootProps()} className="mt-4" aria-labelledby={`${id}-label`} aria-describedby={`${id}-rules`}>
        <input {...getInputProps()} />
        {uploading ? (
          <div className="flex min-h-[72px] items-center gap-3 rounded-xl bg-brand-mist px-4" role="status">
            <Loader2 className="h-5 w-5 animate-spin text-brand-royal" aria-hidden="true" />
            <span className="font-semibold text-brand-ink">Envoi en cours…</span>
          </div>
        ) : fileUrl ? (
          <div className="flex flex-wrap items-center gap-4 rounded-xl bg-brand-mist p-3">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
              {thumb ? <img src={thumb} alt="" className="h-full w-full object-cover" /> : <FileText className="h-7 w-7 text-brand-royal" aria-hidden="true" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="break-all font-semibold text-brand-ink sm:truncate sm:break-normal">{fileName ?? "Document envoyé"}</p>
              <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold text-brand-royal underline-offset-4 hover:underline">
                <Eye className="h-4 w-4" aria-hidden="true" /> Ouvrir <span className="sr-only">{label} (nouvel onglet)</span>
              </a>
            </div>
            {!disabled && (
              <button
                type="button"
                onClick={open}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[hsl(var(--input))] bg-white px-4 text-sm font-semibold text-brand-ink hover:border-brand-ink sm:w-auto"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" /> Remplacer le fichier
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "flex min-h-[88px] w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-4 py-4 text-center transition-colors duration-150",
              isDragActive ? "border-brand-royal bg-brand-sky" : "border-[#b9c3d6] hover:border-brand-royal hover:bg-brand-mist",
            )}
          >
            <Upload className="h-6 w-6 text-brand-royal" aria-hidden="true" />
            <span className="font-semibold text-brand-ink">Choisir un fichier</span>
            <span className="hidden text-sm text-brand-ink-2 sm:block">ou glissez-le ici</span>
          </button>
        )}
      </div>

      {!uploading && !disabled && acceptsImages && (
        <>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={onCamera} />
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className="mt-2 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[hsl(var(--input))] bg-white px-4 font-semibold text-brand-ink active:bg-brand-mist sm:hidden"
          >
            <Camera className="h-5 w-5" aria-hidden="true" /> {fileUrl ? "Reprendre en photo" : "Prendre une photo"}
          </button>
        </>
      )}

      {error && (
        <p role="alert" className="mt-3 flex items-start gap-2 text-[0.9375rem] font-semibold text-[var(--st-danger)]">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" /> {error}
        </p>
      )}
    </div>
  );
}
