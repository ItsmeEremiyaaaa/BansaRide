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
    'Motorcycle': 'Motorsiklo', 'Mini bus': 'Mini bus', '61 streets': '61 ka dalan', '24 barangays and sitios': '24 ka barangay ug sitio', 'Works offline': 'Molihok bisan walay signal', 'Student −20%': 'Estudyante −20%', 'Senior −20%': 'Senior −20%', 'PWD −20%': 'PWD −20%',
    'Riding tonight?': 'Mosakay ka karong gabii?', 'Most pedicabs are gone. Nearest with drivers': 'Wala nay pedikab. Labing duol nga naay drayber', 'Most pedicabs are gone after 8 PM. See who is still around.': 'Wala nay pedikab human sa 8 PM. Tan-awa kinsay naa pa.',
    'Drivers waiting here': 'Mga drayber nga naghulat dinhi', 'Getting there': 'Pag-adto', 'Where they go': 'Asa sila moadto', 'What riders say': 'Unsay ingon sa mga sakay', 'Rides': 'Mga biyahe', 'See on the map': 'Tan-awa sa mapa',
    'How far from you': 'Pila ka layo gikan nimo', 'Show on map': 'Ipakita sa mapa', 'Directions': 'Direksyon', 'Contact': 'Kontak', "Nearest drivers' stand": 'Labing duol nga hulaton sa drayber', 'Ask the driver': 'Pangutan-a ang drayber', 'Possible fare': 'Posibleng plete', 'You are here': 'Naa ka dinhi',
    'Closed now': 'Sirado karon', 'Drivers around': 'Naay drayber', 'A few around': 'Gamay ra ang naa', 'Drivers around now': 'Naay drayber karon', 'Walk': 'Lakaw', 'Tricycle': 'Traysikol', 'Waiting spot': 'Hulaton',
    'Welcome to BansaRide': 'Maayong pag-abot sa BansaRide', 'Your ride and fare guide for Bansalan, Davao del Sur. Tricycle, pedicab, motorcycle, bus and van, all in one place.': 'Imong giya sa sakyanan ug plete sa Bansalan, Davao del Sur. Traysikol, pedikab, motorsiklo, bus ug van, naa tanan dinhi.',
    'A real map of Bansalan': 'Tinuod nga mapa sa Bansalan', 'Real streets, barangays and roads from OpenStreetMap. Once you have opened it, the map keeps working with no signal.': 'Tinuod nga mga dalan, barangay ug karsada gikan sa OpenStreetMap. Kung naabli na, molihok gihapon ang mapa bisan walay signal.',
    'Know your fare first': 'Alamin una ang plete', 'See what a ride costs for a student, a senior or an adult, and when the bus, van and mini bus run. No more guessing.': 'Tan-awa ang plete sa estudyante, senior o hamtong, ug kanus-a nagbiyahe ang bus, van ug mini bus. Wala nay panghuna-huna.',
    'Drivers near you, live': 'Mga drayber duol nimo, live', 'Find the nearest BTODA waiting spot and how far it is. The distance updates as you walk.': 'Pangitaa ang labing duol nga hulaton sa BTODA ug unsa kalayo. Mag-usab ang gilay-on kung naglakaw ka.',
    'Skip': 'Laktaw', 'Next': 'Sunod', 'Sign in': 'Sulod', 'Open the app': 'Ablihi ang app', 'Continue as guest': 'Padayon isip bisita',
    'Menu': 'Menu', 'Fare check': 'Susiha ang plete', 'Fare list': 'Listahan sa plete', 'Account': 'Account', 'Report a problem': 'Ireport ang problema',
    'Visiting Bansalan': 'Pagbisita sa Bansalan', 'Ride alerts': 'Mga pahibalo sa biyahe', 'Poster': 'Poster', 'Towns': 'Mga lungsod', 'Drivers': 'Mga drayber', 'Routes': 'Mga ruta',
    'Rides and places': 'Mga sakyanan ug lugar', 'Drivers and waiting spots': 'Mga drayber ug hulaton', 'You': 'Ikaw', 'Tools': 'Mga himan',
    'All routes': 'Tanang ruta', 'Tricycle and pedicab': 'Traysikol ug pedikab', 'Motorcycles': 'Mga motorsiklo', 'Streets and roads': 'Mga dalan',
    'Barangays and sitios': 'Mga barangay ug sitio', 'Other towns': 'Ubang lungsod', 'BTODA groups': 'Mga grupo sa BTODA', 'Street waiting spots': 'Hulaton sa mga dalan',
    'Add a waiting spot': 'Dugangi ug hulaton', 'Find on the map': 'Pangitaa sa mapa', 'Account and discount': 'Account ug discount',
    'Share this ride': 'I-share ang biyahe', 'Read aloud': 'Basaha ug kusog', 'Return trip': 'Balik nga biyahe',
    inBansalan: 'Sa Bansalan', otherTowns: 'Ubang lungsod', runningNow: 'Naglakaw karon', notRunning: 'Wala pa maglakaw', lastRide: 'katapusang biyahe', firstRide: 'unang biyahe', regular: 'Regular', student: 'Estudyante', yourFare: 'Imong plete',
  },
}

export function translate(lang, key) {
  return (dict[lang] && dict[lang][key]) || dict.en[key] || key
}
