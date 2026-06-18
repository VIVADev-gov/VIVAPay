import type { StateCreator } from "zustand";
import type {
  ContratoDetailResponse,
  ContratosResponse,
  PublicContrato,
} from "@/types/contratos";
import {
  initialContratosState,
  type ContratosState,
} from "./contratos.storage";

export type ContratosActions = {
  setListLoading: (loading: boolean) => void;
  setListError: (error: string | null) => void;
  setContratosList: (data: ContratosResponse) => void;
  setDetailLoading: (loading: boolean) => void;
  setDetailError: (error: string | null) => void;
  setContratoDetail: (detail: ContratoDetailResponse | null) => void;
  applyContratoDetailUpdate: (detail: ContratoDetailResponse) => void;
  setSelectedContractId: (id: string | null) => void;
  openCreateModal: () => void;
  closeCreateModal: () => void;
  upsertContract: (contract: PublicContrato) => void;
  resetContratos: () => void;
};

function mergeContractIntoList(
  state: ContratosState,
  contract: PublicContrato
) {
  const exists = state.contracts.some((item) => item.id === contract.id);
  const contracts = exists
    ? state.contracts.map((item) =>
        item.id === contract.id ? contract : item
      )
    : [contract, ...state.contracts];

  const today = new Date();
  const start = contract.actual.fechaActaInicio ?? contract.fechaActaInicio;
  const end = contract.actual.fechaFinal ?? contract.fechaFinal;
  const isVigente =
    start && end && new Date(start) <= today && new Date(end) >= today;

  return {
    contracts,
    currentContract: isVigente
      ? contract
      : state.currentContract?.id === contract.id
        ? null
        : state.currentContract,
  };
}

export type ContratosStore = ContratosState & ContratosActions;

export const createContratosActions: StateCreator<
  ContratosStore,
  [],
  [],
  ContratosActions
> = (set) => ({
  setListLoading: (isLoadingList) => set({ isLoadingList }),

  setListError: (listError) => set({ listError }),

  setContratosList: (data) =>
    set({
      contracts: data.contracts,
      currentContract: data.currentContract,
      lastContract: data.lastContract,
      listError: null,
    }),

  setDetailLoading: (isLoadingDetail) => set({ isLoadingDetail }),

  setDetailError: (detailError) => set({ detailError }),

  setContratoDetail: (detail) =>
    set({
      detail,
      selectedContractId: detail?.contract.id ?? null,
      detailError: null,
    }),

  applyContratoDetailUpdate: (detail) =>
    set((state) => ({
      ...mergeContractIntoList(state, detail.contract),
      detail,
      selectedContractId: detail.contract.id,
      detailError: null,
    })),

  setSelectedContractId: (selectedContractId) => set({ selectedContractId }),

  openCreateModal: () => set({ isCreateModalOpen: true }),

  closeCreateModal: () => set({ isCreateModalOpen: false }),

  upsertContract: (contract) =>
    set((state) => mergeContractIntoList(state, contract)),

  resetContratos: () => set({ ...initialContratosState }),
});
