// A weak phone (about 2 GB of memory or less, or 4 cores or fewer) gets a calmer app: no moving clouds, no blur, no animations, no 3D map.
// Browsers that do not report these (iPhone Safari, Firefox) are treated as strong.
export const lite = typeof navigator !== 'undefined' && (navigator.deviceMemory <= 2 || navigator.hardwareConcurrency <= 4)
if (lite) document.documentElement.classList.add('lite')
