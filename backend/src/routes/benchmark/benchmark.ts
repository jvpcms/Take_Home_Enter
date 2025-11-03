import { Router as ExpressRouter } from 'express';
import pdf from 'pdf-parse-new';

import { httpResponseBadRequest, httpResponseOk, httpResponseInternalServerError, httpResponseUnauthorized } from '../../utils/httpResponse.ts';
import { successMessages, errorMessages } from '../../utils/messages.ts';

import { extractionControllerInstance } from '../../controllers/extractionController.ts';

import { CustomError } from '../../utils/customErrors.ts';

import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { getTimestamp } from '../../utils/timestamp.ts';

const router = ExpressRouter();

router.get('/', async (req: ExpressRequest, res: ExpressResponse) => {

  try {
    const requestTimestamp = getTimestamp();
    extractionControllerInstance.benchmark();
    return httpResponseOk(successMessages.benchmarkCompleted, {}, res);

  } catch (err) {

    if (err instanceof CustomError) {
      return httpResponseBadRequest(err.message, null, res);
    } else {
      return httpResponseInternalServerError(errorMessages.internalServerError, null, res);
    }

  }
});

export default router;