// cover-letters 도메인 공용 타입
// CoverLettersPageClient.tsx, GenerateCoverLetterModal.tsx, RegisterCoverLetterModal.tsx에서 공유

export type GenerateFormData = {
  targetCompany: string;
  targetRole: string;
  jobDescription: string;
  motivationHint: string;
};

export type RegisterFormData = {
  title: string;
  targetCompany: string;
  targetRole: string;
  contentMd: string;
};
