import { userService } from '@/modules/user/user.service';
import { projectTaskService } from '@/modules/project/project-task.service';
import { projectMilestoneService } from '@/modules/project/project-milestone.service';
import { projectsService } from '@/modules/project/project.service';
import { plannerService } from '@/modules/planner/planner.service';

async function main() {
  console.log('🔹 Planner smoke test starting...');

  const ts = Date.now();
  const email = `planner.user+${ts}@example.com`;

  const { user } = await userService.createUserWithDefaultSettings({
    email,
    passwordHash: 'dummy',
    displayName: 'Planner User',
  });

  const project = await projectsService.createProject({
    userId: user.id,
    name: `Project Planner ${ts}`,
    currency: 'EUR',
    services: [],
  });

  const task = await projectTaskService.addTask({
    userId: user.id,
    projectId: project.project.id,
    title: 'Task 1',
    dueDate: new Date(),
  });

  const milestone = await projectMilestoneService.addMilestone({
    userId: user.id,
    projectId: project.project.id,
    name: 'Milestone 1',
    dueDate: new Date(),
  });

  const timeline = await plannerService.getProjectTimeline({
    userId: user.id,
    projectId: project.project.id,
  });

  console.log('✅ Timeline:', {
    projectId: timeline.project.id,
    tasks: timeline.tasks.length,
    milestones: timeline.milestones.length,
  });

  const from = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
  const to = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const calendar = await plannerService.getUserWorkloadCalendar({
    userId: user.id,
    from,
    to,
  });

  console.log('✅ Workload calendar days:', calendar.days.length);

  if (!timeline.tasks.some((t) => t.id === task.id)) throw new Error('Task missing in timeline');
  if (!timeline.milestones.some((m) => m.id === milestone.id)) throw new Error('Milestone missing in timeline');
  if (calendar.days.length === 0) throw new Error('Calendar should have entries');

  const calendarTaskDay = calendar.days.find((day) => day.tasks.some((t) => t.taskId === task.id));
  if (!calendarTaskDay) throw new Error('Task missing in calendar days');

  const fromDateStr = from.toISOString().slice(0, 10);
  const toDateStr = to.toISOString().slice(0, 10);

  for (const day of calendar.days) {
    if (day.date < fromDateStr || day.date > toDateStr) {
      throw new Error(`Calendar entry ${day.date} outside requested window`);
    }
  }

  for (let i = 1; i < calendar.days.length; i += 1) {
    const prev = calendar.days[i - 1].date;
    const current = calendar.days[i].date;
    if (prev > current) {
      throw new Error('Calendar days are not sorted chronologically');
    }
  }

  console.log('✅ Planner smoke test completed successfully.');
}

main().catch((err) => {
  console.error('❌ Planner smoke test failed:', err);
  process.exit(1);
});
