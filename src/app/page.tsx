import { redirect } from "next/navigation";

/** Spesifikasi tidak memuat beranda: "/" menuju J-01 (Agen D merestyle J-01 dan menautkan Pusat Demo di sana). */
export default function Awal(): never {
  redirect("/masuk");
}
