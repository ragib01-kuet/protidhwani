import { auth, defineMcp } from "@lovable.dev/mcp-js";

import { supabaseProjectRef } from "./supabase";
import commentOnPostTool from "./tools/comment-on-post";
import createComplaintTool from "./tools/create-complaint";
import createPostTool from "./tools/create-post";
import getMyProfileTool from "./tools/get-my-profile";
import getPostTool from "./tools/get-post";
import listComplaintsTool from "./tools/list-complaints";
import listPostsTool from "./tools/list-posts";
import supportPostTool from "./tools/support-post";

export default defineMcp({
  name: "civic-connect-bangladesh",
  title: "Civic Connect Bangladesh",
  version: "0.1.0",
  instructions:
    "Tools for Protidhwani (প্রতিধ্বনি), a citizen-powered civic network for Bangladesh. Read and publish community posts, comment, support posts, file and track civic complaints, and read the signed-in citizen's profile. Content is bilingual: Bangla first, English second.",
  auth: auth.oauth.issuer({
    issuer: `https://${supabaseProjectRef()}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listPostsTool,
    getPostTool,
    createPostTool,
    commentOnPostTool,
    supportPostTool,
    listComplaintsTool,
    createComplaintTool,
    getMyProfileTool,
  ],
});
