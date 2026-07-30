/**
 * Administrative hierarchy used to scope the community feed:
 * জেলা (district) → উপজেলা/থানা (upazila / thana) → ইউনিয়ন/এলাকা (union / area).
 *
 * Coordinates are approximate centroids, used only to resolve the nearest
 * union when the browser grants geolocation permission.
 */

export interface Union {
  bn: string;
  en: string;
  lat: number;
  lng: number;
}

export interface Upazila {
  bn: string;
  en: string;
  lat: number;
  lng: number;
  unions: Union[];
}

export interface District {
  bn: string;
  en: string;
  unions?: never;
  upazilas: Upazila[];
}

const u = (bn: string, en: string, lat: number, lng: number): Union => ({ bn, en, lat, lng });

export const DISTRICT_TREE: District[] = [
  {
    bn: "ঢাকা",
    en: "Dhaka",
    upazilas: [
      {
        bn: "মিরপুর",
        en: "Mirpur",
        lat: 23.8069,
        lng: 90.3687,
        unions: [
          u("মিরপুর ১০", "Mirpur 10", 23.8069, 90.3687),
          u("কাজীপাড়া", "Kazipara", 23.7955, 90.3714),
          u("পল্লবী", "Pallabi", 23.8223, 90.3654),
          u("রূপনগর", "Rupnagar", 23.8135, 90.3549),
        ],
      },
      {
        bn: "ধানমন্ডি",
        en: "Dhanmondi",
        lat: 23.7461,
        lng: 90.376,
        unions: [
          u("ধানমন্ডি ২৭", "Dhanmondi 27", 23.7539, 90.3742),
          u("জিগাতলা", "Jigatola", 23.7405, 90.3746),
          u("হাজারীবাগ", "Hazaribagh", 23.7365, 90.3651),
        ],
      },
      {
        bn: "উত্তরা",
        en: "Uttara",
        lat: 23.8759,
        lng: 90.3795,
        unions: [
          u("উত্তরা সেক্টর ৭", "Uttara Sector 7", 23.8687, 90.3993),
          u("উত্তরা সেক্টর ১১", "Uttara Sector 11", 23.8776, 90.3873),
          u("আজমপুর", "Azampur", 23.8672, 90.3987),
        ],
      },
      {
        bn: "সাভার",
        en: "Savar",
        lat: 23.8583,
        lng: 90.2667,
        unions: [
          u("আশুলিয়া", "Ashulia", 23.9089, 90.3078),
          u("ধামসোনা", "Dhamsona", 23.9127, 90.2812),
          u("বিরুলিয়া", "Birulia", 23.8874, 90.3453),
        ],
      },
    ],
  },
  {
    bn: "চট্টগ্রাম",
    en: "Chattogram",
    upazilas: [
      {
        bn: "ডবলমুরিং",
        en: "Double Mooring",
        lat: 22.3323,
        lng: 91.8175,
        unions: [
          u("আগ্রাবাদ", "Agrabad", 22.3268, 91.8123),
          u("হালিশহর", "Halishahar", 22.3178, 91.7833),
          u("দেওয়ানহাট", "Dewanhat", 22.3345, 91.8213),
        ],
      },
      {
        bn: "পাঁচলাইশ",
        en: "Panchlaish",
        lat: 22.3617,
        lng: 91.8306,
        unions: [
          u("মুরাদপুর", "Muradpur", 22.3663, 91.8341),
          u("ষোলশহর", "Sholoshahar", 22.3702, 91.8412),
          u("চকবাজার", "Chawkbazar", 22.354, 91.8395),
        ],
      },
      {
        bn: "সীতাকুণ্ড",
        en: "Sitakunda",
        lat: 22.6167,
        lng: 91.6667,
        unions: [
          u("বাড়বকুণ্ড", "Barabkunda", 22.6521, 91.6402),
          u("কুমিরা", "Kumira", 22.5442, 91.7183),
        ],
      },
    ],
  },
  {
    bn: "রাজশাহী",
    en: "Rajshahi",
    upazilas: [
      {
        bn: "বোয়ালিয়া",
        en: "Boalia",
        lat: 24.3636,
        lng: 88.6241,
        unions: [
          u("সাহেব বাজার", "Saheb Bazar", 24.3702, 88.6042),
          u("উপশহর", "Upashahar", 24.3591, 88.6156),
          u("লক্ষ্মীপুর", "Laxmipur", 24.3673, 88.6215),
        ],
      },
      {
        bn: "পবা",
        en: "Paba",
        lat: 24.4333,
        lng: 88.6333,
        unions: [
          u("নওহাটা", "Nowhata", 24.4611, 88.6396),
          u("হড়গ্রাম", "Horgram", 24.3897, 88.5715),
        ],
      },
    ],
  },
  {
    bn: "খুলনা",
    en: "Khulna",
    upazilas: [
      {
        bn: "খালিশপুর",
        en: "Khalishpur",
        lat: 22.8456,
        lng: 89.5403,
        unions: [
          u("খালিশপুর", "Khalishpur", 22.8456, 89.5403),
          u("দৌলতপুর", "Daulatpur", 22.8756, 89.5301),
        ],
      },
      {
        bn: "সোনাডাঙ্গা",
        en: "Sonadanga",
        lat: 22.8103,
        lng: 89.5403,
        unions: [
          u("সোনাডাঙ্গা", "Sonadanga", 22.8103, 89.5403),
          u("বয়রা", "Boyra", 22.8228, 89.5312),
        ],
      },
    ],
  },
  {
    bn: "সিলেট",
    en: "Sylhet",
    upazilas: [
      {
        bn: "সিলেট সদর",
        en: "Sylhet Sadar",
        lat: 24.8949,
        lng: 91.8687,
        unions: [
          u("জিন্দাবাজার", "Zindabazar", 24.8949, 91.8687),
          u("উপশহর", "Upashahar", 24.8865, 91.8759),
          u("আম্বরখানা", "Ambarkhana", 24.9048, 91.8697),
        ],
      },
      {
        bn: "দক্ষিণ সুরমা",
        en: "Dakshin Surma",
        lat: 24.8698,
        lng: 91.8759,
        unions: [
          u("কদমতলী", "Kadamtali", 24.8781, 91.8811),
          u("সিলাম", "Silam", 24.8342, 91.8985),
        ],
      },
    ],
  },
  {
    bn: "বরিশাল",
    en: "Barishal",
    upazilas: [
      {
        bn: "কোতোয়ালী",
        en: "Kotwali",
        lat: 22.701,
        lng: 90.3535,
        unions: [
          u("নথুল্লাবাদ", "Nathullabad", 22.7176, 90.3676),
          u("সদর রোড", "Sadar Road", 22.7008, 90.3706),
        ],
      },
      {
        bn: "বাকেরগঞ্জ",
        en: "Bakerganj",
        lat: 22.5486,
        lng: 90.3369,
        unions: [
          u("কলসকাঠি", "Kalaskathi", 22.5629, 90.3161),
          u("দুধল", "Dudhal", 22.5301, 90.3752),
        ],
      },
    ],
  },
  {
    bn: "রংপুর",
    en: "Rangpur",
    upazilas: [
      {
        bn: "রংপুর সদর",
        en: "Rangpur Sadar",
        lat: 25.7439,
        lng: 89.2752,
        unions: [
          u("মেডিকেল মোড়", "Medical More", 25.7452, 89.2601),
          u("ধাপ", "Dhap", 25.7527, 89.2478),
        ],
      },
      {
        bn: "মিঠাপুকুর",
        en: "Mithapukur",
        lat: 25.5622,
        lng: 89.2708,
        unions: [
          u("পায়রাবন্দ", "Payrabond", 25.5765, 89.2432),
          u("বালুয়া মাসিমপুর", "Balua Masimpur", 25.5389, 89.2966),
        ],
      },
    ],
  },
  {
    bn: "ময়মনসিংহ",
    en: "Mymensingh",
    upazilas: [
      {
        bn: "ময়মনসিংহ সদর",
        en: "Mymensingh Sadar",
        lat: 24.7471,
        lng: 90.4203,
        unions: [
          u("চরপাড়া", "Charpara", 24.7561, 90.4045),
          u("গাঙ্গিনারপাড়", "Ganginarpar", 24.7495, 90.4062),
        ],
      },
      {
        bn: "ত্রিশাল",
        en: "Trishal",
        lat: 24.5833,
        lng: 90.4,
        unions: [
          u("ত্রিশাল সদর", "Trishal Sadar", 24.5833, 90.4),
          u("বালিপাড়া", "Balipara", 24.6224, 90.3702),
        ],
      },
    ],
  },
];

