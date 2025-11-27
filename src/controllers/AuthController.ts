import { Request, Response } from 'express';
import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/crypto';
import { generateToken, generateRefreshToken } from '../utils/jwt';
import { successResponse, errorResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

export class AuthController {
  static async register(req: Request, res: Response): Promise<Response> {
    const { username, email, password } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      return errorResponse(res, 'Username or email already exists', 400);
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    return successResponse(
      res,
      { user, token, refreshToken },
      'User registered successfully',
      201
    );
  }

  static async login(req: Request, res: Response): Promise<Response> {
    const { username, password } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email: username }],
      },
    });

    if (!user) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    if (user.status !== 'ACTIVE') {
      return errorResponse(res, 'Account is not active', 403);
    }

    const isValidPassword = await comparePassword(password, user.password);

    if (!isValidPassword) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    const { password: _, ...userWithoutPassword } = user;

    return successResponse(res, {
      user: userWithoutPassword,
      token,
      refreshToken,
    });
  }

  static async me(req: Request, res: Response): Promise<Response> {
    const { userId } = (req as any).user;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
        avatar: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    return successResponse(res, user);
  }
}
