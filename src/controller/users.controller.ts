import { Request,Response } from "express";
import { verify } from "jsonwebtoken";
import { UsersService } from "../service/users.service";
import { CompanyService } from "../service/company.service";
import { CompanyRepository } from "../repository/company.repository";

export class UsersController {
   static async createUser(req:Request,res:Response){
   try{
    const { firstName, lastName, email, password } = req.body;
    if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    const newUser = await UsersService.createUser(firstName,lastName,email,password);
     const isProduction = process.env.NODE_ENV === "production";

      res.cookie("verifyToken", newUser.token, {
        httpOnly: true,
        sameSite: "strict",
        secure: isProduction,
        path: "/",
        maxAge: 15 * 60 * 1000,
      });

    return res.status(201).json(newUser);
   } catch (error) {
  console.error("createUser failed:", error);
  return res.status(500).json({ error: "Internal server error" });
}
   }
   static async verifyEmail(req:Request,res:Response){
    try{
     const userId = req.user?.id
     if (!userId) {
        res.status(401).json({ error: "Verification token is missing." });
        return;
      }
      const { code } = req.body as {
        code?: unknown;
      };
      if (!code) {
       return res.status(400).json({
        error: "A valid six-digit code is required.",
      });
      }
      const result = await UsersService.verifyEmail(userId,code)
      res.clearCookie("verifyToken", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

   const isProduction = process.env.NODE_ENV === "production";
   res.cookie("companyToken", result.token, {
        httpOnly: true,
        sameSite: "strict",
        secure: isProduction,
        path: "/",
        maxAge: 60 * 60 * 1000,
      });
      return res.status(201).json(result);
    }catch(error){
    res.status(500).json({ error: 'Internal server error' })
    }
   }

   static async getSession(req: Request, res: Response) {
  const accessToken = req.cookies?.accessToken;
  const companyToken = req.cookies?.companyToken;
  const verifyToken = req.cookies?.verifyToken;

  if (verifyToken && isValidVerifyToken(verifyToken)) {
    return res.json({
      authenticated: false,
      stage: "verify-email",
    });
  }

  const accessPayload = accessToken
    ? getValidTokenPayload(accessToken, "authenticated-session")
    : null;

  if (accessPayload?.id) {
    const dashboardSession =
      await CompanyService.getDashboardSession(accessPayload.id);

    if (dashboardSession) {
      return res.json({
        authenticated: true,
        stage: "dashboard",
        ...dashboardSession,
      });
    }
  }

  const companyPayload = companyToken
    ? getValidTokenPayload(companyToken, "company-onboarding")
    : null;

  if (companyPayload?.id) {
    const membership =
      await CompanyService.getMembership(companyPayload.id);

    if (membership?.status === "PENDING") {
      return res.json({
        authenticated: true,
        stage: "join-pending",
        membership,
      });
    }

    if (membership?.status === "ACTIVE") {
      return res.json({
        authenticated: true,
        stage: "dashboard",
        membership,
      });
    }

    return res.json({
      authenticated: true,
      stage: "company-onboarding",
    });
  }

  return res.json({
    authenticated: false,
    stage: "unauthenticated",
  });
}
static async logIn(req: Request, res: Response){
try {
  const {email,password}=req.body

 if (!email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
   }
   const result = await UsersService.logIn(email,password)
   const isProduction = process.env.NODE_ENV === "production";

   if (result.next === "verify-email") {
     res.cookie("verifyToken", result.token, {
       httpOnly: true, sameSite: "strict", secure: isProduction,
       path: "/", maxAge: 15 * 60 * 1000,
     });
   } else if (result.next === "company-onboarding") {
    res.clearCookie("verifyToken", { path: "/" });
     res.cookie("companyToken", result.token, {
       httpOnly: true, sameSite: "strict", secure: isProduction,
       path: "/", maxAge: 60 * 60 * 1000,
     });
   } else {
    res.clearCookie("companyToken", { path: "/" });
     res.cookie("accessToken", result.token, {
       httpOnly: true, sameSite: "strict", secure: isProduction,
       path: "/", maxAge: 60 * 60 * 1000,
     });
   }

   const { token: _token, ...response } = result;
   return res.status(200).json(response);
} catch (error) {
  if (error instanceof Error && error.message === "Invalid email or password") {
    return res.status(401).json({ error: error.message });
  }
  console.error("login failed:", error);
  return res.status(500).json({ error: 'Internal server error' });
}
}
static async logout(req: Request, res: Response){
try {
  res.clearCookie("accessToken", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  res.status(200).json({message:"Logged out successfully!"});
} catch (error) {
  return res.status(500).json({ error: 'Internal server error' });
}
}
}


///function helpers

function isValidVerifyToken(companyToken: unknown): boolean {
  const secret = process.env.JWT_SECRET;
  if (typeof companyToken !== "string" || !secret) {
    return false;
  }

  try {
    verify(companyToken, secret);
    return true;
  } catch {
    return false;
  }
}
function isValidCompanyToken(verifyToken: unknown): boolean {
  const secret = process.env.JWT_SECRET;
  if (typeof verifyToken !== "string" || !secret) {
    return false;
  }

  try {
    verify(verifyToken, secret);
    return true;
  } catch {
    return false;
  }
  
}

function getValidTokenPayload(token: unknown, purpose: string) {
  const secret = process.env.JWT_SECRET;
  if (typeof token !== "string" || !secret) {
    return null;
  }

  try {
    const payload = verify(token, secret);
    if (typeof payload === "string" || payload.purpose !== purpose) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
