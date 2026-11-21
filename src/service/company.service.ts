import { CompanyRepository } from "../repository/company.repository"
import jwt from "jsonwebtoken";
export class CompanyService {
   static async getDetails(userId:string){
    const result = await CompanyRepository.getDetails(userId)
    
    const domain = result.email.split("@")[1] ?? ""
        const freeEmailDomains = new Set([
        "gmail.com",
        "hotmail.com",
        "outlook.com",
        "yahoo.com",
        ]);
        const isBusinessEmail = !freeEmailDomains.has(domain);

    const suggestedCompanyName = isBusinessEmail
      ? domain.split(".")[0]
      : null;

        const existingCompany =
        suggestedCompanyName
            ? await CompanyRepository.findByName(suggestedCompanyName)
            : null

            const shouldSuggestCompany =
        isBusinessEmail &&
        suggestedCompanyName !== null &&
        existingCompany === null
    return {
        ...result,
        companyRecommendation:{
        suggestedCompanyName,
        shouldSuggestCompany:shouldSuggestCompany
        }
    }
   }
   static async createCompany(userId:string,name:string,slug:string,domain:string,description:string,logoUrl:string){
    const result = await CompanyRepository.createCompany(userId,name,slug,domain,description,logoUrl)
    const jwtSecret = process.env.JWT_SECRET;
            if (!jwtSecret) {
            throw new Error("JWT_SECRET is not configured.");
       }
       const token = jwt.sign(
         { id: userId, companyId: result.id, purpose: "authenticated-session" },
            jwtSecret,
            { expiresIn: "1hr" },
         ); 
    return { ...result, token };
   }
   static async getDashboardSession(userId:string){
    const membership = await CompanyRepository.getActiveMembership(userId);
    return membership ? { userId, membership } : null;
   }
   static async joinCompany(userId:string,tokenHash:string){
    const findCompany = await CompanyRepository.findCompany(tokenHash)
    if (!findCompany) {
        throw new Error("Companys invitation link was not found !");
    }
    const companyId = findCompany.companyId

    const existingMembership =
        await CompanyRepository.getMembershipForCompany(userId, companyId);

    if (existingMembership?.status === "REJECTED") {
        throw new Error(
            "Your invitation request was rejected. Please try again later."
        );
    }

    if (existingMembership?.status === "PENDING") {
        return [existingMembership];
    }

    if (existingMembership?.status === "ACTIVE") {
        throw new Error("You are already a member of this company.");
    }

    const pendingUser = await CompanyRepository.pendingUser(userId,companyId)
    return pendingUser
}
static async getMembership(userId: string) {
  return CompanyRepository.getMembership(userId);
}
}
