import { Redirect } from 'expo-router';

export default function Index() {
  // Always redirect to onboarding on app load
  return <Redirect href="/(onboarding)/welcome" />;
}
