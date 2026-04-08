import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RolesGuard, { provide: Reflector, useValue: mockReflector }],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should activate when no roles are required', () => {
    const context = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: 'USER' } }),
      }),
    } as unknown as ExecutionContext;

    mockReflector.getAllAndOverride.mockReturnValue(undefined);

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should activate when user has required role', () => {
    const context = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: 'USER' } }),
      }),
    } as unknown as ExecutionContext;

    mockReflector.getAllAndOverride.mockReturnValue(['USER']);

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should activate when user is ADMIN (role hierarchy)', () => {
    const context = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: 'ADMIN' } }),
      }),
    } as unknown as ExecutionContext;

    mockReflector.getAllAndOverride.mockReturnValue(['USER', 'RESTAURANT']);

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should return false when user lacks required role', () => {
    const context = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: 'USER' } }),
      }),
    } as unknown as ExecutionContext;

    mockReflector.getAllAndOverride.mockReturnValue(['ADMIN']);

    const result = guard.canActivate(context);

    expect(result).toBe(false);
  });

  it('should return false when no user in request', () => {
    const context = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    } as unknown as ExecutionContext;

    mockReflector.getAllAndOverride.mockReturnValue(['ADMIN']);

    const result = guard.canActivate(context);

    expect(result).toBe(false);
  });
});
