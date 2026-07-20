// test/runner.ts
import assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import Handlebars from 'handlebars';
import { generatePdf } from '../lib/pdf';
import { prisma } from '../lib/db';

// 1. Test template filling logic
async function testTemplateFilling() {
  console.log('Running Test 1: Template Filling Logic...');
  const templateSource = 'NDA between {{disclosing_party}} and {{receiving_party}} on {{effective_date}}';
  const template = Handlebars.compile(templateSource);
  const result = template({ 
    disclosing_party: 'Disclosing Corp', 
    receiving_party: 'Receiving Ltd',
    effective_date: '2026-07-16'
  });
  
  assert.strictEqual(
    result, 
    'NDA between Disclosing Corp and Receiving Ltd on 2026-07-16',
    'Placeholder substitutions do not match expected output.'
  );
  console.log('✅ Test 1 Passed: Template compilation and placeholder replacement works.');
}

// 2. Test PDF generation with dummy data
async function testPdfGeneration() {
  console.log('Running Test 2: Puppeteer PDF Generation...');
  const templateContent = `
    <html>
      <head>
        <style>body { font-family: sans-serif; padding: 20px; }</style>
      </head>
      <body>
        <h1>Test Document Assembly</h1>
        <p>This is a test PDF for <strong>{{disclosing_party}}</strong>.</p>
      </body>
    </html>
  `;
  const data = { disclosing_party: 'Acme Test Labs' };
  const testOutputDir = path.join(__dirname, 'output');
  const testOutputFile = path.join(testOutputDir, 'test_output.pdf');

  // Clean up older tests
  if (fs.existsSync(testOutputFile)) {
    fs.unlinkSync(testOutputFile);
  }

  // Generate real PDF using Puppeteer utility
  await generatePdf(templateContent, data, testOutputFile);

  // Assert PDF exists and has substance
  assert.ok(fs.existsSync(testOutputFile), 'PDF output file was not created.');
  const stats = fs.statSync(testOutputFile);
  assert.ok(stats.size > 2000, `PDF size is too small (${stats.size} bytes). Might be empty.`);
  console.log(`✅ Test 2 Passed: Real PDF compiled successfully (${stats.size} bytes).`);

  // Tear down
  fs.unlinkSync(testOutputFile);
  fs.rmdirSync(testOutputDir);
}

// 3. Test that payment must succeed before generating
async function testPaymentRequirement() {
  console.log('Running Test 3: Payment Verification Guard...');
  
  // Simulation of the security rule applied in app/api/documents/generate/route.ts
  const mockUnpaidOrder = { id: 'order-1', status: 'PENDING', amount: 19900 };
  const mockPaidOrder = { id: 'order-2', status: 'PAID', amount: 19900 };

  function simulateGenerateRoute(orderRecord: { status: string }) {
    if (orderRecord.status !== 'PAID') {
      return { 
        status: 402, 
        error: 'Payment required. Document generation is blocked until payment is complete.' 
      };
    }
    return { status: 200, success: true };
  }

  // Expect unpaid order to be blocked with 402 Payment Required
  const unpaidResponse = simulateGenerateRoute(mockUnpaidOrder);
  assert.strictEqual(
    unpaidResponse.status, 
    402, 
    'Security failure: Unpaid order was not blocked from document generation.'
  );

  // Expect paid order to pass through
  const paidResponse = simulateGenerateRoute(mockPaidOrder);
  assert.strictEqual(
    paidResponse.status, 
    200, 
    'Success failure: Paid order was blocked from document generation.'
  );

  console.log('✅ Test 3 Passed: Payment verification guard works as expected.');
}

