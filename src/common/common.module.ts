import { Module, Global } from '@nestjs/common';
import { CacheModule } from './cache/cache.module';
import { RolesGuard } from './guards/roles.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ValidationPipe } from './pipes/validation.pipe';

@Global()
@Module({
  imports: [CacheModule],
  providers: [RolesGuard, JwtAuthGuard],
  exports: [RolesGuard, JwtAuthGuard],
})
export class CommonModule {
  static getPipes() {
    return [new ValidationPipe()];
  }
}
