import { NextFunction, Request, Response, Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "./db";
import { config } from "./config";
import { HttpError, wrap } from "./http";
import { isDuplicateKey } from "./utils";

export interface AuthedRequest extends Request {
  userId: number;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "Missing token" });
  try {
    const payload = jwt.verify(header.slice(7), config.jwtSecret) as unknown as { userId: number };
    (req as AuthedRequest).userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

const sign = (userId: number) => jwt.sign({ userId }, config.jwtSecret, { expiresIn: "7d" });

const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Valid email required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

export const authRouter = Router();

authRouter.post(
  "/register",
  wrap(async (req, res) => {
    const { name, email, password } = registerSchema.parse(req.body);
    const hash = await bcrypt.hash(password, 10);
    try {
      const [result] = await pool.query<ResultSetHeader>(
        "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
        [name, email.toLowerCase(), hash]
      );
      res.status(201).json({ token: sign(result.insertId), user: { id: result.insertId, name, email } });
    } catch (e) {
      if (isDuplicateKey(e)) throw new HttpError(409, "Email already registered");
      throw e;
    }
  })
);

authRouter.post(
  "/login",
  wrap(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM users WHERE email = ?", [email.toLowerCase()]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      throw new HttpError(401, "Invalid email or password");
    }
    res.json({ token: sign(user.id), user: { id: user.id, name: user.name, email: user.email } });
  })
);
