import { useQuery } from "@tanstack/react-query";
import type { ProcedureWithGuide } from "@/lib/procedures";

export function useProcedures() {
  return useQuery<ProcedureWithGuide[]>({ queryKey: ["/api/procedures"] });
}
