import { formatOrganizacionDisplay } from "@/constants/organizacionViva";
import { saveUserSignature } from "@/lib/fileUpload";
import { User, toPublicUser, type IUserDocument } from "@/models/user";
import {
  resolveOrganizacionFromProfile,
  type UpdateProfileBodyDto,
} from "./dto/update-profile.dto";

export const profileService = {
  async getProfile(user: IUserDocument) {
    return toPublicUser(user);
  },

  async updateProfile(userId: string, dto: UpdateProfileBodyDto) {
    const organizacion = resolveOrganizacionFromProfile(dto);
    const areaDisplay = formatOrganizacionDisplay({
      organizationalUnitName: organizacion.organizationalUnitName,
      organizationalUnitType: organizacion.organizationalUnitType,
      subareaName: organizacion.subareaName,
    });

    const user = await User.findByIdAndUpdate(
      userId,
      {
        name: dto.name.trim(),
        phone: dto.phone.trim(),
        organizationalUnitId: organizacion.organizationalUnitId,
        organizationalUnitName: organizacion.organizationalUnitName,
        organizationalUnitType: organizacion.organizationalUnitType,
        subareaId: organizacion.subareaId,
        subareaName: organizacion.subareaName,
        area: areaDisplay,
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    return toPublicUser(user);
  },

  async uploadSignature(userId: string, file: File) {
    const saved = await saveUserSignature(file, userId);
    if (!saved.success || !saved.filePath) {
      throw new Error(saved.error ?? "No se pudo guardar la firma");
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { signaturePath: saved.filePath },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    return toPublicUser(user);
  },
};
