import type { Metadata } from "next";
import Mip16HeroSection from "@/components/mip16/Mip16HeroSection";
import ProblemSection from "@/components/mip16/ProblemSection";
import BuilderSection from "@/components/mip16/BuilderSection";
import PagingSection from "@/components/mip16/PagingSection";
import ReorgSection from "@/components/mip16/ReorgSection";
import ErrorsSection from "@/components/mip16/ErrorsSection";
import Mip16TakeawaysSection from "@/components/mip16/Mip16TakeawaysSection";
import DiscussionCtaSection from "@/components/DiscussionCtaSection";
import FooterSection from "@/components/FooterSection";

const DESCRIPTION =
  "MIP-16 is a Draft. Build eth_queryLogs and the other four query methods, step through block-aligned pages, and catch a reorg between pages.";

export const metadata: Metadata = {
  title: "MIP-16: JSON-RPC Query Methods",
  description: DESCRIPTION,
  alternates: { canonical: "/mip-16" },
  openGraph: {
    title: "MIP-16: JSON-RPC Query Methods",
    description: DESCRIPTION,
    url: "/mip-16",
  },
};

export default function Mip16Page() {
  return (
    <main>
      <Mip16HeroSection />
      <ProblemSection />
      <BuilderSection />
      <PagingSection />
      <ReorgSection />
      <ErrorsSection />
      <Mip16TakeawaysSection />
      <DiscussionCtaSection />
      <FooterSection />
    </main>
  );
}
