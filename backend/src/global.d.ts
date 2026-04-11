// backend/src/global.d.ts
// Global type declarations for packages without TypeScript support

declare module 'voucher-code-generator' {
  interface GenerateOptions {
    length?: number;
    count?: number;
    charset?: string;
    prefix?: string;
    postfix?: string;
    pattern?: string;
  }

  interface VoucherCodes {
    generate(options: GenerateOptions): string[];
    charset(name: 'alphanumeric' | 'alphabetic' | 'numbers'): string;
  }

  const voucherCodes: VoucherCodes;
  export default voucherCodes;
}
