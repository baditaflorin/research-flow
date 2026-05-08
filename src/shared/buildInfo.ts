export const buildInfo = {
  version: __APP_VERSION__,
  commit: __APP_COMMIT__,
  fullCommit: __APP_FULL_COMMIT__,
  repositoryUrl: __APP_REPOSITORY_URL__,
  paypalUrl: __APP_PAYPAL_URL__,
  pagesUrl: __APP_PAGES_URL__
} as const;

export function commitUrl() {
  if (buildInfo.fullCommit === "local") return buildInfo.repositoryUrl;
  return `${buildInfo.repositoryUrl}/commit/${buildInfo.fullCommit}`;
}
