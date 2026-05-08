import React from 'react';
import { 
  LayoutDashboard, 
  ArrowRightLeft, 
  Wallet, 
  Users, 
  BarChart3, 
  Settings,
  Utensils,
  ShoppingBag,
  Bus,
  Heart,
  Laptop,
  Phone,
  Zap,
  Home,
  GraduationCap,
  X
} from 'lucide-react';

const icons = {
  LayoutDashboard,
  ArrowRightLeft,
  Wallet,
  Users,
  BarChart3,
  Settings,
  Utensils,
  ShoppingBag,
  Bus,
  Heart,
  Laptop,
  Phone,
  Zap,
  Home,
  GraduationCap,
  X
};

export const Icon = ({ name, ...props }: { name: string; [key: string]: any }) => {
  const LucideIcon = (icons as any)[name] || LayoutDashboard;
  return <LucideIcon {...props} />;
};
