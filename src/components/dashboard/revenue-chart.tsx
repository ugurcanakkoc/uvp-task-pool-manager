"use client"

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const data = [
    { name: "Pzt", total: 12 },
    { name: "Sal", total: 18 },
    { name: "Çar", total: 15 },
    { name: "Per", total: 25 },
    { name: "Cum", total: 20 },
    { name: "Cmt", total: 32 },
    { name: "Paz", total: 28 },
]

export function RevenueChart() {
    return (
        <Card className="col-span-4 rounded-[20px] border-none shadow-[0px_18px_40px_rgba(112,144,176,0.12)] bg-white dark:bg-slate-900">
            <CardHeader>
                <CardTitle className="text-lg font-bold text-slate-800 dark:text-white">
                    Haftalık Görev Tamamlama
                </CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4318FF" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#4318FF" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="name"
                            stroke="#A3AED0"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#A3AED0"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#fff',
                                borderRadius: '12px',
                                border: 'none',
                                boxShadow: '0px 10px 20px rgba(0,0,0,0.1)'
                            }}
                        />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E5F2" />
                        <Area
                            type="monotone"
                            dataKey="total"
                            stroke="#4318FF"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorTotal)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
