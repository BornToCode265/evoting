const crypto = require("crypto");
const algorithm = "aes-256-ctr";
const secretKey =
  "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // Replace with an environment variable
const iv = crypto.randomBytes(16);

const encrypt = (text) => {
  console.log("---algorithm: ", algorithm);
  console.log("----- secretKey: ", secretKey);
  console.log("===iv: ", iv);
  console.log("==== encrypting text: ", text);
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);

  console.log("== cipher: ", cipher);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

  console.log("===encrypted: ", encrypted);
  console.log("===iv.toString(hex): ", iv.toString("hex"));
  console.log("result: ", {
    iv: iv.toString("hex"),
    content: encrypted.toString("hex"),
  });
  return { iv: iv.toString("hex"), content: encrypted.toString("hex") };
};

const decrypt = (hash) => {
  const decipher = crypto.createDecipheriv(
    algorithm,
    secretKey,
    Buffer.from(hash.iv, "hex")
  );
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(hash.content, "hex")),
    decipher.final(),
  ]);
  return decrypted.toString();
};

module.exports = { encrypt, decrypt };
