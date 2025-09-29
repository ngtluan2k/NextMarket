import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsDobValid implements ValidatorConstraintInterface {
  validate(dob: string, _args: ValidationArguments) {
    if (!dob) return false;
    return new Date(dob) <= new Date();
  }

  defaultMessage(_args: ValidationArguments) {
    return 'Ngày sinh không được ở tương lai';
  }
}