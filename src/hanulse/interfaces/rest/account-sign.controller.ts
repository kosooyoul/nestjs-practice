import { Body, Controller, UseGuards } from '@nestjs/common';
import { SignatureAuthGuard } from '@/global/auth/signature-auth.guard';
import { ApolloError } from 'apollo-server-core';
import { AccountSignService } from '@/hanulse/application/service/account-sign.service';
import SignUpRequest from '../dto/account-sign/request/SignUpRequest';
import SignInRequest from '../dto/account-sign/request/SignInRequest';
import { Signature } from '@/global/auth/signature.decorators';
import { Authorization } from '@/global/auth/authorization.decorators';
import { ISignature } from '@/global/auth/auth.interface';
import RefreshSignRequest from '../dto/account-sign/request/RefreshSignRequest';
import SignInResponse from '../dto/account-sign/response/SignInResponse';
import { AccountService } from '@/hanulse/application/service/account.service';
import SignUpResponse from '../dto/account-sign/response/SignUpResponse';
import SignOutResponse from '../dto/account-sign/response/SignOutResponse';
import RefreshSignResponse from '../dto/account-sign/response/RefreshSignResponse';
import { Nullable } from '@/global/common/types';
import { PostApi } from '@/global/interface/rest/decorator';
import { ApiTags } from '@nestjs/swagger';

const TAG = 'SignResolver';

@ApiTags('Sign')
@Controller('/v1')
export class SignController {
  constructor(
    private readonly accountService: AccountService,
    private readonly accountSignService: AccountSignService,
  ) {}

  @PostApi(() => SignUpResponse, {
    path: '/account/sign-up',
    description: '회원 가입',
  })
  async signUp(@Body() request: SignUpRequest): Promise<SignUpResponse> {
    const emailExisting = await this.accountService.IsExistingAccountEmail(
      request.email,
    );
    if (emailExisting)
      throw new ApolloError('ACCOUNT_EMAIL_ALREADY_HAS_BEEN_USED', TAG);

    const account = await this.accountService.createAccount(
      request.toAccountFields(),
    );

    const result = await this.accountSignService.signIn(account, false);

    return SignUpResponse.fromSignInResult(result);
  }

  @PostApi(() => SignInResponse, {
    path: '/account/sign-in',
    description: '로그인',
  })
  async signIn(@Body() request: SignInRequest): Promise<SignInResponse> {
    const account = await this.accountService.getAccountByFilterWithPassword(
      request.toAccountFilter(),
      request.password,
    );
    if (account == null)
      throw new ApolloError('ACCOUNT_PASSWORD_DOES_NOT_MATCH', TAG);

    const result = await this.accountSignService.signIn(account, request.keep);

    return SignInResponse.fromSignInResult(result);
  }

  @UseGuards(SignatureAuthGuard)
  @PostApi(() => SignOutResponse, {
    path: '/account/sign-out',
    description: '로그아웃',
    auth: true,
  })
  async signOut(@Signature() signature: ISignature): Promise<SignOutResponse> {
    const success = await this.accountSignService.signOut(signature);

    return SignOutResponse.fromSuccess(success);
  }

  @PostApi(() => RefreshSignResponse, {
    path: '/account/refresh-sign',
    description: '인증 리프레시',
    auth: true,
  })
  async refreshSign(
    @Authorization() accessToken: Nullable<string>,
    @Body() request: RefreshSignRequest,
  ): Promise<RefreshSignResponse> {
    if (accessToken == null)
      throw new ApolloError('AUTH_TOKEN_IS_NOT_EXISTS', TAG);

    const result = await this.accountSignService.refreshSign(
      accessToken,
      request.refreshToken,
    );

    return RefreshSignResponse.fromSignInResult(result);
  }
}