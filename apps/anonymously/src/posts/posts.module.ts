import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { HttpModule } from '@nestjs/axios';
import { PostsController } from './posts.controller';
import { AvatarService } from 'src/common/services/avatar.service';

@Module({
  imports: [HttpModule],
  controllers: [PostsController],
  providers: [PostsService, AvatarService],
})
export class PostsModule {}
