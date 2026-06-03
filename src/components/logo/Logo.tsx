'use client'
import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";

type LogoSize = 'small' | 'default' | 'large';
type LogoVariant = 'default' | 'logo2' | 'white' | 'whiteNoBg';
type AnimationType = 'fade' | 'scale' | 'pulse' | 'bounce' | 'rotate';

interface LogoProps {
  size?: LogoSize;
  variant?: LogoVariant;
  src?: string;
  alt?: string;
  className?: string;
  fondoColor?: string; // permite pasar color de fondo como prop
  animated?: boolean; // activa animaciones (por defecto: false)
  animationType?: AnimationType; // tipo de animación
  animationDuration?: number; // duración de la animación en segundos
}

interface SizeMap {
  width: number;
  height: number;
}

const sizeMap: Record<LogoSize, SizeMap> = {
  small: { width: 60, height: 45 },
  default: { width: 120, height: 90 },
  large: { width: 180, height: 135 },
};

const variantMap: Record<LogoVariant, string> = {
  default: "/logoviva.png",
  logo2: "/logo2.png",
  white: "/logoW.png",
  whiteNoBg: "/logoW_sin_bg.png",
};

const Logo: React.FC<LogoProps> = ({
  size = "default",
  variant = "default",
  src,
  alt = "Logo de Buenity",
  className = "",
  fondoColor = "transparent", // valor por defecto: transparente
  animated = false, // animaciones desactivadas por defecto
  animationType = "fade",
  animationDuration = 1,
}) => {
  const { width, height } = sizeMap[size as LogoSize];
  const logoSrc = src || variantMap[variant];

  // Configuración de animaciones según el tipo
  const getAnimationProps = () => {
    if (!animated) return {};

    const baseProps = {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: animationDuration },
    };

    switch (animationType) {
      case 'fade':
        return {
          ...baseProps,
          initial: { opacity: 0 },
          animate: { opacity: 1 },
        };
      case 'scale':
        return {
          initial: { opacity: 0, scale: 0.8 },
          animate: { opacity: 1, scale: 1 },
          transition: { duration: animationDuration, ease: "easeOut" },
        };
      case 'pulse':
        return {
          initial: { opacity: 0, scale: 1 },
          animate: { 
            opacity: 1, 
            scale: [1, 1.05, 1],
          },
          transition: { 
            duration: animationDuration,
            repeat: Infinity,
            repeatType: "reverse" as const,
            ease: "easeInOut",
          },
        };
      case 'bounce':
        return {
          initial: { opacity: 0, y: -20 },
          animate: { 
            opacity: 1, 
            y: 0,
          },
          transition: { 
            duration: animationDuration,
            type: "spring",
            stiffness: 200,
            damping: 10,
          },
        };
      case 'rotate':
        return {
          initial: { opacity: 0, rotate: -180 },
          animate: { 
            opacity: 1, 
            rotate: 0,
          },
          transition: { 
            duration: animationDuration,
            ease: "easeOut",
          },
        };
      default:
        return baseProps;
    }
  };

  const animationProps = getAnimationProps();

  const containerProps = {
    className: `flex items-center rounded-xl justify-center`,
    style: { backgroundColor: fondoColor },
    ...(animated ? animationProps : {}),
  };

  if (animated) {
    return (
      <motion.div {...containerProps}>
        <Image
          src={logoSrc}
          width={width}
          height={height}
          alt={alt}
          className={`object-contain ${className}`}
        />
      </motion.div>
    );
  }

  return (
    <div {...containerProps}>
      <Image
        src={logoSrc}
        width={width}
        height={height}
        alt={alt}
        className={`object-contain ${className}`}
      />
    </div>
  );
};

export default Logo;