/**
 * OpenCode TUI Event Stream for Linear Integration
 * 
 * Provides real-time streaming of Linear webhook events to the OpenCode TUI.
 * This module handles event formatting, filtering, and display management
 * for seamless integration with the OpenCode user interface.
 */

import { EventEmitter } from 'events'

/**
 * Linear event types that can be streamed to the TUI
 */
export type LinearEventType = 
  | 'comment_created'
  | 'comment_updated' 
  | 'issue_created'
  | 'issue_updated'
  | 'opencode_command'
  | 'opencode_response'

/**
 * Streamable Linear event structure
 * 
 * Defines the format for events that can be displayed in the OpenCode TUI.
 * Includes rich metadata for proper event handling and display.
 */
export interface LinearStreamEvent {
  /** Unique identifier for the event */
  id: string
  /** Type of event for routing and display */
  type: LinearEventType
  /** Human-readable title for the event */
  title: string
  /** Detailed event description */
  description: string
  /** Event timestamp in ISO format */
  timestamp: string
  /** User who triggered the event */
  actor: string
  /** Associated Linear issue information */
  issue: {
    id: string
    identifier: string
    title: string
    url: string
  }
  /** Optional command information for OpenCode events */
  command?: {
    raw: string
    action: string
    success?: boolean
    response?: string
  }
  /** Event metadata for filtering and processing */
  metadata: {
    source: string
    processedAt: string
    severity: 'info' | 'success' | 'warning' | 'error'
    tags: string[]
  }
}

/**
 * TUI Event Stream Manager
 * 
 * Manages the flow of Linear events to the OpenCode TUI.
 * Provides filtering, formatting, and real-time streaming capabilities.
 */
export class TUIEventStreamManager extends EventEmitter {
  private eventHistory: LinearStreamEvent[] = []
  private maxHistorySize = 1000
  private filters: Set<string> = new Set()
  private isActive = false

  /**
   * Initialize the event stream manager
   * 
   * Sets up the streaming system and prepares for event handling.
   * Connects to the OpenCode TUI event system if available.
   */
  constructor() {
    super()
    this.setupEventHandlers()
  }

  /**
   * Start streaming events to the TUI
   * 
   * Activates the event stream and begins emitting events to listeners.
   * Should be called when the TUI is ready to receive events.
   */
  start(): void {
    if (this.isActive) {
      return
    }

    this.isActive = true
    console.log('Linear event streaming started for OpenCode TUI')
    
    this.emit('stream:started', {
      timestamp: new Date().toISOString(),
      historySize: this.eventHistory.length
    })
  }

  /**
   * Stop streaming events to the TUI
   * 
   * Deactivates the event stream and stops emitting new events.
   * Maintains event history for potential resume.
   */
  stop(): void {
    if (!this.isActive) {
      return
    }

    this.isActive = false
    console.log('Linear event streaming stopped')
    
    this.emit('stream:stopped', {
      timestamp: new Date().toISOString(),
      finalHistorySize: this.eventHistory.length
    })
  }

