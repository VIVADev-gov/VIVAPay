import type { ContratoDetailResponse, PublicContrato } from "@/types/contratos";

export type ContratosState = {
  contracts: PublicContrato[];
  currentContract: PublicContrato | null;
  lastContract: PublicContrato | null;
  selectedContractId: string | null;
  detail: ContratoDetailResponse | null;
  isLoadingList: boolean;
  isLoadingDetail: boolean;
  listError: string | null;
  detailError: string | null;
  isCreateModalOpen: boolean;
};

export const initialContratosState: ContratosState = {
  contracts: [],
  currentContract: null,
  lastContract: null,
  selectedContractId: null,
  detail: null,
  isLoadingList: false,
  isLoadingDetail: false,
  listError: null,
  detailError: null,
  isCreateModalOpen: false,
};
