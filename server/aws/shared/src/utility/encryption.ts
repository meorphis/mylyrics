import { getSecretObject } from "../integrations/aws";
import crypto from "crypto";

const getCredentials = async () => {
  const {key, iv} = await getSecretObject("aesEncryption");
  return {
    key: crypto
      .createHash("sha512")
      .update(key)
      .digest("hex")
      .substring(0, 32),
    iv: crypto
      .createHash("sha512")
      .update(iv)
      .digest("hex")
      .substring(0, 16)
  }
}

// encrypts text using aes-256-ctr
export const encrypt = async (text: string) => {
  const {key, iv} = await getCredentials();
  const aes = crypto.createCipheriv("aes-256-ctr", key, iv);
  let encrypted = aes.update(text, "utf8", "hex");
  encrypted += aes.final("hex");
  return encrypted;
};

// decrypts text encrypted with the encrypt function above
export const decrypt = async (text: string) => {
  const {key, iv} = await getCredentials();
  const aes = crypto.createDecipheriv("aes-256-ctr", key, iv);
  let decrypted = aes.update(text, "hex", "utf8");
  decrypted += aes.final("utf8");
  return decrypted;
};