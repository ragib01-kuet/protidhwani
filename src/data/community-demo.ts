import type { CommunityPostKind } from "@/integrations/supabase/database.types";
import type { CommentWithAuthor, PostWithAuthor } from "@/services/community";
import type { FeedFilters, FeedSort } from "@/services/community";

import reliefImage from "@/assets/demo/community-relief.jpg";
import roadImage from "@/assets/demo/community-road.jpg";
import streetlightImage from "@/assets/demo/community-streetlight.jpg";
import waterloggingImage from "@/assets/demo/community-waterlogging.jpg";

export const DEMO_POST_PREFIX = "demo-";

export const isDemoPost = (id: string) => id.startsWith(DEMO_POST_PREFIX);

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();

function author(
  id: string,
  bn: string,
  en: string,
  username: string,
): PostWithAuthor["author"] {
  return { id, full_name: en, full_name_bn: bn, username, avatar_url: null };
}

/**
 * Seeded demo feed with photos. Used when the live feed has nothing to show
 * (fresh Supabase project, filtered-out view, or tables not provisioned yet),
 * so the community experience is always demonstrable.
 */
export const DEMO_POSTS: PostWithAuthor[] = [
  {
    id: `${DEMO_POST_PREFIX}waterlogging`,
    user_id: `${DEMO_POST_PREFIX}user-1`,
    kind: "report" as CommunityPostKind,
    title: "মিরপুর ১০-এ হাঁটুপানি, যান চলাচল বন্ধ",
    title_en: "Knee-deep waterlogging at Mirpur 10",
    body:
      "গতরাতের ভারী বৃষ্টিতে মিরপুর ১০ গোলচত্বর থেকে কাজীপাড়া পর্যন্ত পুরো সড়ক পানির নিচে। রিকশা ছাড়া কিছুই চলছে না, স্কুলগামী শিশুরা আটকে আছে। ড্রেন পরিষ্কারের জন্য সিটি করপোরেশনে দ্রুত ব্যবস্থা প্রয়োজন।",
    body_en:
      "Heavy overnight rain has submerged the road from Mirpur 10 roundabout to Kazipara. Only rickshaws are moving and school children are stranded. The city corporation needs to clear the drains urgently.",
    location: "মিরপুর ১০ · Mirpur 10, মিরপুর · Mirpur",
    district: "Dhaka",
    tags: ["জলাবদ্ধতা", "waterlogging", "drainage"],
    image_urls: [waterloggingImage],
    level: "high",
    status: "verified",
    support_count: 342,
    comment_count: 2,
    created_at: hoursAgo(3),
    updated_at: hoursAgo(3),
    author: author(`${DEMO_POST_PREFIX}user-1`, "নাফিসা রহমান", "Nafisa Rahman", "nafisa"),
  },
  {
    id: `${DEMO_POST_PREFIX}road`,
    user_id: `${DEMO_POST_PREFIX}user-2`,
    kind: "report" as CommunityPostKind,
    title: "ভাঙা সড়কে বড় গর্ত, দুর্ঘটনার ঝুঁকি",
    title_en: "Open pit on a broken road is causing accidents",
    body:
      "আগ্রাবাদ এলাকায় সংস্কারের কাজ অসমাপ্ত রেখে ঠিকাদার চলে গেছে। রাতে গর্তটি দেখা যায় না, ইতিমধ্যে দুটি মোটরসাইকেল দুর্ঘটনা ঘটেছে। ব্যারিকেড ও দ্রুত মেরামত দরকার।",
    body_en:
      "The contractor left the repair work unfinished in Agrabad. The pit is invisible at night and two motorcycle accidents have already happened. Barricades and immediate repair are needed.",
    location: "আগ্রাবাদ · Agrabad",
    district: "Chattogram",
    tags: ["সড়ক", "road", "safety"],
    image_urls: [roadImage],
    level: "moderate",
    status: "pending",
    support_count: 128,
    comment_count: 1,
    created_at: hoursAgo(9),
    updated_at: hoursAgo(9),
    author: author(`${DEMO_POST_PREFIX}user-2`, "তানভীর হাসান", "Tanvir Hasan", "tanvir"),
  },
  {
    id: `${DEMO_POST_PREFIX}streetlight`,
    user_id: `${DEMO_POST_PREFIX}user-3`,
    kind: "emergency" as CommunityPostKind,
    title: "অন্ধকার সড়কে ছিনতাই বাড়ছে",
    title_en: "Muggings rising on an unlit street",
    body:
      "শাহজালাল উপশহরের প্রধান সড়কের বাতিগুলো দুই সপ্তাহ ধরে নষ্ট। সন্ধ্যার পর একা চলাচল ঝুঁকিপূর্ণ, গত সপ্তাহে তিনটি ছিনতাইয়ের ঘটনা ঘটেছে। বাতি মেরামত ও টহল বাড়ানো জরুরি।",
    body_en:
      "Street lamps on the main road of Shahjalal Upashahar have been dead for two weeks. Walking alone after dusk is risky and three muggings happened last week. Lamps must be fixed and patrols increased.",
    location: "উপশহর · Upashahar, সিলেট সদর · Sylhet Sadar",
    district: "Sylhet",
    tags: ["নিরাপত্তা", "safety", "streetlight"],
    image_urls: [streetlightImage],
    level: "critical",
    status: "pending",
    support_count: 517,
    comment_count: 1,
    created_at: hoursAgo(20),
    updated_at: hoursAgo(20),
    author: author(`${DEMO_POST_PREFIX}user-3`, "সাদিয়া ইসলাম", "Sadia Islam", "sadia"),
  },
  {
    id: `${DEMO_POST_PREFIX}relief`,
    user_id: `${DEMO_POST_PREFIX}user-4`,
    kind: "event" as CommunityPostKind,
    title: "শনিবার ত্রাণ ও বিশুদ্ধ পানি বিতরণ",
    title_en: "Relief and clean water distribution on Saturday",
    body:
      "স্থানীয় স্বেচ্ছাসেবকরা শনিবার সকাল ৯টা থেকে দুপুর ১টা পর্যন্ত ত্রাণ ও বিশুদ্ধ পানি বিতরণ করবেন। স্বেচ্ছাসেবক হিসেবে যুক্ত হতে চাইলে কমেন্টে জানান।",
    body_en:
      "Local volunteers will distribute relief kits and clean water on Saturday from 9am to 1pm. Comment below if you want to join as a volunteer.",
    location: "খালিশপুর · Khalishpur, খালিশপুর · Khalishpur",
    district: "Khulna",
    tags: ["ত্রাণ", "relief", "volunteer"],
    image_urls: [reliefImage],
    level: "moderate",
    status: "verified",
    support_count: 89,
    comment_count: 1,
    created_at: hoursAgo(30),
    updated_at: hoursAgo(30),
    author: author(`${DEMO_POST_PREFIX}user-4`, "রুবেল আহমেদ", "Rubel Ahmed", "rubel"),
  },
];

