"use server";

import {
  generateLocalSeoPost,
  type GeneratePostParams,
  type GeneratedPostData,
  type GeneratePostResult,
} from "@/services/ai-post.actions";

import {
  createPostAction,
  deletePostAction,
  togglePostStatusAction,
  type PostActionState,
} from "@/services/post.actions";

export {
  generateLocalSeoPost,
  generateLocalSeoPost as generateAiPostAction,
  generateLocalSeoPost as generatePostAction,
  createPostAction,
  deletePostAction,
  togglePostStatusAction,
};

export type {
  GeneratePostParams,
  GeneratedPostData,
  GeneratePostResult,
  PostActionState,
};
