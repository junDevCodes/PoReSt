import type {
  CertificationData as CertificationDataFromSchema,
  EducationData as EducationDataFromSchema,
  ProfileData as ProfileDataFromSchema,
  ProjectData as ProjectDataFromSchema,
  WorkData as WorkDataFromSchema,
} from '../content.config';

// 핵심 타입(인터페이스) 정의
// - Zod 스키마에서 파생된 타입을 기반으로, 컴포넌트 경계에서 interface 형태로 노출

export interface ProfileData extends ProfileDataFromSchema {}
export interface ProjectData extends ProjectDataFromSchema {}
export interface WorkData extends WorkDataFromSchema {}
export interface EducationData extends EducationDataFromSchema {}
export interface CertificationData extends CertificationDataFromSchema {}

