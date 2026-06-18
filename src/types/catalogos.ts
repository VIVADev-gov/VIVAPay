export type PublicSubregion = {
  id: string;
  nombre: string;
  value: string;
  status: string;
};

export type PublicMunicipio = {
  id: string;
  nombre: string;
  value: string;
  subregionId: string;
  status: string;
};
