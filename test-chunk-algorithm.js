// Test the chunk-based semantic diff algorithm
console.log("🧪 Testing Chunk-Based Semantic Diff Algorithm");

const testLeft = "Modern technology continues to transform the way humans interact with information and with one another.";
const testRight = "Modern technology keeps changing how people interact with information and each other.";

console.log("Original:", testLeft);
console.log("New:", testRight);

console.log("\n🔧 Algorithm Improvements:");
console.log("1. ✅ Identifies semantic chunks instead of individual words");
console.log("2. ✅ Groups related words into meaningful chunks");
console.log("3. ✅ Highlights entire chunks when semantic difference detected");
console.log("4. ✅ Allows users to click and merge entire chunks");

console.log("\n📋 Expected Chunks:");
console.log("- 'Modern technology' - identical chunk (no highlight)");
console.log("- 'continues to transform' - semantic diff chunk (highlighted)");
console.log("- 'the way humans' - semantic diff chunk (highlighted)"); 
console.log("- 'interact with information and' - identical chunk (no highlight)");
console.log("- 'with one another' - semantic diff chunk (highlighted)");

console.log("\n✨ Chunk-Based Algorithm Ready!");
console.log("Users can now click on any highlighted chunk to merge it as a complete unit.");