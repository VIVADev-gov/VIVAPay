import { connectDB } from "@/lib/db/mongoose";
import { sendEmail } from "@/lib/email/send";
import { User } from "@/models/user";
import { formatOrganizacionDisplay } from "@/constants/organizacionViva";
import { AuthServiceError } from "../_shared/auth.errors";
import { VERIFICATION_TOKEN_EXPIRY_HOURS, USER_STATUS } from "../_shared/auth.constants";
import { normalizeEmail } from "../_shared/email-domain";
import { hashPassword } from "../_shared/password";
import {
  createRawVerificationToken,
  getAppBaseUrl,
  hashVerificationToken,
  verificationTokenExpiresAt,
} from "../_shared/tokens";
import {
  resolveOrganizacionFromRegister,
  type RegisterBodyDto,
} from "./dto/register.dto";

export const registerService = {
  async create(dto: RegisterBodyDto) {
    await connectDB();

    const email = normalizeEmail(dto.email);
    const documentId = dto.documentId.trim();
    const organizacion = resolveOrganizacionFromRegister(dto);

    const existing = await User.findOne({
      $or: [{ email }, { documentId }],
    });

    if (existing) {
      if (existing.email === email) {
        throw new AuthServiceError("Ya existe una cuenta con este correo", 409);
      }
      throw new AuthServiceError("Ya existe una cuenta con este documento", 409);
    }

    const rawToken = createRawVerificationToken();
    const passwordHash = await hashPassword(dto.password);
    const areaDisplay = formatOrganizacionDisplay({
      organizationalUnitName: organizacion.organizationalUnitName,
      organizationalUnitType: organizacion.organizationalUnitType,
      subareaName: organizacion.subareaName,
    });

    const user = await User.create({
      email,
      passwordHash,
      name: dto.name.trim(),
      documentId,
      phone: dto.phone.trim(),
      role: dto.role,
      organizationalUnitId: organizacion.organizationalUnitId,
      organizationalUnitName: organizacion.organizationalUnitName,
      organizationalUnitType: organizacion.organizationalUnitType,
      subareaId: organizacion.subareaId,
      subareaName: organizacion.subareaName,
      area: areaDisplay,
      emailVerified: false,
      status: USER_STATUS.ACTIVE,
      verificationTokenHash: hashVerificationToken(rawToken),
      verificationTokenExpiresAt: verificationTokenExpiresAt(
        VERIFICATION_TOKEN_EXPIRY_HOURS
      ),
    });

    const verifyUrl = `${getAppBaseUrl()}/auth/verification-email?token=${encodeURIComponent(rawToken)}`;

    const emailResult = await sendEmail({
      to: email,
      subject: "Confirma tu correo — Vivapay",
      template: "auth-confirmation",
      data: {
        nombre: user.name,
        verifyUrl,
      },
    });

    if (!emailResult.success) {
      await User.findByIdAndDelete(user._id);
      throw new AuthServiceError(
        emailResult.error ?? "No se pudo enviar el correo de confirmación",
        503
      );
    }

    return {
      message:
        "Registro exitoso. Revisa tu correo institucional para confirmar la cuenta.",
      email,
    };
  },
};
