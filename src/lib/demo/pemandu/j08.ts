import { langkahUc07 } from "./uc-07";
import { langkahUc08 } from "./uc-08";
import { langkahUc09 } from "./uc-09";

/** Panduan gabungan untuk J-08: UC-07 dengan perluasan UC-08, lalu proses latar belakang UC-09 (nomor diawali "UC-09·"). */
export const langkahJ08 = [
  ...langkahUc07.filter((l) => l.nomor !== "1" && l.nomor !== "2"),
  ...langkahUc08,
  ...langkahUc09.map((l) => ({ ...l, nomor: `UC-09·${l.nomor}`, alternatif: true })),
];
