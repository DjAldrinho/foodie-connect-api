import { JwtStrategy } from './jwt.strategy';
import { Repository } from 'typeorm';
import { Secret } from '../entities/secret.entity';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let secretRepository: Repository<Secret>;

  beforeEach(() => {
    secretRepository = {
      find: jest.fn(),
    } as any;

    strategy = new JwtStrategy(secretRepository);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should validate payload with active secret', async () => {
    const mockSecrets = [
      { id: '1', secret: 'current-secret', version: 2, active: true },
      { id: '2', secret: 'old-secret', version: 1, active: false },
    ];

    jest.spyOn(secretRepository, 'find').mockResolvedValue(mockSecrets as any);

    const payload = {
      userId: 'user-123',
      email: 'test@example.com',
      role: 'USER',
    };
    const result = await strategy.validate(payload);

    expect(result).toEqual(payload);
  });

  it('should throw error if no active secrets found', async () => {
    jest.spyOn(secretRepository, 'find').mockResolvedValue([]);

    const payload = {
      userId: 'user-123',
      email: 'test@example.com',
      role: 'USER',
    };

    await expect(strategy.validate(payload)).rejects.toThrow();
  });
});
