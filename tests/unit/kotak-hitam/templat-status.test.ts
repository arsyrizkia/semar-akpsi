// Uji kotak hitam (Dennis dkk., 2015, hlm. 471-475). Sumber: CRC TemplatProposal, Contract C-02 (terbitkan) dan C-04 (arsipkan),
// behavioral state machine templat (Draf, Terbit, Arsip; hlm. 473). Tidak melihat isi metode.
import { describe, expect, it } from "vitest";
import { PESAN_DRAF_9A, PESAN_LENGKAPI, STATUS_TEMPLAT, dapatDisusun, putuskanTerbitkan, transisiTemplat, type AksiTemplat, type StatusTemplat } from "@/lib/templat/status";

describe("state machine TemplatProposal (CRC TemplatProposal; Contract C-02, C-04)", () => {
  it("KH-statusTemplat-01: Draf menjadi Terbit lewat terbitkan", () => {
    expect(transisiTemplat("Draf", "terbitkan")).toEqual({ ok: true, ke: "Terbit" });
  });

  it("KH-statusTemplat-02: Terbit menjadi Arsip lewat arsipkan", () => {
    expect(transisiTemplat("Terbit", "arsipkan")).toEqual({ ok: true, ke: "Arsip" });
  });

  it("KH-statusTemplat-03: hanya transisi yang didefinisikan yang diizinkan (empat pasangan lain ditolak dengan pesan)", () => {
    const tidakSah: [StatusTemplat, AksiTemplat][] = [
      ["Draf", "arsipkan"],
      ["Terbit", "terbitkan"],
      ["Arsip", "terbitkan"],
      ["Arsip", "arsipkan"],
    ];
    for (const [dari, aksi] of tidakSah) {
      const r = transisiTemplat(dari, aksi);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.pesan).toContain(dari);
    }
  });

  it("KH-statusTemplat-04: setiap keadaan dapat dicapai dari Draf dan Arsip tidak punya jalan keluar", () => {
    const awal: StatusTemplat = "Draf";
    const t = transisiTemplat(awal, "terbitkan");
    expect(t.ok && t.ke).toBe("Terbit");
    const a = t.ok ? transisiTemplat(t.ke, "arsipkan") : null;
    expect(a && a.ok && a.ke).toBe("Arsip");
    const keluar = (["terbitkan", "arsipkan"] as AksiTemplat[]).map((x) => transisiTemplat("Arsip", x).ok);
    expect(keluar).toEqual([false, false]);
  });

  it("KH-statusTemplat-05: tepat tiga keadaan: Draf, Terbit, Arsip", () => {
    expect([...STATUS_TEMPLAT]).toEqual(["Draf", "Terbit", "Arsip"]);
  });

  it("KH-statusTemplat-06: hanya Draf yang dapat disusun di J-02b; Terbit dan Arsip hanya-baca", () => {
    expect(dapatDisusun("Draf")).toBe(true);
    expect(dapatDisusun("Terbit")).toBe(false);
    expect(dapatDisusun("Arsip")).toBe(false);
  });
});

describe("keputusan Terbitkan (Contract C-02 pascakondisi Q2, Q3, Q4; label pesan tetap dari docs/spesifikasi-ui.md)", () => {
  it("KH-terbitkan-01: isian lengkap dan masa ditutup menghasilkan terbit", () => {
    expect(putuskanTerbitkan({ lengkap: true, masaBerjalan: false })).toBe("terbit");
  });

  it("KH-terbitkan-02: isian lengkap dan masa pengusulan berjalan menghasilkan draf tersimpan (9a)", () => {
    expect(putuskanTerbitkan({ lengkap: true, masaBerjalan: true })).toBe("draf-disimpan");
  });

  it("KH-terbitkan-03: isian tidak lengkap menghasilkan S-2 walau masa berjalan atau ditutup (kelengkapan didahulukan)", () => {
    expect(putuskanTerbitkan({ lengkap: false, masaBerjalan: false })).toBe("tidak-lengkap");
    expect(putuskanTerbitkan({ lengkap: false, masaBerjalan: true })).toBe("tidak-lengkap");
  });

  it("KH-terbitkan-04: pesan S-2 dan 9a persis seperti spesifikasi UI", () => {
    expect(PESAN_LENGKAPI).toBe("Lengkapi isian yang ditandai");
    expect(PESAN_DRAF_9A).toBe("Masa pengusulan skema ini sedang berjalan. Templat disimpan sebagai draf untuk periode berikutnya.");
  });
});
