import { NextResponse } from "next/server";
import { prisma, Prisma } from "@gymapps/db";
import { withAuthApi, parseJson, clientIp } from "@/lib/api/handler";
import { profileSchema } from "@/lib/api/phase4-validation";
import { serializeProfile } from "@/lib/api/phase4-serializers";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

async function profileWithUser(userId: string) {
  return prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { profile: true }
  });
}

export const GET = withAuthApi(async ({ session }) => {
  await prisma.userProfile.upsert({
    where: { userId: session.user.id },
    update: {},
    create: { userId: session.user.id }
  });
  const user = await profileWithUser(session.user.id);
  return NextResponse.json({ data: serializeProfile(user.profile!, user) });
});

export const PATCH = withAuthApi(async ({ request, session }) => {
  const input = await parseJson(request, profileSchema);

  const profileData: Prisma.UserProfileUncheckedUpdateInput = {};
  if (input.goals !== undefined) profileData.goals = input.goals;
  if (input.experience_level !== undefined) profileData.experienceLevel = input.experience_level;
  if (input.days_per_week !== undefined) profileData.daysPerWeek = input.days_per_week;
  if (input.session_minutes !== undefined) profileData.sessionMinutes = input.session_minutes;
  if (input.equipment !== undefined) profileData.equipment = input.equipment;
  if (input.injury_areas !== undefined) profileData.injuryAreas = input.injury_areas;
  if (input.injury_notes !== undefined) profileData.injuryNotes = input.injury_notes;
  if (input.preferred_split !== undefined) profileData.preferredSplit = input.preferred_split;
  if (input.preferred_cardio !== undefined) profileData.preferredCardio = input.preferred_cardio;
  if (input.height_cm !== undefined) profileData.heightCm = input.height_cm;
  if (input.birth_date !== undefined) profileData.birthDate = input.birth_date;
  if (input.sex !== undefined) profileData.sex = input.sex;
  if (input.program_style_notes !== undefined) {
    profileData.programStyleNotes = input.program_style_notes;
  }

  const userData: Prisma.UserUpdateInput = {};
  if (input.display_name !== undefined) userData.displayName = input.display_name;
  if (input.locale !== undefined) userData.locale = input.locale;
  if (input.unit_system !== undefined) userData.unitSystem = input.unit_system;
  if (input.timezone !== undefined) userData.timezone = input.timezone;
  if (input.theme !== undefined) userData.theme = input.theme;
  if (input.email_opt_in !== undefined) userData.emailOptIn = input.email_opt_in;

  await prisma.$transaction(async (tx) => {
    await tx.userProfile.upsert({
      where: { userId: session.user.id },
      update: {},
      create: { userId: session.user.id }
    });
    await tx.userProfile.update({ where: { userId: session.user.id }, data: profileData });
    if (Object.keys(userData).length > 0) {
      await tx.user.update({ where: { id: session.user.id }, data: userData });
    }
  });

  await writeAudit({
    userId: session.user.id,
    action: "profile.updated",
    entityType: "user_profile",
    entityId: session.user.id,
    after: { profile: Object.keys(profileData), user: Object.keys(userData) },
    ipAddress: clientIp(request)
  });

  const user = await profileWithUser(session.user.id);
  return NextResponse.json({ data: serializeProfile(user.profile!, user) });
});
