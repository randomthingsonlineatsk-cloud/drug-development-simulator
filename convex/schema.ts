import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  ddLeaderboard: defineTable({
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
    .index("by_pct", ["pct"])
    .index("by_program_pct", ["programId", "pct"])
    .index("by_authority_pct", ["authorityKey", "pct"]),
  ddSyncProfiles: defineTable({
    code: v.string(),
    historyJson: v.string(),
    updatedAt: v.number(),
  }).index("by_code", ["code"]),
})
