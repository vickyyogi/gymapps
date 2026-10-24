export type UnitSystem = "metric" | "imperial";

export const KG_TO_LB = 2.2046226218;

export function kgToLb(kg: number): number {
  if (!Number.isFinite(kg)) return 0;
  return Math.round(kg * KG_TO_LB * 10) / 10;
}

export function lbToKg(lb: number): number {
  if (!Number.isFinite(lb)) return 0;
  return Math.round((lb / KG_TO_LB) * 100) / 100;
}

export function fromKg(kg: number, unit: UnitSystem): number {
  if (!Number.isFinite(kg)) return 0;
  return unit === "imperial" ? kgToLb(kg) : Math.round(kg * 10) / 10;
}

export function toKg(value: number, unit: UnitSystem): number {
  if (!Number.isFinite(value)) return 0;
  return unit === "imperial" ? lbToKg(value) : Math.round(value * 100) / 100;
}

export function weightUnitLabel(unit: UnitSystem): "kg" | "lb" {
  return unit === "imperial" ? "lb" : "kg";
}
