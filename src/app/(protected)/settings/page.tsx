import { ThemeToggle } from "@/components/theme-toggle";

export default function SettingsPage() {
  return (
    <>
      <h1 className="text-3xl font-headline font-bold animate-slide-in-up">
        Settings
      </h1>
      <div className="grid gap-4">
        <div
          className="border rounded-lg bg-card text-card-foreground shadow-sm glassmorphism animate-slide-in-up"
          style={{ animationDelay: "200ms" }}
        >
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="text-2xl font-semibold leading-none tracking-tight font-headline">
              Profile
            </h3>
            <p className="text-sm text-muted-foreground">
              Update your personal information.
            </p>
          </div>
          <div className="p-6 pt-0">
            <form className="space-y-4 max-w-md">
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="text-sm font-medium leading-none"
                >
                  Name
                </label>
                <input
                  id="name"
                  defaultValue="Admin User"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium leading-none"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  defaultValue="admin@pachabhoomi.com"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm"
                />
              </div>
            </form>
          </div>
          <div className="flex items-center p-6 pt-0 border-t mt-6 py-4">
            <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
              Save Profile
            </button>
          </div>
        </div>

        <div
          className="border rounded-lg bg-card text-card-foreground shadow-sm glassmorphism animate-slide-in-up"
          style={{ animationDelay: "300ms" }}
        >
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="text-2xl font-semibold leading-none tracking-tight font-headline">
              Appearance
            </h3>
            <p className="text-sm text-muted-foreground">
              Customize the look and feel of the application.
            </p>
          </div>
          <div className="p-6 pt-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Theme</h3>
                <p className="text-sm text-muted-foreground">
                  Select a theme for the dashboard.
                </p>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
