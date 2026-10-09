import { LegalDocument } from "../components/public/LegalDocument";

export default function Terms() {
  return (
    <LegalDocument
      slug="terms"
      title="Terms of Service"
      description="The terms that govern use of the SvapNora website."
      fallback={{
        sections: [
          {
            heading: "Use of this website",
            paragraphs: [
              "This website is provided for information about SvapNora and the GlowLang project. Descriptions of features and roadmap items are indicative and may change as development progresses.",
            ],
          },
          {
            heading: "No warranty",
            paragraphs: [
              "Content is provided on an as-is basis. Status labels indicate development progress and are not contractual commitments or performance guarantees.",
            ],
          },
          {
            heading: "Third-party services",
            paragraphs: [
              "Where third-party services such as payment or email providers are used, their own terms apply to those interactions.",
            ],
          },
          {
            heading: "Intellectual property",
            paragraphs: [
              "The SvapNora name, GlowLang name and associated branding belong to their respective owners. Referenced third-party names remain the property of their owners.",
            ],
          },
        ],
      }}
    />
  );
}
