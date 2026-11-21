import { randomInt } from "node:crypto";
import { UsersRepository } from "../repository/users.repository";
import { hashPassword, verifyPassword } from "../utils/password";
import jwt from "jsonwebtoken";
import { CompanyRepository } from "../repository/company.repository";

export class UsersService{
    static async createUser(firstName: string, lastName: string, email: string, password: string){
        const existingUser = await UsersRepository.findByEmail(email);
        if(existingUser) {
            throw new Error("User already exists");
        }

        const passwordHash = await hashPassword(password);
        const codeHash = randomInt(100000, 1000000).toString();
        const expiresCode = new Date(Date.now() + 15 * 60 * 1000);
       
         const jwtSecret = process.env.JWT_SECRET;
            if (!jwtSecret) {
            throw new Error("JWT_SECRET is not configured.");
            } 
        const result = await UsersRepository.createUser(firstName,lastName,email,passwordHash,codeHash,expiresCode);
       
        const token = jwt.sign(
      {
        id: result.id,
      },
      jwtSecret,
      { expiresIn: "15min" },
    );
        return { ...result, token };
       
    }
    static async verifyEmail(userId:string,code:string){
        const users = await UsersRepository.findUser(userId)
        const findUser = users[0]
        if(!findUser){
            throw new Error("User was not found!");
        }
        if (findUser.usedAt) {
        throw new Error("Email is already verified");
        }
        const todayDate = new Date()
        if (todayDate >= findUser.expiresAt) {
            throw new Error("Expiration time has passed , try again!");
        }
        if (code !== findUser.codeHash) {
            await UsersRepository.attempts(userId)
            throw new Error("Wrong Otp Code , try again");
        }
        if (findUser.attempts >= 5) {
        throw new Error("Too many attempts");
        }
        const jwtSecret = process.env.JWT_SECRET;
            if (!jwtSecret) {
            throw new Error("JWT_SECRET is not configured.");
            } 
        const verified = await UsersRepository.verifyEmail(userId)
         const token = jwt.sign(
        {
            id: verified.id,
            purpose: "company-onboarding",
        },
        jwtSecret,
        { expiresIn: "60min" },
        );
        return {...verified,token}
    }
    static async logIn(email:string,password:string){
        const user = await UsersRepository.findByEmail(email)
        if (!user) {
            throw new Error("Invalid email or password");
        }
        const passwordResult = await verifyPassword(password, user.passwordHash)
        if (!passwordResult) {
             throw new Error("Invalid email or password");
        }
        const jwtSecret = process.env.JWT_SECRET;
            if (!jwtSecret) {
            throw new Error("JWT_SECRET is not configured.");
       } 
       if (user.emailVerifiedAt === null) {
         const codeHash = randomInt(100000, 1000000).toString();
        const expiresCode = new Date(Date.now() + 15 * 60 * 1000);
        await UsersRepository.createCode(user.id,codeHash,expiresCode)
        const token = jwt.sign(
          { id: user.id, purpose: "email-verification" },
          jwtSecret,
          { expiresIn: "15min" },
        );

        // Send codeHash through your email service here. Never return it to the client.
        return { next: "verify-email" as const, token };
       }
       const member = await CompanyRepository.getJoinedMember(user.id)

       const token = jwt.sign(
        { id: user.id, purpose: member ? "authenticated-session" : "company-onboarding" },
        jwtSecret,
        { expiresIn: "60min" },
       );

       return member
         ? { next: "dashboard" as const, token, member }
         : { next: "company-onboarding" as const, token };
    }
}
