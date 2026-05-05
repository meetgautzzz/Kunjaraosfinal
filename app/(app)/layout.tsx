import Sidebar from "@/components/ui/Sidebar";
import Topbar from "@/components/ui/Topbar";
import AtlasXPanel from "@/components/ui/AtlasXPanel";
import { CreditsProvider } from "@/components/credits/useCredits";
import BuyCreditsModal from "@/components/credits/BuyCreditsModal";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CreditsProvider>
      <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-base)" }}>
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-5 lg:p-6">{children}</main>
        </div>
      </div>
      <AtlasXPanel />
      <BuyCreditsModal />
    </CreditsProvider>
  );
}
