import {
  Flex,
  Heading,
  HStack,
  IconButton,
  Image,
  Spinner,
  Text,
  Tooltip,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import type { SubscribeBounty } from '@prisma/client';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { usePostHog } from 'posthog-js/react';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { TbBell, TbBellRinging } from 'react-icons/tb';

import { AuthWrapper } from '@/features/auth';
import { type Listing, WarningModal } from '@/features/listings';
import type { User } from '@/interface/user';
import { userStore } from '@/store/user';
import { dayjs } from '@/utils/dayjs';

import { ListingTabLink } from './ListingTabLink';
import { RegionLabel } from './RegionLabel';
import { StatusBadge } from './StatusBadge';

export function ListingHeader({
  listing,
  isTemplate,
}: {
  listing: Listing;
  isTemplate?: boolean;
}) {
  const {
    type,
    id,
    status,
    deadline,
    title,
    sponsor,
    slug,
    region,
    isWinnersAnnounced,
    references,
    publishedAt,
    isPublished,
    Hackathon,
  } = listing;
  const router = useRouter();
  const posthog = usePostHog();
  const {
    isOpen: warningIsOpen,
    onOpen: warningOnOpen,
    onClose: warningOnClose,
  } = useDisclosure();
  const { userInfo } = userStore();
  const hasDeadlineEnded = dayjs().isAfter(deadline);
  const hasHackathonStarted = dayjs().isAfter(Hackathon?.startDate);
  const [update, setUpdate] = useState<boolean>(false);
  const [sub, setSub] = useState<(SubscribeBounty & { User: User | null })[]>(
    [],
  );
  const [isSubscribeLoading, setIsSubscribeLoading] = useState(false);

  const { status: authStatus } = useSession();

  const isAuthenticated = authStatus === 'authenticated';

  const handleToggleSubscribe = async () => {
    if (!isAuthenticated || !userInfo?.isTalentFilled) return;

    if (!userInfo?.isTalentFilled) {
      warningOnOpen();
      return;
    }

    setIsSubscribeLoading(true);
    try {
      await axios.post('/api/listings/notifications/toggle', { bountyId: id });
      setUpdate((prev) => !prev);
      toast.success(
        sub.find((e) => e.userId === userInfo?.id)
          ? 'Unsubscribed'
          : 'Subscribed',
      );
    } catch (error) {
      console.log(error);
      toast.error('Error occurred while toggling subscription');
    } finally {
      setIsSubscribeLoading(false);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await axios.post(
          '/api/listings/notifications/status',
          {
            listingId: id,
          },
        );
        setSub(data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUser();
  }, [update, id]);

  const isProject = type === 'project';
  const isHackathon = type === 'hackathon';

  let statusText = '';
  let statusBgColor = '';
  let statusTextColor = '';

  if (!isPublished && !publishedAt) {
    statusText = 'Draft';
    statusBgColor = 'brand.slate.200';
    statusTextColor = 'brand.slate.500';
  } else if (!isPublished && publishedAt) {
    statusText = 'Submissions Paused';
    statusBgColor = '#ffecb3';
    statusTextColor = '#F59E0B';
  } else if (isHackathon && !hasDeadlineEnded && !hasHackathonStarted) {
    statusText = 'Opens Soon';
    statusBgColor = '#F3E8FF';
    statusTextColor = '#8B5CF6';
  } else if (status === 'OPEN' && isWinnersAnnounced) {
    statusText = 'Winners Announced';
    statusBgColor = 'green.100';
    statusTextColor = 'green.600';
  } else if (!isWinnersAnnounced && hasDeadlineEnded && status === 'OPEN') {
    statusText = 'In Review';
    statusBgColor = 'orange.100';
    statusTextColor = 'orange.600';
  } else if (!hasDeadlineEnded && !isWinnersAnnounced && status === 'OPEN') {
    statusText = 'Submissions Open';
    statusBgColor = 'green.100';
    statusTextColor = 'green.600';
  }

  const ListingTitle = () => {
    return (
      <Heading
        color={'brand.slate.700'}
        fontFamily={'var(--font-sans)'}
        fontSize={'xl'}
        fontWeight={700}
      >
        {title}
      </Heading>
    );
  };

  const ListingStatus = () => {
    return (
      <StatusBadge
        textColor={statusTextColor}
        bgColor={statusBgColor}
        text={statusText}
      />
    );
  };

  const HeaderSub = () => {
    return (
      <Flex align={'center'} wrap={'wrap'} gap={{ base: 1, md: 3 }}>
        <Text
          color={'#94A3B8'}
          fontSize={{ base: 'xs', sm: 'md' }}
          fontWeight={500}
          whiteSpace={'nowrap'}
        >
          by {sponsor?.name}
        </Text>
        <Text color={'#E2E8EF'} fontWeight={500}>
          |
        </Text>
        {isHackathon ? (
          <Flex align={'center'}>
            <Image h="2.5rem" alt={type} src={Hackathon?.altLogo} />
          </Flex>
        ) : (
          <Flex>
            <Tooltip
              px={4}
              py={2}
              color="brand.slate.400"
              fontFamily={'var(--font-sans)'}
              fontSize="sm"
              bg="white"
              borderRadius={'lg'}
              label={
                isProject
                  ? 'A Project is a short-term gig where sponsors solicit applications from multiple people, and select the best one to work on the Project.'
                  : 'Bounties are open for anyone to participate in and submit their work (as long as they meet the eligibility requirements mentioned below). The best submissions win!'
              }
            >
              <Flex>
                <Image
                  h="4"
                  mt={{ base: '1px', sm: 1 }}
                  mr={{ base: '1px', sm: 1 }}
                  alt={type}
                  src={
                    isProject
                      ? '/assets/icons/briefcase.svg'
                      : '/assets/icons/bolt.svg'
                  }
                />
                <Text
                  color={'gray.400'}
                  fontSize={{ base: 'xs', sm: 'md' }}
                  fontWeight={500}
                >
                  {isProject ? 'Project' : 'Bounty'}
                </Text>
              </Flex>
            </Tooltip>
          </Flex>
        )}
        <Flex display={{ base: 'flex', md: 'none' }}>
          <ListingStatus />
        </Flex>
        <RegionLabel region={region} />
      </Flex>
    );
  };

  const SponsorLogo = () => {
    return (
      <Image
        w={{ base: 12, md: 16 }}
        h={{ base: 12, md: 16 }}
        objectFit={'cover'}
        alt={'phantom'}
        rounded={'md'}
        src={sponsor?.logo || `${router.basePath}/assets/logo/sponsor-logo.png`}
      />
    );
  };

  return (
    <VStack px={{ base: 3, md: 6 }} bg={'white'}>
      {warningIsOpen && (
        <WarningModal
          onCTAClick={() => posthog.capture('complete profile_CTA pop up')}
          isOpen={warningIsOpen}
          onClose={warningOnClose}
          title={'Complete your profile'}
          bodyText={
            'Please complete your profile before submitting to a bounty.'
          }
          primaryCtaText={'Complete Profile'}
          primaryCtaLink={'/new/talent'}
        />
      )}
      <VStack
        justify={'space-between'}
        flexDir={'row'}
        gap={5}
        w={'full'}
        maxW={'8xl'}
        mx={'auto'}
        py={{ base: 4, md: 10 }}
      >
        <HStack align="center">
          <SponsorLogo />
          <VStack align={'start'} gap={isHackathon ? 0 : 1}>
            <HStack>
              <Flex display={{ base: 'none', md: 'flex' }}>
                <ListingTitle />
              </Flex>
              <Flex display={{ base: 'none', md: 'flex' }}>
                <ListingStatus />
              </Flex>
            </HStack>
            {!isTemplate && (
              <Flex display={{ base: 'none', md: 'flex' }}>
                <HeaderSub />
              </Flex>
            )}
          </VStack>
        </HStack>
        {!isTemplate && (
          <HStack>
            <HStack align="start">
              <AuthWrapper>
                <IconButton
                  className="ph-no-capture"
                  color={
                    sub.find((e) => e.userId === userInfo?.id)
                      ? 'white'
                      : 'brand.slate.500'
                  }
                  bg={
                    sub.find((e) => e.userId === userInfo?.id)
                      ? 'brand.purple'
                      : 'brand.slate.100'
                  }
                  aria-label="Notify"
                  icon={
                    isSubscribeLoading ? (
                      <Spinner color="white" size="sm" />
                    ) : sub.find((e) => e.userId === userInfo?.id) ? (
                      <TbBellRinging />
                    ) : (
                      <TbBell />
                    )
                  }
                  onClick={() => {
                    posthog.capture(
                      sub.find((e) => e.userId === userInfo?.id)
                        ? 'unnotify me_listing'
                        : 'notify me_listing',
                    );
                    handleToggleSubscribe();
                  }}
                  variant="solid"
                />
              </AuthWrapper>
            </HStack>
            <HStack whiteSpace={'nowrap'}>
              <VStack align={'start'} gap={0}>
                <Text color={'#000000'} fontWeight={500}>
                  {sub?.length ? sub.length + 1 : 1}
                </Text>
                <Text
                  display={{ base: 'none', md: 'flex' }}
                  color={'gray.400'}
                  fontSize={'sm'}
                  fontWeight={400}
                >
                  {(sub?.length ? sub.length + 1 : 1) === 1
                    ? 'Person'
                    : 'People'}{' '}
                  Interested
                </Text>
              </VStack>
            </HStack>
          </HStack>
        )}
      </VStack>
      <Flex
        direction={'column'}
        gap={1}
        display={{ base: 'flex', md: 'none' }}
        w="full"
        mb={5}
      >
        <ListingTitle />
        <HeaderSub />
      </Flex>
      {!isTemplate && (
        <Flex
          align={'center'}
          w={'full'}
          h={10}
          borderTop={'1px solid'}
          borderTopColor={'gray.100'}
        >
          <HStack
            align="center"
            justifyContent="start"
            gap={10}
            w={'full'}
            maxW={'8xl'}
            h={'full'}
            mx={'auto'}
            my={'auto'}
            px={3}
          >
            <ListingTabLink
              href={`/listings/${type}/${slug}/`}
              text="DETAILS"
              isActive={
                !router.asPath.includes('submission') &&
                !router.asPath.includes('references')
              }
            />

            {!isProject && isWinnersAnnounced && (
              <ListingTabLink
                onClick={() => posthog.capture('submissions tab_listing')}
                href={`/listings/${type}/${slug}/submission`}
                text="SUBMISSIONS"
                isActive={router.asPath.includes('submission')}
              />
            )}

            {isProject && references && references?.length > 0 && (
              <ListingTabLink
                href={`/listings/${type}/${slug}/references`}
                text="REFERENCES"
                isActive={router.asPath.includes('references')}
              />
            )}
          </HStack>
        </Flex>
      )}
    </VStack>
  );
}
