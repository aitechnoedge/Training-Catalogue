import '../../../src/index.css';
import { CareersPage } from '../../../src/components/careers/CareersPage';
import { CareerRolePage } from '../../../src/components/careers/CareerRolePage';

export function CareersRoute({ onViewRole }: { onViewRole: (slug: string) => void }) {
  return <CareersPage onViewRole={onViewRole} />;
}

export function CareerRoleRoute({ slug, onBack }: { slug: string; onBack: () => void }) {
  return <CareerRolePage slug={slug} onBack={onBack} />;
}
