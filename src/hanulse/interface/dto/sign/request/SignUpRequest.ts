import { InputType } from '@nestjs/graphql';
import { AuoiInputValidator } from '@/auoi/common/decorators/input-validator.decorator';
import { AuoiInputTransformer } from '@/auoi/common/decorators/input-transformer.decorator';
import { IAccountFields } from '@/hanulse/application/dto/account/account-fields';
import { AuoiApiField } from '@/auoi/interface/common/decorator';
import * as bcrypt from 'bcrypt';

@InputType()
export default class SignUpRequest {
  @AuoiInputTransformer.NormalizeEmail()
  @AuoiInputValidator.IsEmail()
  @AuoiApiField({ type: String, description: '로그인 이메일', nullable: false, example: 'test@test.com' })
  email!: string;

  @AuoiInputValidator.IsPassword()
  @AuoiApiField({ type: String, description: '로그인 비밀번호', nullable: false, example: 'a123456!' })
  password!: string;

  @AuoiInputTransformer.Trim()
  @AuoiInputValidator.IsUserName()
  @AuoiApiField({ type: String, description: '계정 사용자 이름', nullable: false, example: '테스트' })
  username!: string;

  toAccountFields(): IAccountFields {
    return {
      email: this.email,
      password: this.encryptPassword(this.password),
      username: this.username,
    };
  }

  private encryptPassword(password: string): string {
    // bcrypt.genSaltSync(SignUtils.SALT_ROUND, SignUtils.SALT_MINOR)
    return bcrypt.hashSync(password, 8);
  }
}
