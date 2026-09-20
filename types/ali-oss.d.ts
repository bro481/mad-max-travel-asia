declare module "ali-oss" {
  type OssHeaders = Record<string, string | undefined>;

  class OSS {
    constructor(options: {
      bucket: string;
      region: string;
      accessKeyId: string;
      accessKeySecret: string;
      endpoint: string;
      secure?: boolean;
      timeout?: string | number;
    });

    get(name: string): Promise<{
      content: Buffer;
      res: { headers: OssHeaders };
    }>;

    put(
      name: string,
      file: Buffer,
      options?: { headers?: OssHeaders },
    ): Promise<unknown>;
  }

  export default OSS;
}
