import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PracticeTestSetup } from "@/components/practice/PracticeTestSetup";
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
      <SiteHeader />
      <main className="pt-20">
        <PracticeTestSetup test={test} />
      </main>
      <SiteFooter />
    </>
  );
}
