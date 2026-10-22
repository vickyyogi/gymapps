import type { BodyMetric, Note, User, UserProfile } from "@gymapps/db";

function num(value: { toString(): string } | number | null) {
  return value === null ? null : Number(value);
}

export function serializeProfile(profile: UserProfile, user: User) {
  return {
    id: user.id,
    user_id: user.id,
    goals: profile.goals,
    experience_level: profile.experienceLevel,
    days_per_week: profile.daysPerWeek,
    session_minutes: profile.sessionMinutes,
    equipment: profile.equipment,
    injury_areas: profile.injuryAreas,
    injury_notes: profile.injuryNotes,
    preferred_split: profile.preferredSplit,
    preferred_cardio: profile.preferredCardio,
    height_cm: num(profile.heightCm),
    birth_date: profile.birthDate ? profile.birthDate.toISOString().slice(0, 10) : null,
    sex: profile.sex,
    program_style_notes: profile.programStyleNotes,
    display_name: user.displayName,
    locale: user.locale,
    unit_system: user.unitSystem,
    timezone: user.timezone,
    theme: user.theme,
    created_at: profile.createdAt.toISOString(),
    updated_at: profile.updatedAt.toISOString()
  };
}

export function serializeBodyMetric(metric: BodyMetric) {
  return {
    id: metric.id,
    recorded_on: metric.recordedOn.toISOString().slice(0, 10),
    weight_kg: num(metric.weightKg),
    body_fat_pct: num(metric.bodyFatPct),
    chest_cm: num(metric.chestCm),
    waist_cm: num(metric.waistCm),
    hip_cm: num(metric.hipCm),
    arm_cm: num(metric.armCm),
    thigh_cm: num(metric.thighCm),
    calf_cm: num(metric.calfCm),
    shoulder_cm: num(metric.shoulderCm),
    photo_urls: metric.photoUrls,
    notes: metric.notes
  };
}

export function serializeNote(note: Note) {
  return {
    id: note.id,
    body: note.body,
    category: note.category,
    workout_id: note.workoutId,
    is_pinned: note.isPinned,
    created_at: note.createdAt.toISOString()
  };
}
