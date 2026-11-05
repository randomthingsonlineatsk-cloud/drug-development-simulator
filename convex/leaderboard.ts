import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

const LEADERBOARD_SIZE = 30

const entryValidator = v.object({
  _id: v.id("ddLeaderboard"),
  _creationTime: v.number(),
  name: v.string(),
  programId: v.string(),
  programName: v.string(),
  authorityKey: v.optional(v.string()),
  authorityName: v.optional(v.string()),
  verdict: v.string(),
  approved: v.boolean(),
  score: v.number(),
  maxScore: v.number(),
  pct: v.number(),
})

export const top = query({
  args: { programId: v.optional(v.string()), authorityKey: v.optional(v.string()) },
  returns: v.array(entryValidator),
  handler: async (ctx, args) => {
    if (args.programId) {
      return await ctx.db.query("ddLeaderboard").withIndex("by_program_pct", (q) => q.eq("programId", args.programId!)).order("desc").take(LEADERBOARD_SIZE)
    }
    if (args.authorityKey) {
      return await ctx.db.query("ddLeaderboard").withIndex("by_authority_pct", (q) => q.eq("authorityKey", args.authorityKey!)).order("desc").take(LEADERBOARD_SIZE)
    }
    return await ctx.db.query("ddLeaderboard").withIndex("by_pct").order("desc").take(LEADERBOARD_SIZE)
  },
})

export const submit = mutation({
  args: {
    name: v.string(),
    programId: v.string(),
    programName: v.string(),
    authorityKey: v.optional(v.string()),
    authorityName: v.optional(v.string()),
    verdict: v.string(),
    approved: v.boolean(),
    score: v.number(),
    maxScore: v.number(),
  },
  returns: v.id("ddLeaderboard"),
  handler: async (ctx, args) => {
    const name = args.name.trim().slice(0, 32)
    if (!name) throw new Error("Name is required")
    if (args.maxScore < 1 || args.score < 0 || args.score > args.maxScore) throw new Error("Invalid score")
    const pct = (args.score / args.maxScore) * 100
    return await ctx.db.insert("ddLeaderboard", {
      name,
      programId: args.programId,
      programName: args.programName,
      authorityKey: args.authorityKey ?? "FDA",
      authorityName: args.authorityName ?? "FDA",
      verdict: args.verdict,
      approved: args.approved,
      score: args.score,
      maxScore: args.maxScore,
      pct,
    })
  },
})
