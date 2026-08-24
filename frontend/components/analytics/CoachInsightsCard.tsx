"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Sparkles,
  Flame,
  TrendingUp,
  Scale,
  Shield,
  Target,
  Dumbbell,
  ArrowRight,
  ChevronRight,
  Lightbulb,
} from "lucide-react";
import { apiClient } from "../../lib/api";

export interface CoachInsight {
  id: string;
  type: "PROGRESSION" | "RECOVERY" | "BALANCE" | "CONSISTENCY" | "GOAL_TIP";
  title: string;
  message: string;
  actionText?: string;
  actionHref?: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  categoryIcon: "flame" | "trending-up" | "scale" | "shield" | "target" | "dumbbell";
  badge?: string;
}

export function CoachInsightsCard() {
  const { data: insights, isLoading } = useQuery<CoachInsight[]>({
    queryKey: ["coachInsights"],
    queryFn: async () => {
      const { data } = await apiClient.get("/analytics/insights");
      return data;
    },
  });

  if (isLoading || !insights || insights.length === 0) {
    return null;
  }

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "flame":
        return <Flame size={18} className="text-tag-red-text" />;
      case "trending-up":
        return <TrendingUp size={18} className="text-tag-green-text" />;
      case "scale":
        return <Scale size={18} className="text-tag-yellow-text" />;
      case "shield":
        return <Shield size={18} className="text-tag-blue-text" />;
      case "dumbbell":
        return <Dumbbell size={18} className="text-primary" />;
      case "target":
      default:
        return <Target size={18} className="text-primary" />;
    }
  };

  const getBadgeClass = (type: string) => {
    switch (type) {
      case "PROGRESSION":
        return "bg-tag-green-bg text-tag-green-text border-tag-green-text/20";
      case "CONSISTENCY":
        return "bg-tag-red-bg text-tag-red-text border-tag-red-text/20";
      case "BALANCE":
        return "bg-tag-yellow-bg text-tag-yellow-text border-tag-yellow-text/20";
      case "RECOVERY":
        return "bg-tag-blue-bg text-tag-blue-text border-tag-blue-text/20";
      case "GOAL_TIP":
      default:
        return "bg-primary/10 text-primary border-primary/20";
    }
  };

  return (
    <section className="bg-surface border border-border rounded-3xl p-5 sm:p-6 shadow-sm mb-6 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-primary/10 text-primary rounded-xl">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="font-medium text-base sm:text-lg flex items-center gap-2">
              Smart Coach Insights
            </h3>
            <p className="text-xs opacity-60">
              Personalized training & recovery advice based on your activity
            </p>
          </div>
        </div>
      </div>

      {/* Insights List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className="p-4 bg-background/60 border border-border/80 rounded-2xl flex flex-col justify-between hover:border-primary/40 transition-all group"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-surface border border-border rounded-lg">
                    {getIcon(insight.categoryIcon)}
                  </div>
                  <h4 className="font-semibold text-sm line-clamp-1">
                    {insight.title}
                  </h4>
                </div>

                {insight.badge && (
                  <span
                    className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md border ${getBadgeClass(
                      insight.type
                    )}`}
                  >
                    {insight.badge}
                  </span>
                )}
              </div>

              <p className="text-xs opacity-75 leading-relaxed mb-3">
                {insight.message}
              </p>
            </div>

            {insight.actionText && insight.actionHref && (
              <div className="pt-2 border-t border-border/40 mt-auto flex items-center justify-between">
                <Link
                  href={insight.actionHref}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline group-hover:translate-x-0.5 transition-transform"
                >
                  <span>{insight.actionText}</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
