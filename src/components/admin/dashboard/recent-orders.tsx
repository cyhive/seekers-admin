import Image from 'next/image';
import { orders } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export function RecentOrders() {
    const userAvatar = PlaceHolderImages.find(img => img.id === 'user-avatar-2');

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm glassmorphism animate-slide-in-up" style={{ animationDelay: '600ms' }}>
      <div className="flex flex-col space-y-1.5 p-6">
        <h3 className="text-2xl font-semibold leading-none tracking-tight font-headline">Recent Sales</h3>
        <p className="text-sm text-muted-foreground">You made 265 sales this month.</p>
      </div>
      <div className="p-6 pt-0">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Customer</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Amount</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {orders.slice(0, 5).map((order) => (
                <tr key={order.id} className="border-b transition-colors hover:bg-muted/50">
                  <td className="p-4 align-middle">
                    <div className="flex items-center gap-3">
                      {userAvatar && <Image
                          src={userAvatar.imageUrl}
                          alt="User avatar"
                          width={32}
                          height={32}
                          className="rounded-full"
                          data-ai-hint={userAvatar.imageHint}
                      />}
                      <div>
                          <div className="font-medium">{order.customer.name}</div>
                          <div className="text-sm text-muted-foreground">{order.customer.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${order.status === 'Delivered' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>{order.status}</div>
                  </td>
                  <td className="p-4 align-middle text-right">${order.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
