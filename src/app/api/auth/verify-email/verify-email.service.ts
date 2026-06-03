import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/models/user";
import { AuthServiceError } from "../_shared/auth.errors";
import { hashVerificationToken } from "../_shared/tokens";

export const verifyEmailService = {
  async confirm(token: string) {
    await connectDB();

    const tokenHash = hashVerificationToken(token.trim());
    const user = await User.findOne({ verificationTokenHash: tokenHash });

    if (!user) {
      throw new AuthServiceError("Enlace de verificación inválido o expirado", 400);
    }

    if (
      user.verificationTokenExpiresAt &&
      user.verificationTokenExpiresAt < new Date()
    ) {
      throw new AuthServiceError("El enlace de verificación ha expirado", 400);
    }

    if (user.emailVerified) {
      return {
        message: "Tu correo ya estaba verificado. Puedes iniciar sesión.",
        alreadyVerified: true,
      };
    }

    user.emailVerified = true;
    user.verificationTokenHash = null;
    user.verificationTokenExpiresAt = null;
    await user.save();

    return {
      message: "Correo verificado correctamente. Ya puedes iniciar sesión.",
      alreadyVerified: false,
    };
  },
};
