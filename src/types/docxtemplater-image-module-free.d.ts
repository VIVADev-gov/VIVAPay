declare module "docxtemplater-image-module-free" {
  type ImageModuleOptions = {
    centered?: boolean;
    getImage: (tagValue: string, tagName?: string) => Buffer;
    getSize: (
      img: Buffer,
      tagValue: string,
      tagName?: string
    ) => [number, number];
  };

  export default class ImageModule {
    constructor(options: ImageModuleOptions);
  }
}
