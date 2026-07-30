export type PostKind =
  | "report"
  | "emergency"
  | "verified"
  | "discussion"
  | "rights"
  | "missing"
  | "poll"
  | "event";

export type Post = {
  id: string;
  kind: PostKind;
  author: { id?: string; bn: string; en: string; initials: string; verified: boolean };
  location: { bn: string; en: string };
  time: { bn: string; en: string };
  title: { bn: string; en: string };
  body: { bn: string; en: string };
  tags: { bn: string; en: string }[];
  support: number;
  comments: number;
  status: "verified" | "pending" | "disputed";
  level?: "critical" | "high" | "moderate";
  evidence?: number;
  /** 1:1 demo media rendered in the feed card. */
  images?: string[];
};

import gasLeakImage from "@/assets/demo/explore-gasleak.jpg";
import trafficImage from "@/assets/demo/explore-traffic.jpg";
import missingImage from "@/assets/demo/explore-missing.jpg";
import legalImage from "@/assets/demo/explore-legal.jpg";
import pollImage from "@/assets/demo/explore-poll.jpg";
import reliefImage from "@/assets/demo/community-relief.jpg";
import roadImage from "@/assets/demo/community-road.jpg";
import streetlightImage from "@/assets/demo/community-streetlight.jpg";
import waterloggingImage from "@/assets/demo/community-waterlogging.jpg";

export const kindMeta: Record<
  PostKind,
  { bn: string; en: string; tone: "brand" | "emergency" | "verified" | "warning" }
> = {
  report: { bn: "অভিযোগ", en: "Report", tone: "brand" },
  emergency: { bn: "জরুরি", en: "Emergency", tone: "emergency" },
  verified: { bn: "যাচাইকৃত তথ্য", en: "Verified Info", tone: "verified" },
  discussion: { bn: "আলোচনা", en: "Discussion", tone: "brand" },
  rights: { bn: "অধিকার", en: "Rights", tone: "verified" },
  missing: { bn: "নিখোঁজ", en: "Missing Person", tone: "warning" },
  poll: { bn: "জনমত", en: "Poll", tone: "brand" },
  event: { bn: "কর্মসূচি", en: "Event", tone: "warning" },
};

