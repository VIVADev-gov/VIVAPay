import { User, toPublicUser, type IUserDocument } from "@/models/user";
import type { UpdateProfileBodyDto } from "./dto/update-profile.dto";

export const profileService = {
  async getProfile(user: IUserDocument) {
    return toPublicUser(user);
  },

  async updateProfile(userId: string, dto: UpdateProfileBodyDto) {
    const user = await User.findByIdAndUpdate(
      userId,
      {
        name: dto.name.trim(),
        phone: dto.phone.trim(),
        area: dto.area.trim(),
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    return toPublicUser(user);
  },
};
