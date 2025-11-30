"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loggingPlugin = loggingPlugin;
async function loggingPlugin(app) {
    app.addHook('onRequest', async (request) => {
        request._startTime = Date.now();
        app.log.info({
            msg: 'incoming_request',
            method: request.method,
            url: request.url,
            route: request.routeOptions.url, // <— Safe & typed
            userId: request.user?.id?.toString(),
        });
    });
    app.addHook('onResponse', async (request, reply) => {
        const durationMs = typeof request._startTime === 'number' ? Date.now() - request._startTime : undefined;
        app.log.info({
            msg: 'request_completed',
            method: request.method,
            url: request.url,
            route: request.routeOptions.url, // <— Same here
            statusCode: reply.statusCode,
            userId: request.user?.id?.toString(),
            durationMs,
        });
    });
}