export interface AreaScope {
  district: string;
  upazila: string | null;
  union: string | null;
  /** How the scope was resolved. */
  source: "gps" | "manual";
}

export interface ResolvedArea {
  district: District;
  upazila: Upazila;
  union: Union;
  distanceKm: number;
}

export const findDistrict = (en: string) => DISTRICT_TREE.find((d) => d.en === en) ?? null;

export const findUpazila = (districtEn: string, upazilaEn: string) =>
  findDistrict(districtEn)?.upazilas.find((x) => x.en === upazilaEn) ?? null;

export const findUnion = (districtEn: string, upazilaEn: string, unionEn: string) =>
  findUpazila(districtEn, upazilaEn)?.unions.find((x) => x.en === unionEn) ?? null;

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Nearest seeded union to a GPS fix. */
export function resolveNearestArea(lat: number, lng: number): ResolvedArea | null {
  let best: ResolvedArea | null = null;
  for (const district of DISTRICT_TREE) {
    for (const upazila of district.upazilas) {
      for (const union of upazila.unions) {
        const distanceKm = haversineKm(lat, lng, union.lat, union.lng);
        if (!best || distanceKm < best.distanceKm) best = { district, upazila, union, distanceKm };
      }
    }
  }
  return best;
}

/** "Union · Upazila · District" label for a scope, Bangla dominant. */
export function scopeLabel(scope: AreaScope): { bn: string; en: string } {
  const district = findDistrict(scope.district);
  const upazila = scope.upazila ? findUpazila(scope.district, scope.upazila) : null;
  const union = upazila && scope.union ? findUnion(scope.district, scope.upazila!, scope.union) : null;
  const bn = [union?.bn, upazila?.bn, district?.bn].filter(Boolean).join(" · ");
  const en = [union?.en, upazila?.en, district?.en].filter(Boolean).join(" · ");
  return { bn: bn || "বাংলাদেশ", en: en || "Bangladesh" };
}

