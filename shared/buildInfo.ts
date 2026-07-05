const normalizeBuildNumber = (value?: string) => {
  const buildNumber = value?.trim();
  if (!buildNumber || !/^\d+$/.test(buildNumber)) return null;
  return buildNumber.replace(/^0+(?=\d)/, '');
};

export const formatBuildVersion = (packageVersion: string, buildNumber?: string) => {
  const match = packageVersion
    .trim()
    .replace(/^v/, '')
    .match(/^(\d+)\.(\d+)/);
  const baseVersion = match ? match[1] + '.' + match[2] : '0.0';
  return baseVersion + '.' + (normalizeBuildNumber(buildNumber) || 'dev');
};
