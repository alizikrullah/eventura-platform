import type { UpdatePasswordPayload } from "../types/auth";
import type { User } from "../types/user";
import { api } from "../utils/api";
import { getApiErrorMessage } from "../utils/apiError";

interface AvailableDiscountsResponse {
  success: boolean;
  data: {
    points: {
      total_points: number;
    };
  };
}

export interface PointHistoryItem {
  id: number;
  amount: number;
  amount_remaining: number;
  source: "purchase_reward" | "referral_reward";
  created_at: string;
  expired_at: string;
}

export interface CouponHistoryItem {
  id: number;
  created_at: string;
  expired_at: string;
  is_used: boolean;
  used_at: string | null;
  coupon: {
    code: string;
    discount_type: "percentage" | "fixed";
    discount_value: number;
  };
}

export interface RewardsHistoryResponse {
  points: {
    items: PointHistoryItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  coupons: {
    items: CouponHistoryItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export const userService = {
  async getMe() {
    try {
      const response = await api.get<{ user: User }>("/users/me");
      return response.data.user;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, "Gagal memuat profil"));
    }
  },
  async updateProfile(payload: { name: string; phone?: string }) {
    try {
      const response = await api.patch<{ user: User }>("/users/me", payload);
      return response.data.user;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, "Gagal memperbarui profil"));
    }
  },
  async updatePassword(payload: UpdatePasswordPayload) {
    try {
      const response = await api.patch<{ message: string }>(
        "/users/me/password",
        payload,
      );
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, "Gagal memperbarui password"));
    }
  },
  async updateProfilePhoto(formData: FormData) {
    try {
      const response = await api.patch<{ user: User }>(
        "/users/me/photo",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      return response.data.user;
    } catch (error) {
      throw new Error(
        getApiErrorMessage(error, "Gagal memperbarui foto profil"),
      );
    }
  },
  async getAvailablePoints() {
    try {
      const response = await api.get<AvailableDiscountsResponse>(
        "/transactions/discounts",
      );
      return response.data.data.points.total_points;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, "Gagal memuat poin pengguna"));
    }
  },
  async getRewardsHistory(params?: {
    pointsPage?: number;
    pointsLimit?: number;
    couponsPage?: number;
    couponsLimit?: number;
  }) {
    try {
      const response = await api.get<{ data: RewardsHistoryResponse }>(
        "/users/me/history",
        {
          params: {
            points_page: params?.pointsPage,
            points_limit: params?.pointsLimit,
            coupons_page: params?.couponsPage,
            coupons_limit: params?.couponsLimit,
          },
        },
      );
      return response.data.data;
    } catch (error) {
      throw new Error(
        getApiErrorMessage(error, "Gagal memuat riwayat kupon dan poin"),
      );
    }
  },
};
