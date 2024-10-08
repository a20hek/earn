import { Box, HStack, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import type { GetServerSideProps } from 'next';

import { ErrorSection } from '@/components/shared/ErrorSection';
import { LoadingSection } from '@/components/shared/LoadingSection';
import {
  DescriptionUI,
  ListingHeader,
  listingTemplateQuery,
  ListingWinners,
} from '@/features/listings';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';

interface BountyDetailsProps {
  slug: string;
}

function BountyDetails({ slug }: BountyDetailsProps) {
  const {
    data: bounty,
    isLoading,
    error,
  } = useQuery(listingTemplateQuery(slug));

  return (
    <Default
      meta={
        <Meta
          title={`${bounty?.title || 'Bounty'} | Superteam Earn`}
          description="Every crypto opportunity in one place!"
        />
      }
    >
      {isLoading && <LoadingSection />}
      {!isLoading && !!error && <ErrorSection />}
      {!isLoading && !error && !bounty?.id && (
        <ErrorSection message="Sorry! The bounty you are looking for is not available." />
      )}
      {!isLoading && !error && !!bounty?.id && (
        <>
          <ListingHeader isTemplate={true} listing={bounty} />
          {bounty?.isWinnersAnnounced && (
            <Box w="full">
              {' '}
              <ListingWinners bounty={bounty} />
            </Box>
          )}
          <HStack
            align={['center', 'center', 'start', 'start']}
            justify={['center', 'center', 'space-between', 'space-between']}
            flexDir={['column-reverse', 'column-reverse', 'row', 'row']}
            gap={4}
            maxW={'6xl'}
            mx={'auto'}
            mb={10}
          >
            <VStack gap={8} w={['22rem', '22rem', 'full', 'full']} mt={10}>
              <DescriptionUI description={bounty.description} />
            </VStack>
          </HStack>
        </>
      )}
    </Default>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.query;
  return {
    props: { slug },
  };
};

export default BountyDetails;
