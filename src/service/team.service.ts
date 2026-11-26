import { TeamRepository } from "../repository/team.repository"

export class TeamService {
    static async getTeam(userId:string){
        const team = await TeamRepository.getTeam(userId)
        return team
    }
    static async changeRole(userId:string,memberId:string,status:string){
        const team = await TeamRepository.changeRole(userId,memberId,status)
        return team
    }
}