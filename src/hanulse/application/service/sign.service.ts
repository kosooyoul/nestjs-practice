import { Time } from '@/common/constants/time';
import { TokenType } from '@/common/enums';
import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApolloError } from 'apollo-server-core';
import { ISignature } from '@/auoi/auth/auth.interface';
import { IRefreshTokenRepository } from '@/hanulse/infrastructure/interface/refresh-token.repository';
import { IHanulseSignInResult } from '../dto/sign/sign-in-result';
import { Nullable } from '@/common/types/native';
import * as jwt from 'jsonwebtoken';
import { HanulseUser } from '@/hanulse/domain/user.entity';

const TAG = 'HanulseSignService';

@Injectable()
export class HanulseSignService {
  constructor(
    @Inject(IRefreshTokenRepository)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly jwtService: JwtService,
  ) {}

  async signIn(user: HanulseUser, keep: boolean): Promise<IHanulseSignInResult> {
    const signature: any = {
      id: user.id,
      name: user.name,
      identity: user.cellPhoneNumber,
    };

    const accessToken = this.generateToken(signature, TokenType.ACCESS, keep);
    const refreshToken = this.generateToken(signature, TokenType.REFRESH, keep);
    const accessTokenExpiresIn = new Date(Date.now() + this.getExpiresIn(TokenType.ACCESS, keep));
    const refreshTokenExpiresIn = new Date(Date.now() + this.getExpiresIn(TokenType.REFRESH, keep));

    await this.refreshTokenRepository.createRefreshToken({
      signatureId: user._id,
      refreshToken: refreshToken,
      deleteAt: new Date(Date.now() + Time.MILLS_90_DAYS),
    });

    return {
      accessToken: accessToken,
      refreshToken: refreshToken,
      accessTokenExpiresIn: accessTokenExpiresIn,
      refreshTokenExpiresIn: refreshTokenExpiresIn,
    };
  }

  async signInBySignature(signature: ISignature): Promise<IHanulseSignInResult> {
    const accessToken = this.generateToken(signature, TokenType.ACCESS, signature.keep);
    const refreshToken = this.generateToken(signature, TokenType.REFRESH, signature.keep);
    const accessTokenExpiresIn = new Date(Date.now() + this.getExpiresIn(TokenType.ACCESS, signature.keep));
    const refreshTokenExpiresIn = new Date(Date.now() + this.getExpiresIn(TokenType.REFRESH, signature.keep));

    await this.refreshTokenRepository.createRefreshToken({
      signatureId: signature.id,
      refreshToken: refreshToken,
      deleteAt: new Date(Date.now() + Time.MILLS_90_DAYS),
    });

    return {
      accessToken: accessToken,
      refreshToken: refreshToken,
      accessTokenExpiresIn: accessTokenExpiresIn,
      refreshTokenExpiresIn: refreshTokenExpiresIn,
    };
  }

  async signOut(signature: ISignature): Promise<true> {
    await this.refreshTokenRepository.deleteRefreshToken({
      signatureId: signature.id,
    });

    return true;
  }

  async refreshSign(accessToken: string, refreshToken: string): Promise<IHanulseSignInResult> {
    const signature = this.decodeToken(accessToken);
    if (signature == null) throw new ApolloError('AUTH_TOKEN_IS_NOT_VALID', TAG);

    const deletedRefreshToken = await this.refreshTokenRepository.deleteRefreshToken({
      signatureId: signature.id,
      refreshToken: refreshToken,
    });
    if (!deletedRefreshToken) throw new ApolloError('REFRESH_TOKEN_DOES_NOT_EXIST', TAG);

    return await this.signInBySignature(signature);
  }

  private generateToken(fields: any, tokenType: TokenType, keep: boolean) {
    const token = this.jwtService.sign(
      {
        ...fields,
        keep: keep,
        tokenType: TokenType.ACCESS,
        generatedAt: new Date(),
      },
      {
        expiresIn: this.getExpiresIn(tokenType, keep),
        secret: tokenType === TokenType.ACCESS ? process.env.ACCESS_TOKEN_JWT_SECRET : process.env.REFRESH_TOKEN_JWT_SECRET,
      },
    );
    return token;
  }

  private getExpiresIn(tokenType: TokenType, keep: boolean) {
    if (tokenType == TokenType.ACCESS) {
      return process.env.TESTABLE ? (keep ? Time.MILLS_1_DAY : Time.MILLS_1_MINUTE) : keep ? Time.MILLS_7_DAYS : Time.MILLS_1_DAY;
    } else {
      return keep ? Time.MILLS_1_YEAR : Time.MILLS_1_YEAR;
    }
  }

  private decodeToken(token: string): Nullable<ISignature> {
    try {
      const data = jwt.decode(token);

      if (!data) return null;
      if (typeof data != 'object') return null;

      return {
        id: data['id'],
        identity: data['identity'],
        name: data['name'],
        keep: data['keep'],
        tokenType: data['tokenType'],
      };
    } catch (e: any) {
      // Do nothing
    }
    return null;
  }
}