import CryptoJS from "crypto-js";

// Debe venir de variables de entorno
const SECRET_KEY = process.env.CIPHER_KEY;
if (!SECRET_KEY) {
  throw new Error("CIPHER_KEY is not defined");
}

export const encrypt = (text: string): string => {
  return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
};

export const decrypt = (cipherText: string): string => {
  const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};
