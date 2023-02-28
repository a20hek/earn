import axios from 'axios';
import { v4 as uuidV4 } from 'uuid';
import { SponsorStore } from '../store/sponsor';
//types
import { SponsorType } from '../interface/sponsor';
import { Bounties, GrantsType, JobsType } from '../interface/listings';
import { genrateuuid } from './helpers';

const Backend_Url = process.env.NEXT_PUBLIC_BACKEND_URL;

export const createUser = async (publickey: string) => {
  const id = uuidV4();
  try {
    const res = await axios.post(`${Backend_Url}/user/create`, {
      id: id,
      publickey,
    });
    return res.data;
  } catch (e) {
    console.log(e);
    return null;
  }
};
export const UpdateUser = async (id: string, update: any) => {
  try {
    const res = await axios.patch(`${Backend_Url}/user/update`, {
      id: id,
      update,
    });
    return res;
  } catch (e) {
    console.log(e);
    return null;
  }
};
export const genrateOtp = async (publicKey: string, email: string) => {
  try {
    const res = await axios.post(`${Backend_Url}/email/totp`, {
      publicKey,
      email,
    });
    return res.headers.get;
  } catch (e) {
    console.log(e);
    return null;
  }
};
// Sponsors
export const createSponsor = async (sponsor: SponsorType) => {
  try {
    const res = await axios.post(`${Backend_Url}/sponsor/create`, {
      ...sponsor,
    });
    return res.data;
  } catch (e) {
    console.log(e);
    return null;
  }
};

export const findSponsors = async (publicKey: string) => {
  if (!publicKey) return null;
  try {
    const { data } = await axios.get(
      `${Backend_Url}/sponsor/find?publickey=${publicKey}`
    );
    SponsorStore.setState({
      currentSponsor: data.data[0],
    });
    return data.data ?? [];
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const findSponsorListing = async (orgId: string) => {
  if (!orgId) {
    throw new Error('orgId undefined!');
  }
  let res = await axios.get(`${Backend_Url}/listings/find?orgId=${orgId}`);
  return res.data.data;
};

export const findSponsorDrafts = async (orgId: string) => {
  if (!orgId) {
    throw new Error('orgId undefined!');
  }
  let res = await axios.get(`${Backend_Url}/drafts/findall?orgId=${orgId}`);
  return res.data.data;
};

export const findTeam = async (id: string) => {
  if (!id) return null;
  try {
    const { data } = await axios.get(`${Backend_Url}/sponsor/team?id=${id}`);

    return data.data ?? [];
  } catch (error) {
    console.log(error);
    return null;
  }
};

// Bounties
export const createBounty = async (
  bounties: Bounties,
  sponsor: SponsorType
) => {
  try {
    const { data } = await axios.post(`${Backend_Url}/listings/bounty/create`, {
      id: genrateuuid(),
      title: bounties.title,
      token: bounties.token,
      slug: bounties.title.split(' ').join().toLowerCase(),
      deadline: bounties.deadline,
      description: bounties.description,
      sponsorStatus: bounties.sponsorStatus,
      featured: bounties.featured,
      orgId: sponsor.orgId,
      skills: bounties.skills,
      subSkills: bounties.subSkills,
      prizeList: bounties.prizeList,
      active: bounties.active,
      private: false,
      amount: bounties.amount,
      eligibility: bounties.eligibility,
    });
    return data;
  } catch (e) {
    console.log(e);
    return null;
  }
};

export const createJob = async (jobs: JobsType) => {
  try {
    const res = await axios.post(`${Backend_Url}/listings/job/create`, {
      ...jobs,
    });
    return res;
  } catch (error) {
    console.log(error);

    return null;
  }
};
export const createGrants = async (grants: GrantsType) => {
  try {
    const res = await axios.post(`${Backend_Url}/listings/grants/create`, {
      ...grants,
    });
    return res;
  } catch (error) {
    console.log(error);

    return null;
  }
};
