"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_service_1 = require("@/modules/user/user.service");
const project_task_service_1 = require("@/modules/project/project-task.service");
const project_milestone_service_1 = require("@/modules/project/project-milestone.service");
const project_service_1 = require("@/modules/project/project.service");
const planner_service_1 = require("@/modules/planner/planner.service");
async function main() {
    console.log('🔹 Planner smoke test starting...');
    const ts = Date.now();
    const email = `planner.user+${ts}@example.com`;
    const { user } = await user_service_1.userService.createUserWithDefaultSettings({
        email,
        passwordHash: 'dummy',
        displayName: 'Planner User',
    });
    const project = await project_service_1.projectsService.createProject({
        userId: user.id,
        name: `Project Planner ${ts}`,
        currency: 'EUR',
        services: [],
    });
    const task = await project_task_service_1.projectTaskService.addTask({
        userId: user.id,
        projectId: project.project.id,
        title: 'Task 1',
        dueDate: new Date(),
    });
    const milestone = await project_milestone_service_1.projectMilestoneService.addMilestone({
        userId: user.id,
        projectId: project.project.id,
        name: 'Milestone 1',
        dueDate: new Date(),
    });
    const timeline = await planner_service_1.plannerService.getProjectTimeline({
        userId: user.id,
        projectId: project.project.id,
    });
    console.log('✅ Timeline:', {
        projectId: timeline.project.id,
        tasks: timeline.tasks.length,
        milestones: timeline.milestones.length,
    });
    const calendar = await planner_service_1.plannerService.getUserWorkloadCalendar({
        userId: user.id,
        from: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    console.log('✅ Workload calendar days:', calendar.days.length);
    if (!timeline.tasks.some((t) => t.id === task.id))
        throw new Error('Task missing in timeline');
    if (!timeline.milestones.some((m) => m.id === milestone.id))
        throw new Error('Milestone missing in timeline');
    if (calendar.days.length === 0)
        throw new Error('Calendar should have entries');
    console.log('✅ Planner smoke test completed successfully.');
}
main().catch((err) => {
    console.error('❌ Planner smoke test failed:', err);
    process.exit(1);
});
