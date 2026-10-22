#!/bin/bash
# PreToolUse (Edit|Write|MultiEdit): bila berkas antarmuka SEMAR yang diubah, ingatkan skill desain wajib.
f=$(jq -r '.tool_input.file_path // empty')
case "$f" in
  *semar-akpsi/src/*.tsx|*semar-akpsi/src/*.css|src/*.tsx|src/*.css) ;;
  *) exit 0 ;;
esac
S="$(cd "$(dirname "$0")/../skills" && pwd)"
pesan="Berkas antarmuka SEMAR diubah ($f). Wajib sebelum menulis: (1) ikuti $S/ui-ux-pro-max/SKILL.md beserta docs/desain-sistem.md SEMAR dan pre-delivery checklist-nya; (2) kode React/Next mengikuti $S/vercel-react-best-practices/SKILL.md dan $S/vercel-composition-patterns/SKILL.md; (3) sebelum menyatakan selesai, audit berkas yang diubah dengan $S/web-design-guidelines/SKILL.md. Hindari pola AI slop: semua isi dibungkus kartu, banner penjelas di badan halaman, gradien, emoji sebagai ikon, judul serif di setiap kartu."
jq -n --arg c "$pesan" '{hookSpecificOutput:{hookEventName:"PreToolUse",additionalContext:$c}}'
