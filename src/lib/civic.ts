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
  author: { bn: string; en: string; initials: string; verified: boolean };
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
};

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
    kind: "emergency",
    author: { bn: "রুমানা হক", en: "Rumana Haque", initials: "রু", verified: true },
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
    kind: "verified",
    author: { bn: "সিটি ট্রাফিক ইউনিট", en: "City Traffic Unit", initials: "সি", verified: true },
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
    kind: "missing",
    author: { bn: "আফসানা মিম", en: "Afsana Mim", initials: "আ", verified: false },
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
    kind: "rights",
    author: { bn: "নাগরিক আইন সহায়তা", en: "Citizen Legal Aid", initials: "না", verified: true },
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
    kind: "poll",
    author: { bn: "ওয়ার্ড ১৯ কমিউনিটি", en: "Ward 19 Community", initials: "ও", verified: false },
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
