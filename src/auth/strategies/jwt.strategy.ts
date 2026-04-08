import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { Secret } from '../entities/secret.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(Secret)
    private secretRepository: Repository<Secret>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: (request, rawJwtToken, done) => {
        secretRepository
          .find({
            where: { active: true },
          })
          .then((secrets) => {
            const activeSecrets = secrets.map((s) => s.secret);
            if (activeSecrets.length > 0) {
              done(null, activeSecrets[0]);
            } else {
              done(new Error('No active secrets found'), undefined);
            }
          })
          .catch((error) => {
            done(error, undefined);
          });
      },
    });
  }

  async validate(payload: any) {
    const secrets = await this.secretRepository.find({
      where: { active: true },
    });

    if (!secrets || secrets.length === 0) {
      throw new UnauthorizedException('No active secrets found');
    }

    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as string,
    };
  }
}
