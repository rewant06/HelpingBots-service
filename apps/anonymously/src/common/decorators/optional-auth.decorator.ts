import { SetMetadata } from '@nestjs/common';
export const IS_USER_OPTIONAL_KEY = 'isUserOptional'; // Define constant
export const OptionalUser = () => SetMetadata(IS_USER_OPTIONAL_KEY, true);
