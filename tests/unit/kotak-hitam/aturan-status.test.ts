// Uji kotak hitam (Dennis dkk., 2015, hlm. 471-475). Sumber: CRC ButirCek, Contract C-06 (aturParameter/ubahParameter) dan C-07 (nonaktifkan),
// behavioral state machine butir (Draf, Aktif, Perlu ditinjau, Nonaktif; hlm. 473).
import { describe, expect, it } from "vitest";
import { PESAN_TERKUNCI, STATUS_BUTIR, butirTerkunci, transisiButir, type AksiButir } from "@/lib/aturan/status";
import type { StatusButir } from "@/lib/kontrak/tipe";

describe("state machine ButirCek (CRC ButirCek; Contract C-07)", () => {
  it("KH-statusButir-01: Draf menjadi Aktif saat versi disimpan (simpanVersi)", () => {
    expect(transisiButir("Draf", "simpanVersi")).toEqual({ ok: true, ke: "Aktif" });
  });

  it("KH-statusButir-02: Aktif menjadi Perlu ditinjau saat ditandai pemantauan, lalu kembali Aktif saat versi disimpan", () => {
    const tandai = transisiButir("Aktif", "tandai");
    expect(tandai).toEqual({ ok: true, ke: "Perlu ditinjau" });
    expect(transisiButir("Perlu ditinjau", "simpanVersi")).toEqual({ ok: true, ke: "Aktif" });
  });

  it("KH-statusButir-03: butir manual Draf, Aktif, dan Perlu ditinjau dapat dinonaktifkan", () => {
    for (const dari of ["Draf", "Aktif", "Perlu ditinjau"] as StatusButir[]) expect(transisiButir(dari, "nonaktifkan")).toEqual({ ok: true, ke: "Nonaktif" });
  });

  it("KH-statusButir-04: Nonaktif adalah keadaan akhir: tidak ada aksi yang diizinkan", () => {
    for (const aksi of ["simpanVersi", "tandai", "nonaktifkan"] as AksiButir[]) {
      const r = transisiButir("Nonaktif", aksi);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.pesan).toContain("Nonaktif");
    }
  });

  it("KH-statusButir-05: transisi lain yang tidak didefinisikan ditolak (Draf tidak dapat ditandai, Perlu ditinjau tidak dapat ditandai ulang)", () => {
    expect(transisiButir("Draf", "tandai").ok).toBe(false);
    expect(transisiButir("Perlu ditinjau", "tandai").ok).toBe(false);
    expect(transisiButir("Aktif", "simpanVersi").ok).toBe(false);
  });

  it("KH-statusButir-06: tepat empat keadaan", () => {
    expect([...STATUS_BUTIR]).toEqual(["Draf", "Aktif", "Perlu ditinjau", "Nonaktif"]);
  });
});

describe("penguncian butir turunan templat (Contract C-06 dan C-07 pra-kondisi; label pesan tetap dari docs/spesifikasi-ui.md)", () => {
  it("KH-butirTerkunci-01: butir berasal dari templat terkunci, butir manual tidak", () => {
    expect(butirTerkunci("templat")).toBe(true);
    expect(butirTerkunci("manual")).toBe(false);
  });

  it("KH-butirTerkunci-02: pesan 4a persis seperti spesifikasi UI", () => {
    expect(PESAN_TERKUNCI).toBe("Nilai butir ini berasal dari templat dan hanya dapat diubah melalui jendela J-02 Templat Proposal");
  });
});
