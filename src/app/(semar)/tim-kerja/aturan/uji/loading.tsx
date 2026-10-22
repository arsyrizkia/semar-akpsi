/** Layar J-03b menjalankan pemeriksaan di server (butir semantik dapat memakan beberapa detik): beri tahu pengguna. */
export default function Memuat() {
  return (
    <div role="status" aria-live="polite" className="py-16 text-center text-sm text-primer-700">
      Menjalankan uji pada contoh…
    </div>
  );
}
