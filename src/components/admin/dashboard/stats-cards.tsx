import { DollarSign, Users, CreditCard, Activity } from 'lucide-react';

const StatCard = ({ title, value, change, icon, delay }: { title: string, value: string, change: string, icon: React.ReactNode, delay: string }) => (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm glassmorphism animate-slide-in-up" style={{ animationDelay: delay }}>
        <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium tracking-tight">{title}</h3>
            {icon}
        </div>
        <div className="p-6 pt-0">
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{change}</p>
        </div>
    </div>
)

export function StatsCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <StatCard 
            title="Total Revenue" 
            value="$45,231.89" 
            change="+20.1% from last month"
            icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
            delay="100ms"
        />
        <StatCard 
            title="Customers" 
            value="+2350" 
            change="+180.1% from last month"
            icon={<Users className="h-4 w-4 text-muted-foreground" />}
            delay="200ms"
        />
        <StatCard 
            title="Sales" 
            value="+12,234" 
            change="+19% from last month"
            icon={<CreditCard className="h-4 w-4 text-muted-foreground" />}
            delay="300ms"
        />
        <StatCard 
            title="Active Now" 
            value="+573" 
            change="+201 since last hour"
            icon={<Activity className="h-4 w-4 text-muted-foreground" />}
            delay="400ms"
        />
    </div>
  );
}
