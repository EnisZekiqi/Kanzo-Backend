import { Router,Request, Response,NextFunction } from "express";
import { UsersController } from "../controller/users.controller";
import { registerSchema, verifySchema } from "../schema/loginSchema";
import jwt from "jsonwebtoken"
import { CompanyController } from "../controller/company.controller";
import { createCompanySchema, joinCompanySchema } from "../schema/companySchema";

export const companyRouter = Router()

export const verifyCompany = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const companyToken = req.cookies?.companyToken;

  if (!companyToken) {
    return res.status(401).json({
      message: "Access Denied: No Token Provided",
    });
  }

  try {
    const verified = jwt.verify(companyToken, process.env.JWT_SECRET!);

    req.user = verified as any;
    next();
  } catch {
    return res.status(401).json({
      message: "Invalid or Expired Token!",
    });
  }
};

companyRouter.get('/me/company-onboarding',verifyCompany,CompanyController.getDetails)
companyRouter.post('/me/company-onboarding',verifyCompany,
  (req: Request, res: Response, next: NextFunction) => {
	const result = createCompanySchema.safeParse(req.body);

	if (!result.success) {
		return res.status(400).json({ errors: result.error.issues });
	}

	req.body = result.data;
	next();
},CompanyController.createCompany)

companyRouter.post('/me/join-company',verifyCompany,
  (req: Request, res: Response, next: NextFunction) => {
	const result = joinCompanySchema.safeParse(req.body);

	if (!result.success) {
		return res.status(400).json({ errors: result.error.issues });
	}

	req.body = result.data;
	next();
},CompanyController.joinCompany)
