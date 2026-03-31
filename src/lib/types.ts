import { z } from "zod";

export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  createdAt: z.string().optional(),
  modifiedAt: z.string().optional(),
});

export type Category = z.infer<typeof categorySchema>;

export const MemberSchema = z.object({
  id: z.string(),
  name: z.string(),
  mobileNumber: z.string().optional(),
  bloodGroup: z.string().optional(),
  age: z.number().optional(),
  occupation: z.string().optional(),
  educationQualification: z.string().optional(),
  rationCardType: z.string().optional(),
  disease: z.string().optional(),
  schemes: z.array(z.string()).default([]),
  others: z.string().optional(),
  images: z.array(z.string()).default([]),
  createdAt: z.string(),
  categoryId: z.string().nullable(),
});

export type Member = z.infer<typeof MemberSchema>;

export type Order = {
  id: string;
  customer: {
    name: string;
    email: string;
  };
  date: string;
  createdAt: string;
  status: "Processing" | "Shipped" | "Delivered" | "Cancelled";
  total: number;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  totalSpent: number;
  orders: number;
  createdAt: string;
};

export type Promotion = {
  id: string;
  code: string;
  type: "Percentage" | "Fixed Amount" | "Free Shipping";
  value: string;
  status: "Active" | "Expired" | "Scheduled";
  startDate: string;
  endDate: string;
};
