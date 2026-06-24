"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { ReactNode } from "react";

interface ToggleSwitchProps {
    label: string;
    description?: string;
    statusLabels?: {
        on: string;
        off: string;
    };
    value: boolean;
    onChange: (value: boolean) => void;
    icon?: ReactNode;
    disabled?: boolean;
    className?: string;
}

/**
 * Componente ToggleSwitch reutilizable
 * Similar al toggle de RestauranteField pero más genérico
 */
export default function ToggleSwitch({ 
    label, 
    description,
    statusLabels,
    value, 
    onChange, 
    icon, 
    disabled = false,
    className = ""
}: ToggleSwitchProps) {
    const isEnabled = Boolean(value);
    const statusLabel = statusLabels
        ? isEnabled
            ? statusLabels.on
            : statusLabels.off
        : null;
    
    return (
        <div className={`flex flex-col gap-3 p-4 bg-background rounded-xl border border-border hover:bg-card transition-colors duration-200 ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                    {icon && (
                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary/80 to-primary-foreground/20 rounded-lg flex items-center justify-center text-primary-foreground">
                            {icon}
                        </div>
                    )}
                    <div className="flex-1">
                        <label className="block text-sm font-semibold text-foreground mb-1">
                            {label}
                        </label>
                        {description && (
                            <span className="text-xs text-muted-foreground">
                                {description}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                    {statusLabel ? (
                        <p
                            className={`hidden max-w-44 text-right text-xs leading-5 sm:block ${
                                isEnabled ? "text-primary" : "text-muted-foreground"
                            }`}
                        >
                            {statusLabel}
                        </p>
                    ) : null}

                    <motion.button
                        type="button"
                        onClick={() => !disabled && onChange(!isEnabled)}
                        disabled={disabled}
                        className={`
                            relative flex items-center w-14 h-8 rounded-full p-1 transition-colors duration-300 
                            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50
                            ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
                            ${isEnabled 
                                ? 'bg-gradient-to-r from-green-500 to-green-600' 
                                : 'bg-muted'
                            }
                        `}
                        whileTap={disabled ? {} : { scale: 0.95 }}
                    >
                        <motion.div
                            className="w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center"
                            animate={{
                                x: isEnabled ? 24 : 0,
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 500,
                                damping: 30,
                            }}
                        >
                            {isEnabled ? (
                                <Check className="w-4 h-4 text-green-600" />
                            ) : (
                                <X className="w-4 h-4 text-muted-foreground" />
                            )}
                        </motion.div>
                    </motion.button>
                </div>
            </div>

            {statusLabel ? (
                <p
                    className={`text-xs leading-5 sm:hidden ${
                        isEnabled ? "text-primary" : "text-muted-foreground"
                    }`}
                >
                    {statusLabel}
                </p>
            ) : null}
        </div>
    );
}
