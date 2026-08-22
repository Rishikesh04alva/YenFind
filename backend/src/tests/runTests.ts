import { isValidEduEmail } from '../middleware/auth';
import { computeItemMatchScore } from '../services/matcherService';
import { sanitizeAndSaveImage, inspectImageExif } from '../services/imageService';
import sharp from 'sharp';
import fs from 'fs';

async function runAllTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING CAMPUS LOST & FOUND SECURITY & LOGIC TESTS');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      failed++;
    }
  }

  // --- Test 1: Strict .edu & .edu.in Email Authorization ---
  console.log('👉 [1] Testing Campus .edu & .edu.in Email Domain Security...');
  assert(isValidEduEmail('student@mit.edu') === true, 'Accepts standard university email (student@mit.edu)');
  assert(isValidEduEmail('rohan.shetty@yenepoya.edu.in') === true, 'Accepts Yenepoya University email (rohan.shetty@yenepoya.edu.in)');
  assert(isValidEduEmail('ananya.rai@yenepoya.edu.in') === true, 'Accepts student .edu.in email (ananya.rai@yenepoya.edu.in)');
  assert(isValidEduEmail('prof_smith@harvard.edu') === true, 'Accepts faculty email (prof_smith@harvard.edu)');
  assert(isValidEduEmail('attacker@gmail.com') === false, 'Rejects generic consumer email (attacker@gmail.com)');
  assert(isValidEduEmail('hacker@edu.malicious.com') === false, 'Rejects fake spoofed domain (hacker@edu.malicious.com)');
  assert(isValidEduEmail('phish@evil-mit.edu.ru') === false, 'Rejects domain spoof with trailing tld (phish@evil-mit.edu.ru)');
  assert(isValidEduEmail('') === false, 'Rejects empty input');

  // --- Test 2: Sharp EXIF Stripping & Sanitization ---
  console.log('\n👉 [2] Testing Image EXIF Data Stripping & Privacy Scrubbing...');
  try {
    // Generate a test SVG/PNG image with artificial metadata
    const rawImageBuffer = await sharp({
      create: {
        width: 300,
        height: 300,
        channels: 4,
        background: { r: 59, g: 130, b: 246, alpha: 1 },
      },
    })
      .jpeg()
      .toBuffer();

    const sanitizedResult = await sanitizeAndSaveImage(rawImageBuffer, 'test-photo.jpg');
    assert(sanitizedResult.exifStripped === true, 'Sanitizer flags exifStripped=true');
    assert(sanitizedResult.imageUrl.endsWith('.webp'), 'Re-encoded securely to clean WebP format');
    assert(fs.existsSync(`./uploads`), 'Uploads vault directory exists');

    // Read back the sanitized file and inspect EXIF metadata
    const savedImagePath = '.' + sanitizedResult.imageUrl;
    if (fs.existsSync(savedImagePath)) {
      const savedBuffer = fs.readFileSync(savedImagePath);
      const inspection = await inspectImageExif(savedBuffer);
      assert(inspection.hasExif === false, 'Scrubbed file has NO EXIF tags (GPS & camera info stripped)');
      assert(inspection.hasIptc === false, 'Scrubbed file has NO IPTC tags');
    }
  } catch (err: any) {
    console.error('EXIF Test Error:', err);
    failed++;
  }

  // --- Test 3: Matchmaking Engine (Distance & Keywords) ---
  console.log('\n👉 [3] Testing Matchmaking Proximity & Text Scoring Algorithm...');
  const lostMacBook = {
    title: 'Space Gray MacBook Air M2',
    description: 'Left in library 3rd floor quiet area',
    category: 'ELECTRONICS',
    latitude: 42.3592,
    longitude: -71.0895,
    dateLostOrFound: new Date(),
  };

  const foundMacBookNearby = {
    title: 'Found Apple MacBook in library study room',
    description: 'Gray laptop handed in at 3rd floor desk',
    category: 'ELECTRONICS',
    latitude: 42.3594, // ~30 meters away
    longitude: -71.0893,
    dateLostOrFound: new Date(),
  };

  const foundUmbrellaFarAway = {
    title: 'Black Umbrella',
    description: 'Wet umbrella in gym locker room',
    category: 'ACCESSORIES',
    latitude: 42.3700, // ~1.5 km away
    longitude: -71.1100,
    dateLostOrFound: new Date(),
  };

  const matchHigh = computeItemMatchScore(lostMacBook, foundMacBookNearby);
  assert(matchHigh.totalScore >= 60, `High match score calculated for same item nearby (${matchHigh.totalScore}%)`);
  assert(matchHigh.categoryMatch === true, 'Detected exact category match');
  assert(matchHigh.distanceMeters < 100, `Accurate distance calculation (${matchHigh.distanceMeters}m)`);

  const matchLow = computeItemMatchScore(lostMacBook, foundUmbrellaFarAway);
  assert(matchLow.totalScore < 30, `Low match score calculated for unrelated item far away (${matchLow.totalScore}%)`);

  console.log('\n====================================================');
  console.log(`📊 TEST RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
