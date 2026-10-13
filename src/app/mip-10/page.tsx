import type { Metadata } from "next";
import Mip10HeroSection from "@/components/mip10/Mip10HeroSection";
import RootSection from "@/components/mip10/RootSection";
import AssignmentSection from "@/components/mip10/AssignmentSection";
import SizingSection from "@/components/mip10/SizingSection";
import ValidationSection from "@/components/mip10/ValidationSection";
import RolloutSection from "@/components/mip10/RolloutSection";
import Mip10TakeawaysSection from "@/components/mip10/Mip10TakeawaysSection";
import DiscussionCtaSection from "@/components/DiscussionCtaSection";
import FooterSection from "@/components/FooterSection";

const DESCRIPTION =
  "MIP-10 is a Draft. Watch a block proposal split into chunks under one Merkle root, see which validator gets each chunk and why, and what a validator rejects.";

export const metadata: Metadata = {
  title: "MIP-10: Deterministic RaptorCast",
  description: DESCRIPTION,
  alternates: { canonical: "/mip-10" },
  openGraph: {
    title: "MIP-10: Deterministic RaptorCast",
    description: DESCRIPTION,
    url: "/mip-10",
  },
};

export default function Mip10Page() {
  return (
    <main>
      <Mip10HeroSection />
      <RootSection />
      <AssignmentSection />
      <SizingSection />
      <ValidationSection />
      <RolloutSection />
      <Mip10TakeawaysSection />
      <DiscussionCtaSection />
      <FooterSection />
    </main>
  );
}
