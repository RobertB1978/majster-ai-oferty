#!/usr/bin/env node

/**
 * Deployment Verification Script
 *
 * Checks if Majster.AI is properly deployed and configured
 * Run: node scripts/verify-deployment.js <DEPLOYMENT_URL>
 *
 * Example:
 *   node scripts/verify-deployment.js https://majster-ai.vercel.app
 */

const https = require('https');
const http = require('http');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.cyan);
}

function logSection(message) {
  log(`\n${'='.repeat(60)}`, colors.blue);
  log(`  ${message}`, colors.blue);
  log('='.repeat(60), colors.blue);
}

/**
 * Make HTTP request
 */
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const timeout = 10000; // 10 seconds

    const req = protocol.get(url, { timeout }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

/**
 * Test 1: Check if URL is reachable
 */
async function testReachability(baseUrl) {
  logSection('Test 1: Checking URL Reachability');

  try {
    const response = await makeRequest(baseUrl);

    if (response.statusCode === 200) {
      logSuccess(`URL is reachable: ${baseUrl}`);
      logInfo(`Status: ${response.statusCode}`);
      return true;
    } else {
      logWarning(`Unexpected status code: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    logError(`Cannot reach URL: ${error.message}`);
    return false;
  }
}

/**
 * Test 2: Check if it's a valid HTML page
 */
async function testHTMLContent(baseUrl) {
  logSection('Test 2: Checking HTML Content');

  try {
    const response = await makeRequest(baseUrl);
    const contentType = response.headers['content-type'] || '';

    if (contentType.includes('text/html')) {
      logSuccess('Content-Type is text/html');
    } else {
      logWarning(`Unexpected Content-Type: ${contentType}`);
    }

    if (response.body.includes('<div id="root">')) {
      logSuccess('Found React root element (#root)');
    } else {
      logError('React root element (#root) not found - app may not load');
      return false;
    }

    if (response.body.includes('<!DOCTYPE html>') || response.body.includes('<!doctype html>')) {
      logSuccess('Valid HTML document (DOCTYPE found)');
    } else {
      logWarning('DOCTYPE not found - may cause rendering issues');
    }

    return true;
  } catch (error) {
    logError(`Failed to check HTML content: ${error.message}`);
    return false;
  }
}

/**
 * Test 3: Check security headers
 */
async function testSecurityHeaders(baseUrl) {
  logSection('Test 3: Checking Security Headers');

  try {
    const response = await makeRequest(baseUrl);
    const headers = response.headers;

    const requiredHeaders = {
      'x-frame-options': 'DENY or SAMEORIGIN',
      'x-content-type-options': 'nosniff',
      'x-xss-protection': '1; mode=block',
      'referrer-policy': 'strict-origin-when-cross-origin',
      'strict-transport-security': 'max-age=...',
    };

    let allPresent = true;

    for (const [header, expected] of Object.entries(requiredHeaders)) {
      if (headers[header]) {
        logSuccess(`${header}: ${headers[header]}`);
      } else {
        logWarning(`Missing header: ${header} (expected: ${expected})`);
        allPresent = false;
      }
    }

    // CSP check
    if (headers['content-security-policy']) {
      logSuccess(`content-security-policy: ${headers['content-security-policy'].substring(0, 50)}...`);
    } else {
      logWarning('Missing Content-Security-Policy header');
      allPresent = false;
    }

    return allPresent;
  } catch (error) {
    logError(`Failed to check security headers: ${error.message}`);
    return false;
  }
}

/**
 * Test 4: Check if static assets load
 */
async function testStaticAssets(baseUrl) {
  logSection('Test 4: Checking Static Assets');

  try {
    const response = await makeRequest(baseUrl);
    const body = response.body;

    // Extract JS and CSS file references
    const jsMatches = body.match(/src="([^"]*\.js)"/g) || [];
    const cssMatches = body.match(/href="([^"]*\.css)"/g) || [];

    logInfo(`Found ${jsMatches.length} JS references`);
    logInfo(`Found ${cssMatches.length} CSS references`);

    if (jsMatches.length > 0 && cssMatches.length > 0) {
      logSuccess('Static assets (JS/CSS) are referenced in HTML');
      return true;
    } else {
      logWarning('No JS or CSS references found - app may not load');
      return false;
    }
  } catch (error) {
    logError(`Failed to check static assets: ${error.message}`);
    return false;
  }
}

/**
 * Test 5: Check if Supabase connection can be detected
 */
async function testSupabaseConnection(baseUrl) {
  logSection('Test 5: Checking Supabase Configuration');

  try {
    const response = await makeRequest(baseUrl);
    const body = response.body;

    // Check if Supabase URL is in inline scripts (it shouldn't be for security)
    if (body.includes('supabase.co') && body.includes('VITE_SUPABASE_URL')) {
      logWarning('Supabase URL found in HTML source - may be exposed');
    }

    logInfo('Cannot verify Supabase connection from server-side');
    logInfo('Run manual smoke test to verify Supabase connection');

    return true;
  } catch (error) {
    logError(`Failed to check Supabase configuration: ${error.message}`);
    return false;
  }
}

/**
 * Test 6: Check if routes work (SPA routing)
 */
async function testSPARouting(baseUrl) {
  logSection('Test 6: Checking SPA Routing');

  const routes = ['/login', '/dashboard', '/projects'];

  let allWork = true;

  for (const route of routes) {
    try {
      const url = `${baseUrl}${route}`;
      const response = await makeRequest(url);

      if (response.statusCode === 200) {
        logSuccess(`${route} - Status ${response.statusCode}`);
      } else if (response.statusCode === 404) {
        logError(`${route} - Status 404 (SPA routing not configured)`);
        allWork = false;
      } else {
        logWarning(`${route} - Status ${response.statusCode}`);
        allWork = false;
      }
    } catch (error) {
      logError(`${route} - Error: ${error.message}`);
      allWork = false;
    }
  }

  if (allWork) {
    logSuccess('SPA routing is properly configured');
  } else {
    logWarning('Some routes may not work - check vercel.json rewrites');
  }

  return allWork;
}

/**
 * Main verification function
 */
async function verifyDeployment(deploymentUrl) {
  log('\n' + '='.repeat(60), colors.blue);
  log('  🚀 Majster.AI Deployment Verification', colors.blue);
  log('='.repeat(60) + '\n', colors.blue);

  logInfo(`Deployment URL: ${deploymentUrl}`);
  logInfo(`Timestamp: ${new Date().toISOString()}`);

  const tests = [
    { name: 'Reachability', fn: () => testReachability(deploymentUrl) },
    { name: 'HTML Content', fn: () => testHTMLContent(deploymentUrl) },
    { name: 'Security Headers', fn: () => testSecurityHeaders(deploymentUrl) },
    { name: 'Static Assets', fn: () => testStaticAssets(deploymentUrl) },
    { name: 'Supabase Config', fn: () => testSupabaseConnection(deploymentUrl) },
    { name: 'SPA Routing', fn: () => testSPARouting(deploymentUrl) },
  ];

  const results = [];

  for (const test of tests) {
    try {
      const passed = await test.fn();
      results.push({ name: test.name, passed });
    } catch (error) {
      logError(`Test failed: ${test.name} - ${error.message}`);
      results.push({ name: test.name, passed: false });
    }
  }

  // Summary
  logSection('Summary');

  const totalTests = results.length;
  const passedTests = results.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;

  results.forEach(result => {
    if (result.passed) {
      logSuccess(`${result.name}: PASS`);
    } else {
      logError(`${result.name}: FAIL`);
    }
  });

  log('\n' + '-'.repeat(60));
  logInfo(`Total Tests: ${totalTests}`);
  logInfo(`Passed: ${passedTests}`);
  logInfo(`Failed: ${failedTests}`);
  log('-'.repeat(60) + '\n');

  if (failedTests === 0) {
    logSuccess('🎉 All automated tests passed!');
    logInfo('Next step: Run manual smoke test (docs/SMOKE_TEST_PROD.md)');
    process.exit(0);
  } else {
    logError(`⚠️  ${failedTests} test(s) failed`);
    logInfo('Review failures above and check deployment configuration');
    logInfo('See docs/DEPLOYMENT_QUICK_START.md for setup instructions');
    process.exit(1);
  }
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    logError('Usage: node scripts/verify-deployment.js <DEPLOYMENT_URL>');
    logInfo('Example: node scripts/verify-deployment.js https://majster-ai.vercel.app');
    process.exit(1);
  }

  const deploymentUrl = args[0].replace(/\/$/, ''); // Remove trailing slash

  if (!deploymentUrl.startsWith('http')) {
    logError('Deployment URL must start with http:// or https://');
    process.exit(1);
  }

  verifyDeployment(deploymentUrl).catch(error => {
    logError(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { verifyDeployment };
