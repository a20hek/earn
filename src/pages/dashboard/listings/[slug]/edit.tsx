import axios from 'axios';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { LoadingSection } from '@/components/shared/LoadingSection';
import { CreateListing } from '@/features/listing-builder';
import type { Listing } from '@/features/listings';
import { SponsorLayout } from '@/layouts/Sponsor';
import { useUser } from '@/store/user';

interface Props {
  slug: string;
}

function EditBounty({ slug }: Props) {
  const router = useRouter();
  const { user } = useUser();
  const [isBountyLoading, setIsBountyLoading] = useState(true);
  const [bounty, setBounty] = useState<Listing | undefined>();
  const [prevStep, setPrevStep] = useState<number>(2);

  const getBounty = async () => {
    setIsBountyLoading(true);
    try {
      const bountyDetails = await axios.get(
        `/api/sponsor-dashboard/${slug}/listing`,
      );
      if (bountyDetails.data.sponsorId !== user?.currentSponsorId) {
        router.push('/dashboard/listings');
      } else {
        const bounty = bountyDetails.data as Listing;
        const isProject = bounty?.type === 'project';
        if (
          bounty.isPublished ||
          !bounty.title ||
          !bounty.skills ||
          !bounty.pocSocials ||
          !bounty.applicationType ||
          !bounty.deadline ||
          (isProject && !bounty.timeToComplete)
        ) {
          setPrevStep(2);
        } else if ((bounty.rewards || bounty.rewardAmount) && !isProject) {
          setPrevStep(4);
        } else if ((bounty.rewards || bounty.rewardAmount) && isProject) {
          setPrevStep(5);
        } else if (
          bounty.eligibility &&
          bounty.eligibility.length !== 0 &&
          isProject
        ) {
          setPrevStep(4);
        } else if (bounty.requirements || bounty.description) {
          setPrevStep(3);
        }

        setBounty(bountyDetails.data);
        setIsBountyLoading(false);
      }
    } catch (e) {
      setIsBountyLoading(false);
    }
  };

  useEffect(() => {
    if (user?.currentSponsorId) {
      getBounty();
    }
  }, [user?.currentSponsorId]);

  return (
    <SponsorLayout>
      {isBountyLoading ? (
        <LoadingSection />
      ) : (
        <CreateListing
          listing={bounty}
          editable
          prevStep={prevStep}
          type={bounty?.type as 'bounty' | 'project' | 'hackathon'}
        />
      )}
    </SponsorLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.query;
  return {
    props: { slug },
  };
};

export default EditBounty;
