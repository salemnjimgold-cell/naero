const fs = require('node:fs/promises');
const path = require('node:path');
const { acquire } = require('../src/ingestion/acquire');
const { validateManifest } = require('../src/ingestion/manifest');
const { validateReviewedBatch } = require('../src/ingestion/reviewedBatch');

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const values = {};
  for (let i = 0; i < rest.length; i += 2) {
    if (!rest[i].startsWith('--') || rest[i + 1] === undefined) throw Object.assign(new Error('Arguments must use --name value pairs.'), { code: 'INVALID_ARGUMENTS' });
    values[rest[i].slice(2)] = rest[i + 1];
  }
  const reviewedInputs = ['review', 'vienna-manifest', 'gyor-manifest', 'production', 'expected-project', 'reviewed-digest'];
  const allowed = { acquire: ['city', 'category', 'output'], validate: ['manifest'], apply: [...reviewedInputs, 'operator'], approve: [...reviewedInputs, 'reviewer'] }[command];
  if (!allowed || Object.keys(values).some((key) => !allowed.includes(key))) throw Object.assign(new Error('Unsupported command or argument.'), { code: 'INVALID_ARGUMENTS' });
  return { command, values };
}
async function readManifest(file) { return JSON.parse(await fs.readFile(path.resolve(file), 'utf8')); }
async function main(argv = process.argv.slice(2)) {
  const { command, values } = parseArgs(argv);
  if (command === 'acquire') {
    if (!values.output) throw Object.assign(new Error('Output path is required.'), { code: 'OUTPUT_REQUIRED' });
    const result = await acquire({ city: values.city, category: values.category });
    await fs.writeFile(path.resolve(values.output), `${JSON.stringify(result.manifest, null, 2)}\n`, { flag: 'wx' });
    console.log(JSON.stringify({ status: result.status, counts: result.manifest.counts, digest: result.manifest.digest }));
    return;
  }
  if (command === 'validate') {
    const manifest = await readManifest(values.manifest);
    const validation = validateManifest(manifest);
    if (!validation.valid) throw Object.assign(new Error(`Manifest validation failed: ${validation.code}`), { code: validation.code });
    console.log(JSON.stringify({ valid: true, digest: manifest.digest, counts: manifest.counts })); return;
  }
  const review = await readManifest(values.review);
  const manifests = { vienna: await readManifest(values['vienna-manifest']), gyor: await readManifest(values['gyor-manifest']) };
  validateReviewedBatch(review, manifests);
  throw Object.assign(new Error('Production write adapter is intentionally not configured in Phase 2B.'), { code: 'PRODUCTION_WRITE_DISABLED' });
}
if (require.main === module) main().catch((error) => { console.error(JSON.stringify({ code: error.code || 'INGESTION_ERROR' })); process.exitCode = 1; });
module.exports = { parseArgs, main };
