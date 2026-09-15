import { prisma } from "@/lib/prisma";

export const FREE_MONTHLY_VIDEO_LIMIT = 3;

export async function canRenderAnotherVideo(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { allowed: false, reason: "User not found." };
  if (user.plan === "pro") return { allowed: true };

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const count = await prisma.project.count({
    where: {
      userId,
      status: "ready",
      updatedAt: { gte: startOfMonth },
    },
  });

  if (count >= FREE_MONTHLY_VIDEO_LIMIT) {
    return {
      allowed: false,
      reason: `You've used all ${FREE_MONTHLY_VIDEO_LIMIT} free videos this month. Upgrade to Pro for unlimited videos.`,
    };
  }
  return { allowed: true };
}
