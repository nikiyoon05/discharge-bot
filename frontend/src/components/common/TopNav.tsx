import { Bell, Settings, Moon, Sun, User, LogOut } from 'lucide-react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { themeState, notificationState, authUserState } from '@/store/atoms';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function TopNav() {
  const [theme, setTheme] = useRecoilState(themeState);
  const notifications = useRecoilValue(notificationState);
  const authUser = useRecoilValue(authUserState);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const totalNotifications = notifications.unreadMessages + notifications.pendingApprovals + notifications.criticalAlerts;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4">
        {/* Logo and Title */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">CE</span>
            </div>
            <div>
              <h1 className="clinical-h2 text-primary">CareExit</h1>
              <p className="text-xs text-muted-foreground">Discharge Management System</p>
            </div>
          </div>
        </div>

        {/* Center - Current Context */}
        <div className="hidden md:block">
          <div className="clinical-card bg-hospital-light border-hospital-primary/20 py-2 px-4">
            <p className="clinical-small text-hospital-primary">General Medicine Ward • Shift: Day</p>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-2">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9"
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative h-9 w-9">
            <Bell className="h-4 w-4" />
            {totalNotifications > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
              >
                {totalNotifications}
              </Badge>
            )}
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 h-9">
                <User className="h-4 w-4" />
                <span className="hidden md:block clinical-small">{authUser.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="clinical-small font-medium">{authUser.name}</p>
                <p className="text-xs text-muted-foreground">{authUser.department}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}