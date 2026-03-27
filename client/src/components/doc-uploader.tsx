import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
    FileUp,
    FileText,
    CheckCircle2,
    AlertCircle,
    X,
    Loader2,
    Eye,
    RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DocumentStatusBadge } from "./status-badge";

interface DocUploaderProps {
    label: string;
    description?: string;
    required?: boolean;
    status?: string;
    rejectionReason?: string;
    onUpload: (file: File) => Promise<void>;
    fileUrl?: string;
    fileName?: string;
    onRemove?: () => void;
    className?: string;
}

export function DocUploader({
    label,
    description,
    required = true,
    status,
    rejectionReason,
    onUpload,
    fileUrl,
    fileName,
    onRemove,
    className,
}: DocUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setUploading(true);
            setUploadError(null);
            setProgress(10);
            try {
                const interval = setInterval(() => {
                    setProgress((prev) => (prev >= 90 ? 90 : prev + 10));
                }, 150);

                await onUpload(acceptedFiles[0]);

                clearInterval(interval);
                setProgress(100);
            } catch (error: any) {
                console.error("Upload failed:", error);
                setUploadError(error?.message || "Erreur lors de l'envoi du fichier.");
            } finally {
                setTimeout(() => setUploading(false), 500);
            }
        }
    }, [onUpload]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false,
        disabled: !!fileUrl || uploading,
    });

    return (
        <div className={cn("space-y-3", className)}>
            <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                    <label className="text-sm font-semibold flex items-center gap-1.5">
                        {label}
                        {required && <span className="text-rose-500">*</span>}
                        {status && <DocumentStatusBadge status={status} />}
                    </label>
                    {description && (
                        <p className="text-xs text-slate-500">{description}</p>
                    )}
                </div>
            </div>

            {!fileUrl && !uploading && (
                <div
                    {...getRootProps()}
                    className={cn(
                        "border-2 border-dashed rounded-xl p-8 transition-all duration-200 cursor-pointer text-center",
                        isDragActive
                            ? "border-primary bg-primary/5 scale-[1.01]"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    )}
                >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                            <FileUp className="h-5 w-5" />
                        </div>
                        <div className="text-sm">
                            <span className="text-primary font-semibold">Cliquez pour télécharger</span>
                            <span className="text-slate-500"> ou glissez-déposez</span>
                        </div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                            PDF, JPG, PNG (Max 5Mo)
                        </p>
                    </div>
                </div>
            )}

            {uploading && (
                <div className="border border-slate-100 rounded-xl p-4 bg-slate-50 space-y-3">
                    <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <div className="flex-1 space-y-1">
                            <div className="text-xs font-semibold">Téléchargement en cours...</div>
                            <Progress value={progress} className="h-1.5" />
                        </div>
                    </div>
                </div>
            )}

            {fileUrl && !uploading && (
                <div
                    className={cn(
                        "border rounded-xl p-4 flex items-center gap-4 transition-all",
                        status === "rejected" ? "border-rose-200 bg-rose-50/30" : "border-slate-100 bg-white"
                    )}
                >
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <FileText className="h-6 w-6" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate">
                            {fileName || "document_telecharge.pdf"}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <a
                                href={fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] font-medium text-primary hover:underline flex items-center gap-1"
                            >
                                <Eye className="h-3 w-3" /> Voir
                            </a>
                            {onRemove && (status === "draft" || status === "rejected" || status === "submitted") && (
                                <button
                                    onClick={onRemove}
                                    className="text-[11px] font-medium text-rose-500 hover:underline flex items-center gap-1"
                                >
                                    <RotateCcw className="h-3 w-3" /> Remplacer
                                </button>
                            )}
                        </div>
                    </div>

                    {status === "approved" && (
                        <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                    )}
                </div>
            )}

            {uploadError && (
                <div className="flex gap-2 p-3 rounded-lg bg-rose-50 text-rose-700 border border-rose-100">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <div className="text-xs font-medium">{uploadError}</div>
                </div>
            )}

            {status === "rejected" && rejectionReason && (
                <div className="flex gap-2 p-3 rounded-lg bg-rose-50 text-rose-700 border border-rose-100">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <div className="text-xs">
                        <span className="font-bold">Motif du rejet : </span>
                        {rejectionReason}
                    </div>
                </div>
            )}
        </div>
    );
}
