/**
 * LinearAgent - Specialized OpenCode Agent for Linear Operations
 * 
 * This agent provides direct access to Linear plugin tools without requiring
 * temporary file creation. It exposes all Linear CRUD operations as available
 * functions that can be called directly through the OpenCode agent system.
 * 
 * Features:
 * - Direct Linear tool access (no temp files)
 * - Authentication handling
 * - Issue and comment management
 * - Team and project operations
 * - Error handling and logging
 */

import type { Plugin } from "@opencode-ai/plugin"
import { tool } from "@opencode-ai/plugin"
import { testLinearAuth, getLinearClient } from '../plugin/linear-auth'
import { getLinearCRUD } from '../plugin/linear-crud'

/**
 * LinearAgent Configuration
 * 
 * Provides all Linear plugin tools as available functions for direct access.
 * This eliminates the need for temporary file creation when executing
 * Linear commands through OpenCode.
 */
export const LinearAgent = {
  name: "LinearAgent",
  description: "Specialized agent for Linear issue and comment management",
  mode: "subagent" as const,
  builtIn: false,
  
  // Agent permissions - read-only for Linear API operations
  permission: {
    edit: "deny" as const,
    bash: {},
    webfetch: "allow" as const,
  },

  // Agent configuration
  temperature: 0.1,
  topP: 0.9,

  // Available Linear tools
  tools: {
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
        title: { type: "string", description: "Issue title" },
        description: { type: "string", description: "Issue description (optional)" },
        teamId: { type: "string", description: "Team ID (optional, will auto-select if not provided)" },
        assigneeId: { type: "string", description: "Assignee ID (optional)" },
        priority: { type: "number", description: "Priority 1-4 (optional)" }
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
        issueId: { type: "string", description: "Linear issue ID" }
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
            status: issue.state?.name || 'Unknown',
            assignee: issue.assignee?.name || 'Unassigned',
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

    linear_update_issue: tool({
      description: "Update an existing Linear issue",
      args: {
        issueId: { type: "string", description: "Linear issue ID" },
        title: { type: "string", description: "New title (optional)" },
        description: { type: "string", description: "New description (optional)" },
        assigneeId: { type: "string", description: "New assignee ID (optional)" },
        priority: { type: "number", description: "New priority 1-4 (optional)" }
      },
      async execute(args, context) {
        try {
          const crud = getLinearCRUD()
          const issue = await crud.updateIssue(args.issueId, args)
          return issue ? {
            success: true,
            id: issue.id,
            identifier: issue.identifier,
            title: issue.title,
            url: issue.url
          } : {
            success: false,
            error: "Failed to update issue"
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
        issueId: { type: "string", description: "Linear issue ID" },
        body: { type: "string", description: "Comment content" }
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
        first: { type: "number", description: "Maximum number of issues to return (default: 50)", optional: true }
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
              status: issue.state?.name || 'Unknown',
              assignee: issue.assignee?.name || 'Unassigned',
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
    }),

    linear_list_comments: tool({
      description: "List comments for a Linear issue",
      args: {
        issueId: { type: "string", description: "Linear issue ID" },
        first: { type: "number", description: "Maximum number of comments to return (default: 50)", optional: true }
      },
      async execute(args, context) {
        try {
          const crud = getLinearCRUD()
          const comments = await crud.listComments(args.issueId, args.first || 50)
          return {
            success: true,
            comments: comments.map(comment => ({
              id: comment.id,
              body: comment.body,
              author: comment.user?.name || 'Unknown',
              createdAt: comment.createdAt
            })),
            count: comments.length
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

  // Agent prompt for context and instructions
  prompt: `You are LinearAgent, a specialized OpenCode agent for Linear issue and comment management.

Your capabilities include:
- Creating, reading, updating, and deleting Linear issues
- Adding and managing comments on issues
- Listing issues and comments with pagination
- Authentication and connection testing

Available commands:
- linear_auth: Test Linear authentication
- linear_create_issue: Create new issues (title required, others optional)
- linear_get_issue: Retrieve specific issue by ID
- linear_update_issue: Update existing issues
- linear_add_comment: Add comments to issues
- linear_list_issues: List issues with pagination (default 50)
- linear_list_comments: List comments for an issue

Guidelines:
- Always authenticate first with linear_auth if needed
- Provide clear, concise responses suitable for Linear comments
- Include issue URLs and identifiers when available
- Handle errors gracefully and provide helpful error messages
- Use auto-selection for teamId when creating issues if not specified

Execute Linear commands directly without creating temporary files.`,

  // Additional options for Linear-specific behavior
  options: {
    autoAuth: true, // Automatically authenticate on first use
    maxRetries: 3,  // Retry failed operations up to 3 times
    timeout: 30000  // 30 second timeout for Linear operations
  }
}

/**
 * Export LinearAgent for use in OpenCode system
 * This agent can be registered and used directly through the OpenCode agent framework
 */
export default LinearAgent