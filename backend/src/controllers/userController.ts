import { Request, Response } from "express";
import type { User } from "@prisma/client";
import * as userService from "../services/userService";

type UserRequest = Request & { user?: User };

export async function getMe(req: UserRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const user = await userService.getMe(req.user.id);
    return res.json({ user });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Bad Request" });
  }
}

export async function updateMe(req: UserRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const user = await userService.updateMe(req.user.id, req.body);
    return res.json({ user });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Bad Request" });
  }
}

export async function updateMyPassword(req: UserRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const { currentPassword, newPassword } = req.body;
    const result = await userService.updateMyPassword(
      req.user.id,
      currentPassword,
      newPassword,
    );
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Bad Request" });
  }
}

export async function updateMyPhoto(req: UserRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const user = await userService.updateMyPhoto(req.user.id, req.file);
    return res.json({ user });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Bad Request" });
  }
}

export async function getMyRewardsHistory(req: UserRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const toPositiveNumber = (value: unknown, fallback: number) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) && parsed > 0
        ? Math.floor(parsed)
        : fallback;
    };

    const data = await userService.getMyRewardsHistory(req.user.id, {
      pointsPage: toPositiveNumber(req.query.points_page, 1),
      pointsLimit: Math.min(toPositiveNumber(req.query.points_limit, 5), 20),
      couponsPage: toPositiveNumber(req.query.coupons_page, 1),
      couponsLimit: Math.min(toPositiveNumber(req.query.coupons_limit, 5), 20),
    });

    return res.json({ data });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Bad Request" });
  }
}
