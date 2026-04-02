import { Body, Controller, HttpCode, HttpStatus, Post, UsePipes } from '@nestjs/common'

import { Public } from '@/common/decorators/public.decorator'
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe'

import { AuthService } from './auth.service'
import type { LoginDto } from './dto/login.dto'
import { loginSchema } from './dto/login.dto'
import type { RegisterDto } from './dto/register.dto'
import { registerSchema } from './dto/register.dto'
import type { LoginResponse, RegisterResponse } from './responses/auth.response'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(registerSchema))
  async register(@Body() registerDto: RegisterDto): Promise<RegisterResponse> {
    return this.authService.register(registerDto)
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(loginSchema))
  async login(@Body() loginDto: LoginDto): Promise<LoginResponse> {
    return this.authService.login(loginDto)
  }
}