/** Canonical `location` string stored on posts created inside a scope. */
export function scopeLocationString(scope: AreaScope): string {
  const upazila = scope.upazila ? findUpazila(scope.district, scope.upazila) : null;
  const union = upazila && scope.union ? findUnion(scope.district, scope.upazila!, scope.union) : null;
  const parts = [
    union ? `${union.bn} · ${union.en}` : null,
    upazila ? `${upazila.bn} · ${upazila.en}` : null,
  ].filter(Boolean);
  return parts.join(", ");
}

/**
 * Does a post belong to this scope? District must match; upazila/union are
 * matched against the free-text `location` field (both scripts).
 */
export function postInScope(
  post: { district: string | null; location: string | null },
  scope: AreaScope | null,
): boolean {
  if (!scope) return true;
  if ((post.district ?? "") !== scope.district) return false;
  const haystack = (post.location ?? "").toLowerCase();
  const needle = (name: { bn: string; en: string } | null) =>
    !name || haystack.includes(name.bn.toLowerCase()) || haystack.includes(name.en.toLowerCase());

  const upazila = scope.upazila ? findUpazila(scope.district, scope.upazila) : null;
  if (upazila && !needle(upazila)) {
    // A post may only name its union — accept it if the union belongs here.
    const inUpazila = upazila.unions.some((x) => needle(x));
    if (!inUpazila) return false;
  }
  if (scope.union) {
    const union = upazila?.unions.find((x) => x.en === scope.union) ?? null;
    if (union && !needle(union)) return false;
  }
  return true;
}
