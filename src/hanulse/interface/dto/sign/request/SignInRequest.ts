import { InputType } from '@nestjs/graphql';
import { GlobalInputValidator } from '@/global/common/decorators/input-validator.decorator';
import { GlobalInputTransformer } from '@/global/common/decorators/input-transformer.decorator';
import { IAccountFilter } from '@/hanulse/application/dto/account/account-filter';
import { ApiField } from '@/global/interface/rest/decorator';

@InputType()
export default class SignInRequest {
  @GlobalInputTransformer.NormalizeEmail()
  @GlobalInputValidator.IsEmail()
  @ApiField({
    type: String,
    description: '로그인 이메일',
    nullable: false,
    example: 'test@test.com',
  })
  email!: string;

  @GlobalInputValidator.IsNotEmptyString()
  @ApiField({
    type: String,
    description: '로그인 비밀번호',
    nullable: false,
    example: 'a123456!',
  })
  password!: string;

  @ApiField({
    type: Boolean,
    description: '로그인을 유지할지 여부',
    nullable: true,
    defaultValue: false,
    example: 'true',
  })
  keep!: boolean;

  toAccountFilter(): IAccountFilter {
    return {
      email: this.email,
    };
  }
}