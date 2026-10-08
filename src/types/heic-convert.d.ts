declare module "heic-convert" {
  type ConvertFormat = "JPEG" | "PNG";

  interface ConvertOptions {
    buffer: Buffer | ArrayBuffer | Uint8Array;
    format: ConvertFormat;
    quality?: number;
  }

  function convert(options: ConvertOptions): Promise<ArrayBuffer>;

  export default convert;
}
