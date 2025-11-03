import { LinearClient } from '@linear/sdk'
import type { Plugin } from "@opencode-ai/plugin"
import { tool } from "@opencode-ai/plugin"

export const LinearPlugin: Plugin = async (ctx) => {
  console.log("🔗 Linear Plugin: Initializing...")
  
  const apiKey = process.env.LINEAR_API_KEY
  
  if (!apiKey) {
    console.log("❌ Linear Plugin: LINEAR_API_KEY environment variable not found")
  } else {
    console.log("✅ Linear Plugin: LINEAR_API_KEY found, authentication ready")
  }

  return {
    tool: {
      linear_auth: tool({
        description: "Authenticate with Linear SDK and test connection",
        args: {},
        async execute(args, context) {
          const apiKey = process.env.LINEAR_API_KEY
          
          if (!apiKey) {
            return "❌ Linear Plugin: LINEAR_API_KEY environment variable not set. Please set it and restart OpenCode."
          }

          try {
            const linearClient = new LinearClient({ apiKey })
            const user = await linearClient.viewer
            
            if (user) {
              console.log(`✅ Linear Plugin: Successfully authenticated as ${user.displayName || user.name}`)
              return `✅ Linear Plugin: Successfully authenticated as ${user.displayName || user.name}`
            } else {
              console.log("❌ Linear Plugin: Authentication failed - could not retrieve user")
              return "❌ Linear Plugin: Authentication failed - could not retrieve user"
            }
          } catch (error) {
            console.log(`❌ Linear Plugin: Authentication error - ${error}`)
            return `❌ Linear Plugin: Authentication error - ${error}`
          }
        },
      }),
    },
  }
}