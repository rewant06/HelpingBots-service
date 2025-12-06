import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { HttpModule } from '@nestjs/axios';
import { PostsController } from './posts.controller';
import { AvatarService } from 'src/common/services/avatar.service';
import { PostsCronService } from './posts.cron';

@Module({
  imports: [HttpModule],
  controllers: [PostsController],
  providers: [PostsService, AvatarService, PostsCronService, PostsController],
})
export class PostsModule {}
