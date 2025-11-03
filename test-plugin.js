/**
 * Simple test to verify the plugin structure and exports
 */

// Test basic imports
console.log('Testing plugin imports...')

try {
  // Test if we can import the auth module
  const { testLinearAuth } = require('./plugin/linear-auth.ts')
  console.log('✅ Auth module imported successfully')
  
  // Test if we can import the CRUD module  
  const { getLinearCRUD } = require('./plugin/linear-crud.ts')
  console.log('✅ CRUD module imported successfully')
  
  // Test if we can create a CRUD instance
  const crud = getLinearCRUD()
  console.log('✅ CRUD instance created successfully')
  
  console.log('\n🎉 Plugin structure test passed!')
  console.log('The refactored plugin is ready for integration with OpenCode')
  
} catch (error) {
  console.error('❌ Plugin test failed:', error.message)
  process.exit(1)
}