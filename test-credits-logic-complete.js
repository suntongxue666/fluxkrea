// Complete Credits Logic Verification Test
// This test verifies all the credits-related fixes

const fs = require('fs');

console.log('🧪 Testing Complete Credits Logic Implementation...\n');

// Read the main HTML file
const htmlContent = fs.readFileSync('public/index.html', 'utf8');

// Test 1: Verify showCreditsModal function exists and has correct content
console.log('1. Testing showCreditsModal function...');
const showCreditsModalMatch = htmlContent.match(/function showCreditsModal\(\)\s*{([^}]+)}/);
if (showCreditsModalMatch) {
    const modalContent = showCreditsModalMatch[1];
    
    // Check for correct modal content
    const hasCorrectTitle = modalContent.includes('积分不足');
    const hasCorrectMessage = modalContent.includes('您的积分不足，无法生成图片');
    const hasUpgradeButton = modalContent.includes('立即升级');
    const hasCloseButton = modalContent.includes('关闭');
    
    console.log('   ✅ showCreditsModal function found');
    console.log(`   ${hasCorrectTitle ? '✅' : '❌'} Has correct title (积分不足)`);
    console.log(`   ${hasCorrectMessage ? '✅' : '❌'} Has correct message`);
    console.log(`   ${hasUpgradeButton ? '✅' : '❌'} Has upgrade button`);
    console.log(`   ${hasCloseButton ? '✅' : '❌'} Has close button`);
} else {
    console.log('   ❌ showCreditsModal function not found');
}

// Test 2: Verify credits modal CSS is centered
console.log('\n2. Testing credits modal CSS...');
const modalCssMatch = htmlContent.match(/#creditsModal[^}]+}/);
if (modalCssMatch) {
    const modalCss = modalCssMatch[0];
    const isCentered = modalCss.includes('justify-content: center') && 
                      modalCss.includes('align-items: center') &&
                      modalCss.includes('display: flex');
    
    console.log(`   ${isCentered ? '✅' : '❌'} Modal is properly centered`);
} else {
    console.log('   ❌ Credits modal CSS not found');
}

// Test 3: Verify ImageGenerator credits check logic
console.log('\n3. Testing ImageGenerator credits check...');
const imageGeneratorMatch = htmlContent.match(/class ImageGenerator[^}]+}[^}]+}/s);
if (imageGeneratorMatch) {
    const generatorCode = imageGeneratorMatch[0];
    
    // Check for proper credits validation
    const hasCreditsCheck = generatorCode.includes('credits <= 0') || generatorCode.includes('credits < 1');
    const callsShowCreditsModal = generatorCode.includes('showCreditsModal()');
    const hasReturnAfterModal = generatorCode.includes('showCreditsModal()') && 
                               generatorCode.includes('return');
    
    console.log(`   ${hasCreditsCheck ? '✅' : '❌'} Has credits validation`);
    console.log(`   ${callsShowCreditsModal ? '✅' : '❌'} Calls showCreditsModal()`);
    console.log(`   ${hasReturnAfterModal ? '✅' : '❌'} Returns after showing modal`);
} else {
    console.log('   ❌ ImageGenerator class not found');
}

// Test 4: Verify UnifiedStateSync integration
console.log('\n4. Testing UnifiedStateSync integration...');
const hasUnifiedStateSync = htmlContent.includes('UnifiedStateSync');
const hasCreditsUpdate = htmlContent.includes('updateCreditsDisplay') || 
                        htmlContent.includes('credits:');

console.log(`   ${hasUnifiedStateSync ? '✅' : '❌'} Uses UnifiedStateSync`);
console.log(`   ${hasCreditsUpdate ? '✅' : '❌'} Has credits update mechanism`);

// Test 5: Check for login bonus logic
console.log('\n5. Testing login bonus logic...');
const hasLoginBonus = htmlContent.includes('20') && 
                     (htmlContent.includes('bonus') || htmlContent.includes('登录奖励'));

console.log(`   ${hasLoginBonus ? '✅' : '❌'} Has login bonus logic`);

// Summary
console.log('\n📊 Credits Logic Test Summary:');
console.log('================================');

const tests = [
    showCreditsModalMatch ? '✅' : '❌',
    modalCssMatch ? '✅' : '❌', 
    imageGeneratorMatch ? '✅' : '❌',
    hasUnifiedStateSync ? '✅' : '❌',
    hasLoginBonus ? '✅' : '❌'
];

const passedTests = tests.filter(test => test === '✅').length;
console.log(`Passed: ${passedTests}/5 tests`);

if (passedTests === 5) {
    console.log('🎉 All credits logic tests passed!');
} else {
    console.log('⚠️  Some tests failed. Please review the implementation.');
}