import { Router as ExpressRouter } from 'express';
import pdf from 'pdf-parse-new';

import { z } from 'zod';

import { httpResponseBadRequest, httpResponseOk, httpResponseInternalServerError, httpResponseUnauthorized } from '../../utils/httpResponse.ts';
import { successMessages, errorMessages } from '../../utils/messages.ts';

import { extractionControllerInstance } from '../../controllers/extractionController.ts';

import { CustomError } from '../../utils/customErrors.ts';

import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { getTimestamp } from '../../utils/timestamp.ts';

const router = ExpressRouter();

router.post('/', async (req: ExpressRequest, res: ExpressResponse) => {

    const ExpectedSchema = z.object({
        file_base64: z.string(),
        schema: z.record(z.string(), z.any()),
    });

    type ExpectedBodyType = z.infer<typeof ExpectedSchema>;

    if (!ExpectedSchema.safeParse(req.body).success) {
        return httpResponseBadRequest(errorMessages.invalidRequestBody, null, res);
    }

    try {
        const requestTimestamp = getTimestamp();
        const body = req.body as ExpectedBodyType;

        // Decode base64 to buffer
        const pdfBuffer = Buffer.from(body.file_base64, 'base64');

        // Parse PDF
        const pdfData = await pdf(pdfBuffer);
        const fileText = pdfData.text;

        // Extract data using the controller
        const extractedData = await extractionControllerInstance.extract(fileText, body.schema.extraction_schema);
        const result = {
            label: body.schema.label,
            extraction_schema: extractedData,
            pdf_path: body.schema.pdf_path,
            response_timestamp: getTimestamp(),
            request_timestamp: requestTimestamp,
        }
        return httpResponseOk(successMessages.extractedDataRetrieved, result, res);

    } catch (err) {

        if (err instanceof CustomError) {
            return httpResponseBadRequest(err.message, null, res);
        } else {
            return httpResponseInternalServerError(errorMessages.internalServerError, null, res);
        }

    }
});

export default router;