import { wajibTimKerja } from "@/lib/auth";

export default async function LayoutTimKerja({ children }: { children: React.ReactNode }) {
  await wajibTimKerja();
  return children;
}
