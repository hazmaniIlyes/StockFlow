import { useNavigate } from 'react-router-dom';

import { OnboardingView } from 'src/sections/onboarding/onboarding-view';

// ----------------------------------------------------------------------

export default function OnboardingPage() {
  const navigate = useNavigate();

  return <OnboardingView onComplete={() => navigate('/', { replace: true })} />;
}
