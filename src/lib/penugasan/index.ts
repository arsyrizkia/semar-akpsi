/**
 * ENTRI AGEN B: kontrak susunPenugasan dan pilihReviewer (UC-03). Implementasi ada di layanan.ts dan aturan.ts.
 */
import type { PilihReviewer, SusunPenugasan } from "../kontrak/layanan";
import { pilihReviewer as pilihReviewerImpl, susunPenugasan as susunPenugasanImpl } from "./layanan";

export const susunPenugasan: SusunPenugasan = susunPenugasanImpl;
export const pilihReviewer: PilihReviewer = pilihReviewerImpl;
