import { getLinearCRUD } from './plugin/linear-crud'

async function createRandomIssue() {
  try {
    console.log('Creating Linear issue with title "Random Issue"...');
    
    const crud = getLinearCRUD();
    const issue = await crud.createIssue({
      title: "Random Issue"
    });
    
    if (issue) {
      console.log('✅ Issue created successfully!');
      console.log(`ID: ${issue.id}`);
      console.log(`Identifier: ${issue.identifier}`);
      console.log(`Title: ${issue.title}`);
      console.log(`URL: ${issue.url}`);
      return {
        success: true,
        id: issue.id,
        identifier: issue.identifier,
        title: issue.title,
        url: issue.url
      };
    } else {
      console.log('❌ Failed to create issue');
      return {
        success: false,
        error: "Failed to create issue"
      };
    }
  } catch (error) {
    console.error('❌ Error creating issue:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

createRandomIssue().then(result => {
  console.log('\nFinal result:', JSON.stringify(result, null, 2));
  process.exit(result.success ? 0 : 1);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});