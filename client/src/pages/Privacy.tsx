import { LegalDocument } from "../components/public/LegalDocument";

export default function Privacy() {
  return (
    <LegalDocument
      slug="privacy"
      title="Privacy Policy"
      description="How SvapNora handles the limited information submitted through this website."
      fallback={{
        sections: [
          {
            heading: "Information we collect",
            paragraphs: [
              "When you submit the contact form we store the name, email address, subject, category and message you provide, together with basic request metadata used for abuse prevention and rate limiting.",
              "We do not use advertising trackers on this website.",
            ],
          },
          {
            heading: "How we use information",
            paragraphs: [
              "Contact submissions are used solely to respond to your enquiry. Payment records, where present, are maintained for accounting and reconciliation purposes.",
            ],
          },
          {
            heading: "Retention and your rights",
            paragraphs: [
              "Submissions are retained only as long as necessary to handle your enquiry. You may request access to, or deletion of, the information associated with your submission by contacting us through the form.",
            ],
          },
          {
            heading: "Security",
            paragraphs: [
              "Data is stored server-side with access restricted to authorised administrators. We do not store raw card numbers, CVVs or other prohibited payment credentials.",
            ],
          },
        ],
      }}
    />
  );
}
