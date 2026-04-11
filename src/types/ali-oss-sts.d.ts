declare module 'ali-oss/lib/sts' {
  interface STSOptions {
    accessKeyId: string
    accessKeySecret: string
    endpoint?: string
  }

  interface AssumeRoleResult {
    res: unknown
    credentials: {
      AccessKeyId: string
      AccessKeySecret: string
      SecurityToken: string
      Expiration: string
    }
  }

  class STS {
    constructor(options: STSOptions)
    assumeRole(
      roleArn: string,
      policy?: Record<string, unknown> | string,
      durationSeconds?: number,
      sessionName?: string,
      options?: unknown,
    ): Promise<AssumeRoleResult>
  }

  export = STS
}
