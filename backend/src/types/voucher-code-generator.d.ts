// backend/src/types/voucher-code-generator.d.ts

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
