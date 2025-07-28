async function testAPIs() {
const fetch = require('node-fetch');

async function testAPIs() {
    const baseUrl = 'http://localhost:3000';
    
    console.log('🧪 Testing CLSI Platform API Endpoints\n');
    
    // Test login first
    console.log('1. Testing Authentication...');
    try {
        const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin123' })
        });
        
        if (loginResponse.ok) {
            const loginData = await loginResponse.json();
            console.log('✅ Login successful');
            const token = loginData.token;
            
            // Test all API endpoints
            const endpoints = [
                '/api/users',
                '/api/users/statistics',
                '/api/microorganisms',
                '/api/microorganisms/statistics',
                '/api/drugs',
                '/api/drugs/statistics',
                '/api/samples',
                '/api/samples/statistics',
                '/api/expert-rules',
                '/api/expert-rules/statistics',
                '/api/reports/system-overview',
                '/api/breakpoint-standards',
                '/api/lab-results',
                '/api/documents',
                '/api/export-import/statistics',
                '/api/localization/languages'
            ];
            
            console.log('\n2. Testing API Endpoints...');
            for (const endpoint of endpoints) {
                try {
                    const response = await fetch(`${baseUrl}${endpoint}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    
                    if (response.ok) {
                        console.log(`✅ ${endpoint} - Status: ${response.status}`);
                    } else {
                        console.log(`❌ ${endpoint} - Status: ${response.status}`);
                    }
                } catch (error) {
                    console.log(`❌ ${endpoint} - Error: ${error.message}`);
                }
            }
            
        } else {
            console.log('❌ Login failed');
        }
    } catch (error) {
        console.log(`❌ Login error: ${error.message}`);
    }
    
    console.log('\n3. Testing HTML Pages...');
    const pages = [
        '/login.html',
        '/dashboard.html',
        '/users.html',
        '/microorganisms.html',
        '/drugs.html',
        '/samples.html',
        '/expert-rules.html',
        '/reports.html'
    ];
    
    for (const page of pages) {
        try {
            const response = await fetch(`${baseUrl}${page}`);
            if (response.ok) {
                console.log(`✅ ${page} - Status: ${response.status}`);
            } else {
                console.log(`❌ ${page} - Status: ${response.status}`);
            }
        } catch (error) {
            console.log(`❌ ${page} - Error: ${error.message}`);
        }
    }
    
    console.log('\n🎯 API Testing Complete!');
}

testAPIs().catch(console.error);