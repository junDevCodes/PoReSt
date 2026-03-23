import { prisma } from "@/lib/prisma";
import { createTestimonialService } from "@/modules/testimonials";
import { getRequiredOwnerSession } from "@/app/(private)/app/_lib/server-auth";
import { serializeTestimonialList } from "@/app/(private)/app/_lib/server-serializers";
import { TestimonialsPageClient } from "./TestimonialsPageClient";

const testimonialService = createTestimonialService({ prisma });

export default async function TestimonialsPage() {
  const { ownerId } = await getRequiredOwnerSession("/app/testimonials");
  const testimonials = await testimonialService.listForOwner(ownerId);

  return <TestimonialsPageClient initialTestimonials={serializeTestimonialList(testimonials)} />;
}
