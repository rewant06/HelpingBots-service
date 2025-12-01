import { Injectable } from '@nestjs/common';

@Injectable()
export class AvatarService {
  //   Generates a deterministic Avatar URL.
  //  In Future, this method can be upgraded to upload to S3.

  async generateAndUpload(seed: string): Promise<string> {
    const safeSeed = encodeURIComponent(seed.trim());
    return `https://api.dicebear.com/7.x/bottts/svg?seed=${safeSeed}`;
  }
}
