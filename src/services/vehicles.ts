import { supabase } from "@/integrations/supabase/client";
import {
  DEMO_VEHICLES,
  findDemoVehicle,
  normalizePlate,
  type VehicleRecord,
  type VehicleReportRecord,
} from "@/data/vehicles";

export interface VehicleLookupResult {
  vehicle: VehicleRecord | null;
  /** "live" = read from Supabase, "demo" = seeded local registry. */
  source: "live" | "demo";
  /** Set when the live tables are missing/unreachable and we fell back. */
  fallbackReason?: string;
}

interface VehicleRow {
  plate: string;
  registered: boolean | null;
  owner_verified: boolean | null;
  type_bn: string | null;
  type_en: string | null;
  model_bn: string | null;
  model_en: string | null;
  registration_expiry: string | null;
  fitness_valid: boolean | null;
  tax_token_valid: boolean | null;
}

interface ReportRow {
  id: string;
  kind: string;
  note_bn: string | null;
  note_en: string | null;
  verified: boolean | null;
  created_at: string;
}

function mapRow(row: VehicleRow, reports: ReportRow[]): VehicleRecord {
  return {
    plate: row.plate,
    registered: row.registered ?? false,
    ownerVerified: row.owner_verified ?? false,
    typeBn: row.type_bn ?? "অজানা",
    typeEn: row.type_en ?? "Unknown",
    modelBn: row.model_bn ?? "—",
    modelEn: row.model_en ?? "—",
    registrationExpiry: row.registration_expiry ?? "—",
    fitnessValid: row.fitness_valid ?? false,
    taxTokenValid: row.tax_token_valid ?? false,
    reports: reports.map((r) => ({
      id: r.id,
      kind: (r.kind as VehicleReportRecord["kind"]) ?? "other",
      noteBn: r.note_bn ?? "",
      noteEn: r.note_en ?? "",
      verified: r.verified ?? false,
      createdAtISO: r.created_at,
    })),
  };
}

/**
 * Once the optional live tables are proven missing we stop calling them, so the
 * demo does not spam 404s on every keystroke.
 */
let liveRegistryAvailable = null as boolean | null;

function markLiveUnavailable(error: unknown) {
  const code = (error as { code?: string } | null)?.code;
  // PGRST205 = table not in schema cache (not provisioned). 42P01 = undefined table.
  if (code === "PGRST205" || code === "42P01") liveRegistryAvailable = false;
}

export function isLiveRegistryKnownUnavailable(): boolean {
  return liveRegistryAvailable === false;
}

/** Reports filed during this session while the live tables are unavailable. */
const demoSessionReports = new Map<string, VehicleReportRecord[]>();

function withSessionReports(vehicle: VehicleRecord): VehicleRecord {
  const extra = demoSessionReports.get(normalizePlate(vehicle.plate));
  if (!extra?.length) return vehicle;
  return { ...vehicle, reports: [...extra, ...vehicle.reports] };
}

/**
 * Looks the plate up in Supabase first; if the optional `vehicles` table is not
 * provisioned (or the request fails) the seeded demo registry answers instead,
 * so the page always stays usable as a demo.
 */
export async function lookupVehicle(query: string): Promise<VehicleLookupResult> {
  const normalized = normalizePlate(query);
  if (!normalized) return { vehicle: null, source: "demo" };

  const demoAnswer = (reason: string): VehicleLookupResult => {
    const demo = findDemoVehicle(query);
    return {
      vehicle: demo ? withSessionReports(demo) : null,
      source: "demo",
      fallbackReason: reason,
    };
  };

  if (liveRegistryAvailable === false) return demoAnswer("live_registry_unavailable");

  try {
    const { data, error } = await supabase
      .from("vehicles")
      .select(
        "plate, registered, owner_verified, type_bn, type_en, model_bn, model_en, registration_expiry, fitness_valid, tax_token_valid, plate_normalized",
      )
      .eq("plate_normalized", normalized)
      .maybeSingle();

    if (error) throw error;
    liveRegistryAvailable = true;

    if (data) {
      const { data: reports } = await supabase
        .from("vehicle_reports")
        .select("id, kind, note_bn, note_en, verified, created_at")
        .eq("plate_normalized", normalized)
        .order("created_at", { ascending: false })
        .limit(30);
      return { vehicle: mapRow(data as VehicleRow, (reports ?? []) as ReportRow[]), source: "live" };
    }

    // Table exists but no such plate — still offer the demo registry.
    const demo = findDemoVehicle(query);
    return demo
      ? { vehicle: withSessionReports(demo), source: "demo", fallbackReason: "not_in_live_registry" }
      : { vehicle: null, source: "live" };
  } catch (error) {
    markLiveUnavailable(error);
    return demoAnswer("live_registry_unavailable");
  }
}

export interface VehicleReportInput {
  plate: string;
  kind: VehicleReportRecord["kind"];
  noteBn: string;
  noteEn?: string;
}

export interface VehicleReportResult {
  stored: "live" | "demo";
}

/**
 * Files a public safety report. Writes to Supabase when the tables exist;
 * otherwise the report is kept for this session so the demo flow still works.
 */
export async function submitVehicleReport(
  input: VehicleReportInput,
  userId: string | null,
): Promise<VehicleReportResult> {
  const normalized = normalizePlate(input.plate);

  const keepLocally = () => {
    const list = demoSessionReports.get(normalized) ?? [];
    list.unshift({
      id: `session-${Date.now()}`,
      kind: input.kind,
      noteBn: input.noteBn.trim(),
      noteEn: input.noteEn?.trim() || "Submitted in demo mode",
      createdAtISO: new Date().toISOString(),
      verified: false,
    });
    demoSessionReports.set(normalized, list);
    return { stored: "demo" as const };
  };

  if (liveRegistryAvailable === false || !userId) return keepLocally();

  const { error } = await supabase.from("vehicle_reports").insert({
    plate: input.plate.trim(),
    plate_normalized: normalized,
    kind: input.kind,
    note_bn: input.noteBn.trim(),
    note_en: input.noteEn?.trim() || null,
    user_id: userId,
  });

  if (error) {
    markLiveUnavailable(error);
    if (isLiveRegistryKnownUnavailable()) return keepLocally();
    throw error;
  }
  return { stored: "live" };
}

/** Plate suggestions for the search field (demo registry + live prefix match). */
export async function suggestPlates(query: string): Promise<string[]> {
  const q = normalizePlate(query);
  const local = DEMO_VEHICLES.map((v) => v.plate).filter((p) =>
    q ? normalizePlate(p).includes(q) : true,
  );
  if (!q || liveRegistryAvailable === false) return local.slice(0, 5);
  try {
    const { data, error } = await supabase
      .from("vehicles")
      .select("plate, plate_normalized")
      .ilike("plate_normalized", `%${q}%`)
      .limit(5);
    if (error) throw error;
    const live = (data ?? []).map((r) => (r as { plate: string }).plate);
    return Array.from(new Set([...live, ...local])).slice(0, 6);
  } catch (error) {
    markLiveUnavailable(error);
    return local.slice(0, 5);
  }
}

