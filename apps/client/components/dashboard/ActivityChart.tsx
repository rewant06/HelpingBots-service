"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity } from "lucide-react";

// Veteran Fix: Move data outside component to prevent re-render loop
const data = [
  { time: "00:00", requests: 120 },
  { time: "04:00", requests: 50 },
  { time: "08:00", requests: 890 },
  { time: "12:00", requests: 2400 },
  { time: "16:00", requests: 1800 },
  { time: "20:00", requests: 450 },
  { time: "23:59", requests: 180 },
];

export function ActivityChart() {
  return (
    <Card className="glass-effect border-border/50 h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Activity className="w-4 h-4 text-primary" /> API Traffic
            </CardTitle>
            {/* Mobile-Only Badge */}
            <span className="md:hidden text-xs font-bold text-primary">24h</span>
        </div>
        <CardDescription className="text-xs">Requests across tenants</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 p-0 pb-4 pr-4">
        {/* Veteran Fix: Dynamic Height Container */}
        {/* Mobile: 180px, Desktop: 100% of parent */}
        <div className="h-[180px] md:h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="time" 
                stroke="#888888" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => value.split(':')[0]} // Show only hour on mobile
                interval="preserveStartEnd"
              />
              <YAxis 
                stroke="#888888" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value) => `${value}`} 
              />
              <Tooltip 
                contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                    padding: "8px"
                }} 
                labelStyle={{ color: "hsl(var(--muted-foreground))", marginBottom: "4px" }}
              />
              <Area 
                type="monotone" 
                dataKey="requests" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorReq)" 
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}