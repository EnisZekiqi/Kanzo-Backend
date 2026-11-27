import { and, asc, count, desc, eq, gte, ilike, inArray, isNotNull, lt, lte, ne, or } from "drizzle-orm";
import { db } from "../db";
import { companies, companyMembers } from "../db/company";
import { users } from "../db/schema";
import { projects, projectMembers } from "../db/projects";
import { tasks } from "../db/tasks";


export class TeamRepository {
    static async getTeam(userId:string,offset:number,limit:number,search:string){
       const membership = await db
        .select({
            companyId: companyMembers.companyId,
        })
        .from(companyMembers)
        .where(and(
            eq(companyMembers.userId, userId),
            eq(companyMembers.status, "ACTIVE"),
        ))
        .limit(1);

        if (!membership[0]) {
            return [];
        }
        const pageSize = limit > 0 ? limit : 10;
        const start = offset >= 0 ? offset : 0;
        const term = search.trim();
        const searchFilter = term
            ? or(
                ilike(users.firstName, `%${term}%`),
                ilike(users.lastName, `%${term}%`),
            )
            : undefined;

        const [team, totalResult] = await Promise.all([
            db.select({
            memberId: companyMembers.userId,
            companyId: companyMembers.companyId,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            role: companyMembers.role,
            status: companyMembers.status,
            joinedAt:companyMembers.joinedAt
            }).from(companyMembers)
            .innerJoin(users, eq(users.id, companyMembers.userId))
            .where(
            and(
                eq(companyMembers.companyId, membership[0].companyId),
                eq(companyMembers.status, 'ACTIVE'),
                searchFilter,
            )
            )
            .limit(pageSize)
            .offset(start)
            .orderBy(companyMembers.joinedAt),
            db.select({ total: count() })
                .from(companyMembers)
                .innerJoin(users, eq(users.id, companyMembers.userId))
                .where(
            and(
                eq(companyMembers.companyId, membership[0].companyId),
                eq(companyMembers.status, 'ACTIVE'),
                searchFilter,
            )
                ),
        ]);
        const total = totalResult[0]?.total ?? 0;

        return {
            team,
            total,
            totalPages: Math.ceil(total / pageSize),
            page: Math.floor(start / pageSize) + 1,
            limit: pageSize,
            offset: start,
        }
    }
    static async changeRole(userId:string,memberId:string,status:string){
        return await db.transaction(async(tx)=>{
            const targetMember = await tx.select({
                companyId: companyMembers.companyId,
            })
            .from(companyMembers)
            .where(and(
                eq(companyMembers.userId, memberId),
                eq(companyMembers.status, "ACTIVE"),
            ))
            .limit(1);

            const owner = targetMember[0]
                ? await tx.select({
                    companyId: companies.id,
                })
                .from(companies)
                .innerJoin(companyMembers, and(
                    eq(companyMembers.companyId, companies.id),
                    eq(companyMembers.userId, userId),
                ))
                .where(and(
                    eq(companies.id, targetMember[0].companyId),
                    eq(companies.createdBy, userId),
                    eq(companyMembers.role, "OWNER"),
                    eq(companyMembers.status, "ACTIVE"),
                ))
                .limit(1)
                : [];

            if (!targetMember[0] || !owner[0]) {
                throw new Error("Owner cannot make the changes!");
                
            }
            const changeRole = await tx.update(companyMembers)
            .set({
                role:status,
                updatedAt:new Date()
            }).where(
                and(
                    eq(companyMembers.userId,memberId),
                    eq(companyMembers.status,'ACTIVE'),
                    ne(companyMembers.role,status)
                )
            ).returning()
            return changeRole
        })
        
    }
    static async getTaskCompletition(userId:string){
        const statusCounts = await db.select({
            taskStatus: tasks.status,
            count: count(),
        })
        .from(tasks)
        .where(eq(tasks.assigneeId, userId))
        .groupBy(tasks.status);
        return {
            statusCounts,
        }
    }
    static async getUpcomingDeadlines(userId:string){
        const result = await db.select({
             taskId:tasks.id,
            taskTitle:tasks.title,
            taskDescription:tasks.description,
            taskStatus:tasks.status,
            taskPriority:tasks.priority,
            taskAssigned:tasks.assigneeId,
            taskDueDate:tasks.dueDate,
            taskPosition:tasks.position
        }).from(tasks)
        .where(
            eq(tasks.assigneeId,userId)
        ).orderBy(asc(tasks.dueDate)).limit(3)
        return result
    }
    static async getMemberProjects(userId:string){
        const result = await db.select({
            projectId:projects.id,
            projectName:projects.name,
            projectsDescription:projects.description,
            joinedAt:projectMembers.joinedAt,
            taskCount:count(tasks.id)
        }).from(projects)
        .innerJoin(projectMembers,
           and(
                eq(projectMembers.projectId, projects.id),
                eq(projectMembers.userId, userId),
            )
        ).leftJoin(tasks,
            eq(tasks.projectId,projects.id)
        ).groupBy(
            projects.id,
            projects.name,
            projects.description,
            projectMembers.joinedAt,
        )
        .orderBy(asc(projectMembers.joinedAt)).limit(3)
        return result
    }
    static async getTaskCompletion(userId:string){
       const result = await db.select()
       .from(tasks)
       .leftJoin(companyMembers,
        eq(companyMembers.userId,userId)
       )
       .where(and(
        eq(tasks.status,'DONE'),
        inArray(companyMembers.role,['ADMIN','OWNER'])
       ))
        return result 
    }
    static async getAttention(userId:string){
       const today = new Date();

    return await db
        .select({
            projectName: projects.name,
            projectStatus: projects.status,
            tasksTitle: tasks.title,
            taskStatus: tasks.status,
            tasksDueDate: tasks.dueDate,
            companyId: companyMembers.companyId,
        })
        .from(projects)
        .innerJoin(
            companyMembers,
            and(
                eq(companyMembers.companyId, projects.companyId),
                eq(companyMembers.userId, userId),
                eq(companyMembers.status, "ACTIVE"),
                inArray(companyMembers.role, ["ADMIN", "OWNER"]),
            ),
        )
        .innerJoin(
            tasks,
            eq(tasks.projectId, projects.id),
        )
        .where(
            and(
                eq(projects.status, "ACTIVE"),
                inArray(tasks.status, ["TODO", "IN_PROGRESS"]),
                lte(tasks.dueDate, today),
            ),
        )
        .orderBy(asc(tasks.dueDate))
        .limit(3);
        
    }
    static async getActivity(userId: string) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

    return await db
        .select({
            taskId: tasks.id,
            taskTitle: tasks.title,
            taskStatus: tasks.status,
            taskUpdatedAt: tasks.updatedAt,
            projectName: projects.name,
            companyId: projects.companyId,
        })
        .from(tasks)
        .innerJoin(
            projects,
            eq(projects.id, tasks.projectId),
        )
        .innerJoin(
            companyMembers,
            and(
                eq(companyMembers.companyId, projects.companyId),
                eq(companyMembers.userId, userId),
                eq(companyMembers.status, "ACTIVE"),
                inArray(companyMembers.role, ["ADMIN", "OWNER"]),
            ),
        )
        .where(
            and(
                gte(tasks.updatedAt, startOfToday),
                lt(tasks.updatedAt, startOfTomorrow),
            ),
        )
        .orderBy(desc(tasks.updatedAt));
}
}
