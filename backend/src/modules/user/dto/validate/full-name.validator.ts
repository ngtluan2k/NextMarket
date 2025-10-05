import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsFullName implements ValidatorConstraintInterface {
  validate(name: string, _args: ValidationArguments) {
    if (!name) return false;
    const parts = name.trim().split(' ');
    return parts.length >= 2 && parts.every((p) => /^[A-Za-zÀ-ỹ]+$/.test(p));
  }

  defaultMessage(_args: ValidationArguments) {
    return 'Full name phải ít nhất 2 từ và không được rỗng';
  }
}
