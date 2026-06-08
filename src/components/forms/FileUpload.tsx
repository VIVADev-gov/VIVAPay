"use client";

import React, { useRef, useState } from "react";
import { Upload, X, FileText } from "lucide-react";

interface FileUploadBaseProps {
    id: string;
    name: string;
    label: string;
    accept?: string;
    required?: boolean;
    helperText?: string;
    error?: string;
    disabled?: boolean;
    maxSizeMB?: number;
    currentFileName?: string;
}

export interface FileUploadSingleProps extends FileUploadBaseProps {
    multiple?: false;
    onChange: (file: File | null) => void;
}

export interface FileUploadMultipleProps extends FileUploadBaseProps {
    multiple: true;
    onFilesChange: (files: File[]) => void;
}

export type FileUploadProps = FileUploadSingleProps | FileUploadMultipleProps;

export default function FileUpload(props: FileUploadProps) {
    const {
        id,
        name,
        label,
        accept = ".pdf,application/pdf",
        required = false,
        helperText,
        error,
        disabled = false,
        maxSizeMB = 10,
        currentFileName,
    } = props;

    const isMultiple = props.multiple === true;

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [dragActive, setDragActive] = useState(false);
    const [internalError, setInternalError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const displayError = error ?? internalError ?? undefined;

    const validateFile = (file: File): string | null => {
        if (accept.includes("pdf") && file.type !== "application/pdf") {
            return "El archivo debe ser un PDF";
        }
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            return `El archivo no debe superar ${maxSizeMB}MB`;
        }
        return null;
    };

    const emitSingle = (file: File | null) => {
        if (!isMultiple) {
            (props as FileUploadSingleProps).onChange(file);
        }
    };

    const emitMultiple = (files: File[]) => {
        if (isMultiple) {
            (props as FileUploadMultipleProps).onFilesChange(files);
        }
    };

    const handleSingleFile = (file: File | null) => {
        setInternalError(null);
        if (!file) {
            setSelectedFile(null);
            emitSingle(null);
            return;
        }
        const validationError = validateFile(file);
        if (validationError) {
            setSelectedFile(null);
            setInternalError(validationError);
            emitSingle(null);
            return;
        }
        setSelectedFile(file);
        emitSingle(file);
    };

    const handleMultipleFiles = (files: File[]) => {
        setInternalError(null);
        if (files.length === 0) {
            setSelectedFiles([]);
            emitMultiple([]);
            return;
        }
        for (const file of files) {
            const validationError = validateFile(file);
            if (validationError) {
                setInternalError(validationError);
                return;
            }
        }
        setSelectedFiles(files);
        emitMultiple(files);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isMultiple) {
            const list = e.target.files ? Array.from(e.target.files) : [];
            handleMultipleFiles(list);
        } else {
            const file = e.target.files?.[0] ?? null;
            handleSingleFile(file);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (disabled) return;
        const dt = e.dataTransfer.files;
        if (!dt?.length) return;
        if (isMultiple) {
            handleMultipleFiles(Array.from(dt));
        } else {
            handleSingleFile(dt[0] ?? null);
        }
    };

    const handleRemove = () => {
        setInternalError(null);
        if (isMultiple) {
            setSelectedFiles([]);
            emitMultiple([]);
        } else {
            setSelectedFile(null);
            emitSingle(null);
        }
        if (inputRef.current) {
            inputRef.current.value = "";
        }
    };

    const handleRemoveAt = (index: number) => {
        if (!isMultiple) return;
        setInternalError(null);
        const next = selectedFiles.filter((_, i) => i !== index);
        setSelectedFiles(next);
        emitMultiple(next);
        if (inputRef.current) {
            inputRef.current.value = "";
        }
    };

    const handleClick = () => {
        if (!disabled) {
            inputRef.current?.click();
        }
    };

    const hasSelection = isMultiple ? selectedFiles.length > 0 : selectedFile !== null || !!currentFileName;

    return (
        <div className="space-y-2">
            <label htmlFor={id} className="block text-sm font-medium text-foreground">
                {label}
                {required && <span className="text-destructive ml-1">*</span>}
            </label>

            <div
                className={`
                    relative border-2 border-dashed rounded-lg p-6 transition-all
                    ${dragActive ? "border-primary bg-primary/5" : "border-border"}
                    ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-primary/50"}
                    ${displayError ? "border-destructive" : ""}
                `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={handleClick}
            >
                <input
                    ref={inputRef}
                    id={id}
                    name={name}
                    type="file"
                    accept={accept}
                    multiple={isMultiple}
                    onChange={handleInputChange}
                    disabled={disabled}
                    className="hidden"
                />

                {hasSelection ? (
                    <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                        {isMultiple ? (
                            selectedFiles.map((f, index) => (
                                <div key={`${f.name}-${index}`} className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                                            <FileText className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">{f.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {(f.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </div>
                                    </div>
                                    {!disabled && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveAt(index)}
                                            className="p-2 rounded-lg hover:bg-destructive/10 transition-colors shrink-0"
                                        >
                                            <X className="w-4 h-4 text-destructive" />
                                        </button>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                                        <FileText className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">
                                            {selectedFile?.name || currentFileName}
                                        </p>
                                        {selectedFile && (
                                            <p className="text-xs text-muted-foreground">
                                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {!disabled && (
                                    <div className="flex items-center gap-2 shrink-0">
                                        {!selectedFile && currentFileName ? (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    inputRef.current?.click();
                                                }}
                                                className="rounded-lg px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
                                            >
                                                Cambiar
                                            </button>
                                        ) : null}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemove();
                                            }}
                                            className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                                        >
                                            <X className="w-4 h-4 text-destructive" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                        {isMultiple && !disabled && selectedFiles.length > 0 && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemove();
                                }}
                                className="text-xs text-muted-foreground hover:text-destructive underline"
                            >
                                Quitar todos
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="text-center">
                        <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                        <div className="mt-4">
                            <p className="text-sm text-foreground">
                                Arrastra y suelta {isMultiple ? "tus archivos" : "tu archivo"} aquí, o{" "}
                                <span className="text-primary font-medium">haz clic para seleccionar</span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                                {accept.includes("pdf")
                                    ? `Archivos PDF (máx. ${maxSizeMB}MB${isMultiple ? " c/u" : ""})`
                                    : `Máximo ${maxSizeMB}MB`}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {helperText && !displayError && <p className="text-xs text-muted-foreground">{helperText}</p>}

            {displayError && <p className="text-xs text-destructive">{displayError}</p>}
        </div>
    );
}
