import { jalankanSeed } from "../src/lib/seed";

jalankanSeed({ reset: true })
  .then((r) => {
    console.log("Seed selesai:", r);
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
