import { Router } from "express";
import { z } from "zod";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../db";
import { config } from "../config";
import { HttpError, wrap } from "../http";
import { isDuplicateKey } from "../utils";

export const publicRouter = Router();

async function findActiveLink(code: string) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT l.id AS linkId, ca.name AS campaignName, ca.reward_amount AS rewardAmount
     FROM referral_links l JOIN campaigns ca ON ca.id = l.campaign_id
     WHERE l.code = ? AND ca.status = 'active'`,
    [code]
  );
  return rows[0];
}

/** Referral link entry point: records a click, then sends the visitor to the signup page. */
publicRouter.get(
  "/r/:code",
  wrap(async (req, res) => {
    const link = await findActiveLink(req.params.code);
    if (!link) throw new HttpError(404, "Referral link not found or campaign paused");
    await pool.query("INSERT INTO clicks (link_id, user_agent) VALUES (?, ?)", [
      link.linkId,
      (req.headers["user-agent"] ?? "").slice(0, 255),
    ]);
    res.redirect(`${config.clientUrl}/join?ref=${encodeURIComponent(req.params.code)}`);
  })
);

publicRouter.get(
  "/api/public/ref/:code",
  wrap(async (req, res) => {
    const link = await findActiveLink(req.params.code);
    if (!link) throw new HttpError(404, "Referral link not found or campaign paused");
    res.json({ campaignName: link.campaignName });
  })
);

const signupSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Valid email required"),
});

/** A conversion: records the signup and credits the campaign's reward. */
publicRouter.post(
  "/api/public/signup",
  wrap(async (req, res) => {
    const { code, name, email } = signupSchema.parse(req.body);
    const link = await findActiveLink(code);
    if (!link) throw new HttpError(404, "Referral link not found or campaign paused");
    try {
      await pool.query<ResultSetHeader>(
        "INSERT INTO signups (link_id, name, email, reward_amount) VALUES (?, ?, ?, ?)",
        [link.linkId, name, email.toLowerCase(), Number(link.rewardAmount)]
      );
    } catch (e) {
      if (isDuplicateKey(e)) throw new HttpError(409, "This email has already signed up via this link");
      throw e;
    }
    res.status(201).json({ message: "Signup recorded", campaignName: link.campaignName });
  })
);
