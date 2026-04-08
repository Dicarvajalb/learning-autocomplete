import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import type { JSONSchemaType, ValidateFunction } from 'ajv';

const ajv = addFormats(
  new Ajv({
    allErrors: true,
    removeAdditional: true,
    coerceTypes: false,
  }),
);

const formatErrors = (errors: ValidateFunction['errors']): string => {
  if (!errors || errors.length === 0) {
    return 'Invalid request payload';
  }

  return errors
    .map((error) => {
      const location = error.instancePath || '/';
      return `${location} ${error.message ?? 'is invalid'}`.trim();
    })
    .join('; ');
};

@Injectable()
export class AjvValidationPipe<T> implements PipeTransform {
  private readonly validate: ValidateFunction<T>;

  constructor(schema: JSONSchemaType<T>) {
    this.validate = ajv.compile(schema);
  }

  transform(value: unknown): T {
    const valid = this.validate(value);

    if (!valid) {
      throw new BadRequestException({
        message: formatErrors(this.validate.errors),
      });
    }

    return value as T;
  }
}
