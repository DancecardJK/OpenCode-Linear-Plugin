/**
 * OpenCode Reference Detector
 * 
 * Detects and extracts @opencode mentions from Linear comment text.
 * This module provides the foundational pattern matching that enables
 * Linear-to-OpenCode integration by identifying commands that should
 * be processed by the OpenCode agent system.
 * 
 * The detection is intentionally broad to capture various command formats,
 * allowing downstream processors to handle specific parsing and validation.
 * This approach ensures flexibility while maintaining clear separation
 * of concerns between detection and execution.
 */

export interface OpenCodeReference {
  /** The raw @opencode mention including all arguments and options */
  raw: string
  /** Character position where the mention starts and ends in the original text */
  position: { start: number; end: number }
  /** The complete comment text providing full context for the reference */
  context: string
}

export class OpenCodeReferenceDetector {
  /**
   * Regex pattern for detecting @opencode references
   * 
   * Pattern breakdown:
   * - @opencode\b - Matches "@opencode" as a whole word (case insensitive)
   * - [^@]* - Captures any characters except @ (greedy)
   * - (?=@opencode|$) - Positive lookahead for next @opencode or end of string
   * 
   * This pattern captures complete commands including arguments and options,
   * stopping at the next @opencode reference or end of text to properly
   * handle multiple commands in a single comment.
   */
  private static readonly OPENCODE_PATTERN = /@opencode\b[^@]*(?=@opencode|$)/gi

  /**
   * Extract all @opencode references from comment text
   * 
   * Scans the provided comment text and returns an array of all detected
   * OpenCode references with their positions and full context. This method
   * handles multiple commands in a single comment and preserves the original
   * text for downstream processing.
   * 
   * @param comment - The Linear comment text to scan for @opencode references
   * @returns Array of detected references with position and context information
   */
  static detectReferences(comment: string): OpenCodeReference[] {
    const references: OpenCodeReference[] = []
    let match

    // Reset regex lastIndex to ensure consistent behavior across multiple calls
    // This is important because regex objects maintain state in JavaScript
    this.OPENCODE_PATTERN.lastIndex = 0

    // Execute regex globally to find all matches in the comment
    while ((match = this.OPENCODE_PATTERN.exec(comment)) !== null) {
      references.push({
        raw: match[0], // The complete matched @opencode reference
        position: {
          start: match.index, // Starting character position in original text
          end: match.index + match[0].length // Ending character position
        },
        context: comment.trim() // Full comment text for downstream processing
      })
    }

    return references
  }

  /**
   * Quick existence check for @opencode references
   * 
   * Provides a fast boolean check to determine if a comment contains
   * any @opencode mentions. This is useful for early filtering in
   * webhook processing pipelines where comments without references
   * can be skipped immediately.
   * 
   * @param comment - The comment text to check for @opencode mentions
   * @returns True if at least one @opencode reference is found, false otherwise
   */
  static hasOpenCodeReference(comment: string): boolean {
    // Reset regex to ensure accurate test results
    this.OPENCODE_PATTERN.lastIndex = 0
    return this.OPENCODE_PATTERN.test(comment)
  }

  /**
   * Extract the primary command action from a reference
   * 
   * Parses the detected reference to identify the main action/command.
   * This helper method extracts the first word after @opencode which
   * typically represents the primary action to be executed.
   * 
   * @param reference - The OpenCode reference to parse
   * @returns The primary action string or 'help' if no action found
   */
  static extractAction(reference: OpenCodeReference): string {
    // Remove @opencode prefix and trim whitespace
    const commandText = reference.raw.replace(/@opencode/i, '').trim()
    
    // Extract first word as the action, default to 'help' if empty
    const match = commandText.match(/^(\w+)/)
    return match ? match[1].toLowerCase() : 'help'
  }

  /**
   * Check if a reference contains specific options or flags
   * 
   * Searches the reference text for specific command-line options
   * in various formats (--option, -o, --key=value).
   * 
   * @param reference - The OpenCode reference to search
   * @param options - Array of option names to look for (without -- prefix)
   * @returns True if any of the specified options are found
   */
  static hasOptions(reference: OpenCodeReference, options: string[]): boolean {
    const searchText = reference.raw.toLowerCase()
    return options.some(option => {
      // Check for both --option and -o formats
      return searchText.includes(`--${option.toLowerCase()}`) ||
             searchText.includes(` -${option.toLowerCase()}`)
    })
  }
}

// Export singleton instance for convenient usage throughout the application
// This pattern ensures consistent regex state and provides a clean API
export const opencodeReferenceDetector = OpenCodeReferenceDetector