import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { VocabularyNotes } from "@/components/vocabulary/VocabularyNotes";

export default function VocabularyPage() {
  return (
    <>
      <Header />
      <main className="pt-20">
        <VocabularyNotes />
      </main>
      <Footer />
    </>
  );
}
