export const getImagePrefix = (image) => {
    if (window.location.hostname.includes('localhost')) {
      return 'public/assets/' + image;
    }

    return '/drone-simulation-cte-alpha/assets/' + image;
};

export const projects = () => {
    return []
}






