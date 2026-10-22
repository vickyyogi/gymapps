import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const muscles = [
  { code: "chest", nameId: "Dada", nameEn: "Chest", icon: "chest" },
  { code: "back", nameId: "Punggung", nameEn: "Back", icon: "back" },
  { code: "shoulders", nameId: "Bahu", nameEn: "Shoulders", icon: "shoulders" },
  { code: "biceps", nameId: "Bisep", nameEn: "Biceps", icon: "biceps" },
  { code: "triceps", nameId: "Trisep", nameEn: "Triceps", icon: "triceps" },
  { code: "forearms", nameId: "Lengan Bawah", nameEn: "Forearms", icon: "forearms" },
  { code: "quads", nameId: "Paha Depan", nameEn: "Quads", icon: "quads" },
  { code: "hamstrings", nameId: "Paha Belakang", nameEn: "Hamstrings", icon: "hamstrings" },
  { code: "glutes", nameId: "Bokong", nameEn: "Glutes", icon: "glutes" },
  { code: "calves", nameId: "Betis", nameEn: "Calves", icon: "calves" },
  { code: "abs", nameId: "Perut", nameEn: "Abs", icon: "abs" },
  { code: "obliques", nameId: "Otot Samping", nameEn: "Obliques", icon: "obliques" },
  { code: "adductors", nameId: "Adduktor", nameEn: "Adductors", icon: "adductors" },
  { code: "abductors", nameId: "Abduktor", nameEn: "Abductors", icon: "abductors" },
  { code: "lats", nameId: "Lats", nameEn: "Lats", icon: "lats" },
  { code: "traps", nameId: "Trapesium", nameEn: "Traps", icon: "traps" },
  { code: "lower_back", nameId: "Punggung Bawah", nameEn: "Lower Back", icon: "lower-back" },
  { code: "full_body", nameId: "Seluruh Tubuh", nameEn: "Full Body", icon: "full-body" },
  { code: "cardio", nameId: "Kardio", nameEn: "Cardio", icon: "cardio" },
  { code: "core", nameId: "Core", nameEn: "Core", icon: "core" }
] as const;

const equipment = [
  { code: "bodyweight", nameId: "Berat Badan", nameEn: "Bodyweight", icon: "bodyweight" },
  { code: "dumbbell", nameId: "Dumbbell", nameEn: "Dumbbell", icon: "dumbbell" },
  { code: "barbell", nameId: "Barbell", nameEn: "Barbell", icon: "barbell" },
  { code: "machine", nameId: "Mesin", nameEn: "Machine", icon: "machine" },
  { code: "cable", nameId: "Kabel", nameEn: "Cable", icon: "cable" },
  { code: "bench", nameId: "Bangku", nameEn: "Bench", icon: "bench" },
  { code: "pullup_bar", nameId: "Pull-up Bar", nameEn: "Pull-up Bar", icon: "pullup-bar" },
  { code: "kettlebell", nameId: "Kettlebell", nameEn: "Kettlebell", icon: "kettlebell" },
  {
    code: "resistance_band",
    nameId: "Band Resistance",
    nameEn: "Resistance Band",
    icon: "resistance-band"
  },
  {
    code: "cardio_machine",
    nameId: "Mesin Kardio",
    nameEn: "Cardio Machine",
    icon: "cardio-machine"
  },
  { code: "smith_machine", nameId: "Smith Machine", nameEn: "Smith Machine", icon: "smith-machine" },
  { code: "dip_bar", nameId: "Dip Bar", nameEn: "Dip Bar", icon: "dip-bar" },
  { code: "landmine", nameId: "Landmine", nameEn: "Landmine", icon: "landmine" },
  { code: "sled", nameId: "Sled", nameEn: "Sled", icon: "sled" },
  { code: "other", nameId: "Lainnya", nameEn: "Other", icon: "other" }
] as const;

async function main() {
  for (const [index, m] of muscles.entries()) {
    await prisma.muscle.upsert({
      where: { code: m.code },
      update: { nameId: m.nameId, nameEn: m.nameEn, icon: m.icon, sortOrder: index },
      create: { code: m.code, nameId: m.nameId, nameEn: m.nameEn, icon: m.icon, sortOrder: index }
    });
  }

  for (const [index, e] of equipment.entries()) {
    await prisma.equipment.upsert({
      where: { code: e.code },
      update: { nameId: e.nameId, nameEn: e.nameEn, icon: e.icon, sortOrder: index },
      create: { code: e.code, nameId: e.nameId, nameEn: e.nameEn, icon: e.icon, sortOrder: index }
    });
  }

  const [muscleCount, equipmentCount] = await Promise.all([
    prisma.muscle.count(),
    prisma.equipment.count()
  ]);
  console.log(`seed ok: ${muscleCount} muscles, ${equipmentCount} equipment`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
