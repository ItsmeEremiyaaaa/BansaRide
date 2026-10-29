// Sample Bisaya text. A local Bisaya speaker should check these words before launch.
const dict = {
  en: {
    title: 'Where\nto?', whereTo: 'WHERE TO?', from: 'From', to: 'To', chooseTo: 'Choose a destination',
    towns: 'Other towns', saved: 'Saved routes', recent: 'Recently viewed', popular: 'Popular destinations',
    home: 'Home', routes: 'Routes', map: 'Map', drivers: 'Drivers', fares: 'Fares',
    savedEmpty: 'Tap the star on a route to save it here.',
    noRoute: 'No route for this pair yet. We are adding more.',
    quickMap: 'Map', quickRoutes: 'Routes', quickFares: 'Fares', quickTowns: 'Towns',
    seeAll: 'See all routes', seeAllTowns: 'See all towns',
    inBansalan: 'In Bansalan', otherTowns: 'Other towns', runningNow: 'Running now', notRunning: 'Not running', lastRide: 'last ride', firstRide: 'first ride', regular: 'Regular', student: 'Student', yourFare: 'Your fare',
  },
  bis: {
    title: 'Asa\nta?', whereTo: 'ASA TA?', from: 'Gikan', to: 'Padulong', chooseTo: 'Pili ug padulngan',
    towns: 'Ubang lungsod', saved: 'Gitipigan nga mga ruta', recent: 'Bag-o lang gitan-aw', popular: 'Sikat nga padulngan',
    home: 'Balay', routes: 'Ruta', map: 'Mapa', drivers: 'Drayber', fares: 'Plete',
    savedEmpty: 'Pislita ang bituon sa ruta aron tipigan dinhi.',
    noRoute: 'Wala pay ruta niining duha. Nagdugang pa mi.',
    quickMap: 'Mapa', quickRoutes: 'Ruta', quickFares: 'Plete', quickTowns: 'Lungsod',
    seeAll: 'Tan-awa ang tanang ruta', seeAllTowns: 'Tan-awa ang tanang lungsod',
    inBansalan: 'Sa Bansalan', otherTowns: 'Ubang lungsod', runningNow: 'Naglakaw karon', notRunning: 'Wala pa maglakaw', lastRide: 'katapusang biyahe', firstRide: 'unang biyahe', regular: 'Regular', student: 'Estudyante', yourFare: 'Imong plete',
  },
}

export function translate(lang, key) {
  return (dict[lang] && dict[lang][key]) || dict.en[key] || key
}
