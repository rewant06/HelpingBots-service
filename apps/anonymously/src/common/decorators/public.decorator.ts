import { SetMetadata } from '@nestjs/common';
export const IS_PUBLIC_KEY = 'isPublic'; // Define constant
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
