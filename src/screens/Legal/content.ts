/**
 * Source text for the in-app legal documents (Privacy Policy & Terms of Use).
 * Kept as structured data — not hard-coded JSX — so the same `LegalScreen`
 * renderer can present either document and copy edits stay in one place.
 *
 * The text mirrors the TorahSings.com website (`src/app/privacy/page.tsx` and
 * `src/app/terms/page.tsx`); keep the two in sync when either is revised.
 */

/** A single rendered block within a section: a paragraph, sub-heading, or list. */
export type LegalBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'subheading'; text: string }
  | { type: 'bullets'; items: string[] }
  /** The bordered contact panel that closes each document, as on the web. */
  | { type: 'card'; title: string; lines: string[] };

export interface LegalSection {
  heading: string;
  blocks: LegalBlock[];
}

export interface LegalDocument {
  title: string;
  /** Standfirst under the title, above the rule that opens the body. */
  lead: string;
  /** Human-readable effective date shown under the title. */
  effectiveDate: string;
  /** Opening body paragraph(s) shown before the numbered sections. */
  intro: string[];
  sections: LegalSection[];
  /** Address used in the closing "Contact us" section. */
  contactEmail: string;
}

const EFFECTIVE_DATE = 'July 14, 2026';

export const PRIVACY_POLICY: LegalDocument = {
  title: 'Privacy Policy',
  effectiveDate: EFFECTIVE_DATE,
  contactEmail: 'privacy@torahsings.com',
  lead: 'This policy explains what we collect, how we use it, and the choices you have. Torah Sings keeps your listening simple and the data we hold to a minimum.',
  intro: [
    `This Privacy Policy explains how Jubilee Ministries ("Torah Sings," "we," "us," or "our") collects, uses, and protects your information when you use TorahSings.com (the "Service"). It should be read together with our Terms of Use.`,
  ],
  sections: [
    {
      heading: '1. Information We Collect',
      blocks: [
        {
          type: 'bullets',
          items: [
            'Account information. When you sign in with your Jubilee Account, we receive the basic profile details needed to identify you — such as your name and email address.',
            'Usage and playback. We may collect which albums and tracks you open, and your playback position, so the Service works the way you expect.',
            'Device and log data. Standard technical information such as browser type, device, and approximate region, collected automatically as you use the Service.',
          ],
        },
      ],
    },
    {
      heading: '2. How We Use Your Information',
      blocks: [
        {
          type: 'paragraph',
          text: 'We use your information to provide and maintain the Service, remember your session and playback position, understand how the Service is used so we can improve it, keep the Service secure, and communicate with you about your account when necessary.',
        },
      ],
    },
    {
      heading: '3. Your Jubilee Account',
      blocks: [
        {
          type: 'paragraph',
          text: 'Torah Sings uses your Jubilee Account as a single sign-on shared across the Jubilee ecosystem. Signing in links your use of Torah Sings to that account so your experience carries across sites. Your Jubilee Account profile is governed by this policy together with any terms presented when you created it.',
        },
      ],
    },
    {
      heading: '4. Cookies and Local Storage',
      blocks: [
        {
          type: 'paragraph',
          text: 'We keep your listening simple: your session and playback position live in your own device’s local storage, and we use only the cookies necessary to sign you in and operate the Service. You can clear this data at any time through your device settings.',
        },
      ],
    },
    {
      heading: '5. How We Share Information',
      blocks: [
        {
          type: 'paragraph',
          text: 'We do not sell your personal information. We share it only with service providers who help us run the Service (such as hosting, streaming, and sign-on providers) under appropriate safeguards, or where required by law or to protect the Service and its users.',
        },
      ],
    },
    {
      heading: '6. Data Retention',
      blocks: [
        {
          type: 'paragraph',
          text: 'We keep your information only as long as needed to provide the Service and for legitimate operational, legal, or security purposes. When it is no longer needed, we take reasonable steps to delete or anonymize it.',
        },
      ],
    },
    {
      heading: '7. Security',
      blocks: [
        {
          type: 'paragraph',
          text: 'We use reasonable technical and organizational measures to protect your information. No method of transmission or storage is completely secure, however, and we cannot guarantee absolute security.',
        },
      ],
    },
    {
      heading: '8. Your Rights and Choices',
      blocks: [
        {
          type: 'paragraph',
          text: 'Depending on where you live, you may have the right to access, correct, or delete your personal information, or to object to certain processing. To make a request, contact us using the details below. You can also manage much of your data directly through your Jubilee Account and your device settings.',
        },
      ],
    },
    {
      heading: '9. Children’s Privacy',
      blocks: [
        {
          type: 'paragraph',
          text: 'The Service is not directed to children under 13, and we do not knowingly collect personal information from them. If you believe a child has provided us information, please contact us so we can remove it.',
        },
      ],
    },
    {
      heading: '10. International Users',
      blocks: [
        {
          type: 'paragraph',
          text: 'The Service may be operated from, and your information processed in, countries other than your own. By using the Service, you understand that your information may be transferred and handled in accordance with this policy and applicable law.',
        },
      ],
    },
    {
      heading: '11. Third-Party Links and Services',
      blocks: [
        {
          type: 'paragraph',
          text: 'The Service may link to or rely on third-party sites and services, including your Jubilee Account and the wider Jubilee ecosystem. Their handling of your information is governed by their own privacy policies, which we encourage you to review.',
        },
      ],
    },
    {
      heading: '12. Changes to This Policy',
      blocks: [
        {
          type: 'paragraph',
          text: 'We may update this Privacy Policy from time to time. When we make material changes, we will update the effective date above and, where appropriate, provide additional notice. Your continued use of the Service after changes take effect means you accept the revised policy.',
        },
      ],
    },
    {
      heading: '13. Contact Us',
      blocks: [
        { type: 'paragraph', text: 'Questions about your privacy are welcome. You can reach us at the address below.' },
        {
          type: 'card',
          title: 'Jubilee Ministries',
          lines: ['Privacy inquiries: privacy@torahsings.com', 'We aim to respond within a reasonable time.'],
        },
      ],
    },
  ],
};

