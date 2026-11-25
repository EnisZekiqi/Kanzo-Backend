import { TaskRepository } from "../repository/task.repository";

export class TaskService {
    static async createTask(userId:string,projectId:string,title:string,description:string,status:string,priority:string,assigneeId:string,dueDate:string){
        const result = await TaskRepository.createTask(userId,projectId,title,description,status,priority,assigneeId,dueDate)
        return result
    }
    static async getProjects(userId: string) {
        const result = await TaskRepository.getProjects(userId);

        const projectMap = new Map<string, {
            projectId: string;
            projectName: string;
            projectDescription: string | null;
            members: Array<{
                memberId: string;
                memberFirstName: string;
                memberLastName: string;
                memberEmail: string;
            }>;
            tasks:Array<{
                taskTitle:string,
                taskDescription:string,
                taskStatus:string,
                taskPriority:string,
                taskAssigned:string
            }>
        }>();

        for (const row of result) {
            let project = projectMap.get(row.projectId);

            if (!project) {
                project = {
                    projectId: row.projectId,
                    projectName: row.projectName,
                    projectDescription: row.projectDescription,
                    members: [],
                    tasks: [],
                };

                projectMap.set(row.projectId, project);
            }

            if (
            row.memberId &&
            !project.members.some(
                (member) => member.memberId === row.memberId,
            )
            ) {
            project.members.push({
                memberId: row.memberId,
                memberFirstName: row.memberFirstName,
                memberLastName: row.memberLastName,
                memberEmail: row.memberEmail,
            });
            }

            if (
            row.taskId &&
            !project.tasks.some(
                (task) => task.taskId === row.taskId,
            )
            ) {
            project.tasks.push({
                taskId: row.taskId,
                taskTitle: row.taskTitle,
                taskDescription: row.taskDescription,
                taskStatus: row.taskStatus,
                taskPriority: row.taskPriority,
                taskAssigned: row.taskAssigned,
            });
            }
            if (row.taskTitle) {
                project.tasks.push({
                    taskTitle: row.taskTitle,
                    taskDescription: row.taskDescription,
                    taskStatus: row.taskStatus,
                    taskPriority: row.taskPriority,
                    taskAssigned: row.taskAssigned,
                });
            }
        }

        return Array.from(projectMap.values());
    }
    static async getProjectsMember(userId: string) {
        const result = await TaskRepository.getProjectsMember(userId);

        const projectMap = new Map<string, {
            projectId: string;
            projectName: string;
            projectDescription: string | null;
            assignedMember: {
                memberId: string;
                firstName: string;
                lastName: string;
                email: string;
            };
            tasks:Array<{
                taskTitle:string,
                taskDescription:string,
                taskStatus:string,
                taskPriority:string,
                taskAssigned:string
            }>
        }>();

        for (const row of result) {
            let project = projectMap.get(row.projectId);

            if (!project) {
                project = {
                    projectId: row.projectId,
                    projectName: row.projectName,
                    projectDescription: row.projectDescription,
                    assignedMember:{
                    memberId:row.memberId,
                    firstName:row.memberFirstName,
                    lastName:row.memberLastName,
                    email:row.memberEmail
                    },
                    tasks: [],
                };

                projectMap.set(row.projectId, project);
            }

            
            if (row.taskTitle) {
                project.tasks.push({
                    taskTitle: row.taskTitle,
                    taskDescription: row.taskDescription,
                    taskStatus: row.taskStatus,
                    taskPriority: row.taskPriority,
                    taskAssigned: row.taskAssigned,
                });
            }
        }

        return Array.from(projectMap.values());
    }
}
