import { Router,Request, Response,NextFunction } from "express";
import { UsersController } from "../controller/users.controller";
import { loginSchema, registerSchema, verifySchema } from "../schema/loginSchema";
import jwt from "jsonwebtoken"
import { verifyCompany } from "./company.route";
export const usersRouter = Router();

export const verifyOtp = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const verifyToken = req.cookies?.verifyToken;

  if (!verifyToken) {
    return res.status(401).json({
      message: "Access Denied: No Token Provided",
    });
  }

  try {
    const verified = jwt.verify(verifyToken, process.env.JWT_SECRET!);

    req.user = verified as any;
    next();
  } catch {
    return res.status(401).json({
      message: "Invalid or Expired Token!",
    });
  }
};

usersRouter.post('/users', (req: Request, res: Response, next: NextFunction) => {
	const result = registerSchema.safeParse(req.body);

	if (!result.success) {
		return res.status(400).json({ errors: result.error.issues });
	}

	req.body = result.data;
	next();
}, UsersController.createUser);

usersRouter.patch('/users/verify',verifyOtp,(req: Request, res: Response, next: NextFunction) => {
	const result = verifySchema.safeParse(req.body);

	if (!result.success) {
		return res.status(400).json({ errors: result.error.issues });
	}

	req.body = result.data;
	next();
},UsersController.verifyEmail)

usersRouter.get('/session',UsersController.getSession)
usersRouter.post('/users/login',
  (req: Request, res: Response, next: NextFunction) => {
	const result = loginSchema.safeParse(req.body);

	if (!result.success) {
		return res.status(400).json({ errors: result.error.issues });
	}

	req.body = result.data;
	next();
},UsersController.logIn)

usersRouter.post('/users/logout',UsersController.logout)