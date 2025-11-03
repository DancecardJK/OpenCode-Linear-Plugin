/**
 * Linear Webhook Plugin for OpenCode
 * 
 * This plugin provides webhook processing capabilities for Linear events.
 * It can be used independently or alongside the main Linear plugin.
 * 
 * Features:
 * - Process Linear webhook events
 * - Detect OpenCode references in comments
 * - Execute OpenCode commands from Linear
 * - Stream events to OpenCode TUI
 */

import type { Plugin } from "@opencode-ai/plugin"
import { tool } from "@opencode-ai/plugin"
import { webhookEventProcessor } from './webhook-event-processor'
import { testLinearAuth } from './linear-auth'

export const LinearWebhookPlugin: Plugin = async (ctx) => {
  return {
    tool: {
      linear_webhook_test: tool({
        description: "Test Linear webhook authentication and processing",
        args: {},
        async execute(args, context) {
          return await testLinearAuth()
        },
      }),

      linear_webhook_process: tool({
        description: "Process a Linear webhook event payload",
        args: {
          payload: { type: "object", description: "Linear webhook payload" }
        },
        async execute(args, context) {
          try {
            const result = await webhookEventProcessor.processEvent(args.payload)
            return {
              success: result.success,
              processed: result.processed,
              message: result.message,
              context: result.context ? {
                eventType: result.context.metadata.eventType,
                action: result.context.metadata.action,
                actor: result.context.metadata.actor,
                referenceCount: result.context.references.length
              } : undefined,
              error: result.error
            }
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          }
        },
      }),

      linear_webhook_status: tool({
        description: "Get the status of the Linear webhook processor",
        args: {},
        async execute(args, context) {
          try {
            return {
              success: true,
              status: "Webhook processor is ready",
              processor: "LinearWebhookEventProcessor",
              features: [
                "Comment event processing",
                "Issue event processing", 
                "OpenCode reference detection",
                "Command execution",
                "TUI event streaming"
              ]
            }
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          }
        },
      })
    },
  }
}

// Export the webhook plugin as default for easy importing
export default LinearWebhookPlugin