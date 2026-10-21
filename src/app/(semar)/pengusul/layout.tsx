import { wajibPengusul } from "@/lib/auth";

export default async function LayoutPengusul({ children }: { children: React.ReactNode }) {
  await wajibPengusul();
  return children;
}
