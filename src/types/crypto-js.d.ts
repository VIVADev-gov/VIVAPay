declare module "crypto-js" {
    const CryptoJS: {
        AES: { encrypt(text: string, key: string): { toString(): string }; decrypt(cipherText: string, key: string): { toString(encoder: unknown): string } };
        enc: { Utf8: unknown };
    };
    export default CryptoJS;
}
