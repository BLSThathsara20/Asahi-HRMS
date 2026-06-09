import { COMPANY_NAME } from './brand'

export type LegalDocumentId = 'privacy' | 'terms' | 'cookies'

export interface LegalDocument {
  id: LegalDocumentId
  title: string
  sections: { heading: string; body: string }[]
}

export const LEGAL_DOCUMENTS: Record<LegalDocumentId, LegalDocument> = {
  privacy: {
    id: 'privacy',
    title: 'Privacy Policy',
    sections: [
      {
        heading: 'Who we are',
        body: `${COMPANY_NAME} ("we", "us") operates this People Management system for our staff in the United Kingdom. We are the data controller for personal data processed through this application.`,
      },
      {
        heading: 'What we collect',
        body: 'We process employee and attendance data including names, contact details, job roles, sign-in and sign-out times, location where recorded, salary and payroll information, and account login details used to access the system.',
      },
      {
        heading: 'Why we use your data',
        body: 'We process this information to manage employment, attendance, payroll, and internal HR operations. Our lawful bases under UK GDPR typically include contractual necessity, legal obligation, and legitimate interests in running our business securely and efficiently.',
      },
      {
        heading: 'How long we keep data',
        body: 'We retain HR and payroll records only for as long as needed for employment administration, legal compliance, and dispute resolution, after which data is securely deleted or anonymised.',
      },
      {
        heading: 'Sharing your data',
        body: 'We do not sell personal data. Information may be shared with trusted service providers (such as our cloud database host) under appropriate contracts, or where required by UK law, regulators, or courts.',
      },
      {
        heading: 'Your rights',
        body: 'Under UK data protection law you may have rights to access, rectify, erase, restrict, or object to processing of your personal data, and to data portability where applicable. You may also complain to the Information Commissioner\'s Office (ICO) at ico.org.uk.',
      },
      {
        heading: 'Contact',
        body: `For privacy questions or to exercise your rights, contact ${COMPANY_NAME} using your usual HR or management channel.`,
      },
    ],
  },
  terms: {
    id: 'terms',
    title: 'Terms of Use',
    sections: [
      {
        heading: 'Authorised use',
        body: `This system is provided exclusively for authorised ${COMPANY_NAME} staff and contractors. You must use it only for legitimate work purposes related to your role.`,
      },
      {
        heading: 'Your account',
        body: 'You are responsible for keeping your login credentials confidential and for all activity under your account. Report suspected unauthorised access to management immediately.',
      },
      {
        heading: 'Accurate records',
        body: 'You must record attendance truthfully and promptly. Deliberately false entries, misuse of sign-in data, or tampering with records may result in disciplinary action.',
      },
      {
        heading: 'Acceptable use',
        body: 'You must not attempt to bypass security, scrape or export data without permission, introduce malware, or use the system in any way that harms the business, colleagues, or third parties.',
      },
      {
        heading: 'Availability',
        body: 'We aim to keep the service available but do not guarantee uninterrupted access. Maintenance, updates, or technical issues may occasionally affect availability.',
      },
      {
        heading: 'Intellectual property',
        body: 'The software, branding, and content of this application remain the property of their respective owners. You receive only a limited right to use the system for work purposes.',
      },
      {
        heading: 'Changes',
        body: 'We may update these terms or system features from time to time. Continued use after changes are communicated constitutes acceptance of the updated terms.',
      },
    ],
  },
  cookies: {
    id: 'cookies',
    title: 'Cookies & Local Storage',
    sections: [
      {
        heading: 'What we use',
        body: 'This application stores information in your browser to keep you signed in, remember your theme preference (light or dark), and support essential app functionality. These are strictly necessary for the service to work.',
      },
      {
        heading: 'Analytics',
        body: 'We do not use third-party advertising or tracking cookies in this internal HR application.',
      },
      {
        heading: 'Managing storage',
        body: 'Clearing your browser data or local storage will sign you out and reset preferences such as theme. You can do this through your browser settings at any time.',
      },
      {
        heading: 'UK law',
        body: 'Under UK privacy and electronic communications rules, strictly necessary storage does not require consent. If optional features are added in future, we will update this notice accordingly.',
      },
    ],
  },
}

export const LEGAL_LINKS: { id: LegalDocumentId; label: string }[] = [
  { id: 'privacy', label: 'Privacy' },
  { id: 'terms', label: 'Terms' },
  { id: 'cookies', label: 'Cookies' },
]
