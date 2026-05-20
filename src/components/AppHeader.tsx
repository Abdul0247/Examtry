import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { BookOpen, Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";

export function AppHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { session } = useSession();
  const isHome = location.pathname === "/";

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <BookOpen className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground">ExamHub</span>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {session ? (
            <>
              <Button variant="ghost" asChild><Link to="/dashboard">Dashboard</Link></Button>
              <Button variant="ghost" onClick={signOut}>
                <LogOut className="h-4 w-4" />Sign out
              </Button>
            </>
          ) : isHome ? (
            <>
              <Button variant="ghost" asChild><Link to="/student-login">Take an Exam</Link></Button>
              <Button asChild><Link to="/auth">Teacher Sign In</Link></Button>
            </>
          ) : (
            <Button variant="ghost" asChild><Link to="/">Home</Link></Button>
          )}
        </nav>

        <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-background px-4 py-3 md:hidden">
          <div className="flex flex-col gap-2">
            {session ? (
              <>
                <Button variant="ghost" className="justify-start" asChild>
                  <Link to="/dashboard" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                </Button>
                <Button variant="ghost" className="justify-start" onClick={signOut}>
                  <LogOut className="h-4 w-4" />Sign out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" className="justify-start" asChild>
                  <Link to="/student-login" onClick={() => setMobileOpen(false)}>Take an Exam</Link>
                </Button>
                <Button className="justify-start" asChild>
                  <Link to="/auth" onClick={() => setMobileOpen(false)}>Teacher Sign In</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