export const DEMO_COMMENTS: Record<string, CommentWithAuthor[]> = {
  [`${DEMO_POST_PREFIX}waterlogging`]: [
    {
      id: `${DEMO_POST_PREFIX}c1`,
      post_id: `${DEMO_POST_PREFIX}waterlogging`,
      user_id: `${DEMO_POST_PREFIX}user-2`,
      body: "কাজীপাড়া অংশেও একই অবস্থা · Same situation in Kazipara.",
      created_at: hoursAgo(2),
      author: author(`${DEMO_POST_PREFIX}user-2`, "তানভীর হাসান", "Tanvir Hasan", "tanvir"),
    } as CommentWithAuthor,
    {
      id: `${DEMO_POST_PREFIX}c2`,
      post_id: `${DEMO_POST_PREFIX}waterlogging`,
      user_id: `${DEMO_POST_PREFIX}user-3`,
      body: "সিটি করপোরেশনে অভিযোগ জমা দিয়েছি · Filed a complaint with the city corporation.",
      created_at: hoursAgo(1),
      author: author(`${DEMO_POST_PREFIX}user-3`, "সাদিয়া ইসলাম", "Sadia Islam", "sadia"),
    } as CommentWithAuthor,
  ],
  [`${DEMO_POST_PREFIX}road`]: [
    {
      id: `${DEMO_POST_PREFIX}c3`,
      post_id: `${DEMO_POST_PREFIX}road`,
      user_id: `${DEMO_POST_PREFIX}user-4`,
      body: "রাতে ব্যারিকেড বসানো দরকার · Barricades are needed at night.",
      created_at: hoursAgo(6),
      author: author(`${DEMO_POST_PREFIX}user-4`, "রুবেল আহমেদ", "Rubel Ahmed", "rubel"),
    } as CommentWithAuthor,
  ],
  [`${DEMO_POST_PREFIX}streetlight`]: [
    {
      id: `${DEMO_POST_PREFIX}c4`,
      post_id: `${DEMO_POST_PREFIX}streetlight`,
      user_id: `${DEMO_POST_PREFIX}user-1`,
      body: "থানায় জিডি করা হয়েছে · A general diary has been filed.",
      created_at: hoursAgo(12),
      author: author(`${DEMO_POST_PREFIX}user-1`, "নাফিসা রহমান", "Nafisa Rahman", "nafisa"),
    } as CommentWithAuthor,
  ],
  [`${DEMO_POST_PREFIX}relief`]: [
    {
      id: `${DEMO_POST_PREFIX}c5`,
      post_id: `${DEMO_POST_PREFIX}relief`,
      user_id: `${DEMO_POST_PREFIX}user-2`,
      body: "আমি স্বেচ্ছাসেবক হিসেবে থাকতে চাই · I would like to volunteer.",
      created_at: hoursAgo(20),
      author: author(`${DEMO_POST_PREFIX}user-2`, "তানভীর হাসান", "Tanvir Hasan", "tanvir"),
    } as CommentWithAuthor,
  ],
};

/** Client-side equivalent of the server feed query, for the demo dataset. */
export function filterDemoPosts(
  posts: PostWithAuthor[],
  filters: FeedFilters = {},
): PostWithAuthor[] {
  let list = [...posts];
  if (filters.mine) return [];
  if (filters.kind && filters.kind !== "all") list = list.filter((p) => p.kind === filters.kind);
  if (filters.district) list = list.filter((p) => p.district === filters.district);

  const term = filters.search?.trim().toLowerCase();
  if (term) {
    list = list.filter((p) =>
      [p.title, p.title_en, p.body, p.body_en, p.location, p.district, ...p.tags]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term)),
    );
  }

  const sort: FeedSort = filters.sort ?? "recent";
  list.sort((a, b) => {
    if (sort === "top") return b.support_count - a.support_count;
    if (sort === "discussed") return b.comment_count - a.comment_count;
    return b.created_at.localeCompare(a.created_at);
  });
  return list;
}
