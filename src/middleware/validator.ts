import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { errorResponse } from '../utils/response';

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const extractedErrors: any[] = [];
    errors.array().forEach((err: any) => {
      extractedErrors.push({
        field: err.param,
        message: err.msg,
        value: err.value,
      });
    });

    return errorResponse(
      res,
      'Validation failed',
      400,
      JSON.stringify(extractedErrors),
      'VALIDATION_ERROR'
    );
  };
};
