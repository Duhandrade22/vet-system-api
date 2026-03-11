import dns from "dns/promises";

export const emailDomainExists = async (email) => {
  const domain = email.split("@")[1];
  try {
    await dns.resolveMx(domain);
    return true;
  } catch (error) {
    return false;
  }
};
