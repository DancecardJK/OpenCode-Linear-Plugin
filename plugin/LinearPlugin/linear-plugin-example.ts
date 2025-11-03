import type { Plugin } from "@opencode-ai/plugin"
import { tool } from "@opencode-ai/plugin"
import { testLinearAuth, getLinearClient } from './linear-auth'
import { getLinearCRUD } from './linear-crud'

import { z } from "zod"

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
      
      linear_create_issue: tool({
        description: "Create a new Linear issue",
        args: {
          title: z.string(),
          description: z.string().optional(),
          teamId: z.string().optional(),
          assigneeId: z.string().optional(),
          priority: z.number().optional()
        },
        async execute(args, context) {
          try {
            const crud = getLinearCRUD()
            const issue = await crud.createIssue(args)
            return issue ? {
              success: true,
              id: issue.id,
              identifier: issue.identifier,
              title: issue.title,
              url: issue.url
            } : {
              success: false,
              error: "Failed to create issue"
            }
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          }
        },
      }),

      linear_get_issue: tool({
        description: "Get a Linear issue by ID",
        args: {
          issueId: z.string()
        },
        async execute(args, context) {
          try {
            const crud = getLinearCRUD()
            const issue = await crud.getIssue(args.issueId)
            return issue ? {
              success: true,
              id: issue.id,
              identifier: issue.identifier,
              title: issue.title,
              description: issue.description,
              status: issue.state?.name,
              assignee: issue.assignee?.name,
              url: issue.url
            } : {
              success: false,
              error: "Issue not found"
            }
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          }
        },
      }),

      linear_add_comment: tool({
        description: "Add a comment to a Linear issue",
        args: {
          issueId: z.string(),
          body: z.string()
        },
        async execute(args, context) {
          try {
            const crud = getLinearCRUD()
            const comment = await crud.addComment(args.issueId, args.body)
            return comment ? {
              success: true,
              id: comment.id,
              body: comment.body,
              createdAt: comment.createdAt
            } : {
              success: false,
              error: "Failed to add comment"
            }
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          }
        },
      }),

      linear_list_issues: tool({
        description: "List Linear issues with pagination",
        args: {
          
          first: z.number().optional()
        },
        async execute(args, context) {
          try {
            const crud = getLinearCRUD()
            const issues = await crud.listIssues(args.first || 50)
            return {
              success: true,
              issues: issues.map(issue => ({
                id: issue.id,
                identifier: issue.identifier,
                title: issue.title,
                status: issue.state?.name,
                assignee: issue.assignee?.name,
                createdAt: issue.createdAt,
                url: issue.url
              })),
              count: issues.length
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