import type { Plugin } from "@opencode-ai/plugin"
import { tool } from "@opencode-ai/plugin"
import { testLinearAuth } from './linear-auth'

export const LinearPlugin: Plugin = async (ctx) => {
  return {
    tool: {
      linear_auth: tool({
        description: "Authenticate with Linear SDK and test connection",
        args: {},
        async execute(args, context) {
          return await testLinearAuth()
        },
      }),
    },
  }
}