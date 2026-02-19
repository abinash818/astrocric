const http = require('http');

async function callApi(method, path, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        statusCode: res.statusCode,
                        body: JSON.parse(body)
                    });
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        body: body
                    });
                }
            });
        });

        req.on('error', (e) => reject(e));

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function runTest() {
    console.log('--- Testing Verify OTP ---');
    const authRes = await callApi('POST', '/api/auth/verify-otp', {
        phone: '1234567890',
        otp: '1212'
    });
    console.log('Auth Status:', authRes.statusCode);
    console.log('Auth Response:', JSON.stringify(authRes.body, null, 2));

    if (authRes.body.success) {
        const token = authRes.body.token;
        console.log('\n--- Testing Unified SDK Token ---');
        const sdkRes = await callApi('POST', '/api/payment/sdk-token', {
            amount: 100
        }, token);
        console.log('SDK Status:', sdkRes.statusCode);

        if (sdkRes.body.orderId) {
            console.log('Order ID (Real):', sdkRes.body.orderId);
            console.log('Order Token (Real):', sdkRes.body.token);
            console.log('Merchant Transaction ID:', sdkRes.body.merchantTransactionId);
        } else {
            console.log('SDK Error Response:', JSON.stringify(sdkRes.body, null, 2));
        }
    }
}

runTest();
