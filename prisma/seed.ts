import { prisma } from "../src/lib/prisma";

const ownerEmail = process.env.OWNER_EMAIL?.toLowerCase();
const ownerName = process.env.OWNER_NAME ?? "오너";
const DEFAULT_PUBLIC_SLUG = "owner";
const EMAIL_DELIMITER = "@";
const SLUG_NORMALIZE_PATTERN = /[^a-z0-9-]/g;
const EMPTY_LENGTH = 0;

async function main() {
  if (!ownerEmail) {
    throw new Error("OWNER_EMAIL은 오너 계정 시드를 위해 필요합니다.");
  }

  const owner = await prisma.user.upsert({
    where: { email: ownerEmail },
    update: {
      isOwner: true,
      name: ownerName,
    },
    create: {
      email: ownerEmail,
      name: ownerName,
      isOwner: true,
    },
  });

  const slugBase =
    ownerEmail
      ?.split(EMAIL_DELIMITER)[0]
      ?.toLowerCase()
      ?.replace(SLUG_NORMALIZE_PATTERN, "-") ?? DEFAULT_PUBLIC_SLUG;
  const publicSlug = slugBase.length > EMPTY_LENGTH ? slugBase : DEFAULT_PUBLIC_SLUG;

  await prisma.portfolioSettings.upsert({
    where: { ownerId: owner.id },
    update: {
      publicSlug,
      displayName: owner.name ?? ownerName,
    },
    create: {
      ownerId: owner.id,
      publicSlug,
      displayName: owner.name ?? ownerName,
    },
  });

  console.log(`오너 계정 시드 완료: ${owner.email}`);
  console.log(`포트폴리오 설정 시드 완료: ${publicSlug}`);
}

main()
  .catch((error) => {
    console.error("시드 실패:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
