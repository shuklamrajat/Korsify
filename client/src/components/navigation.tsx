import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { User } from "@shared/schema";
import { 
  GraduationCap, 
  Menu, 
  User as UserIcon, 
  Settings, 
  LogOut, 
  BookOpen, 
  PlusCircle, 
  BarChart3,
  Search,
  Bell,
  HelpCircle
} from "lucide-react";

export default function Navigation() {
  const [, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fetch user data
  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const navigationItems = [
    {
      label: "Features",
      href: "#features",
      action: () => {
        const element = document.getElementById('features');
        element?.scrollIntoView({ behavior: 'smooth' });
      }
    },
    {
      label: "How It Works",
      href: "#how-it-works",
      action: () => {
        const element = document.getElementById('how-it-works');
        element?.scrollIntoView({ behavior: 'smooth' });
      }
    },
    {
      label: "Pricing",
      href: "#pricing",
      action: () => {
        const element = document.getElementById('pricing');
        element?.scrollIntoView({ behavior: 'smooth' });
      }
    },
  ];

  const userMenuItems = user ? [
    {
      label: user.userType === 'creator' ? 'Creator Dashboard' : 'Learner Dashboard',
      icon: BookOpen,
      action: () => setLocation(user.userType === 'creator' ? '/creator' : '/learner'),
    },
    {
      label: 'Browse Courses',
      icon: Search,
      action: () => setLocation('/learner'),
    },
    {
      label: 'Analytics',
      icon: BarChart3,
      action: () => setLocation('/analytics'),
    },
  ] : [];

  const handleSignIn = () => {
    setLocation('/login');
  };

  const handleGetStarted = () => {
    setLocation('/login');
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      // Refresh the page to clear user state
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setLocation('/')}>
            <div className="w-10 h-10 bg-gradient-to-r from-primary to-purple-600 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">Korsify</span>
            <Badge variant="secondary" className="bg-primary/10 text-primary text-xs px-2 py-1">
              AI-Powered
            </Badge>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                className="text-gray-600 hover:text-primary transition-colors font-medium"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                {/* Notifications */}
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </Button>

                {/* Create Course Button for Creators */}
                {user.userType === 'creator' && (
                  <Button
                    size="sm"
                    onClick={() => setLocation('/creator')}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Create Course
                  </Button>
                )}

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.profileImageUrl || undefined} alt={user.firstName || 'User'} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {user.firstName?.charAt(0) || user.email?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    {userMenuItems.map((item) => (
                      <DropdownMenuItem key={item.label} onClick={item.action}>
                        <item.icon className="mr-2 h-4 w-4" />
                        <span>{item.label}</span>
                      </DropdownMenuItem>
                    ))}
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem>
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <HelpCircle className="mr-2 h-4 w-4" />
                      <span>Help</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Button variant="ghost" onClick={handleSignIn}>
                  Sign In
                </Button>
                <Button onClick={handleGetStarted}>
                  Get Started Free
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-primary to-purple-600 rounded-lg flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-white" />
                    </div>
                    <span>Korsify</span>
                  </SheetTitle>
                  <SheetDescription>
                    AI-powered educational platform
                  </SheetDescription>
                </SheetHeader>

                <div className="mt-8 space-y-4">
                  {/* Navigation Items */}
                  <div className="space-y-2">
                    {navigationItems.map((item) => (
                      <Button
                        key={item.label}
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => {
                          item.action();
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        {item.label}
                      </Button>
                    ))}
                  </div>

                  {/* User Section */}
                  {user ? (
                    <div className="pt-4 border-t">
                      <div className="flex items-center space-x-3 mb-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.profileImageUrl || undefined} alt={user.firstName || 'User'} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {user.firstName?.charAt(0) || user.email?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {userMenuItems.map((item) => (
                          <Button
                            key={item.label}
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => {
                              item.action();
                              setIsMobileMenuOpen(false);
                            }}
                          >
                            <item.icon className="mr-2 h-4 w-4" />
                            {item.label}
                          </Button>
                        ))}
                        
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => {
                            handleSignOut();
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Sign out
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-4 border-t space-y-2">
                      <Button
                        variant="ghost"
                        className="w-full"
                        onClick={() => {
                          handleSignIn();
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        Sign In
                      </Button>
                      <Button
                        className="w-full"
                        onClick={() => {
                          handleGetStarted();
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        Get Started Free
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
