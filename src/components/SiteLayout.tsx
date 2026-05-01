import { Outlet } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const SiteLayout = () => (
  <div className="min-h-screen bg-background text-foreground flex flex-col">
    <SiteHeader />
    <main className="flex-1">
      <Outlet />
    </main>
    <SiteFooter />
  </div>
);

export default SiteLayout;