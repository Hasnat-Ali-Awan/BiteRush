import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';
import { SELF_REGISTER_ROLES } from '../../users/schemas/user.schema';
import type { UserRole } from '../../users/schemas/user.schema';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsIn(SELF_REGISTER_ROLES)
  role: UserRole;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
