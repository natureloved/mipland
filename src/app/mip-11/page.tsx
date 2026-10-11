import type { Metadata } from "next";
import Mip11HeroSection from "@/components/mip11/Mip11HeroSection";
import FeeFlowSection from "@/components/mip11/FeeFlowSection";
import DelegatorShareSection from "@/components/mip11/DelegatorShareSection";
import ThresholdSection from "@/components/mip11/ThresholdSection";
import AffectedSection from "@/components/mip11/AffectedSection";
import DiscussionCtaSection from "@/components/DiscussionCtaSection";
import FooterSection from "@/components/FooterSection";

const DESCRIPTION =
  "MIP-11 is a Draft. See where priority fees go today and under MIP-11, what a delegator would earn, and how much the spec's unclear minimum amount could burn, using real mainnet blocks.";

export const metadata: Metadata = {
  title: "MIP-11: Automatic Priority Fee Distribution",
  description: DESCRIPTION,
  alternates: { canonical: "/mip-11" },
  openGraph: {
    title: "MIP-11: Automatic Priority Fee Distribution",
    description: DESCRIPTION,
    url: "/mip-11",
  },
};

export default function Mip11Page() {
  return (
    <main>
      <Mip11HeroSection />
      <FeeFlowSection />
      <DelegatorShareSection />
      <ThresholdSection />
      <AffectedSection />
      <DiscussionCtaSection />
      <FooterSection />
    </main>
  );
}
