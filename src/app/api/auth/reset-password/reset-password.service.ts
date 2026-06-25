import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/models/user";
import { AuthServiceError } from "../_shared/auth.errors";
import { hashPassword } from "../_shared/password";
import { hashVerificationToken } from "../_shared/tokens";
import type { ResetPasswordBodyDto } from "./dto/reset-password.dto";

export const resetPasswordService = {
  async reset(dto: ResetPasswordBodyDto) {
    await connectDB();

    const tokenHash = hashVerificationToken(dto.token.trim());
    const user = await User.findOne({ passwordResetTokenHash: tokenHash }).exec();

    if (!user) {
      throw new AuthServiceError(
        "Enlace de restablecimiento inválido o expirado",
        400
      );
    }

    if (
      user.passwordResetTokenExpiresAt &&
      user.passwordResetTokenExpiresAt < new Date()
    ) {
      throw new AuthServiceError("El enlace de restablecimiento ha expirado", 400);
    }

    user.passwordHash = await hashPassword(dto.password);
    user.passwordResetTokenHash = null;
    user.passwordResetTokenExpiresAt = null;
    await user.save();

    return {
      message: "Contraseña actualizada. Ya puedes iniciar sesión.",
    };
  },
};
