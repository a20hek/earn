import { ChevronDownIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Circle,
  Flex,
  Menu,
  MenuButton,
  MenuDivider,
  MenuGroup,
  MenuItem,
  MenuList,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';

import { EarnAvatar, EmailSettingsModal } from '@/features/talent';
import { useLogout, useUser } from '@/store/user';

export function UserMenu({}) {
  const router = useRouter();
  const posthog = usePostHog();

  const { user } = useUser();
  const logout = useLogout();

  const { data: session } = useSession();

  const { isOpen, onClose, onOpen } = useDisclosure();

  useEffect(() => {
    const checkHashAndOpenModal = () => {
      const url = window.location.href;
      const hashIndex = url.indexOf('#');
      const afterHash = hashIndex !== -1 ? url.substring(hashIndex + 1) : '';
      const [hashValue, queryString] = afterHash.split('?');
      const hashHasEmail = hashValue === 'emailPreferences';
      const queryParams = new URLSearchParams(queryString);
      if (
        (hashHasEmail && queryParams.get('loginState') === 'signedIn') ||
        hashHasEmail
      ) {
        onOpen();
      }
    };

    checkHashAndOpenModal();
  }, [isOpen, onOpen]);

  const handleClose = () => {
    onClose();
    router.push(router.asPath, undefined, { shallow: true });
  };

  const [showBlueCircle, setShowBlueCircle] = useState(() => {
    return !localStorage.getItem('emailPreferencesClicked');
  });

  const handleEmailPreferencesClick = () => {
    onOpen();
    setShowBlueCircle(false);
    localStorage.setItem('emailPreferencesClicked', 'true');
  };

  return (
    <>
      <EmailSettingsModal isOpen={isOpen} onClose={handleClose} />
      {user && !user.currentSponsorId && !user.isTalentFilled && (
        <Button
          className="ph-no-capture"
          display={{ base: 'none', md: 'flex' }}
          fontSize="xs"
          onClick={() => {
            posthog.capture('complete profile_nav bar');
            router.push('/new');
          }}
          size="sm"
          variant={'ghost'}
        >
          Complete your Profile
        </Button>
      )}
      <Menu>
        <MenuButton
          className="ph-no-capture"
          as={Button}
          px={{ base: 0.5, md: 2 }}
          bg={'brand.slate.50'}
          borderWidth={'1px'}
          borderColor={'white'}
          _hover={{ bg: 'brand.slate.100' }}
          _active={{
            bg: 'brand.slate.200',
            borderColor: 'brand.slate.300',
          }}
          cursor={'pointer'}
          id="user menu"
          onClick={() => {
            posthog.capture('clicked_user menu');
          }}
          rightIcon={
            <ChevronDownIcon
              color="brand.slate.400"
              boxSize={{ base: 4, md: 5 }}
            />
          }
        >
          <Flex align="center">
            <EarnAvatar id={user?.id} avatar={user?.photo} />
            {showBlueCircle && (
              <Circle
                display={{ base: 'flex', md: 'none' }}
                ml={2}
                bg="blue.400"
                size="8px"
              />
            )}

            <Flex
              align={'center'}
              display={{ base: 'none', md: 'flex' }}
              ml={2}
            >
              <Text color="brand.slate.600" fontSize="sm" fontWeight={500}>
                {user?.firstName ?? 'New User'}
              </Text>
              {showBlueCircle && <Circle ml={2} bg="blue.400" size="8px" />}
            </Flex>
          </Flex>
        </MenuButton>
        <MenuList className="ph-no-capture">
          {user?.isTalentFilled && (
            <>
              <MenuItem
                className="ph-no-capture"
                as={NextLink}
                color="brand.slate.500"
                fontSize="sm"
                fontWeight={600}
                href={`/t/${user?.username}`}
                onClick={() => {
                  posthog.capture('profile_user menu');
                }}
              >
                Profile
              </MenuItem>
              <MenuItem
                className="ph-no-capture"
                as={NextLink}
                color="brand.slate.500"
                fontSize="sm"
                fontWeight={600}
                href={`/t/${user?.username}/edit`}
                onClick={() => {
                  posthog.capture('edit profile_user menu');
                }}
              >
                Edit Profile
              </MenuItem>
            </>
          )}
          {!!user?.currentSponsorId && (
            <>
              <MenuItem
                className="ph-no-capture"
                as={NextLink}
                display={{ base: 'none', sm: 'block' }}
                color="brand.slate.500"
                fontSize="sm"
                fontWeight={600}
                href={'/dashboard/listings'}
                onClick={() => {
                  posthog.capture('sponsor dashboard_user menu');
                }}
              >
                Sponsor Dashboard
              </MenuItem>
            </>
          )}
          <MenuDivider />
          {session?.user?.role === 'GOD' && (
            <Box display={{ base: 'none', sm: 'block' }}>
              <MenuGroup
                mb={0}
                ml={3}
                color="brand.slate.400"
                fontSize="xs"
                fontWeight={500}
                title="God Mode"
              >
                <MenuItem
                  as={NextLink}
                  color="brand.slate.500"
                  fontSize="sm"
                  fontWeight={600}
                  href={'/new/sponsor'}
                >
                  Create New Sponsor
                </MenuItem>
              </MenuGroup>
              <MenuDivider />
            </Box>
          )}
          {(user?.isTalentFilled || !!user?.currentSponsorId) && (
            <MenuItem
              className="ph-no-capture"
              color="brand.slate.500"
              fontSize="sm"
              fontWeight={600}
              onClick={() => {
                handleEmailPreferencesClick();
                posthog.capture('email preferences_user menu');
              }}
            >
              Email Preferences
              {showBlueCircle && <Circle ml={2} bg="blue.400" size="8px" />}
            </MenuItem>
          )}
          <MenuItem
            className="ph-no-capture"
            color="brand.slate.500"
            fontSize="sm"
            fontWeight={600}
            onClick={() => {
              window.open('mailto:support@superteamearn.com', '_blank');
              posthog.capture('get help_user menu');
            }}
          >
            Get Help
          </MenuItem>
          <MenuItem
            className="ph-no-capture"
            color="red.500"
            fontSize="sm"
            fontWeight={600}
            onClick={() => {
              posthog.capture('logout_user menu');
              logout();
            }}
          >
            Logout
          </MenuItem>
        </MenuList>
      </Menu>
    </>
  );
}
