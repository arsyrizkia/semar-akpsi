/** Berkas contoh untuk demo M-16 (panel "Berkas contoh (demo)" di langkah Substansi Usulan BIMA tiruan): kunci URL -> varian naskah contoh. */
export const VARIAN_DEMO = {
  lolos: { varian: "a", label: "Lolos semua pemeriksaan" },
  "batas-kata": { varian: "b", label: "Bagian Metode melebihi 1.000 kata" },
  "kata-kunci": { varian: "f", label: "Kata kunci dipisah koma" },
} as const;

export type KunciContohDemo = keyof typeof VARIAN_DEMO;
