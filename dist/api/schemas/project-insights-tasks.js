"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectTaskTimeInsightSchema = void 0;
const zod_1 = require("zod");
exports.projectTaskTimeInsightSchema = zod_1.z.object({
    taskId: zod_1.z.string(),
    name: zod_1.z.string(),
    status: zod_1.z.string(),
    estimatedHours: zod_1.z.number().nullable(),
    actualHours: zod_1.z.number().nullable(),
    ratio: zod_1.z.number().nullable(), // actual / estimated
});
