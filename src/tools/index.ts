/**
 * Tool Registry - All built-in tool definitions
 *
 * 30+ tools covering file I/O, execution, search, web, agents,
 * tasks, teams, messaging, worktree, planning, scheduling, and more.
 */

import type { ToolDefinition } from '../types.js'

// File I/O
import { BashTool } from './bash.js'
import { FileReadTool } from './read.js'
import { FileWriteTool } from './write.js'
import { FileEditTool } from './edit.js'
import { GlobTool } from './glob.js'
import { GrepTool } from './grep.js'
import { NotebookEditTool } from './notebook-edit.js'

// Web
import { ParallelWebSearchTool } from './parallel-web-search.js'
import { WebFetchTool } from './web-fetch.js'
import { WebSearchTool } from './web-search.js'

// Agent & Multi-agent
import { AgentTool } from './agent-tool.js'
import { SendMessageTool } from './send-message.js'
import { TeamCreateTool, TeamDeleteTool } from './team-tools.js'

// Tasks
import {
  TaskCreateTool,
  TaskListTool,
  TaskUpdateTool,
  TaskGetTool,
  TaskStopTool,
  TaskOutputTool,
} from './task-tools.js'

// Worktree
import { EnterWorktreeTool, ExitWorktreeTool } from './worktree-tools.js'

// Planning
import { EnterPlanModeTool, ExitPlanModeTool } from './plan-tools.js'

// User interaction
import { AskUserQuestionTool } from './ask-user.js'

// Discovery
import { ToolSearchTool } from './tool-search.js'

// MCP Resources
import { ListMcpResourcesTool, ReadMcpResourceTool } from './mcp-resource-tools.js'

// Scheduling
import { CronCreateTool, CronDeleteTool, CronListTool, RemoteTriggerTool } from './cron-tools.js'

// LSP
import { LSPTool } from './lsp-tool.js'

// Config
import { ConfigTool } from './config-tool.js'

// Todo
import { TodoWriteTool } from './todo-tool.js'

// Skill
import { SkillTool } from './skill-tool.js'

/**
 * All built-in tools (30+).
 */
const ALL_TOOLS: ToolDefinition[] = [
  // Core file I/O & execution
  BashTool,
  FileReadTool,
  FileWriteTool,
  FileEditTool,
  GlobTool,
  GrepTool,
  NotebookEditTool,

  // Web
  WebFetchTool,
  WebSearchTool,

  // Agent & Multi-agent
  AgentTool,
  SendMessageTool,
  TeamCreateTool,
  TeamDeleteTool,

  // Tasks
  TaskCreateTool,
  TaskListTool,
  TaskUpdateTool,
  TaskGetTool,
  TaskStopTool,
  TaskOutputTool,

  // Worktree
  EnterWorktreeTool,
  ExitWorktreeTool,

  // Planning
  EnterPlanModeTool,
  ExitPlanModeTool,

  // User interaction
  AskUserQuestionTool,

  // Discovery
  ToolSearchTool,

  // MCP Resources
  ListMcpResourcesTool,
  ReadMcpResourceTool,

  // Scheduling
  CronCreateTool,
  CronDeleteTool,
  CronListTool,
  RemoteTriggerTool,

  // LSP
  LSPTool,

  // Config
  ConfigTool,

  // Todo
  TodoWriteTool,

  // Skill
  SkillTool,
]

/**
 * Get all built-in tools.
 */
export function getAllBaseTools(): ToolDefinition[] {
  return [...ALL_TOOLS]
}

/**
 * Filter tools by allowed/disallowed lists.
 */
export function filterTools(
  tools: ToolDefinition[],
  allowedTools?: string[],
  disallowedTools?: string[],
): ToolDefinition[] {
  let filtered = tools

  if (allowedTools && allowedTools.length > 0) {
    const allowed = new Set(allowedTools)
    filtered = filtered.filter((t) => allowed.has(t.name))
  }

  if (disallowedTools && disallowedTools.length > 0) {
    const disallowed = new Set(disallowedTools)
    filtered = filtered.filter((t) => !disallowed.has(t.name))
  }

  return filtered
}

/**
 * Assemble tool pool: base tools + MCP tools, with deduplication.
 */
export function assembleToolPool(
  baseTools: ToolDefinition[],
  mcpTools: ToolDefinition[] = [],
  allowedTools?: string[],
  disallowedTools?: string[],
): ToolDefinition[] {
  const combined = [...baseTools, ...mcpTools]

  // Deduplicate by name (later definitions override)
  const byName = new Map<string, ToolDefinition>()
  for (const tool of combined) {
    byName.set(tool.name, tool)
  }

  let tools = Array.from(byName.values())
  return filterTools(tools, allowedTools, disallowedTools)
}

// Re-export individual tools
export {
  // Core
  BashTool,
  FileReadTool,
  FileWriteTool,
  FileEditTool,
  GlobTool,
  GrepTool,
  NotebookEditTool,
  WebFetchTool,
  WebSearchTool,
  ParallelWebSearchTool,
  // Agent
  AgentTool,
  SendMessageTool,
  TeamCreateTool,
  TeamDeleteTool,
  // Tasks
  TaskCreateTool,
  TaskListTool,
  TaskUpdateTool,
  TaskGetTool,
  TaskStopTool,
  TaskOutputTool,
  // Worktree
  EnterWorktreeTool,
  ExitWorktreeTool,
  // Planning
  EnterPlanModeTool,
  ExitPlanModeTool,
  // User
  AskUserQuestionTool,
  // Discovery
  ToolSearchTool,
  // MCP
  ListMcpResourcesTool,
  ReadMcpResourceTool,
  // Scheduling
  CronCreateTool,
  CronDeleteTool,
  CronListTool,
  RemoteTriggerTool,
  // LSP
  LSPTool,
  // Config
  ConfigTool,
  // Todo
  TodoWriteTool,
  // Skill
  SkillTool,
}

// Re-export helpers
export { defineTool, toApiTool } from './types.js'
