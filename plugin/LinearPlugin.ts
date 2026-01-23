/**
 * Linear Plugin for OpenCode
 * 
 * This plugin provides comprehensive Linear integration for OpenCode, including:
 * - Authentication and connection testing
 * - Issue management (create, read, update, delete)
 * - Comment management (create, read, update, delete)
 * - Team and project operations
 * 
 * The plugin is designed to work seamlessly with OpenCode's tool system,
 * allowing agents to interact with Linear issues and comments through
 * natural language commands.
 */

import type { Plugin } from "@opencode-ai/plugin"
import { tool } from "@opencode-ai/plugin"
import { z } from "zod"
import { testLinearAuth, getLinearClient } from './LinearPlugin/linear-auth'
import { getLinearCRUD } from './LinearPlugin/linear-crud'

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
          title: z.string().describe("Issue title"),
          description: z.string().optional().describe("Issue description (optional)"),
          teamId: z.string().optional().describe("Team ID (optional, will auto-select if not provided)"),
          assigneeId: z.string().optional().describe("Assignee ID (optional)"),
          stateId: z.string().optional().describe("Workflow state ID (optional)"),
          labelIds: z.array(z.string()).optional().describe("Array of label IDs (optional)"),
          priority: z.number().min(1).max(4).optional().describe("Priority 1-4 (optional)"),
          parentId: z.string().optional().describe("Parent issue ID to create a sub-issue (optional)")
        },
        async execute(args, context) {
          try {
            const crud = getLinearCRUD()
            const issue = await crud.createIssue(args)
            return JSON.stringify(issue ? {
              success: true,
              id: issue.id,
              identifier: issue.identifier,
              title: issue.title,
              url: issue.url
            } : {
              success: false,
              error: "Failed to create issue"
            })
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
          issueId: z.string().describe("Linear issue ID")
        },
        async execute(args, context) {
          try {
            const crud = getLinearCRUD()
            const issue = await crud.getIssue(args.issueId)
            if (!issue) {
              return JSON.stringify({
                success: false,
                error: "Issue not found"
              })
            }
            
            // Fetch labels and parent for the issue
            const labels = await issue.labels()
            const parent = issue.parentId ? await issue.parent : null
            
            return JSON.stringify({
              success: true,
              id: issue.id,
              identifier: issue.identifier,
              title: issue.title,
              description: issue.description,
              state: issue.state ? {
                id: issue.state.id,
                name: issue.state.name,
                type: issue.state.type,
                color: issue.state.color
              } : null,
              assignee: issue.assignee ? {
                id: issue.assignee.id,
                name: issue.assignee.name
              } : null,
              labels: labels.nodes.map(label => ({
                id: label.id,
                name: label.name,
                color: label.color
              })),
              parent: parent ? {
                id: parent.id,
                identifier: parent.identifier,
                title: parent.title
              } : null,
              url: issue.url
            })
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
          issueId: z.string().describe("Linear issue ID"),
          title: z.string().optional().describe("New title (optional)"),
          description: z.string().optional().describe("New description (optional)"),
          assigneeId: z.string().optional().describe("New assignee ID (optional)"),
          stateId: z.string().optional().describe("New workflow state ID (optional)"),
          labelIds: z.array(z.string()).optional().describe("New array of label IDs (optional)"),
          priority: z.number().min(1).max(4).optional().describe("New priority 1-4 (optional)"),
          parentId: z.string().optional().describe("New parent issue ID (optional, null to remove parent)")
        },
        async execute(args, context) {
          try {
            const crud = getLinearCRUD()
            const issue = await crud.updateIssue(args.issueId, args)
            return JSON.stringify( issue ? {
              success: true,
              id: issue.id,
              identifier: issue.identifier,
              title: issue.title,
              url: issue.url
            } : {
              success: false,
              error: "Failed to update issue"
            })
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
          issueId: z.string().describe("Linear issue ID"),
          body: z.string().describe("Comment content")
        },
        async execute(args, context) {
          try {
            const crud = getLinearCRUD()
            const comment = await crud.addComment(args.issueId, args.body)
            return JSON.stringify(comment ? {
              success: true,
              id: comment.id,
              body: comment.body,
              createdAt: comment.createdAt
            } : {
              success: false,
              error: "Failed to add comment"
            })
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
          first: z.number().optional().describe("Maximum number of issues to return (default: 50)")
        },
        async execute(args, context) {
          try {
            const crud = getLinearCRUD()
            const issues = await crud.listIssues(args.first || 50)
            return JSON.stringify({
              success: true,
              issues: issues.map(issue => ({
                id: issue.id,
                identifier: issue.identifier,
                title: issue.title,
                status: 'Unknown', // State data is not properly populated by Linear SDK
                assignee: issue.assignee?.name || 'Unassigned',
                createdAt: issue.createdAt,
                url: issue.url
              })),
              count: issues.length
            });
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
          issueId: z.string().describe("Linear issue ID"),
          first: z.number().optional().describe("Maximum number of comments to return (default: 50)")
        },
        async execute(args, context) {
          try {
            const crud = getLinearCRUD()
            const comments = await crud.listComments(args.issueId, args.first || 50)
            return JSON.stringify({
              success: true,
              comments: comments.map(comment => ({
                id: comment.id,
                body: comment.body,
                author: comment.user?.name || 'Unknown',
                createdAt: comment.createdAt
              })),
              count: comments.length
            })
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          }
        },
      }),

      linear_list_states: tool({
        description: "List workflow states (statuses) for a team",
        args: {
          teamId: z.string().optional().describe("Team ID (optional, will auto-select if not provided)")
        },
        async execute(args, context) {
          try {
            const crud = getLinearCRUD()
            const states = await crud.listStates(args.teamId)
            return JSON.stringify({
              success: true,
              states: states.map(state => ({
                id: state.id,
                name: state.name,
                type: state.type,
                color: state.color,
                description: state.description
              })),
              count: states.length
            })
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          }
        },
      }),

      linear_list_labels: tool({
        description: "List issue labels for a team",
        args: {
          teamId: z.string().optional().describe("Team ID (optional, will auto-select if not provided)")
        },
        async execute(args, context) {
          try {
            const crud = getLinearCRUD()
            const labels = await crud.listLabels(args.teamId)
            return JSON.stringify({
              success: true,
              labels: labels.map(label => ({
                id: label.id,
                name: label.name,
                color: label.color,
                description: label.description
              })),
              count: labels.length
            })
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          }
        },
      }),

      linear_list_children: tool({
        description: "List child issues (sub-issues) of a parent issue",
        args: {
          parentId: z.string().describe("Parent issue ID"),
          first: z.number().optional().describe("Maximum number of children to return (default: 50)")
        },
        async execute(args, context) {
          try {
            const crud = getLinearCRUD()
            const children = await crud.listChildren(args.parentId, args.first || 50)
            return JSON.stringify({
              success: true,
              children: children.map(child => ({
                id: child.id,
                identifier: child.identifier,
                title: child.title,
                state: child.state?.name || 'Unknown',
                assignee: child.assignee?.name || 'Unassigned',
                url: child.url
              })),
              count: children.length
            })
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          }
        },
      }),

      linear_create_relation: tool({
        description: "Create an issue relation (blocks, duplicate, related, similar)",
        args: {
          issueId: z.string().describe("Issue ID that has the relation"),
          relatedIssueId: z.string().describe("Related issue ID"),
          type: z.enum(['blocks', 'duplicate', 'related', 'similar']).describe("Relation type: blocks, duplicate, related, or similar")
        },
        async execute(args, context) {
          try {
            const crud = getLinearCRUD()
            const relation = await crud.createRelation(args)
            return JSON.stringify(relation ? {
              success: true,
              id: relation.id,
              type: relation.type,
              createdAt: relation.createdAt
            } : {
              success: false,
              error: "Failed to create relation"
            })
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          }
        },
      }),

      linear_list_relations: tool({
        description: "List issue relations for an issue",
        args: {
          issueId: z.string().describe("Issue ID"),
          direction: z.enum(['from', 'to', 'both']).optional().describe("Direction: 'from' (relations FROM this issue), 'to' (relations TO this issue), or 'both' (default: both)"),
          first: z.number().optional().describe("Maximum number of relations to return (default: 50)")
        },
        async execute(args, context) {
          try {
            const crud = getLinearCRUD()
            const relations = await crud.listRelations(args.issueId, args.direction || 'both', args.first || 50)
            
            // Fetch issue details for each relation
            const relationsWithDetails = await Promise.all(relations.map(async (relation) => {
              const issue = await relation.issue
              const relatedIssue = await relation.relatedIssue
              return {
                id: relation.id,
                type: relation.type,
                issue: {
                  id: issue.id,
                  identifier: issue.identifier,
                  title: issue.title
                },
                relatedIssue: {
                  id: relatedIssue.id,
                  identifier: relatedIssue.identifier,
                  title: relatedIssue.title
                },
                createdAt: relation.createdAt
              }
            }))
            
            return JSON.stringify({
              success: true,
              relations: relationsWithDetails,
              count: relationsWithDetails.length
            })
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          }
        },
      }),

      linear_delete_relation: tool({
        description: "Delete an issue relation",
        args: {
          relationId: z.string().describe("Relation ID to delete")
        },
        async execute(args, context) {
          try {
            const crud = getLinearCRUD()
            const deleted = await crud.deleteRelation(args.relationId)
            return JSON.stringify({
              success: deleted,
              message: deleted ? "Relation deleted successfully" : "Relation not found"
            })
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

// Export the plugin as default for easy importing
export default LinearPlugin