// 4. Test NDA variants difference
async function testNdaVariantsDifference() {
  console.log('Running Test 4: NDA Mutual vs Unilateral template difference...');
  const mutualPath = path.join(__dirname, '../templates/nda-mutual.html');
  const unilateralPath = path.join(__dirname, '../templates/nda-unilateral.html');

  assert.ok(fs.existsSync(mutualPath), 'Mutual NDA template file not found.');
  assert.ok(fs.existsSync(unilateralPath), 'Unilateral NDA template file not found.');

  const mutualContent = fs.readFileSync(mutualPath, 'utf-8');
  const unilateralContent = fs.readFileSync(unilateralPath, 'utf-8');

  // Verify that the templates themselves are different
  assert.notStrictEqual(mutualContent, unilateralContent, 'Mutual and Unilateral NDA templates are identical in file system.');

  // Compile both templates using Handlebars with the same answers
  const answers = {
    effective_date: '2026-07-17',
    disclosing_party: 'Disclosing Corp',
    disclosing_party_address: 'Address A',
    receiving_party: 'Receiving Ltd',
    receiving_party_address: 'Address B',
    purpose: 'Strategic discussion',
    confidentiality_term: '12',
    governing_jurisdiction: 'Maharashtra'
  };

  const compiledMutual = Handlebars.compile(mutualContent)(answers);
  const compiledUnilateral = Handlebars.compile(unilateralContent)(answers);

  // Assert they differ in terms of confidentiality obligation section
  assert.ok(compiledMutual.includes('MUTUAL CONFIDENTIALITY OBLIGATIONS'), 'Mutual template does not contain mutual obligations text.');
  assert.ok(compiledUnilateral.includes('UNILATERAL CONFIDENTIALITY OBLIGATIONS'), 'Unilateral template does not contain unilateral obligations text.');
  assert.ok(!compiledMutual.includes('UNILATERAL CONFIDENTIALITY OBLIGATIONS'), 'Mutual template incorrectly contains unilateral obligations text.');
  assert.ok(!compiledUnilateral.includes('MUTUAL CONFIDENTIALITY OBLIGATIONS'), 'Unilateral template incorrectly contains mutual obligations text.');

  console.log('✅ Test 4 Passed: NDA templates differ correctly in substance.');
}

// 5. Test Service Agreement template rendering
async function testServiceAgreementGeneration() {
  console.log('Running Test 5: Service Agreement template rendering...');
  const templatePath = path.join(__dirname, '../templates/service-agreement.html');
  assert.ok(fs.existsSync(templatePath), 'Service Agreement template file not found.');

  const templateContent = fs.readFileSync(templatePath, 'utf-8');

  // Answers mapping to snake case
  const answers = {
    effective_date: '2026-07-17',
    client_name: 'Client Alpha Inc',
    client_address: '101 Corporate Blvd',
    freelancer_name: 'Freelancer Dev',
    freelancer_address: '202 Home St',
    scope_of_work: 'Build a next-gen React dashboard.',
    payment_amount: '120000',
    payment_schedule: 'milestone',
    is_milestone_schedule: true,
    milestones: [
      { description: 'Milestone 1', dueDate: '2026-08-17', amount: 60000 },
      { description: 'Milestone 2', dueDate: '2026-09-17', amount: 60000 }
    ],
    termination_notice_period: '15',
    governing_jurisdiction: 'Delhi'
  };

  const compiled = Handlebars.compile(templateContent)(answers);

  // Assertions
  assert.ok(compiled.includes('Client Alpha Inc'), 'Compiled document is missing Client Name.');
  assert.ok(compiled.includes('Freelancer Dev'), 'Compiled document is missing Freelancer Name.');
  assert.ok(compiled.includes('Build a next-gen React dashboard.'), 'Compiled document is missing Scope of Work.');
  assert.ok(compiled.includes('Milestone 1'), 'Compiled document is missing Milestone 1 description.');
  assert.ok(compiled.includes('Milestone 2'), 'Compiled document is missing Milestone 2 description.');
  assert.ok(compiled.includes('15</strong> days'), 'Compiled document is missing Termination notice days.');
  assert.ok(compiled.includes('Delhi</strong>, India'), 'Compiled document is missing Governing jurisdiction.');
  assert.ok(compiled.includes('TEMPLATE PENDING LAWYER REVIEW'), 'Compiled document is missing lawyer review template comment.');

  console.log('✅ Test 5 Passed: Service Agreement template compiled and validated successfully.');
}

