const axios = require('axios');

// Test script to verify throttling works
async function testThrottling() {
  const API_BASE = 'http://localhost:3000'; // Adjust if different
  const token = 'YOUR_JWT_TOKEN_HERE'; // Replace with actual token
  
  console.log('🔥 Testing affiliate link creation throttling...');
  console.log('Expected: First 5 requests should succeed, 6th should fail with 429\n');

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const payload = {
    productId: 1,
    variantId: 1,
    programId: 1
  };

  for (let i = 1; i <= 7; i++) {
    try {
      const start = Date.now();
      const response = await axios.post(
        `${API_BASE}/affiliate-links/create-link`,
        payload,
        { headers }
      );
      const duration = Date.now() - start;
      
      console.log(`✅ Request ${i}: SUCCESS (${response.status}) - ${duration}ms`);
    } catch (error) {
      const duration = Date.now() - start;
      const status = error.response?.status || 'ERROR';
      const message = error.response?.data?.message || error.message;
      
      if (status === 429) {
        console.log(`🚫 Request ${i}: THROTTLED (${status}) - ${duration}ms`);
        console.log(`   Message: ${message}`);
      } else {
        console.log(`❌ Request ${i}: FAILED (${status}) - ${duration}ms`);
        console.log(`   Error: ${message}`);
      }
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n⏰ Waiting 61 seconds for throttle reset...');
  await new Promise(resolve => setTimeout(resolve, 61000));
  
  console.log('🔄 Testing after throttle reset...');
  try {
    const response = await axios.post(
      `${API_BASE}/affiliate-links/create-link`,
      payload,
      { headers }
    );
    console.log(`✅ After reset: SUCCESS (${response.status})`);
  } catch (error) {
    const status = error.response?.status || 'ERROR';
    console.log(`❌ After reset: FAILED (${status})`);
  }
}

// Run the test
testThrottling().catch(console.error);
