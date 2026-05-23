import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { VocabularyNotes } from "@/components/VocabularyNotes";

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
