export const samsungHealthIntegration = {
  appName: "Samsung Health",
  // Android intent URI improves launch reliability in Chromium-based mobile browsers.
  deepLinkUrl: "intent://launch/#Intent;scheme=shealth;package=com.sec.android.app.shealth;end",
  fallbackWebUrl: "https://www.samsung.com/global/galaxy/apps/samsung-health/",
};

export const spotifyIntegration = {
  appName: "Spotify",
  deepLinkUrl: "spotify://",
  fallbackWebUrl: "https://open.spotify.com/",
};