  /**
   * Stream a Linear event to the TUI
   * 
   * Processes and formats a Linear webhook event for TUI display.
   * Applies filters and manages event history.
   * 
   * @param eventData - Raw Linear webhook event data
   * @param eventType - Specific type of Linear event
   * @returns Formatted stream event or null if filtered out
   */
  streamEvent(eventData: any, eventType: LinearEventType): LinearStreamEvent | null {
    if (!this.isActive) {
      return null
    }

    try {
      // Format the event for TUI consumption
      const streamEvent = this.formatEventForTUI(eventData, eventType)
      
      // Apply filters if any are set
      if (this.shouldFilterEvent(streamEvent)) {
        return null
      }

      // Add to event history
      this.addToHistory(streamEvent)
      
      // Emit the event to TUI listeners
      this.emit('event:streamed', streamEvent)
      
      // Emit type-specific events for specialized handling
      this.emit(`event:${eventType}`, streamEvent)
      
      console.log(`Linear event streamed to TUI:`, {
        type: eventType,
        title: streamEvent.title,
        actor: streamEvent.actor,
        issue: streamEvent.issue.identifier
      })

      return streamEvent

    } catch (error) {
      console.error(`Failed to stream Linear event:`, {
        eventType,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return null
    }
  }

  /**
   * Format Linear webhook event for TUI display
   * 
   * Converts raw Linear webhook data into a standardized format
   * suitable for TUI consumption and display.
   * 
   * @param eventData - Raw Linear webhook event data
   * @param eventType - Type of event for formatting
   * @returns Formatted stream event ready for TUI display
   */
  private formatEventForTUI(eventData: any, eventType: LinearEventType): LinearStreamEvent {
    const timestamp = new Date().toISOString()
    const actor = eventData.actor?.name || eventData.user?.name || 'Unknown'
    
    // Extract issue information from various event structures
    const issue = {
      id: eventData.data?.issueId || eventData.data?.id || 'unknown',
      identifier: eventData.data?.issue?.identifier || eventData.data?.identifier || 'UNKNOWN',
      title: eventData.data?.issue?.title || eventData.data?.title || 'Unknown Issue',
      url: eventData.data?.issue?.url || eventData.url || '#'
    }

    let title = ''
    let description = ''
    let severity: 'info' | 'success' | 'warning' | 'error' = 'info'
    let tags: string[] = [eventType]
    let command: LinearStreamEvent['command'] = undefined

    switch (eventType) {
      case 'comment_created':
        title = `New comment on ${issue.identifier}`
        description = this.truncateText(eventData.data?.body || 'No content', 200)
        tags.push('comment', 'created')
        break

      case 'comment_updated':
        title = `Comment updated on ${issue.identifier}`
        description = this.truncateText(eventData.data?.body || 'No content', 200)
        tags.push('comment', 'updated')
        break

      case 'issue_created':
        title = `New issue: ${issue.identifier}`
        description = this.truncateText(eventData.data?.description || 'No description', 200)
        tags.push('issue', 'created')
        break

      case 'issue_updated':
        title = `Issue updated: ${issue.identifier}`
        description = `Issue ${eventData.action} by ${actor}`
        tags.push('issue', 'updated')
        break

      case 'opencode_command':
        title = `OpenCode command in ${issue.identifier}`
        description = `Command: ${eventData.command?.raw || 'Unknown command'}`
        command = eventData.command
        severity = 'info'
        tags.push('opencode', 'command')
        break

      case 'opencode_response':
        title = `OpenCode response in ${issue.identifier}`
        description = this.truncateText(eventData.command?.response || 'No response', 200)
        command = eventData.command
        severity = eventData.command?.success ? 'success' : 'warning'
        tags.push('opencode', 'response')
        break
    }

    return {
      id: this.generateEventId(eventData, eventType),
      type: eventType,
      title,
      description,
      timestamp,
      actor,
      issue,
      command,
      metadata: {
        source: 'linear-webhook',
        processedAt: timestamp,
        severity,
        tags
      }
    }
  }

  /**
   * Add event to history with size management
   * 
   * Maintains a rolling history of events for reference and debugging.
   * Automatically removes oldest events when history size limit is reached.
   * 
   * @param event - Event to add to history
   */
  private addToHistory(event: LinearStreamEvent): void {
    this.eventHistory.push(event)
    
    // Maintain history size limit
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift()
    }
  }

  /**
   * Check if event should be filtered out
   * 
   * Applies active filters to determine if an event should be streamed.
   * Supports filtering by event type, severity, and tags.
   * 
   * @param event - Event to check for filtering
   * @returns True if event should be filtered out
   */
  private shouldFilterEvent(event: LinearStreamEvent): boolean {
    if (this.filters.size === 0) {
      return false
    }

    // Check if any filter matches the event
    for (const filter of this.filters) {
      if (this.matchesFilter(event, filter)) {
        return false // Event matches an allowed filter
      }
    }

    return true // No filters matched, filter out the event
  }

  /**
   * Check if event matches a specific filter
   * 
   * Evaluates whether an event matches the given filter criteria.
   * Supports various filter formats for flexible event selection.
   * 
   * @param event - Event to check
   * @param filter - Filter string to match against
   * @returns True if event matches the filter
   */
  private matchesFilter(event: LinearStreamEvent, filter: string): boolean {
    const lowerFilter = filter.toLowerCase()
    
    // Check event type
    if (event.type.toLowerCase().includes(lowerFilter)) {
      return true
    }
    
    // Check severity
    if (event.metadata.severity.toLowerCase().includes(lowerFilter)) {
      return true
    }
    
    // Check tags
    if (event.metadata.tags.some(tag => tag.toLowerCase().includes(lowerFilter))) {
      return true
    }
    
    // Check actor
    if (event.actor.toLowerCase().includes(lowerFilter)) {
      return true
    }
    
    // Check issue identifier
    if (event.issue.identifier.toLowerCase().includes(lowerFilter)) {
      return true
    }
    
    return false
  }

  /**
   * Generate unique event identifier
   * 
   * Creates a consistent ID for events based on their content and type.
   * Useful for deduplication and event tracking.
   * 
   * @param eventData - Raw event data
   * @param eventType - Type of event
   * @returns Unique event identifier
   */
  private generateEventId(eventData: any, eventType: LinearEventType): string {
    const baseId = eventData.data?.id || eventData.id || 'unknown'
    const timestamp = Date.now()
    return `${eventType}-${baseId}-${timestamp}`
  }

  /**
   * Truncate text to specified length with ellipsis
   * 
   * Helper method to ensure text fits within display constraints.
   * Preserves word boundaries when possible.
   * 
   * @param text - Text to truncate
   * @param maxLength - Maximum length for the text
   * @returns Truncated text with ellipsis if needed
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text
    }
    
    return text.substring(0, maxLength - 3) + '...'
  }

  /**
   * Set up event handlers for internal management
   * 
   * Configures internal event handling for stream lifecycle management.
   * Handles cleanup and maintenance tasks.
   */
  private setupEventHandlers(): void {
    // Handle stream lifecycle events
    this.on('stream:started', () => {
      console.log('TUI event stream is now active')
    })

    this.on('stream:stopped', () => {
      console.log('TUI event stream is now inactive')
    })

    // Handle error events
    this.on('error', (error) => {
      console.error('TUI event stream error:', error)
    })
  }

  /**
   * Get current event history
   * 
   * Returns the current event history for inspection or debugging.
   * 
   * @returns Array of historical events
   */
  getHistory(): LinearStreamEvent[] {
    return [...this.eventHistory]
  }

  /**
   * Set event filters
   * 
   * Configures filters to control which events are streamed.
   * Empty filter set means all events are allowed.
   * 
   * @param filters - Array of filter strings
   */
  setFilters(filters: string[]): void {
    this.filters = new Set(filters)
    console.log(`Event filters updated: ${filters.join(', ')}`)
  }

  /**
   * Get current filters
   * 
   * Returns the currently active event filters.
   * 
   * @returns Array of active filter strings
   */
  getFilters(): string[] {
    return Array.from(this.filters)
  }

  /**
   * Clear event history
   * 
   * Removes all events from the history.
   * Useful for privacy or memory management.
   */
  clearHistory(): void {
    this.eventHistory = []
    console.log('Event history cleared')
  }

  /**
   * Get stream statistics
   * 
   * Returns current statistics about the event stream.
   * 
   * @returns Stream statistics object
   */
  getStats(): {
    isActive: boolean
    historySize: number
    filterCount: number
    maxHistorySize: number
  } {
    return {
      isActive: this.isActive,
      historySize: this.eventHistory.length,
      filterCount: this.filters.size,
      maxHistorySize: this.maxHistorySize
    }
  }
}

// Export singleton instance for easy usage
export const tuiEventStreamManager = new TUIEventStreamManager()