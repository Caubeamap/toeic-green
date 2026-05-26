import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PracticeTestDetailView } from "@/components/PracticeTestDetailView";
import { allPracticeTests, getPracticeTestById } from "@/lib/practice-tests";

type TestStartPageProps = {
  params: Promise<{
    testId: string;
  }>;
};

export function generateStaticParams() {
  return allPracticeTests.map((test) => ({
    testId: test.id
  }));
}

export async function generateMetadata({ params }: TestStartPageProps): Promise<Metadata> {
  const { testId } = await params;
  const test = getPracticeTestById(testId);

  return {
    title: test ? `${test.title} ${test.subtitle} | TOEIC Green` : "Practice Test | TOEIC Green"
  };
}

export default async function TestStartPage({ params }: TestStartPageProps) {
  const { testId } = await params;
  const test = getPracticeTestById(testId);

  if (!test) {
    notFound();
  }

  return (
    <>
      <Header />
      <main className="pt-20">
        <PracticeTestDetailView test={test} />
      </main>
      <Footer />
    </>
  );
}
