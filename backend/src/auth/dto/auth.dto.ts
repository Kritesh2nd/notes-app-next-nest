import { IsEmail, IsString, Matches, MaxLength, MinLength } from "class-validator";

const PASSWORD_REGEX = {
  upper: /[A-Z]/,
  lower: /[a-z]/,
  digit: /[0-9]/,
};

export class RegisterDto {
  @IsString()
  @MinLength(2, { message: "Name must be at least 2 characters" })
  @MaxLength(60)
  name: string;

  @IsEmail({}, { message: "Enter a valid email address" })
  email: string;

  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters" })
  @Matches(PASSWORD_REGEX.upper, { message: "Must contain an uppercase letter" })
  @Matches(PASSWORD_REGEX.lower, { message: "Must contain a lowercase letter" })
  @Matches(PASSWORD_REGEX.digit, { message: "Must contain a number" })
  password: string;
}

export class LoginDto {
  @IsEmail({}, { message: "Enter a valid email address" })
  email: string;

  @IsString()
  @MinLength(1, { message: "Password is required" })
  password: string;
}

export class ForgotPasswordDto {
  @IsEmail({}, { message: "Enter a valid email address" })
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  @MinLength(1, { message: "Missing token" })
  token: string;

  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters" })
  @Matches(PASSWORD_REGEX.upper, { message: "Must contain an uppercase letter" })
  @Matches(PASSWORD_REGEX.lower, { message: "Must contain a lowercase letter" })
  @Matches(PASSWORD_REGEX.digit, { message: "Must contain a number" })
  password: string;
}

export class VerifyEmailDto {
  @IsString()
  @MinLength(1, { message: "Missing verification token" })
  token: string;
}

export class ResendVerificationDto {
  @IsEmail({}, { message: "Enter a valid email address" })
  email: string;
}

export class DeleteAccountDto {
  @IsString()
  @MinLength(1, { message: "Please confirm your password to delete your account." })
  password: string;
}
