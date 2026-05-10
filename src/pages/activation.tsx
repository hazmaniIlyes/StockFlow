import { useNavigate } from 'react-router-dom';

import { ActivationView } from 'src/sections/activation/activation-view';

// ----------------------------------------------------------------------

export default function ActivationPage() {
  const navigate = useNavigate();

  return <ActivationView onComplete={() => navigate('/', { replace: true })} />;
}