export const posts: Post[] = [
  {
    id: "1",
    images: [gasLeakImage, roadImage, streetlightImage],
    kind: "emergency",
    author: { id: "demo-rumana", bn: "রুমানা হক", en: "Rumana Haque", initials: "রু", verified: true },
    location: { bn: "মিরপুর ১০, ঢাকা", en: "Mirpur 10, Dhaka" },
    time: { bn: "৪ মিনিট আগে", en: "4 minutes ago" },
    title: {
      bn: "গ্যাস লিক থেকে আগুনের ঝুঁকি",
      en: "Fire risk from gas leak on main road",
    },
    body: {
      bn: "মূল সড়কের পাশে গ্যাস লাইনে লিক ধরা পড়েছে। ফায়ার সার্ভিসকে জানানো হয়েছে, এলাকা এড়িয়ে চলুন।",
      en: "A gas line leak has been detected beside the main road. Fire service notified — please avoid the area.",
    },
    tags: [
      { bn: "অগ্নিঝুঁকি", en: "Fire risk" },
      { bn: "মিরপুর", en: "Mirpur" },
    ],
    support: 412,
    comments: 63,
    status: "verified",
    level: "critical",
    evidence: 3,
  },
  {
    id: "2",
    images: [trafficImage],
    kind: "verified",
    author: { id: "demo-traffic-unit", bn: "সিটি ট্রাফিক ইউনিট", en: "City Traffic Unit", initials: "সি", verified: true },
    location: { bn: "গুলশান ২, ঢাকা", en: "Gulshan 2, Dhaka" },
    time: { bn: "২৫ মিনিট আগে", en: "25 minutes ago" },
    title: {
      bn: "বিকল্প রুট চালু হয়েছে",
      en: "Alternate route opened for evening commute",
    },
    body: {
      bn: "মেরামত কাজের কারণে দুইটি লেন বন্ধ থাকবে আজ রাত ১০টা পর্যন্ত। বিকল্প রুট মানচিত্রে যুক্ত করা হয়েছে।",
      en: "Two lanes stay closed until 10 PM for repairs. The alternate route is now marked on the safety map.",
    },
    tags: [
      { bn: "ট্রাফিক", en: "Traffic" },
      { bn: "যাচাইকৃত", en: "Verified" },
    ],
    support: 1284,
    comments: 96,
    status: "verified",
    evidence: 1,
  },
  {
    id: "3",
    images: [missingImage, waterloggingImage],
    kind: "missing",
    author: { id: "demo-afsana", bn: "আফসানা মিম", en: "Afsana Mim", initials: "আ", verified: false },
    location: { bn: "চট্টগ্রাম", en: "Chattogram" },
    time: { bn: "১ ঘন্টা আগে", en: "1 hour ago" },
    title: { bn: "নিখোঁজ: তানভীর, বয়স ১২", en: "Missing: Tanvir, age 12" },
    body: {
      bn: "গতকাল বিকেল থেকে নিখোঁজ। পরনে নীল স্কুল ইউনিফর্ম। তথ্য থাকলে অনুগ্রহ করে জানান।",
      en: "Missing since yesterday afternoon, wearing a blue school uniform. Please share any information.",
    },
    tags: [
      { bn: "নিখোঁজ", en: "Missing" },
      { bn: "শিশু", en: "Child" },
    ],
    support: 3120,
    comments: 214,
    status: "pending",
    level: "high",
    evidence: 2,
  },
  {
    id: "4",
    images: [legalImage],
    kind: "rights",
    author: { id: "demo-legal-aid", bn: "নাগরিক আইন সহায়তা", en: "Citizen Legal Aid", initials: "না", verified: true },
    location: { bn: "রাজশাহী", en: "Rajshahi" },
    time: { bn: "৩ ঘন্টা আগে", en: "3 hours ago" },
    title: {
      bn: "শ্রমিকের বকেয়া মজুরি আদায়ের উপায়",
      en: "How to recover unpaid wages legally",
    },
    body: {
      bn: "শ্রম আদালতে অভিযোগ দায়েরের ধাপগুলো এবং প্রয়োজনীয় কাগজপত্রের যাচাইকৃত তালিকা।",
      en: "Verified checklist of documents and the step-by-step process for filing at the labour court.",
    },
    tags: [
      { bn: "শ্রম অধিকার", en: "Labour rights" },
      { bn: "আইন", en: "Legal" },
    ],
    support: 878,
    comments: 41,
    status: "verified",
  },
  {
    id: "5",
    images: [pollImage, reliefImage, waterloggingImage, roadImage, streetlightImage],
    kind: "poll",
    author: { id: "demo-ward19", bn: "ওয়ার্ড ১৯ কমিউনিটি", en: "Ward 19 Community", initials: "ও", verified: false },
    location: { bn: "খুলনা", en: "Khulna" },
    time: { bn: "৫ ঘন্টা আগে", en: "5 hours ago" },
    title: {
      bn: "আপনার এলাকার সবচেয়ে বড় সমস্যা কী?",
      en: "What is the biggest problem in your area?",
    },
    body: {
      bn: "জলাবদ্ধতা · সড়কবাতি · বর্জ্য ব্যবস্থাপনা · নিরাপত্তা — মতামত দিন, ফল সিটি কর্পোরেশনে পাঠানো হবে।",
      en: "Waterlogging · Street lights · Waste · Safety — results will be forwarded to the city corporation.",
    },
    tags: [
      { bn: "জনমত", en: "Poll" },
      { bn: "ওয়ার্ড ১৯", en: "Ward 19" },
    ],
    support: 642,
    comments: 130,
    status: "pending",
  },
];

