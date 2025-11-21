const fs = require('fs');
const path = require('path');

console.log('=== CHECKING JWT USAGE IN AUTH CONTROLLER ===\n');

const authControllerPath = path.join(__dirname, 'src', 'controllers', 'authController.js');
if (fs.existsSync(authControllerPath)) {
  const content = fs.readFileSync(authControllerPath, 'utf8');
  
  console.log('Searching for jwt.sign usage...\n');
  
  // Look for the register function and JWT usage
  const registerFunctionMatch = content.match(/register[\s\S]*?async[\s\S]*?{[\s\S]*?}(?=\s*(?:async|function|\/\/|\/\*|$))/);
  
  if (registerFunctionMatch) {
    console.log('📋 Register function found:\n');
    console.log(registerFunctionMatch[0]);
    
    // Specifically look for jwt.sign calls
    const jwtSignCalls = registerFunctionMatch[0].match(/jwt\.sign\([\s\S]*?\)/g);
    if (jwtSignCalls) {
      console.log('\n🔍 JWT sign calls in register function:');
      jwtSignCalls.forEach((call, index) => {
        console.log(`\nCall ${index + 1}:`);
        console.log(call);
      });
    } else {
      console.log('\n❌ No jwt.sign calls found in register function');
    }
  } else {
    console.log('❌ Could not find register function');
  }
  
  // Also check for login function
  const loginFunctionMatch = content.match(/login[\s\S]*?async[\s\S]*?{[\s\S]*?}(?=\s*(?:async|function|\/\/|\/\*|$))/);
  if (loginFunctionMatch) {
    console.log('\n📋 Login function JWT usage:');
    const loginJwtCalls = loginFunctionMatch[0].match(/jwt\.sign\([\s\S]*?\)/g);
    if (loginJwtCalls) {
      loginJwtCalls.forEach((call, index) => {
        console.log(`\nLogin JWT call ${index + 1}:`);
        console.log(call);
      });
    }
  }
} else {
  console.log('❌ Auth controller not found at:', authControllerPath);
}