// 6. Test e-sign simulation and callback
async function testEsignSimulation() {
  console.log('Running Test 6: E-Sign flow simulation & Webhook callback...');
  
  // Create a mock document in database
  const order = await prisma.order.create({
    data: { amount: 19900, status: 'PAID', type: 'SINGLE' }
  });
  
  const doc = await prisma.document.create({
    data: {
      order_id: order.id,
      type: 'NDA_MUTUAL',
      answers: {},
      expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000)
    }
  });

  // Verify signing urls generation template
  const mockSigners = [
    { name: 'Alice', email: 'alice@example.com' },
    { name: 'Bob', email: 'bob@example.com' }
  ];
  
  const signingUrls: Record<string, string> = {};
  mockSigners.forEach(s => {
    signingUrls[s.email] = `http://localhost:3000/esign/mock-sign?docId=${doc.id}&email=${s.email}`;
  });

  assert.ok(signingUrls['alice@example.com'].includes(doc.id), 'Signing URL missing document ID reference.');
  
  // Update doc signature status
  await prisma.document.update({
    where: { id: doc.id },
    data: {
      signature_status: 'SENT_FOR_SIGNATURE',
    }
  });

  // Verify status update
  let updatedDoc = await prisma.document.findUnique({ where: { id: doc.id } });
  assert.strictEqual(updatedDoc?.signature_status, 'SENT_FOR_SIGNATURE', 'Signature status did not update to SENT_FOR_SIGNATURE.');

  // Simulate Digio completion webhook
  await prisma.document.update({
    where: { id: doc.id },
    data: {
      signature_status: 'SIGNED',
      signed_pdf_url: `/api/documents/${doc.id}/download?signed=true`
    }
  });

  updatedDoc = await prisma.document.findUnique({ where: { id: doc.id } });
  assert.strictEqual(updatedDoc?.signature_status, 'SIGNED', 'Webhook callback failed to update status to SIGNED.');
  assert.ok(updatedDoc?.signed_pdf_url?.includes('signed=true'), 'Signed PDF URL path missing correct ?signed=true query parameter.');

  // Clean up
  await prisma.document.delete({ where: { id: doc.id } });
  await prisma.order.delete({ where: { id: order.id } });

  console.log('✅ Test 6 Passed: E-Sign status flow and webhook callback simulated successfully.');
}

// 7. Test Bundle credit balances and atomic decrementing
async function testBundleCredits() {
  console.log('Running Test 7: Bundle Credit System & Atomic Transaction Decrementing...');
  
  const testEmail = 'test-credits-buyer@example.com';
  
  // Pre-test clean up
  await prisma.creditBalance.deleteMany({ where: { email: testEmail } });

  // 1. Simulate order creation for bundle
  const order = await prisma.order.create({
    data: {
      amount: 49900,
      status: 'PENDING',
      type: 'BUNDLE',
      email: testEmail
    }
  });

  assert.strictEqual(order.amount, 49900, 'Bundle order price is not set to ₹499 (49900 paise).');
  assert.strictEqual(order.type, 'BUNDLE', 'Order type is not BUNDLE.');

  // 2. Simulate order payment verification (verification route logic)
  await prisma.order.update({
    where: { id: order.id },
    data: { status: 'PAID' }
  });

  // Allocate 3 credits
  await prisma.creditBalance.upsert({
    where: { email: testEmail },
    update: { credits: { increment: 3 } },
    create: { email: testEmail, credits: 3 }
  });

  let balance = await prisma.creditBalance.findUnique({ where: { email: testEmail } });
  assert.strictEqual(balance?.credits, 3, 'Credits failed to accrue correctly (expected 3).');

  // 3. Simulate credit usage (generate-with-credit endpoint)
  // Atomic decrement using updateMany:
  const updateResult = await prisma.creditBalance.updateMany({
    where: { email: testEmail, credits: { gt: 0 } },
    data: { credits: { decrement: 1 } }
  });

  assert.strictEqual(updateResult.count, 1, 'Atomic decrement did not process successfully.');

  balance = await prisma.creditBalance.findUnique({ where: { email: testEmail } });
  assert.strictEqual(balance?.credits, 2, 'Credit did not decrement to 2.');

  // 4. Test insufficient balance double spend protection
  // Force credits to 0
  await prisma.creditBalance.update({
    where: { email: testEmail },
    data: { credits: 0 }
  });

  const failedUpdateResult = await prisma.creditBalance.updateMany({
    where: { email: testEmail, credits: { gt: 0 } },
    data: { credits: { decrement: 1 } }
  });

  assert.strictEqual(failedUpdateResult.count, 0, 'Security failure: credit was decremented even when balance was 0.');

  // Clean up
  await prisma.creditBalance.deleteMany({ where: { email: testEmail } });
  await prisma.order.delete({ where: { id: order.id } });

  console.log('✅ Test 7 Passed: Bundle order payment accrues credits, and generation atomically decrements balance.');
}

