import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { PracticeSection } from "@/components/practice/PracticeSection";

export default function PracticePage() {
  return (
    <>
      <Header />
      <main className="pt-20">
        <PracticeSection />
      </main>
      <Footer />
    </>
  );
}
