import { langkahUc07 } from "./uc-07";
import { langkahUc08 } from "./uc-08";

/** Panduan gabungan untuk J-08 (UC-07 dengan perluasan UC-08). */
export const langkahJ08 = [...langkahUc07.filter((l) => l.nomor !== "1" && l.nomor !== "2"), ...langkahUc08];
