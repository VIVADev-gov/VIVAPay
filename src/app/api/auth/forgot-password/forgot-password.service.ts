import { connectDB } from "@/lib/db/mongoose";
import { sendEmail } from "@/lib/email/send";
import logger from "@/lib/logger";
import { User } from "@/models/user";
import {
  PASSWORD_RESET_GENERIC_MESSAGE,
  PASSWORD_RESET_TOKEN_EXPIRY_HOURS,
  USER_STATUS,
} from "../_shared/auth.constants";
import { AuthServiceError } from "../_shared/auth.errors";
import { normalizeEmail } from "../_shared/email-domain";
import {
  createRawVerificationToken,
  getAppBaseUrl,
  hashVerificationToken,
  verificationTokenExpiresAt,
} from "../_shared/tokens";
import type { ForgotPasswordBodyDto } from "./dto/forgot-password.dto";

export const forgotPasswordService = {
  async requestReset(dto: ForgotPasswordBodyDto) {
    await connectDB();

    const email = normalizeEmail(dto.email);
    const user = await User.findOne({ email }).exec();

    if (user && user.status === USER_STATUS.ACTIVE) {
      const rawToken = createRawVerificationToken();
      user.passwordResetTokenHash = hashVerificationToken(rawToken);
      user.passwordResetTokenExpiresAt = verificationTokenExpiresAt(
        PASSWORD_RESET_TOKEN_EXPIRY_HOURS
      );
      await user.save();

      const resetUrl = `${getAppBaseUrl()}/auth/reset-password?token=${encodeURIComponent(rawToken)}`;
      const emailResult = await sendEmail({
        to: user.email,
        subject: "Restablece tu contraseña — Vivapay",
        template: "auth-password-reset",
        data: {
          nombre: user.name,
          resetUrl,
        },
      });

      if (!emailResult.success) {
        user.passwordResetTokenHash = null;
        user.passwordResetTokenExpiresAt = null;
        await user.save();

        logger.error("[auth/forgot-password] No se pudo enviar el correo", {
          email: user.email,
          error: emailResult.error,
        });
        throw new AuthServiceError(
          "No se pudo enviar el correo de restablecimiento. Intenta más tarde.",
          503
        );
      }
    }

    return {
      message: PASSWORD_RESET_GENERIC_MESSAGE,
    };
  },
};
