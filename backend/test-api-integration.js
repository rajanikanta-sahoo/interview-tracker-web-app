import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, 'uploads');
const pdfPath = path.join(uploadsDir, 'resume-1779209387917-184987233.pdf');
const docxPath = path.join(uploadsDir, 'resume-1780244795182-940767321.docx');

// Helper to wait
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTests() {
  console.log('--- STARTING AUTOMATED API INTEGRATION TESTS ---');

  // 1. Start the server on a custom test port (e.g. 5002) to avoid conflicts
  const testPort = '5002';
  console.log(`Starting backend server process on port ${testPort}...`);
  
  const serverProcess = spawn('node', ['server.js'], {
    cwd: __dirname,
    env: { ...process.env, PORT: testPort }
  });

  // Log server output to console
  serverProcess.stdout.on('data', (data) => {
    console.log(`[Server]: ${data.toString().trim()}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`[Server Error]: ${data.toString().trim()}`);
  });

  // Wait 2 seconds for server to boot up
  await sleep(2000);

  const baseUrl = `http://localhost:${testPort}/api/resume`;
  let passed = true;

  try {
    // --- TEST 1: PDF RESUME UPLOAD & PARSE ---
    console.log('\nRunning Test 1: PDF Resume Upload & Parse...');
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`Test PDF file does not exist at: ${pdfPath}`);
    }

    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });
    const pdfFormData = new FormData();
    pdfFormData.append('resume', pdfBlob, 'resume.pdf');

    const pdfRes = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      body: pdfFormData
    });

    if (!pdfRes.ok) {
      throw new Error(`PDF Upload request failed with status: ${pdfRes.status}`);
    }

    const pdfData = await pdfRes.json();
    console.log('PDF response received successfully.');
    
    // Assertions
    const expectedPdfName = 'RAJANIKANTA SAHOO';
    const expectedPdfRole = 'Full Stack Developer';
    
    if (pdfData.name !== expectedPdfName) {
      console.error(`❌ Test 1 Failed: Expected name "${expectedPdfName}", got "${pdfData.name}"`);
      passed = false;
    } else {
      console.log(`✅ Test 1 Passed: Extracted name is "${pdfData.name}"`);
    }

    if (pdfData.role !== expectedPdfRole) {
      console.error(`❌ Test 1 Failed: Expected role "${expectedPdfRole}", got "${pdfData.role}"`);
      passed = false;
    } else {
      console.log(`✅ Test 1 Passed: Extracted target role is "${pdfData.role}"`);
    }

    if (!pdfData.skills.includes('Spring Boot') && !pdfData.skills.includes('React')) {
      console.warn(`⚠️ Test 1 Warning: Expected skills listing to contain core technical skills, got: ${JSON.stringify(pdfData.skills)}`);
    } else {
      console.log(`✅ Test 1 Passed: Extracted skills correctly contain "${pdfData.skills.join(', ')}"`);
    }

    // --- TEST 2: DOCX RESUME UPLOAD & PARSE ---
    console.log('\nRunning Test 2: DOCX Resume Upload & Parse...');
    if (!fs.existsSync(docxPath)) {
      throw new Error(`Test DOCX file does not exist at: ${docxPath}`);
    }

    const docxBuffer = fs.readFileSync(docxPath);
    const docxBlob = new Blob([docxBuffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const docxFormData = new FormData();
    docxFormData.append('resume', docxBlob, 'resume.docx');

    const docxRes = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      body: docxFormData
    });

    if (!docxRes.ok) {
      throw new Error(`DOCX Upload request failed with status: ${docxRes.status}`);
    }

    const docxData = await docxRes.json();
    console.log('DOCX response received successfully.');

    // Assertions
    const expectedDocxName = 'RAJANIKANTA SAHOO';
    const expectedDocxRole = 'Backend Developer';

    if (docxData.name !== expectedDocxName) {
      console.error(`❌ Test 2 Failed: Expected name "${expectedDocxName}", got "${docxData.name}"`);
      passed = false;
    } else {
      console.log(`✅ Test 2 Passed: Extracted name is "${docxData.name}"`);
    }

    if (docxData.role !== expectedDocxRole) {
      console.error(`❌ Test 2 Failed: Expected role "${expectedDocxRole}", got "${docxData.role}"`);
      passed = false;
    } else {
      console.log(`✅ Test 2 Passed: Extracted target role is "${docxData.role}"`);
    }

  } catch (error) {
    console.error('❌ Integration Test Suite Error:', error);
    passed = false;
  } finally {
    // 3. Shutdown the test server
    console.log('\nShutting down test backend server...');
    serverProcess.kill('SIGKILL');
    await sleep(500);
    
    if (passed) {
      console.log('\n🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉\n');
      process.exit(0);
    } else {
      console.error('\n❌ SOME INTEGRATION TESTS FAILED! ❌\n');
      process.exit(1);
    }
  }
}

runTests();
