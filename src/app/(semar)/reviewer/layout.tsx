import { wajibReviewer } from "@/lib/auth";

export default async function LayoutReviewer({ children }: { children: React.ReactNode }) {
  await wajibReviewer();
  return children;
}
