import { Router } from "express";
import { z } from "zod";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../db";
import { AuthedRequest, requireAuth } from "../auth";
import { HttpError, wrap } from "../http";
import { conversionRate, generateCode, isDuplicateKey, totalReward } from "../utils";

export const campaignsRouter = Router();
campaignsRouter.use(requireAuth);

const CAMPAIGN_SELECT = `
  SELECT ca.id, ca.name, ca.description, ca.reward_amount, ca.status, ca.created_at,
    (SELECT COUNT(*) FROM clicks c JOIN referral_links l ON l.id = c.link_id WHERE l.campaign_id = ca.id) AS clicks,
    (SELECT COUNT(*) FROM signups s JOIN referral_links l ON l.id = s.link_id WHERE l.campaign_id = ca.id) AS signups
  FROM campaigns ca`;

function shapeCampaign(r: RowDataPacket) {
  const clicks = Number(r.clicks);
  const signups = Number(r.signups);
  const rewardAmount = Number(r.reward_amount);
  return {
    id: r.id, name: r.name, description: r.description, status: r.status, createdAt: r.created_at,
    rewardAmount, clicks, signups,
    conversionRate: conversionRate(clicks, signups),
    totalReward: totalReward(signups, rewardAmount),
  };
}

async function getOwnedCampaign(id: number, userId: number) {
  const [rows] = await pool.query<RowDataPacket[]>(`${CAMPAIGN_SELECT} WHERE ca.id = ? AND ca.user_id = ?`, [id, userId]);
  if (!rows[0]) throw new HttpError(404, "Campaign not found");
  return shapeCampaign(rows[0]);
}

const createSchema = z.object({
  name: z.string().min(1, "Name is required").max(150),
  description: z.string().max(1000).optional().default(""),
  rewardAmount: z.number().min(0, "Reward cannot be negative").max(100000),
});
const statusSchema = z.object({ status: z.enum(["active", "paused"]) });
const linkSchema = z.object({ label: z.string().max(100).optional() });

campaignsRouter.get(
  "/",
  wrap(async (req, res) => {
    const { userId } = req as AuthedRequest;
    const [rows] = await pool.query<RowDataPacket[]>(`${CAMPAIGN_SELECT} WHERE ca.user_id = ? ORDER BY ca.created_at DESC`, [userId]);
    const campaigns = rows.map(shapeCampaign);
    const summary = campaigns.reduce(
      (a, c) => ({ clicks: a.clicks + c.clicks, signups: a.signups + c.signups, totalReward: a.totalReward + c.totalReward }),
      { clicks: 0, signups: 0, totalReward: 0 }
    );
    res.json({ campaigns, summary: { ...summary, conversionRate: conversionRate(summary.clicks, summary.signups) } });
  })
);

campaignsRouter.post(
  "/",
  wrap(async (req, res) => {
    const { userId } = req as AuthedRequest;
    const body = createSchema.parse(req.body);
    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO campaigns (user_id, name, description, reward_amount) VALUES (?, ?, ?, ?)",
      [userId, body.name, body.description, body.rewardAmount]
    );
    res.status(201).json(await getOwnedCampaign(result.insertId, userId));
  })
);

campaignsRouter.get(
  "/:id",
  wrap(async (req, res) => {
    const { userId } = req as AuthedRequest;
    const id = Number(req.params.id);
    const campaign = await getOwnedCampaign(id, userId);
    const [links] = await pool.query<RowDataPacket[]>(
      `SELECT l.id, l.code, l.label, l.created_at AS createdAt,
        (SELECT COUNT(*) FROM clicks c WHERE c.link_id = l.id) AS clicks,
        (SELECT COUNT(*) FROM signups s WHERE s.link_id = l.id) AS signups
       FROM referral_links l WHERE l.campaign_id = ? ORDER BY l.created_at DESC`,
      [id]
    );
    const [recent] = await pool.query<RowDataPacket[]>(
      `SELECT s.name, s.email, s.reward_amount AS rewardAmount, s.created_at AS createdAt, l.code
       FROM signups s JOIN referral_links l ON l.id = s.link_id
       WHERE l.campaign_id = ? ORDER BY s.created_at DESC LIMIT 20`,
      [id]
    );
    res.json({
      campaign,
      links: links.map((l) => ({ ...l, clicks: Number(l.clicks), signups: Number(l.signups) })),
      recentSignups: recent.map((s) => ({ ...s, rewardAmount: Number(s.rewardAmount) })),
    });
  })
);

campaignsRouter.patch(
  "/:id",
  wrap(async (req, res) => {
    const { userId } = req as AuthedRequest;
    const id = Number(req.params.id);
    const { status } = statusSchema.parse(req.body);
    await getOwnedCampaign(id, userId);
    await pool.query("UPDATE campaigns SET status = ? WHERE id = ?", [status, id]);
    res.json(await getOwnedCampaign(id, userId));
  })
);

campaignsRouter.post(
  "/:id/links",
  wrap(async (req, res) => {
    const { userId } = req as AuthedRequest;
    const id = Number(req.params.id);
    const { label } = linkSchema.parse(req.body);
    await getOwnedCampaign(id, userId);
    for (let attempt = 0; attempt < 3; attempt++) {
      const code = generateCode();
      try {
        const [result] = await pool.query<ResultSetHeader>(
          "INSERT INTO referral_links (campaign_id, code, label) VALUES (?, ?, ?)",
          [id, code, label ?? null]
        );
        return res.status(201).json({ id: result.insertId, code, label: label ?? null, clicks: 0, signups: 0 });
      } catch (e) {
        if (!isDuplicateKey(e)) throw e; // code collision: retry with a new code
      }
    }
    throw new HttpError(500, "Could not generate a unique referral code");
  })
);
