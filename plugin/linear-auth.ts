import { LinearClient } from '@linear/sdk'

let linearClient: LinearClient | null = null
const apiKey = process.env.LINEAR_API_KEY

if (!apiKey) {
  console.log("Linear Plugin: LINEAR_API_KEY environment variable not found")
} else {
  linearClient = new LinearClient({ apiKey })
}

export async function getLinearClient(): Promise<LinearClient | null> {
  if (!linearClient) return null

  try {
    await linearClient.viewer
    return linearClient
  } catch (error) {
    console.log(`Linear Plugin: Authentication error - ${error}`)
    
    // Retry once for de-authenticated users
    try {
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      await linearClient.viewer
      return linearClient

    } catch {
      
      console.log(`Linear Plugin: Could not resolve authentication retry`)
      return null
    }
  }
}

export async function testLinearAuth(): Promise<string> {
  const client = await getLinearClient()
  if (!client) {
    return "Linear Plugin: Authentication failed - check API key and connection"
  }

  try {
    const user = await client.viewer
    return user ? `Linear Plugin: Successfully authenticated as ${user.displayName || user.name}` 
                : "Linear Plugin: Authentication failed - could not retrieve user"
  } catch (error) {
    return `Linear Plugin: Authentication error - ${error}`
  }
}