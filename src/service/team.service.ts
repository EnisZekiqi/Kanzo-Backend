import { TeamRepository } from "../repository/team.repository"

export class TeamService {
    static async getTeam(userId:string,page:number,limit:number,search:string){
        const offset = (page -1)*limit

        const team = await TeamRepository.getTeam(userId,offset,limit,search)
        if (Array.isArray(team)) {
            return {
                team: [],
                total: 0,
                page,
                limit,
                totalPages: 0
            }
        }
        return {
            team:team.team,
            total:team.total,
            page,
            limit,
            totalPages:Math.ceil(team.total / limit)
        }
    }
    static async changeRole(userId:string,memberId:string,status:string){
        const team = await TeamRepository.changeRole(userId,memberId,status)
        return team
    }
    static async getTaskCompletition(userId:string){
        const taskCompletition = await TeamRepository.getTaskCompletition(userId)
        return taskCompletition
    }
    static async getUpcomingDeadlines(userId:string){
        const upcoming = await TeamRepository.getUpcomingDeadlines(userId)
        return upcoming
    }
    static async getMemberProjects(userId:string){
        const memberProject = await TeamRepository.getMemberProjects(userId)
        return memberProject
    }
    static async getCompletion(userId:string){
        const completion = await TeamRepository.getTaskCompletion(userId)
        return completion
    }
    static async getAttention(userId:string){
        const attention = await TeamRepository.getAttention(userId)
        return attention
    }
    static async getActivity(userId:string){
        const activity = await TeamRepository.getActivity(userId)
        return activity
    }
}