import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Video,
  HelpCircle,
  MessageSquare,
  Settings,
  BarChart3,
  LogOut,
  Brain,
  Image,
  Ticket
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import toast from "react-hot-toast";

const menuItems = [
  {
    title: "Dashboard",
    url: "/admin/dashboard",
    icon: LayoutDashboard,
    description: "Overview and analytics"
  },
  {
    title: "Articles",
    url: "/admin/manage-articles",
    icon: FileText,
    description: "Manage help articles"
  },
  {
    title: "Videos",
    url: "/admin/manage-videos",
    icon: Video,
    description: "Manage video tutorials"
  },
  {
    title: "Media Gallery",
    url: "/admin/media-gallery",
    icon: Image,
    description: "Manage uploaded images and videos"
  },
  {
    title: "FAQs",
    url: "/admin/manage-faqs",
    icon: HelpCircle,
    description: "Manage frequently asked questions"
  },
  {
    title: "Feedback",
    url: "/admin/manage-feedback",
    icon: MessageSquare,
    description: "User feedback and reviews"
  },
  {
    title: "Support Tickets",
    url: "/admin/manage-tickets",
    icon: Ticket,
    description: "Manage support requests"
  }
];

export const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useApp();

  const handleLogout = async () => {
    try {
      
      await logout();
      toast.success('Logged out successfully');
      // Navigate immediately after successful logout
      navigate("/", { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
      // Navigate even if logout fails to ensure user leaves admin area
      navigate("/", { replace: true });
    }
  };

  return (
    <div className="w-64 bg-card border-r border-border h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <Link to="/" className="flex items-center space-x-2">
          <Brain className="h-8 w-8 text-primary" />
          <span className="font-bold text-xl">BrainHints</span>
        </Link>
        <p className="text-sm text-muted-foreground mt-1">Admin Panel</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.url;
            return (
              <Link
                key={item.title}
                to={item.url}
                className={`group flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'}`} />
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{item.title}</span>
                  <span className={`text-xs ${isActive ? 'text-primary-foreground/80' : 'text-muted-foreground group-hover:text-foreground/80'}`}>
                    {item.description}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-3 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all duration-200 w-full"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-sm font-medium">Logout</span>
        </button>
        <Link
          to="/admin/dashboard"
          className="flex items-center gap-3 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all duration-200 text-sm"
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>Back to Admin Dashboard</span>
        </Link>
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all duration-200 text-sm"
        >
          <Brain className="h-4 w-4" />
          <span>View Help Center (Public)</span>
        </Link>
      </div>
    </div>
  );
};