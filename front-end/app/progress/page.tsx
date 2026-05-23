import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ProgressDashboard } from "@/components/ProgressDashboard";

export default function ProgressPage() {
  return (
    <>
      <Header />
      <main className="pt-20">
        <ProgressDashboard />
      </main>
      <Footer />
    </>
  );
}
