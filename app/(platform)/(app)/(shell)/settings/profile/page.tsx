import { LoginMethods } from '@/features/auth';
import { ProfileSection } from '@/features/settings';

const page = () => {
  return <ProfileSection loginMethods={<LoginMethods />} />;
};

export default page;
