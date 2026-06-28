import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PusherProvider from "@/components/layout/PusherProvider";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PusherProvider>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </PusherProvider>
  );
}
