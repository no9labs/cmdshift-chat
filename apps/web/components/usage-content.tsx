"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  BarChart3,
  MessageSquare,
  Zap,
  DollarSign,
  TrendingUp,
  Calendar,
  Clock,
  Download,
  RefreshCw,
} from "lucide-react"

// Mock data
const statsData = {
  messages: {
    current: 1247,
    limit: 2000,
    change: +12.5,
  },
  tokens: {
    current: 156780,
    limit: 250000,
    change: +8.3,
  },
  cost: {
    current: 24.67,
    limit: 50.0,
    change: +15.2,
  },
}

const modelUsageData = [
  { name: "GPT-4", usage: 45, color: "#3A4D6F" },
  { name: "GPT-3.5", usage: 30, color: "#7A7A7A" },
  { name: "Claude", usage: 15, color: "#EAE8E2" },
  { name: "Others", usage: 10, color: "#C84A4A" },
]

const activityData = [
  { date: "Jan 1", messages: 45 },
  { date: "Jan 2", messages: 52 },
  { date: "Jan 3", messages: 38 },
  { date: "Jan 4", messages: 61 },
  { date: "Jan 5", messages: 55 },
  { date: "Jan 6", messages: 67 },
  { date: "Jan 7", messages: 43 },
  { date: "Jan 8", messages: 58 },
  { date: "Jan 9", messages: 72 },
  { date: "Jan 10", messages: 49 },
  { date: "Jan 11", messages: 63 },
  { date: "Jan 12", messages: 71 },
  { date: "Jan 13", messages: 56 },
  { date: "Jan 14", messages: 68 },
]

const recentConversations = [
  {
    id: "1",
    title: "React Component Architecture",
    model: "GPT-4",
    messages: 23,
    tokens: 4567,
    cost: 0.89,
    date: "2024-01-14",
    time: "2:34 PM",
  },
  {
    id: "2",
    title: "Database Design Patterns",
    model: "Claude",
    messages: 18,
    tokens: 3421,
    cost: 0.65,
    date: "2024-01-14",
    time: "11:22 AM",
  },
  {
    id: "3",
    title: "API Security Best Practices",
    model: "GPT-4",
    messages: 31,
    tokens: 5892,
    cost: 1.12,
    date: "2024-01-13",
    time: "4:15 PM",
  },
  {
    id: "4",
    title: "CSS Grid vs Flexbox",
    model: "GPT-3.5",
    messages: 15,
    tokens: 2134,
    cost: 0.34,
    date: "2024-01-13",
    time: "9:45 AM",
  },
  {
    id: "5",
    title: "Machine Learning Basics",
    model: "GPT-4",
    messages: 42,
    tokens: 7823,
    cost: 1.45,
    date: "2024-01-12",
    time: "3:20 PM",
  },
]

