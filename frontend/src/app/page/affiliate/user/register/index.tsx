import { RegistrationHeader } from '../../../../components/affiliate/registration/registration-header';
import { RegistrationHero } from '../../../../components/affiliate/registration/registration-hero';
import { RegistrationForm } from '../../../../components/affiliate/registration/registration-form';
export default function AffiliateRegister() {
  return (
    <div className="min-h-screen bg-gray-50">
      <RegistrationHeader />
      <RegistrationHero />
      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <RegistrationForm />
        </div>
      </main>
    </div>
  );
}
