import { Types } from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import { Municipio, toPublicMunicipio } from "@/models/municipio";
import { Subregion, toPublicSubregion } from "@/models/subregion";

export const catalogosService = {
  async listSubregiones() {
    await connectDB();

    const items = await Subregion.find({ status: "activo" })
      .sort({ nombre: 1 })
      .exec();

    return items.map(toPublicSubregion);
  },

  async listMunicipios(subregionId?: string | null) {
    await connectDB();

    const filter: Record<string, unknown> = { status: "activo" };

    if (subregionId) {
      if (!Types.ObjectId.isValid(subregionId)) {
        return [];
      }
      filter.subregion = subregionId;
    }

    const items = await Municipio.find(filter).sort({ nombre: 1 }).exec();

    return items.map(toPublicMunicipio);
  },
};
