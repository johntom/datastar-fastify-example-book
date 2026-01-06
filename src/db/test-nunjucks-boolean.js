const nunjucks = require('nunjucks');

// Test how Nunjucks renders boolean values
const env = nunjucks.configure({ autoescape: true });

const template = `
<div data-signals:hasMore="{{ hasMore }}">
  hasMore value: {{ hasMore }}
  Type check: {{ hasMore | dump }}
</div>
`;

console.log('=== TESTING NUNJUCKS BOOLEAN RENDERING ===\n');

console.log('Test 1: hasMore = true (boolean)');
const result1 = env.renderString(template, { hasMore: true });
console.log(result1);

console.log('\nTest 2: hasMore = false (boolean)');
const result2 = env.renderString(template, { hasMore: false });
console.log(result2);

console.log('\nTest 3: hasMore = "true" (string)');
const result3 = env.renderString(template, { hasMore: "true" });
console.log(result3);

console.log('\nTest 4: hasMore = undefined');
const result4 = env.renderString(template, { });
console.log(result4);
