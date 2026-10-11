import type { Metadata } from "next";
import Mip18HeroSection from "@/components/mip18/Mip18HeroSection";
import CallStackSection from "@/components/mip18/CallStackSection";
import OpcodesSection from "@/components/mip18/OpcodesSection";
import AuthPitfallSection from "@/components/mip18/AuthPitfallSection";
import Mip18TakeawaysSection from "@/components/mip18/Mip18TakeawaysSection";
import DiscussionCtaSection from "@/components/DiscussionCtaSection";
import FooterSection from "@/components/FooterSection";

const DESCRIPTION =
  "MIP-18 is in Review. Step through a call stack to see what CALLSTACKDEPTH and CALLERN return, and why CALLERN should not be used for access control.";

export const metadata: Metadata = {
  title: "MIP-18: Call Stack Introspection Opcodes",
  description: DESCRIPTION,
  alternates: { canonical: "/mip-18" },
  openGraph: {
    title: "MIP-18: Call Stack Introspection Opcodes",
    description: DESCRIPTION,
    url: "/mip-18",
  },
};

export default function Mip18Page() {
  return (
    <main>
      <Mip18HeroSection />
      <CallStackSection />
      <OpcodesSection />
      <AuthPitfallSection />
      <Mip18TakeawaysSection />
      <DiscussionCtaSection />
      <FooterSection />
    </main>
  );
}
