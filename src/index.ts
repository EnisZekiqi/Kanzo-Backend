import express, { Application} from 'express';
import 'dotenv/config';
// @ts-expect-error Install @types/cors to provide this module's declarations.
import cors from 'cors';
import helmet from 'helmet';
import { usersRouter } from './routes/users.route';
import cookieParser from "cookie-parser";
import cron from "node-cron";
import {UsersRepository} from './repository/users.repository'
import {AdminRepository} from './repository/admin.repository'
import { companyRouter } from './routes/company.route';
import { adminRouter } from './routes/admin.routes';
import { settingsRouter } from './routes/settings.routes';
import { tasksRouter } from './routes/tasks.routes';

const app: Application = express();
const PORT = process.env.PORT || 5555;

//// Security Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(helmet());
app.use(cors({
  origin: "http://localhost:5173", 
  credentials: true,                
}));
/////
cron.schedule("0 * * * *", async () => {
  console.log("[Worker] Starting scheduled cleanup...");
  try {
    await UsersRepository.deleteExpiredVerificationTokens();
    console.log("[Worker] Expired OTP tokens cleaned up successfully.");

    const deletedProjects = await AdminRepository.deletePermanentProject();
    console.log(`[Worker] Permanently deleted ${deletedProjects.rowCount ?? 0} projects.`);
  } catch (error) {
    console.error("[Worker] Scheduled cleanup failed:", error);
  }
});
///Routes the Users will use

app.use('/api/auth',usersRouter);
app.use('/api/company',companyRouter)
app.use('/api/admin',adminRouter)
app.use('/api/settings/',settingsRouter)
app.use('/api/tasks/',tasksRouter)
///Routes the Users will use

//// 404 if the user accesses a route that does not exist
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
