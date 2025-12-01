import {
  Injectable,
  OnModuleInit,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface ModerationResult {
  isSafe: boolean;
  flaggedWords: string[];
}

@Injectable()
export class ModerationService implements OnModuleInit {
  private readonly logger = new Logger(ModerationService.name);
  private bannedWords: Set<string> = new Set();

  private readonly RESERVED_NAMES = new Set([
    'admin',
    'administrator',
    'mod',
    'moderator',
    'system',
    'root',
    'support',
    'help',
    'staff',
    'hr',
    'manager',
    'ceo',
    'cto',
    'helpingbots',
    'veil',
    'anonymous',
    'verified',
  ]);

  async onModuleInit() {
    this.loadBannedWords();
  }

  private loadBannedWords() {
    try {
      const filePath = path.join(__dirname, 'banned-words.json');
      // const filePath = path.join(
      //   process.cwd(),
      //   'apps/anonymously/src/moderation/banned-words.json',
      // );

      if (!fs.existsSync(filePath)) {
        this.logger.warn(`Moderation list not found at ${filePath}.`);
        return;
      }

      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const words = JSON.parse(fileContent) as string[];

      this.bannedWords = new Set(words.map((w) => w.toLowerCase()));
      this.logger.log(
        `Moderation Engine loaded ${this.bannedWords.size} banned words.`,
      );
    } catch (err) {
      this.logger.error('Failed to load banned words list', err.stack);
      if (process.env.NODE_ENV === 'production') process.exit(1);
    }
  }

  checkContent(text: string): ModerationResult {
    if (this.bannedWords.size === 0) {
      this.logger.warn('Moderation check skipped: Empty Ban List');
    }

    if (!text) return { isSafe: true, flaggedWords: [] };
    const normalizedText = text.toLowerCase();
    const words = normalizedText.split(/[\s,.!?;:"']+/);
    const violations = words.filter((word) => this.bannedWords.has(word));
    return {
      isSafe: violations.length === 0,
      flaggedWords: [...new Set(violations)],
    };
  }

  enforcePolicy(text: string) {
    const result = this.checkContent(text);
    if (!result.isSafe) {
      this.logger.warn(
        `Content blocked. Triggers: ${result.flaggedWords.join(',')}`,
      );
      throw new BadRequestException({
        message: 'Content violates community guidelines.',
        error: 'Policy Violation',
        triggered: true,
        words: result.flaggedWords,
      });
    }
  }

  validatePseudonym(name: string) {
    const normalized = name.toLowerCase().trim();
    if (this.RESERVED_NAMES.has(normalized)) {
      throw new BadRequestException(
        'Pseudonym cannot contain restricted titles.',
      );
    }
    this.enforcePolicy(name);
  }
}
