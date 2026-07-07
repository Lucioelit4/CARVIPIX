import { ArrowLeft } from "lucide-react";
import { CARVIPIXButtonLink } from "@/app/design-system";

export default function BackToDashboard() {
  return (
    <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
      <CARVIPIXButtonLink href="/servicios" variant="secondary" size="md" leftIcon={<ArrowLeft size={16} />}>
        Volver a servicios
      </CARVIPIXButtonLink>
    </div>
  );
}
