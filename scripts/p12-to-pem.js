// Converts an Apple Pass Type ID .p12 certificate into the separate PEM
// cert + PEM key that passkit-generator needs (it can't consume a raw .p12
// buffer directly, and macOS's /usr/bin/openssl is actually LibreSSL, which
// fails silently or produces a key format passkit-generator can't decrypt).
//
// Usage: node scripts/p12-to-pem.js <input.p12> <output-cert.pem> <output-key.pem>
// Run this yourself — it asks for the .p12 password interactively rather
// than accepting it as a CLI arg, so it never ends up in shell history.
const forge = require("node-forge");
const fs = require("fs");
const readline = require("readline");

const [, , p12Path, outCert, outKey] = process.argv;
if (!p12Path || !outCert || !outKey) {
  console.error("Verwendung: node scripts/p12-to-pem.js <input.p12> <output-cert.pem> <output-key.pem>");
  process.exit(1);
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

(async () => {
  const p12Password = await ask("Passwort der .p12-Datei: ");
  const keyPassphrase = await ask("Neues Passwort fuer den privaten Schluessel (frei waehlbar, wird APPLE_PASS_CERT_PASSWORD): ");
  rl.close();

  const p12Der = fs.readFileSync(p12Path, "binary");
  const p12Asn1 = forge.asn1.fromDer(p12Der);
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, p12Password);

  let certPem = "";
  let keyPem = "";

  for (const safeContents of p12.safeContents) {
    for (const safeBag of safeContents.safeBags) {
      if (safeBag.type === forge.pki.oids.certBag) {
        certPem += forge.pki.certificateToPem(safeBag.cert);
      } else if (
        safeBag.type === forge.pki.oids.pkcs8ShroudedKeyBag ||
        safeBag.type === forge.pki.oids.keyBag
      ) {
        // legacy:true + 3des is required — the modern PKCS#8 default can't
        // be decrypted by passkit-generator/node-forge on the reading side.
        keyPem += forge.pki.encryptRsaPrivateKey(safeBag.key, keyPassphrase, {
          legacy: true,
          algorithm: "3des",
        });
      }
    }
  }

  if (!certPem || !keyPem) {
    console.error("Fehler: Zertifikat oder Schluessel wurde nicht gefunden. Falsches Passwort?");
    process.exit(1);
  }

  fs.writeFileSync(outCert, certPem);
  fs.writeFileSync(outKey, keyPem);
  console.log("Fertig! Gespeichert:", outCert, "und", outKey);
  console.log("Naechster Schritt: base64 -i", outCert, "| pbcopy  ->  APPLE_PASS_CERT_B64");
  console.log("                   base64 -i", outKey, "| pbcopy  ->  APPLE_PASS_KEY_B64");
})().catch((err) => {
  console.error("Fehler:", err.message);
  process.exit(1);
});