export function UsageContent() {
  const [timeRange, setTimeRange] = useState("7d")

  const maxActivity = Math.max(...activityData.map((d) => d.messages))

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="p-6 bg-white dark:bg-gray-900 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">Usage & Analytics</h1>
            <p className="text-base text-zinc-500 dark:text-zinc-400 mt-1">
              Monitor your CmdShift usage and performance
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32 border-zinc-200 dark:border-zinc-600 focus:border-[#3A4D6F] focus:ring-[#3A4D6F] bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              className="border-zinc-200 dark:border-zinc-600 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 bg-transparent"
            >
              <RefreshCw className="size-4" />
            </Button>
            <Button
              variant="outline"
              className="border-zinc-200 dark:border-zinc-600 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 bg-transparent"
            >
              <Download className="size-4 mr-2" />
              Export
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Stats Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Messages Card */}
            <Card className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-[#3A4D6F]/20 dark:hover:border-[#3A4D6F]/30 transition-colors duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="size-5 text-zinc-900 dark:text-gray-300" />
                      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Messages</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-semibold text-zinc-900 dark:text-white">
                        {statsData.messages.current.toLocaleString()}
                      </p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        of {statsData.messages.limit.toLocaleString()} limit
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-green-600">
                      <TrendingUp className="size-4" />
                      <span className="text-sm font-medium">+{statsData.messages.change}%</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
                    <div
                      className="bg-zinc-900 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(statsData.messages.current / statsData.messages.limit) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tokens Card */}
            <Card className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-[#3A4D6F]/20 dark:hover:border-[#3A4D6F]/30 transition-colors duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="size-5 text-zinc-900 dark:text-gray-300" />
                      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Tokens</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-semibold text-zinc-900 dark:text-white">
                        {statsData.tokens.current.toLocaleString()}
                      </p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        of {statsData.tokens.limit.toLocaleString()} limit
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-green-600">
                      <TrendingUp className="size-4" />
                      <span className="text-sm font-medium">+{statsData.tokens.change}%</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
                    <div
                      className="bg-zinc-900 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(statsData.tokens.current / statsData.tokens.limit) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cost Card */}
            <Card className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-[#3A4D6F]/20 dark:hover:border-[#3A4D6F]/30 transition-colors duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="size-5 text-zinc-900 dark:text-gray-300" />
                      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Cost</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-semibold text-zinc-900 dark:text-white">
                        ${statsData.cost.current.toFixed(2)}
                      </p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        of ${statsData.cost.limit.toFixed(2)} budget
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-green-600">
                      <TrendingUp className="size-4" />
                      <span className="text-sm font-medium">+{statsData.cost.change}%</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
                    <div
                      className="bg-zinc-900 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(statsData.cost.current / statsData.cost.limit) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Model Usage Pie Chart */}
            <Card className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-[#3A4D6F]/20 dark:hover:border-[#3A4D6F]/30 transition-colors duration-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="size-5 text-zinc-900 dark:text-gray-300" />
                  Model Usage Distribution
                </CardTitle>
                <CardDescription className="text-zinc-500 dark:text-zinc-400">
                  Breakdown of usage by AI model
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center mb-6">
                  <div className="relative size-48">
                    <svg className="size-48 transform -rotate-90" viewBox="0 0 100 100">
                      {/* Background circle */}
                      <circle cx="50" cy="50" r="15.915" fill="transparent" stroke="#F8F6F2" strokeWidth="3" />
                      {modelUsageData.map((item, index) => {
                        const prevSum = modelUsageData.slice(0, index).reduce((sum, d) => sum + d.usage, 0)
                        const strokeDasharray = `${item.usage} ${100 - item.usage}`
                        const strokeDashoffset = -prevSum
                        return (
                          <circle
                            key={item.name}
                            cx="50"
                            cy="50"
                            r="15.915"
                            fill="transparent"
                            stroke={item.color}
                            strokeWidth="3"
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            className="transition-all duration-500 ease-in-out hover:stroke-opacity-80"
                            style={{ filter: "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.05))" }}
                          />
                        )
                      })}
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center bg-white dark:bg-zinc-950 rounded-full p-3 shadow-sm border border-zinc-200 dark:border-zinc-800">
                        <div className="text-xl font-semibold text-zinc-900 dark:text-white">Total</div>
                        <div className="text-sm text-zinc-500 dark:text-zinc-400">Usage</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  {modelUsageData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="size-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="font-medium text-zinc-900 dark:text-white">{item.name}</span>
                      </div>
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">{item.usage}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Activity Line Graph */}
            <Card className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-[#3A4D6F]/20 dark:hover:border-[#3A4D6F]/30 transition-colors duration-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="size-5 text-zinc-900 dark:text-gray-300" />
                  Daily Activity
                </CardTitle>
                <CardDescription className="text-zinc-500 dark:text-zinc-400">
                  Messages sent over the last 14 days
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-hidden">
                <div className="h-48 flex items-end justify-between gap-0.5 sm:gap-1 mb-4 px-1">
                  {activityData.map((item, index) => (
                    <div key={index} className="flex flex-col items-center gap-1 sm:gap-2 flex-1 min-w-0">
                      <div
                        className="bg-zinc-900 rounded-t-sm transition-all duration-300 hover:bg-zinc-900/80 w-full min-h-[4px] max-w-full"
                        style={{ height: `${(item.messages / maxActivity) * 160}px` }}
                        title={`${item.date}: ${item.messages} messages`}
                      ></div>
                      <span className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 transform rotate-45 origin-left whitespace-nowrap truncate max-w-full overflow-hidden">
                        {item.date.split(" ")[1]}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 px-1">
                  <span className="truncate">Peak: {maxActivity}</span>
                  <span className="truncate">
                    Avg: {Math.round(activityData.reduce((sum, d) => sum + d.messages, 0) / activityData.length)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Conversations Table */}
          <Card className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-[#3A4D6F]/20 dark:hover:border-[#3A4D6F]/30 transition-colors duration-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="size-5 text-zinc-900 dark:text-gray-300" />
                Recent Conversations
              </CardTitle>
              <CardDescription className="text-zinc-500 dark:text-zinc-400">
                Your most recent chat sessions and their usage metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-200 dark:border-zinc-800">
                    <TableHead className="text-zinc-900 dark:text-white font-medium">Conversation</TableHead>
                    <TableHead className="text-zinc-900 dark:text-white font-medium">Model</TableHead>
                    <TableHead className="text-zinc-900 dark:text-white font-medium">Messages</TableHead>
                    <TableHead className="text-zinc-900 dark:text-white font-medium">Tokens</TableHead>
                    <TableHead className="text-zinc-900 dark:text-white font-medium">Cost</TableHead>
                    <TableHead className="text-zinc-900 dark:text-white font-medium">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentConversations.map((conversation) => (
                    <TableRow
                      key={conversation.id}
                      className="border-zinc-200 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-700/50"
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium text-zinc-900 dark:text-white">{conversation.title}</div>
                          <div className="text-sm text-zinc-500 dark:text-zinc-400">ID: {conversation.id}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700"
                        >
                          {conversation.model}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-zinc-900 dark:text-white">{conversation.messages}</TableCell>
                      <TableCell className="text-zinc-900 dark:text-white">
                        {conversation.tokens.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-zinc-900 dark:text-white">${conversation.cost.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="text-zinc-900 dark:text-white">
                          <div className="flex items-center gap-1">
                            <Calendar className="size-3 text-zinc-500 dark:text-zinc-400" />
                            {conversation.date}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400">
                            <Clock className="size-3" />
                            {conversation.time}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
