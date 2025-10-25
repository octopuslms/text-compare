// 测试语义差异算法
const { computeSemanticDiff, getSemanticDiffExplanation } = require('./src/lib/semantic-diff.ts');

// 测试用例
const testCases = [
  {
    name: "基本语义差异测试",
    left: "Modern technology continues to transform the way humans interact with information and with one another.",
    right: "Modern technology keeps changing how people interact with information and each other.",
    expected: {
      identical: ["Modern technology", "interact with information and"],
      semanticDiff: ["continues to transform", "keeps changing", "the way humans", "how people", "with one another", "each other"]
    }
  }
];

function runTests() {
  console.log("🧪 开始测试语义差异算法...\n");
  
  testCases.forEach((testCase, index) => {
    console.log(`📝 测试用例 ${index + 1}: ${testCase.name}`);
    console.log(`原文: ${testCase.left}`);
    console.log(`新文: ${testCase.right}`);
    
    const leftWords = testCase.left.split(/\s+/);
    const rightWords = testCase.right.split(/\s+/);
    
    const result = computeSemanticDiff(leftWords, rightWords);
    const explanations = getSemanticDiffExplanation(result.semanticBlocks);
    
    console.log("\n🔍 分析结果:");
    console.log(`高亮的左文词汇: ${result.leftHighlights.map((h, i) => h ? leftWords[i] : null).filter(Boolean).join(', ')}`);
    console.log(`高亮的右文词汇: ${result.rightHighlights.map((h, i) => h ? rightWords[i] : null).filter(Boolean).join(', ')}`);
    
    console.log("\n💡 语义解释:");
    explanations.forEach((explanation, i) => {
      console.log(`  ${i + 1}. ${explanation}`);
    });
    
    console.log("\n" + "=".repeat(80) + "\n");
  });
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  runTests();
}

module.exports = { runTests };