export const TERMS_OF_USE: LegalDocument = {
  title: 'Terms of Use',
  effectiveDate: EFFECTIVE_DATE,
  contactEmail: 'legal@torahsings.com',
  lead: 'These terms are the agreement between you and Torah Sings. Please read them carefully — by creating a Jubilee Account or using the Service, you agree to be bound by them.',
  intro: [
    `Welcome to TorahSings.com. These Terms of Use ("Terms") are a legal agreement between you and Jubilee Ministries ("Torah Sings," "we," "us," or "our") governing your access to and use of the TorahSings.com website and the music, readings, and study materials offered through it (the "Service"). Please also review our Privacy Policy, which explains how we handle your information and is incorporated into these Terms by reference.`,
  ],
  sections: [
    {
      heading: '1. Acceptance of These Terms',
      blocks: [
        {
          type: 'paragraph',
          text: 'By creating an account, accessing, or using the Service, you confirm that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. If you do not agree, please do not use the Service. If you are using the Service on behalf of an organization, you represent that you are authorized to accept these Terms on its behalf.',
        },
      ],
    },
    {
      heading: '2. Eligibility',
      blocks: [
        {
          type: 'paragraph',
          text: 'You must be at least 13 years old (or the minimum age required in your country) to create an account and use the Service. If you are a minor in your jurisdiction, you may use the Service only with the involvement and consent of a parent or legal guardian. By using the Service, you represent that you meet these requirements.',
        },
      ],
    },
    {
      heading: '3. Your Account',
      blocks: [
        {
          type: 'bullets',
          items: [
            'You agree to provide accurate, current, and complete information when you register and to keep it up to date.',
            'Torah Sings uses your Jubilee Account — the single sign-on shared across the Jubilee ecosystem — to identify you across sites.',
            'You are responsible for safeguarding your credentials and for all activity that occurs under your account. Notify us promptly of any unauthorized use.',
          ],
        },
      ],
    },
    {
      heading: '4. License to Use the Service',
      blocks: [
        {
          type: 'paragraph',
          text: 'Subject to these Terms, we grant you a limited, personal, non-exclusive, non-transferable, and revocable license to access and use the Service for your own personal, non-commercial listening and study. This license does not permit resale, redistribution, or any use of the Service or its content beyond what these Terms allow.',
        },
      ],
    },
    {
      heading: '5. Content and Intellectual Property',
      blocks: [
        {
          type: 'paragraph',
          text: 'The Service and its contents — including the recordings, songs, artwork, text, the accompanying book, the underlying discovery, and the software — are owned by Jubilee Ministries or its licensors and are protected by copyright and other laws. The songs and the book are offered as something to consider for study and reflection — not as canon. Nothing in these Terms transfers ownership of any content to you.',
        },
      ],
    },
    {
      heading: '6. Your Content',
      blocks: [
        {
          type: 'paragraph',
          text: 'If you submit feedback, suggestions, or other materials to us, you grant Jubilee Ministries a worldwide, royalty-free license to use them to operate and improve the Service. You are responsible for anything you submit and represent that you have the right to share it.',
        },
      ],
    },
    {
      heading: '7. Acceptable Use',
      blocks: [
        {
          type: 'bullets',
          items: [
            'Do not copy, scrape, download in bulk, redistribute, or publicly perform the content except as the Service expressly allows.',
            'Do not attempt to disrupt, reverse-engineer, or gain unauthorized access to the Service or its systems.',
            'Do not use the Service unlawfully, or to infringe the rights of others.',
          ],
        },
      ],
    },
    {
      heading: '8. Third-Party Services',
      blocks: [
        {
          type: 'paragraph',
          text: 'The Service relies on third parties — including your Jubilee Account for sign-on, and providers for hosting, streaming, and payments. Your use of those services may be subject to their own terms and privacy policies. We are not responsible for third-party services we do not control.',
        },
      ],
    },
    {
      heading: '9. Suspension and Termination',
      blocks: [
        {
          type: 'paragraph',
          text: 'We may suspend or terminate your access to the Service at any time if you violate these Terms or if we need to protect the Service or other users. You may stop using the Service at any time. Provisions that by their nature should survive termination will survive.',
        },
      ],
    },
    {
      heading: '10. Disclaimers',
      blocks: [
        {
          type: 'paragraph',
          text: `The Service is provided "as is" and "as available," without warranties of any kind, whether express or implied. The interpretive material is offered for study and reflection and is not presented as doctrine. We do not warrant that the Service will be uninterrupted, error-free, or secure.`,
        },
      ],
    },
    {
      heading: '11. Limitation of Liability',
      blocks: [
        {
          type: 'paragraph',
          text: 'To the fullest extent permitted by law, Jubilee Ministries will not be liable for any indirect, incidental, special, consequential, or punitive damages, or for any loss of data or goodwill, arising out of or related to your use of the Service.',
        },
      ],
    },
    {
      heading: '12. Indemnification',
      blocks: [
        {
          type: 'paragraph',
          text: 'You agree to indemnify and hold harmless Jubilee Ministries and its affiliates from any claims, damages, or expenses arising out of your use of the Service or your violation of these Terms.',
        },
      ],
    },
    {
      heading: '13. Changes to the Service and These Terms',
      blocks: [
        {
          type: 'paragraph',
          text: 'We may update the Service and these Terms from time to time. When we make material changes, we will update the effective date above and, where appropriate, provide additional notice. Your continued use of the Service after changes take effect means you accept the revised Terms.',
        },
      ],
    },
    {
      heading: '14. Governing Law',
      blocks: [
        {
          type: 'paragraph',
          text: 'These Terms are governed by the laws applicable at the place of Jubilee Ministries’ principal operations, without regard to conflict-of-laws rules. Any disputes will be resolved in the courts of that jurisdiction, unless applicable law requires otherwise.',
        },
      ],
    },
    {
      heading: '15. Contact Us',
      blocks: [
        { type: 'paragraph', text: 'Questions about these Terms are welcome. You can reach us at the address below.' },
        {
          type: 'card',
          title: 'Jubilee Ministries',
          lines: ['Legal inquiries: legal@torahsings.com', 'We aim to respond within a reasonable time.'],
        },
      ],
    },
  ],
};