export const quickActions = [
  { icon: "🚨", bn: "এসওএস", en: "SOS", to: "/emergency", tone: "emergency" },
  { icon: "📢", bn: "অভিযোগ জানান", en: "Report Incident", to: "/community", tone: "brand" },
  { icon: "⚠️", bn: "ভুল তথ্য", en: "Report Misinformation", to: "/explore", tone: "warning" },
  { icon: "👤", bn: "নিখোঁজ ব্যক্তি", en: "Missing Person", to: "/community", tone: "warning" },
  { icon: "🚓", bn: "যানবাহন যাচাই", en: "Verify Vehicle", to: "/vehicle", tone: "verified" },
  { icon: "🛡️", bn: "অধিকার ও আইন", en: "Rights & Legal Help", to: "/rights", tone: "verified" },
  { icon: "📍", bn: "কাছের সতর্কতা", en: "Nearby Alerts", to: "/explore", tone: "brand" },
  { icon: "🗺️", bn: "নিরাপত্তা মানচিত্র", en: "Safety Map", to: "/map", tone: "brand" },
] as const;

export const composerOptions = [
  { icon: "📢", bn: "অভিযোগ", en: "Report" },
  { icon: "❓", bn: "প্রশ্ন", en: "Ask" },
  { icon: "💬", bn: "আলোচনা", en: "Discuss" },
  { icon: "🚨", bn: "জরুরি", en: "Emergency" },
  { icon: "🛡️", bn: "অধিকার", en: "Rights" },
  { icon: "👤", bn: "নিখোঁজ", en: "Missing" },
  { icon: "🚦", bn: "যানজট", en: "Traffic" },
  { icon: "✊", bn: "প্রতিবাদ", en: "Protest" },
  { icon: "🖼️", bn: "মিডিয়া", en: "Media" },
] as const;

export type PostComment = {
  id: string;
  author: { id?: string; bn: string; en: string; initials: string };
  time: { bn: string; en: string };
  body: { bn: string; en: string };
};

/** Demo discussion threads for the Explore post detail pages. */
export const postComments: Record<string, PostComment[]> = {
  "1": [
    {
      id: "1-c1",
      author: { bn: "ফায়ার সার্ভিস ইউনিট", en: "Fire Service Unit", initials: "ফা" },
      time: { bn: "২ মিনিট আগে", en: "2 minutes ago" },
      body: {
        bn: "দুইটি ইউনিট ঘটনাস্থলে পৌঁছেছে, গ্যাস সরবরাহ বন্ধ করা হয়েছে।",
        en: "Two units have reached the site and the gas supply has been shut off.",
      },
    },
    {
      id: "1-c2",
      author: { bn: "সাব্বির আহমেদ", en: "Sabbir Ahmed", initials: "সা" },
      time: { bn: "৫ মিনিট আগে", en: "5 minutes ago" },
      body: {
        bn: "মিরপুর ১০ গোলচত্বর এড়িয়ে কাজীপাড়া হয়ে যান।",
        en: "Avoid the Mirpur 10 roundabout and take the Kazipara route instead.",
      },
    },
  ],
  "2": [
    {
      id: "2-c1",
      author: { bn: "নুসরাত জাহান", en: "Nusrat Jahan", initials: "নু" },
      time: { bn: "১০ মিনিট আগে", en: "10 minutes ago" },
      body: {
        bn: "বিকল্প রুটে যানজট কম, ধন্যবাদ আপডেটের জন্য।",
        en: "The alternate route is much clearer, thanks for the update.",
      },
    },
  ],
  "3": [
    {
      id: "3-c1",
      author: { bn: "রুবেল হোসেন", en: "Rubel Hossain", initials: "রু" },
      time: { bn: "৪০ মিনিট আগে", en: "40 minutes ago" },
      body: {
        bn: "থানায় জিডি করা হয়েছে কি? প্রয়োজনে সহায়তা করতে পারি।",
        en: "Has a general diary been filed? I can help if needed.",
      },
    },
    {
      id: "3-c2",
      author: { id: "demo-afsana", bn: "আফসানা মিম", en: "Afsana Mim", initials: "আ" },
      time: { bn: "২০ মিনিট আগে", en: "20 minutes ago" },
      body: {
        bn: "হ্যাঁ, কোতোয়ালী থানায় জিডি হয়েছে। ছবি শেয়ার করুন সবার সাথে।",
        en: "Yes, a diary is filed at Kotwali. Please share the photo widely.",
      },
    },
  ],
  "4": [
    {
      id: "4-c1",
      author: { bn: "শ্রমিক ঐক্য", en: "Sromik Oikko", initials: "শ্র" },
      time: { bn: "১ ঘন্টা আগে", en: "1 hour ago" },
      body: {
        bn: "নিয়োগপত্র ও হাজিরা খাতার কপি সংরক্ষণ করা জরুরি।",
        en: "Keeping a copy of the appointment letter and attendance register is essential.",
      },
    },
  ],
  "5": [
    {
      id: "5-c1",
      author: { id: "demo-ward19", bn: "ওয়ার্ড ১৯ কমিউনিটি", en: "Ward 19 Community", initials: "ও" },
      time: { bn: "৩ ঘন্টা আগে", en: "3 hours ago" },
      body: {
        bn: "এখন পর্যন্ত জলাবদ্ধতা সবচেয়ে বেশি ভোট পেয়েছে।",
        en: "Waterlogging is leading the vote so far.",
      },
    },
  ],
};

