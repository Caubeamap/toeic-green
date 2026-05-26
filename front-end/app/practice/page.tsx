import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PracticeSection } from "@/components/PracticeSection";

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
