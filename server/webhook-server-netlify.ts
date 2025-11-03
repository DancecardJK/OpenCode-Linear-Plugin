/**
 * Linear Webhook Server - Netlify Functions Implementation
 * 
 * This is a serverless implementation using Netlify Functions for handling Linear webhooks.
 * It's perfect for:
 * - Production deployment without server management
 * - Auto-scaling and pay-per-use pricing
 * - Global CDN distribution
 * - Quick setup and deployment
 * 
 * Architecture:
 * - Uses shared webhook handlers and middleware
 * - Netlify Functions runtime environment
 * - Automatic HTTPS and domain management
 * - Built-in error handling and logging
 */

import { verifyWebhookSignature, extractSignature } from './middleware/signature-verification'
import { handleWebhook, handleHealthCheck } from './webhook-handlers'
import type { LinearWebhookPayload } from './types/linear-webhook-types'
import type { HandlerEvent, HandlerContext, HandlerResponse } from '@netlify/functions'

/**
 * Netlify Functions configuration
 * These can be set via Netlify environment variables
 */
const config = {
  webhookSecret: process.env.LINEAR_WEBHOOK_SECRET || '',
  enableDebug: process.env.NETLIFY_DEBUG === 'true'
}

/**
 * Debug logging helper
 * Only logs when debug mode is enabled
 */
function debugLog(message: string, data?: any): void {
  if (config.enableDebug) {
    console.log(`🔍 DEBUG: ${message}`, data || '')
  }
}

/**
 * Main webhook handler function
 * This is the Netlify Function that processes Linear webhooks
 * 
 * Netlify automatically routes requests to this function based on the filename
 * or netlify.toml configuration
 */
export async function handler(
  event: HandlerEvent,
  context: HandlerContext
): Promise<HandlerResponse> {
  debugLog('Netlify Function invoked', {
    httpMethod: event.httpMethod,
    path: event.path,
    headers: event.headers,
    body: event.body ? 'present' : 'missing'
  })

  try {
    // Handle different HTTP methods
    switch (event.httpMethod) {
      case 'POST':
        return await handleWebhookRequest(event)
      
      case 'GET':
        return await handleGetRequest(event)
      
      default:
        return {
          statusCode: 405,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Method not allowed' })
        }
    }
  } catch (error) {
    console.error('❌ Netlify Function error:', error)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}

/**
 * Handle POST requests (webhook payloads from Linear)
 */
async function handleWebhookRequest(event: HandlerEvent): Promise<HandlerResponse> {
  // Validate request
  if (!event.body) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing request body' })
    }
  }

  // Extract and verify signature
  const signature = extractSignature(event.headers as Record<string, string>)
  
  if (!signature) {
    console.error('❌ Missing Linear signature header')
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing signature' })
    }
  }

  if (!verifyWebhookSignature(event.body, signature, config.webhookSecret)) {
    console.error('❌ Invalid webhook signature')
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid signature' })
    }
  }

  // Parse and process webhook payload
  try {
    const webhookPayload: LinearWebhookPayload = JSON.parse(event.body)
    debugLog('Webhook payload parsed', { type: webhookPayload.type, action: webhookPayload.action })
    
    const result = await handleWebhook(webhookPayload)

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: result.message,
        data: result.data,
        error: result.error
      })
    }
  } catch (parseError) {
    console.error('❌ Failed to parse webhook payload:', parseError)
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid webhook payload' })
    }
  }
}

/**
 * Handle GET requests (health checks, info, etc.)
 */
async function handleGetRequest(event: HandlerEvent): Promise<HandlerResponse> {
  const path = event.path.replace(/^\/+/, '') // Remove leading slashes
  
  switch (path) {
    case 'health':
      return handleHealthCheckRequest()
    
    case 'info':
      return handleInfoRequest()
    
    default:
      return handleRootRequest()
  }
}

/**
 * Health check endpoint
 * Useful for monitoring and Netlify's health checks
 */
function handleHealthCheckRequest(): HandlerResponse {
  const health = handleHealthCheck()
  
  return {
    statusCode: health.success ? 200 : 500,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(health)
  }
}

/**
 * Server info endpoint
 * Shows configuration and deployment information
 */
function handleInfoRequest(): HandlerResponse {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      server: 'Linear Webhook Server (Netlify Functions)',
      version: '1.0.0',
      config: {
        hasWebhookSecret: !!config.webhookSecret,
        debugMode: config.enableDebug
      },
      deployment: {
        platform: 'Netlify Functions',
        region: process.env.NETLIFY_REGION || 'unknown',
        site: process.env.SITE_NAME || 'unknown'
      },
      timestamp: new Date().toISOString()
    })
  }
}

/**
 * Root endpoint
 * Basic server information and available endpoints
 */
function handleRootRequest(): HandlerResponse {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Linear Webhook Server (Netlify Functions)',
      endpoints: {
        webhook: 'POST / (main function)',
        health: 'GET /health',
        info: 'GET /info'
      },
      docs: 'See README.md for setup instructions',
      deployment: 'Netlify Functions'
    })
  }
}

/**
 * Development helper: Local testing function
 * This can be used for local development with Netlify CLI
 * 
 * Usage: netlify functions serve
 */
export async function localTest(event: HandlerEvent): Promise<HandlerResponse> {
  console.log('🧪 Local test function called')
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Local test successful',
      timestamp: new Date().toISOString(),
      event: {
        httpMethod: event.httpMethod,
        path: event.path,
        headers: Object.keys(event.headers)
      }
    })
  }
}