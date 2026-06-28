const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'node_modules', 'expo-asset', 'build', 'AssetUris.js');

if (!fs.existsSync(filePath)) {
  console.log('expo-asset not found, skipping patch');
  process.exit(0);
}

let content = fs.readFileSync(filePath, 'utf8');

// Check if already patched
if (content.includes('nextProtocol + \'//\' + urlObject.host + directory')) {
  console.log('expo-asset already patched');
  process.exit(0);
}

// Replace the broken getManifestBaseUrl function
const oldFn = `export function getManifestBaseUrl(manifestUrl) {
    const urlObject = new URL(manifestUrl);
    let nextProtocol = urlObject.protocol;
    // Change the scheme to http(s) if it is exp(s)
    if (nextProtocol === 'exp:') {
        nextProtocol = 'http:';
    }
    else if (nextProtocol === 'exps:') {
        nextProtocol = 'https:';
    }
    urlObject.protocol = nextProtocol;
    // Trim filename, query parameters, and fragment, if any
    const directory = urlObject.pathname.substring(0, urlObject.pathname.lastIndexOf('/') + 1);
    urlObject.pathname = directory;
    urlObject.search = '';
    urlObject.hash = '';
    // The URL spec doesn't allow for changing the protocol to \`http\` or \`https\`
    // without a port set so instead, we'll just swap the protocol manually.
    return urlObject.protocol !== nextProtocol
        ? urlObject.href.replace(urlObject.protocol, nextProtocol)
        : urlObject.href;
}`;

const newFn = `export function getManifestBaseUrl(manifestUrl) {
    const urlObject = new URL(manifestUrl);
    let nextProtocol = urlObject.protocol;
    // Change the scheme to http(s) if it is exp(s)
    if (nextProtocol === 'exp:') {
        nextProtocol = 'http:';
    }
    else if (nextProtocol === 'exps:') {
        nextProtocol = 'https:';
    }
    // Trim filename, query parameters, and fragment, if any
    const directory = urlObject.pathname.substring(0, urlObject.pathname.lastIndexOf('/') + 1);
    // Construct URL without mutating read-only URL properties (Hermes limitation)
    return nextProtocol + '//' + urlObject.host + directory;
}`;

if (content.includes(oldFn)) {
  content = content.replace(oldFn, newFn);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✓ Patched expo-asset/build/AssetUris.js - getManifestBaseUrl no longer mutates read-only URL properties');
} else {
  console.log('Warning: Could not find the expected function in expo-asset. Patch may need updating.');
}

// Also update the source map to be safe (sourceMapUrl is fine as-is)