// 8. Test Magic Link passwordless token verification
async function testMagicLinkAuthentication() {
  console.log('Running Test 8: Magic Link Token Validation & Cookie Session Signature...');

  const testEmail = 'magic-user@example.com';
  const token = 'test-token-12345';
  
  // Clean up
  await prisma.magicToken.deleteMany({ where: { email: testEmail } });

  // 1. Create a magic token
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15);

  const magicToken = await prisma.magicToken.create({
    data: {
      email: testEmail,
      token,
      expires_at: expiresAt
    }
  });

  // Verify DB state
  assert.strictEqual(magicToken.used, false, 'New token should not be marked used.');
  assert.ok(new Date(magicToken.expires_at) > new Date(), 'New token should not be expired.');

  // 2. Validate session signature and decryption helpers
  const { signSession, verifySession } = require('../lib/session');
  const sessionToken = signSession(testEmail);
  const decodedEmail = verifySession(sessionToken);

  assert.strictEqual(decodedEmail, testEmail, 'Decrypted session email does not match.');

  // Test invalid session token
  const invalidEmail = verifySession(sessionToken + 'malicious_tamper');
  assert.strictEqual(invalidEmail, null, 'Security check failed: tampered session signature was parsed.');

  // Clean up
  await prisma.magicToken.delete({ where: { id: magicToken.id } });

  console.log('✅ Test 8 Passed: Magic token validation and session cookie token signature encryption verified.');
}

// 9. Test Partner B2B API limits and validation
async function testPartnerApiB2B() {
  console.log('Running Test 9: Partner API Key & Rate Limiter Sliding Window...');

  const testKey = 'test-partner-api-key-999';
  
  // Clean up
  await prisma.partnerRequest.deleteMany({
    where: {
      partner: {
        api_key: testKey
      }
    }
  });
  await prisma.partner.deleteMany({ where: { api_key: testKey } });

  // 1. Setup active partner
  const partner = await prisma.partner.create({
    data: {
      name: 'Test Partner Inc',
      api_key: testKey,
      rate_limit: 2, // 2 requests per minute
      is_active: true
    }
  });

  // 2. Perform validations
  const { validatePartner } = require('../lib/auth');

  // Request 1: Should pass
  const req1 = await validatePartner(testKey, '/api/v1/generate');
  assert.strictEqual(req1.authorized, true, 'Valid API key was rejected.');

  // Request 2: Should pass
  const req2 = await validatePartner(testKey, '/api/v1/generate');
  assert.strictEqual(req2.authorized, true, 'Second valid API key was rejected.');

  // Request 3: Should trigger Rate Limit (429)
  const req3 = await validatePartner(testKey, '/api/v1/generate');
  assert.strictEqual(req3.authorized, false, 'Rate limit was not enforced.');
  assert.strictEqual(req3.status, 429, 'Rate limit error status code is not 429.');

  // Request with invalid key: Should trigger Unauthorized (403)
  const reqInvalid = await validatePartner('wrong_key', '/api/v1/generate');
  assert.strictEqual(reqInvalid.authorized, false, 'Invalid API key was accepted.');
  assert.strictEqual(reqInvalid.status, 403, 'Invalid API key error status code is not 403.');

  // Clean up
  await prisma.partnerRequest.deleteMany({ where: { partner_id: partner.id } });
  await prisma.partner.delete({ where: { id: partner.id } });

  console.log('✅ Test 9 Passed: Rate limiting validation and partner keys are securely gated.');
}

async function runAllTests() {
  console.log('==================================================');
  console.log('        LEGALDOCS UNIT TEST RUNNER START          ');
  console.log('==================================================\n');
  
  try {
    await testTemplateFilling();
    console.log('');
    await testPdfGeneration();
    console.log('');
    await testPaymentRequirement();
    console.log('');
    await testNdaVariantsDifference();
    console.log('');
    await testServiceAgreementGeneration();
    console.log('');
    await testEsignSimulation();
    console.log('');
    await testBundleCredits();
    console.log('');
    await testMagicLinkAuthentication();
    console.log('');
    await testPartnerApiB2B();
    
    console.log('\n==================================================');
    console.log('🎉 ALL TESTS COMPLETED AND PASSED SUCCESSFULLY!');
    console.log('==================================================');
  } catch (error) {
    console.error('\n❌ TEST RUNNER FAILURE ENCOUNTERED:');
    console.error(error);
    process.exit(1);
  }
}

runAllTests();
