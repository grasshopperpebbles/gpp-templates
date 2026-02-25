import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";

// Example data - replace with your own data source
const stats = [
  { label: "Total Items", value: "1,234", change: "+12%" },
  { label: "Active Users", value: "567", change: "+5%" },
  { label: "Completed", value: "89%", change: "+2%" },
  { label: "Pending", value: "23", change: "-8%" },
];

const recentActivity = [
  { id: 1, action: "Created new item", user: "John", time: "2 min ago" },
  { id: 2, action: "Updated settings", user: "Jane", time: "5 min ago" },
  { id: 3, action: "Exported data", user: "Bob", time: "1 hour ago" },
  { id: 4, action: "Added comment", user: "Alice", time: "2 hours ago" },
];

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Dashboard"
        description="Overview of your application"
        actions={
          <Button>Create New</Button>
        }
      />

      {/* Stats Grid */}
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <Badge variant={stat.change.startsWith("+") ? "success" : "secondary"}>
                {stat.change}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Grid */}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions in your app</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between border-b border-zinc-100 pb-3 last:border-0 dark:border-zinc-800"
                >
                  <div>
                    <p className="text-sm font-medium">{item.action}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      by {item.user}
                    </p>
                  </div>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {item.time}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks you can perform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <Button variant="outline" className="justify-start">
                Create new item
              </Button>
              <Button variant="outline" className="justify-start">
                Import data
              </Button>
              <Button variant="outline" className="justify-start">
                Export report
              </Button>
              <Button variant="outline" className="justify-start">
                View analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
