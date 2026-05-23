import { FeatureTabs } from "@/components/FeatureTabs";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PracticeSection } from "@/components/PracticeSection";
import { TestInterface } from "@/components/TestInterface";
import { TestResult } from "@/components/TestResult";

export default function PracticePage() {
  return (
    <>
      <Header />
      <main className="pt-20">
        <FeatureTabs />
        <PracticeSection />
        <TestInterface />
        <TestResult />
      </main>
      <Footer />
    </>
  );
}
