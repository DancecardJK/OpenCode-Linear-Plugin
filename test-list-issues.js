const { getLinearCRUD } = require('./plugin/linear-crud');

async function testListIssues() {
  try {
    console.log('Testing linear_list_issues functionality...');
    
    const crud = getLinearCRUD();
    const issues = await crud.listIssues(10);
    
    console.log(`Found ${issues.length} issues:`);
    issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.identifier} - ${issue.title}`);
      console.log(`   Status: ${issue.state?.name || 'Unknown'}`);
      console.log(`   Assignee: ${issue.assignee?.name || 'Unassigned'}`);
      console.log(`   URL: ${issue.url}`);
      console.log('');
    });
    
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
    };
    
  } catch (error) {
    console.error('Error listing issues:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

testListIssues().then(result => {
  console.log('\nFinal result:', JSON.stringify(result, null, 2));
}).catch(error => {
  console.error('Script failed:', error);
});