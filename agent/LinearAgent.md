# LinearAgent - OpenCode Agent for Linear Operations

## Overview

LinearAgent is a specialized OpenCode agent that provides direct access to Linear plugin tools without requiring temporary file creation. It exposes all Linear CRUD operations as available functions that can be called directly through the OpenCode agent system.

## Features

- **Direct Tool Access**: No temporary file creation needed
- **Authentication Handling**: Built-in Linear authentication
- **Issue Management**: Create, read, update, delete Linear issues
- **Comment Management**: Add and manage comments on issues
- **Pagination Support**: List issues and comments with pagination
- **Error Handling**: Comprehensive error handling and logging

## Available Commands

### Authentication
- `linear_auth` - Test Linear authentication and connection

### Issue Management
- `linear_create_issue` - Create a new Linear issue
  - Required: `title` (string)
  - Optional: `description` (string), `teamId` (string), `assigneeId` (string), `priority` (number 1-4)

- `linear_get_issue` - Get a Linear issue by ID
  - Required: `issueId` (string)

- `linear_update_issue` - Update an existing Linear issue
  - Required: `issueId` (string)
  - Optional: `title` (string), `description` (string), `assigneeId` (string), `priority` (number 1-4)

- `linear_list_issues` - List Linear issues with pagination
  - Optional: `first` (number, default: 50) - Maximum issues to return

### Comment Management
- `linear_add_comment` - Add a comment to a Linear issue
  - Required: `issueId` (string), `body` (string)

- `linear_list_comments` - List comments for a Linear issue
  - Required: `issueId` (string)
  - Optional: `first` (number, default: 50) - Maximum comments to return

## Usage Examples

### Create an Issue
```typescript
// Create a simple issue
await linear_create_issue({
  title: "New Feature Request",
  description: "Add user authentication feature"
})

// Create issue with assignee and priority
await linear_create_issue({
  title: "Bug Fix",
  description: "Fix login validation error",
  assigneeId: "user_123",
  priority: 1
})
```

### Get Issue Details
```typescript
const issue = await linear_get_issue({
  issueId: "issue_123"
})
```

### List Issues
```typescript
// List first 10 issues
const issues = await linear_list_issues({
  first: 10
})

// List default 50 issues
const allIssues = await linear_list_issues({})
```

### Add Comment
```typescript
await linear_add_comment({
  issueId: "issue_123",
  body: "Working on this issue now. ETA: 2 days."
})
```

## Agent Configuration

- **Name**: LinearAgent
- **Mode**: subagent (specialized for Linear operations)
- **Permissions**: Read-only for Linear API operations
- **Temperature**: 0.1 (consistent responses)
- **Top-P**: 0.9

## Error Handling

The agent provides comprehensive error handling:
- Authentication failures with helpful messages
- Network error retry logic (up to 3 retries)
- 30-second timeout for Linear operations
- Clear error messages for debugging

## Integration

LinearAgent can be integrated into the OpenCode system by:
1. Importing the agent: `import { LinearAgent } from './LinearAgent'`
2. Registering it with the OpenCode agent framework
3. Using it through the standard OpenCode agent interface

## Benefits

- **No Temporary Files**: Direct tool access eliminates file creation overhead
- **Faster Execution**: Direct API calls through Linear SDK
- **Better Error Handling**: Centralized error handling and retry logic
- **Consistent Interface**: Standardized tool definitions and responses
- **Authentication Management**: Built-in auth handling and validation

## Dependencies

- `@opencode-ai/plugin` - OpenCode plugin framework
- `@linear/sdk` - Linear SDK for API operations
- Local Linear plugin modules for authentication and CRUD operations