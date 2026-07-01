"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { contratosQueryKeys } from "@/hooks/api/useContratos";
import { cuentasCobroQueryKeys } from "@/hooks/api/useCuentasCobro";
import { useAuthStore } from "@/store/auth/auth.store";
import { useContratosStore } from "@/store/contratos/contratos.store";
import { useCuentasCobroStore } from "@/store/cuentas-cobro/cuentas-cobro.store";

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const logout = useAuthStore((s) => s.logout);
  const resetContratos = useContratosStore((s) => s.resetContratos);
  const resetCuentasCobro = useCuentasCobroStore((s) => s.resetCuentasCobro);

  return () => {
    logout();
    resetContratos();
    resetCuentasCobro();
    queryClient.removeQueries({ queryKey: contratosQueryKeys.root });
    queryClient.removeQueries({ queryKey: cuentasCobroQueryKeys.summary });
    router.push("/auth/login");
  };
}
