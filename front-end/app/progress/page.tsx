import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ProgressDashboard } from "@/components/progress/ProgressDashboard";

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
