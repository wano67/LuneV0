"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandlerPlugin = errorHandlerPlugin;
const errors_1 = require("@/modules/shared/errors");
const zod_1 = require("zod");
const client_service_1 = require("@/modules/client/client.service");
const service_service_1 = require("@/modules/service/service.service");
const invoice_payment_service_1 = require("@/modules/invoice-payment/invoice-payment.service");
async function errorHandlerPlugin(app) {
    app.setErrorHandler((err, _req, reply) => {
        let statusCode = 500;
        let error = {
            code: 'internal_error',
            message: 'Une erreur interne est survenue.',
        };
        if (err instanceof zod_1.ZodError) {
            statusCode = 400;
            error = {
                code: 'invalid_request',
                message: 'Requête invalide',
                details: err.issues,
            };
        }
        const isJwtError = typeof err?.code === 'string' && err.code.startsWith('FST_JWT_');
        if (isJwtError) {
            app.log.error({ err }, 'Request error');
            return reply.status(401).send({
                error: {
                    code: 'unauthorized',
                    message: 'Authentication required',
                    details: { reason: err.message },
                },
            });
        }
        if (err instanceof errors_1.AccountNotFoundError) {
            statusCode = 404;
            error = { code: 'account_not_found', message: err.message };
        }
        else if (err instanceof errors_1.AccountOwnershipError) {
            statusCode = 403;
            error = { code: 'forbidden', message: err.message };
        }
        else if (err instanceof client_service_1.ClientNotFoundError) {
            statusCode = 404;
            error = { code: 'client_not_found', message: err.message };
        }
        else if (err instanceof errors_1.ClientOwnershipError) {
            statusCode = 403;
            error = { code: 'forbidden', message: err.message };
        }
        else if (err instanceof service_service_1.ServiceNotFoundError) {
            statusCode = 404;
            error = { code: 'service_not_found', message: err.message };
        }
        else if (err instanceof errors_1.ServiceOwnershipError) {
            statusCode = 403;
            error = { code: 'forbidden', message: err.message };
        }
        else if (err instanceof errors_1.ProjectNotFoundError) {
            statusCode = 404;
            error = { code: 'project_not_found', message: err.message };
        }
        else if (err instanceof errors_1.ProjectOwnershipError) {
            statusCode = 403;
            error = { code: 'forbidden', message: err.message };
        }
        else if (err instanceof errors_1.BudgetNotFoundError) {
            statusCode = 404;
            error = { code: 'budget_not_found', message: err.message };
        }
        else if (err instanceof errors_1.BudgetOwnershipError) {
            statusCode = 403;
            error = { code: 'forbidden', message: err.message };
        }
        else if (err instanceof errors_1.ProjectTaskNotFoundError) {
            statusCode = 404;
            error = { code: 'task_not_found', message: err.message };
        }
        else if (err instanceof errors_1.ProjectTaskOwnershipError) {
            statusCode = 403;
            error = { code: 'forbidden', message: err.message };
        }
        else if (err instanceof errors_1.TransactionNotFoundError) {
            statusCode = 404;
            error = { code: 'transaction_not_found', message: err.message };
        }
        else if (err instanceof errors_1.TransactionOwnershipError) {
            statusCode = 403;
            error = { code: 'forbidden', message: err.message };
        }
        else if (err instanceof errors_1.InvoiceNotFoundError) {
            statusCode = 404;
            error = { code: 'invoice_not_found', message: err.message };
        }
        else if (err instanceof errors_1.InvoiceOwnershipError) {
            statusCode = 403;
            error = { code: 'forbidden', message: err.message };
        }
        else if (err instanceof invoice_payment_service_1.InvoicePaymentNotFoundError) {
            statusCode = 404;
            error = { code: 'payment_not_found', message: err.message };
        }
        else if (typeof err.message === 'string') {
            if (err.message.includes('Quote not found')) {
                statusCode = 404;
                error = { code: 'quote_not_found', message: err.message };
            }
            else if (err.message.includes('Quote must be accepted')) {
                statusCode = 409;
                error = { code: 'invalid_quote_state', message: err.message };
            }
            else if (err.message.includes('Only draft quotes')) {
                statusCode = 409;
                error = { code: 'invalid_quote_state', message: err.message };
            }
            else if (err.message.includes('Cannot delete quote linked to invoices')) {
                statusCode = 409;
                error = { code: 'invalid_quote_state', message: err.message };
            }
            else if (err.message.includes('Cannot delete invoice')) {
                statusCode = 409;
                error = { code: 'invoice_delete_forbidden', message: err.message };
            }
        }
        app.log.error({ err }, 'Request error');
        reply.status(statusCode).send({ error });
    });
}