const FEED_AREAS = [
  { bn: "উত্তরা সেক্টর ৭, ঢাকা", en: "Uttara Sector 7, Dhaka" },
  { bn: "আগ্রাবাদ, চট্টগ্রাম", en: "Agrabad, Chattogram" },
  { bn: "জিন্দাবাজার, সিলেট", en: "Zindabazar, Sylhet" },
  { bn: "সোনাডাঙ্গা, খুলনা", en: "Sonadanga, Khulna" },
  { bn: "সাহেব বাজার, রাজশাহী", en: "Saheb Bazar, Rajshahi" },
  { bn: "বগুড়া সদর", en: "Bogura Sadar" },
  { bn: "কোতোয়ালী, বরিশাল", en: "Kotwali, Barishal" },
  { bn: "মেডিকেল মোড়, রংপুর", en: "Medical More, Rangpur" },
];

const FEED_TIMES = [
  { bn: "৭ ঘন্টা আগে", en: "7 hours ago" },
  { bn: "১১ ঘন্টা আগে", en: "11 hours ago" },
  { bn: "১৫ ঘন্টা আগে", en: "15 hours ago" },
  { bn: "১ দিন আগে", en: "1 day ago" },
  { bn: "২ দিন আগে", en: "2 days ago" },
  { bn: "৩ দিন আগে", en: "3 days ago" },
];

/**
 * Paginated demo feed. The five hand-written posts stay on top, followed by
 * area-shifted variants so infinite scroll on /explore has enough material.
 */
export const feedPosts: Post[] = [
  ...posts,
  ...Array.from({ length: 24 }, (_, i) => {
    const base = posts[i % posts.length];
    const area = FEED_AREAS[i % FEED_AREAS.length];
    const time = FEED_TIMES[i % FEED_TIMES.length];
    const page = Math.floor(i / posts.length) + 2;
    return {
      ...base,
      id: `${base.id}-${page}`,
      location: area,
      time,
      support: Math.max(12, Math.round(base.support * (0.35 + ((i * 7) % 9) / 10))),
      comments: Math.max(3, Math.round(base.comments * (0.3 + ((i * 5) % 8) / 10))),
      title: {
        bn: `${base.title.bn} — ${area.bn}`,
        en: `${base.title.en} — ${area.en}`,
      },
      images: base.images ? base.images.slice(0, ((i % 3) + 1)) : undefined,
    } satisfies Post;
  }),
];
