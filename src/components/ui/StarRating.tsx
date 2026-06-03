"use client";

import React from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
    value: number | null;
    onChange?: (value: number) => void;
    disabled?: boolean;
    size?: number;
}

export function StarRating({ value = 0, onChange, disabled, size = 22 }: StarRatingProps) {
    const v = value ?? 0;
    return (
        <span className="inline-flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange?.(star)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") onChange?.(star);
                    }}
                    className={`shrink-0 rounded p-0.5 transition-colors ${
                        disabled ? "cursor-default" : "cursor-pointer hover:opacity-90"
                    }`}
                    aria-label={`${star} estrella${star > 1 ? "s" : ""}`}
                >
                    <Star
                        size={size}
                        className={
                            star <= v
                                ? "fill-amber-400 text-amber-500"
                                : "fill-transparent text-gray-300"
                        }
                    />
                </button>
            ))}
        </span>
    );
}
