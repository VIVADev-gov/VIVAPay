"use client";
import React, { useState, useRef } from "react";
import { Eye, EyeOff } from "lucide-react";

interface SelectOption {
    value: string | number;
    label: string;
}

interface FormFieldProps {
    label?: string;
    id?: string;
    name?: string;
    type?: "text" | "email" | "password" | "number" | "tel" | "textarea" | "select" | "date";
    value?: string | number;
    onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    placeholder?: string;
    required?: boolean;
    options?: SelectOption[];
    rows?: number;
    className?: string;
    floatingLabel?: boolean;
    helperText?: string;
    disabled?: boolean;
    inputMode?: "none" | "text" | "tel" | "url" | "email" | "numeric" | "decimal" | "search";
    /** Si es false, el select no incluye la opción vacía "Seleccionar opción" (útil para enums con valor siempre definido). */
    selectAllowEmpty?: boolean;
}

const inputTextClasses =
    "relative z-0 text-foreground placeholder:text-muted-foreground";

const baseClasses =
    `w-full px-4 py-3 border text-base border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all bg-background shadow-sm ${inputTextClasses}`;

const baseClassesWithPassword =
    `w-full pl-4 pr-12 py-3 border text-base border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all bg-background shadow-sm ${inputTextClasses}`;

const floatingLabelBaseClasses =
    `w-full px-4 pt-6 pb-2 border text-base border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all bg-background shadow-sm ${inputTextClasses}`;

const floatingLabelBaseClassesWithPassword =
    `w-full pl-4 pr-12 pt-6 pb-2 border text-base border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all bg-background shadow-sm ${inputTextClasses}`;

export default function FormField({
    label,
    id,
    name,
    type = "text",
    value = "",
    onChange,
    onBlur,
    placeholder,
    required = false,
    options = [],
    rows = 4,
    className = "",
    floatingLabel = false,
    helperText,
    disabled = false,
    inputMode,
    selectAllowEmpty = true,
}: FormFieldProps) {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null);

    const hasValue = value !== "" && value !== undefined && value !== null;
    const isLabelFloating = floatingLabel && (isFocused || hasValue);
    const isPassword = type === "password";
    const inputType = isPassword && showPassword ? "text" : type;

    const handleFocus = () => {
        setIsFocused(true);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setIsFocused(false);
        onBlur?.(e);
    };

    const getInputClasses = () => {
        if (floatingLabel) {
            return isPassword ? floatingLabelBaseClassesWithPassword : floatingLabelBaseClasses;
        }
        return isPassword ? baseClassesWithPassword : baseClasses;
    };

    const inputClasses = getInputClasses();

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className={className}>
            {floatingLabel ? (
                <div className="relative">
                    {label && (
                        <label
                            htmlFor={id}
                            className={`absolute left-4 z-10 transition-all duration-200 pointer-events-none ${isLabelFloating
                                ? "top-2 text-xs text-muted-foreground font-medium"
                                : "top-1/2 -translate-y-1/2 text-base text-foreground/60"
                                }`}
                        >
                            {label}
                            {required && <span className="text-destructive ml-1">*</span>}
                        </label>
                    )}

                    {type === "textarea" ? (
                        <textarea
                            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                            id={id}
                            name={name}
                            value={value}
                            onChange={onChange}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            placeholder={isLabelFloating ? placeholder : ""}
                            rows={rows}
                            disabled={disabled}
                            className={`${inputClasses} resize-none`}
                        />
                    ) : type === "select" ? (
                        <select
                            ref={inputRef as React.RefObject<HTMLSelectElement>}
                            id={id}
                            name={name}
                            value={value}
                            onChange={onChange}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            disabled={disabled}
                            className={inputClasses}
                        >
                            {selectAllowEmpty && <option value="">Seleccionar opción</option>}
                            {options.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <div className="relative">
                            <input
                                ref={inputRef as React.RefObject<HTMLInputElement>}
                                type={inputType}
                                id={id}
                                name={name}
                                value={value}
                                onChange={onChange}
                                onFocus={handleFocus}
                                onBlur={handleBlur}
                                placeholder={isLabelFloating ? placeholder : ""}
                                disabled={disabled}
                                inputMode={inputMode}
                                className={inputClasses}
                            />
                            {isPassword && (
                                <button
                                    type="button"
                                    onClick={togglePasswordVisibility}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring rounded p-1"
                                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <>
                    {label && (
                        <label
                            htmlFor={id}
                            className="block text-base font-semibold text-foreground mb-2"
                        >
                            {label}
                            {required && <span className="text-destructive ml-1">*</span>}
                        </label>
                    )}

                    {type === "textarea" ? (
                        <textarea
                            id={id}
                            name={name}
                            value={value}
                            onChange={onChange}
                            placeholder={placeholder}
                            rows={rows}
                            disabled={disabled}
                            className={`${inputClasses} resize-none`}
                        />
                    ) : type === "select" ? (
                        <select
                            id={id}
                            name={name}
                            value={value}
                            onChange={onChange}
                            disabled={disabled}
                            className={inputClasses}
                        >
                            {!selectAllowEmpty && <option value="">Seleccionar opción</option>}
                            {options.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <div className="relative">
                            <input
                                type={inputType}
                                id={id}
                                name={name}
                                value={value}
                                onChange={onChange}
                                onFocus={handleFocus}
                                onBlur={handleBlur}
                                placeholder={placeholder}
                                disabled={disabled}
                                inputMode={inputMode}
                                className={inputClasses}
                            />
                            {isPassword && (
                                <button
                                    type="button"
                                    onClick={togglePasswordVisibility}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring rounded p-1"
                                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            )}
                        </div>
                    )}
                </>
            )}

            {helperText && (
                <p className={`mt-2 text-sm ${className?.includes("border-red-500") ? "text-destructive" : "text-muted-foreground"}`}>{helperText}</p>
            )}
        </div>
    );
}

