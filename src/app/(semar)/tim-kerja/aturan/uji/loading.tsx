/** J-03b hanya membaca hasil uji tersimpan; uji sendiri berjalan di M-15 dengan kemajuannya. */
export default function Memuat() {
  return (
    <div role="status" aria-live="polite" className="py-16 text-center text-sm text-teks-redup">
      Memuat hasil uji…
    </div>
  );
}
