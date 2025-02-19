export const getBannerReference = () => {
    if (window.location.hostname.includes('localhost')) {
      return 'assets/fixtures/nws_banner.png';
    }
  
    return '/drone-simulation-cte-alpha/assets/fixtures/nws_banner.png';
};
