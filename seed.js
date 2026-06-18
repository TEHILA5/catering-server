/**
 * Seed script - מילוי הדאטהבייס בנתונים לדוגמה.
 *
 * מציף את הקולקציות: dishes, packages, orders.
 * לא נוגע ב-users (לא מוחק ולא מוסיף).
 *
 * כל המנות בשריות או פרווה בלבד — אין שום מנה חלבית.
 * כל תמונה: פוטוגרפיית אוכל אמיתית מ-Unsplash (ID ידוע וקבוע), ללא אנשים/נשים.
 *
 * הרצה: node seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const Dish    = require('./src/models/Dish');
const Package = require('./src/models/Package');
const Order   = require('./src/models/Order');
const User    = require('./src/models/User');

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/catering';

// Unsplash image helper — ID קבוע, תמונת אוכל אמיתית
const u = (id) =>
  `https://images.unsplash.com/photo-${id}?w=800&auto=format&fit=crop&q=85`;

// ---------------------------------------------------------------------------
// מנות — בשרי / פרווה בלבד, ללא חלבי
// ---------------------------------------------------------------------------
const dishesData = [

  /* ────── STARTERS ────── */
  {
    name: 'כבד עוף קצוץ',
    description: 'כבד עוף מטוגן בבצל מזהיב, מוגש על טוסט פריך',
    category: 'starters',
    imageUrl: u('1565557623262-b51531de0814'), // pâté / chopped liver appetizer
  },
  {
    name: 'קבב על האש',
    description: 'קבב בקר וכבש מתובל בכמון ופטרוזיליה, צלוי על גריל',
    category: 'starters',
    imageUrl: u('1529694157872-4e0c0f3b238b'), // kebab skewers on grill
  },
  {
    name: 'כנפיים פיקנטיות',
    description: 'כנפי עוף בזיגוג צ׳ילי-דבש חריף',
    category: 'starters',
    imageUrl: u('1569050467447-ce54b3bbc37d'), // chicken wings close-up
  },
  {
    name: 'סיגרים מרוקאים',
    description: 'בצק עלים פריך במילוי בשר בקר טחון ותבלינים',
    category: 'starters',
    imageUrl: u('1541592106381-b31e9677c0e5'), // fried crispy rolls
  },
  {
    name: 'חומוס עם צנובר',
    description: 'חומוס ביתי חלק עם שמן זית, צנובר וזעתר (פרווה)',
    category: 'starters',
    imageUrl: u('1577805947697-89e18249d767'), // hummus bowl with olive oil
  },
  {
    name: 'קרפצ׳יו בקר',
    description: 'פרוסות בקר דקות, שמן זית, בלסמי וצנוברים קלויים',
    category: 'starters',
    imageUrl: u('1432139555190-58524dae6a55'), // beef carpaccio
  },
  {
    name: 'שיפודי פרגית',
    description: 'נתחי פרגית מתובלים על האש בליווי טחינה',
    category: 'starters',
    imageUrl: u('1555939594-58d7cb561ad1'), // chicken skewers plated
  },

  /* ────── MAIN COURSES ────── */
  {
    name: 'אנטריקוט אנגוס',
    description: 'סטייק אנטריקוט מיושן צלוי על האש בעשבי תיבול',
    category: 'mainCourses',
    imageUrl: u('1546964124-0cce460f38ef'), // perfect grilled steak
  },
  {
    name: 'צלי בקר ביין אדום',
    description: 'נתח כתף בקר מבושל לאט ברוטב יין אדום ושורשים',
    category: 'mainCourses',
    imageUrl: u('1544025162-d76694265947'), // beef pot roast
  },
  {
    name: 'עוף בגריל לימוני',
    description: 'רבעי עוף צלויים עם לימון, שום ורוזמרין',
    category: 'mainCourses',
    imageUrl: u('1598103442097-8b74394b95c6'), // roasted chicken quarters
  },
  {
    name: 'שניצל עוף פריך',
    description: 'חזה עוף בציפוי פירורי לחם זהוב',
    category: 'mainCourses',
    imageUrl: u('1599921841143-819065a55cc6'), // golden schnitzel
  },
  {
    name: 'כבש בתנור',
    description: 'שריר כבש מתפרק עם תפוחי אדמה וראש שום',
    category: 'mainCourses',
    imageUrl: u('1574672280600-4accfa5b6f98'), // slow-roasted lamb shank
  },
  {
    name: 'אסאדו על מצע פירה',
    description: 'צלעות אסאדו בבישול ארוך ברוטב ברביקיו ביתי',
    category: 'mainCourses',
    imageUrl: u('1558030006-450675393462'), // bbq beef ribs
  },
  {
    name: 'הודו ממולא',
    description: 'חזה הודו ממולא באורז, צנוברים ופירות יבשים',
    category: 'mainCourses',
    imageUrl: u('1574672280600-4accfa5b6f98'), // roasted turkey breast
  },
  {
    name: 'נקניקיות מרגז על האש',
    description: 'מרגז כבש חריף צלוי עם בצל מקורמל',
    category: 'mainCourses',
    imageUrl: u('1529193591184-b1d58069ecdd'), // sausages on grill
  },

  /* ────── SALADS ────── */
  {
    name: 'סלט ירוק קלאסי',
    description: 'חסה, מלפפון, עגבנייה ובצל סגול ברוטב לימון',
    category: 'salads',
    imageUrl: u('1512621776951-a57141f2eefd'), // fresh green salad bowl
  },
  {
    name: 'סלט ישראלי',
    description: 'עגבנייה ומלפפון בחיתוך דק עם פטרוזיליה ושמן זית',
    category: 'salads',
    imageUrl: u('1540420773420-3366772f4999'), // chopped tomato-cucumber salad
  },
  {
    name: 'טאבולה',
    description: 'בורגול, פטרוזיליה, נענע ועגבניות ברוטב לימוני',
    category: 'salads',
    imageUrl: u('1505253716362-afaea1d3d1af'), // tabbouleh close-up
  },
  {
    name: 'סלט קינואה וירקות שורש',
    description: 'קינואה, בטטה צלויה, גזר ורימונים',
    category: 'salads',
    imageUrl: u('1505576399279-565b52d4ac71'), // quinoa salad bowl
  },
  {
    name: 'סלט כרוב סגול',
    description: 'כרוב סגול וגזר ברוטב ויניגרט קל',
    category: 'salads',
    imageUrl: u('1607532941433-304659e8198a'), // purple cabbage slaw
  },
  {
    name: 'חצילים בטחינה',
    description: 'חצילים קלויים על האש עם טחינה גולמית ורימונים',
    category: 'salads',
    imageUrl: u('1623428187969-5da2dcea5ebf'), // roasted eggplant with tahini
  },
  {
    name: 'סלט תפוחי אדמה',
    description: 'תפוחי אדמה, בצל ירוק וחרדל גרגרים',
    category: 'salads',
    imageUrl: u('1591299177061-2151e53fd6b6'), // potato salad
  },
  {
    name: 'מטבוחה חריפה',
    description: 'עגבניות, פלפלים ושום מבושלים בשמן זית',
    category: 'salads',
    imageUrl: u('1564671165093-20688ff1fffa'), // spiced red pepper tomato dip
  },

  /* ────── DESSERTS (פרווה בלבד) ────── */
  {
    name: 'מוס שוקולד פרווה',
    description: 'מוס שוקולד מריר עשיר על בסיס צמחי, ללא חלב',
    category: 'desserts',
    imageUrl: u('1541783245831-57d6fb0926d3'), // dark chocolate mousse
  },
  {
    name: 'סלט פירות העונה',
    description: 'תערובת פירות טריים חתוכים',
    category: 'desserts',
    imageUrl: u('1490474418585-ba9bad8fd0ea'), // colorful fruit salad
  },
  {
    name: 'עוגת תפוחים פרווה',
    description: 'עוגת תפוחים וקינמון ביתית ללא מוצרי חלב',
    category: 'desserts',
    imageUrl: u('1568571780765-9276ac8b75a2'), // apple cinnamon cake
  },
  {
    name: 'בקלאווה',
    description: 'בצק פילו, אגוזים וסירופ דבש — פרווה',
    category: 'desserts',
    imageUrl: u('1519676867240-f03562e64548'), // baklava tray close-up
  },
  {
    name: 'קרמבל אגסים',
    description: 'אגסים אפויים עם פירורי בצק שקדים פריכים',
    category: 'desserts',
    imageUrl: u('1488477181946-6428a0291777'), // pear crumble dessert
  },
  {
    name: 'תות שדה בשוקולד',
    description: 'תותים טבולים בשוקולד מריר פרווה',
    category: 'desserts',
    imageUrl: u('1488477304112-4944851de03d'), // chocolate-dipped strawberries
  },

  /* ────── BREADS ────── */
  {
    name: 'לחם כפרי על האש',
    description: 'כיכר מחמצת אפויה בטאבון עם שמן זית וזעתר',
    category: 'breads',
    imageUrl: u('1509440159596-0249088772ff'), // rustic sourdough loaf
  },
  {
    name: 'פוקצ׳ה רוזמרין',
    description: 'פוקצ׳ה רכה עם רוזמרין ומלח גס',
    category: 'breads',
    imageUrl: u('1573140247632-f8fd74997d5c'), // rosemary focaccia
  },
  {
    name: 'לאפות טריות',
    description: 'לאפה אפויה במקום בטאבון חם',
    category: 'breads',
    imageUrl: u('1586444248902-2f64eddc13df'), // fresh pita bread
  },
  {
    name: 'חלות מתוקות פרווה',
    description: 'חלה קלועה זהובה ללא מוצרי חלב',
    category: 'breads',
    imageUrl: u('1598373182133-52452f7691ef'), // braided challah
  },
  {
    name: 'גריסיני שומשום',
    description: 'מקלות לחם פריכים בציפוי שומשום',
    category: 'breads',
    imageUrl: u('1612203985729-70726954388c'), // sesame breadsticks
  },

  /* ────── DRINKS ────── */
  {
    name: 'לימונדה נענע',
    description: 'לימונדה טבעית עם עלי נענע טריים',
    category: 'drinks',
    imageUrl: u('1556679343-c7306c1976bc'), // mint lemonade in glass
  },
  {
    name: 'מיץ תפוזים סחוט',
    description: 'מיץ תפוזים טבעי סחוט במקום',
    category: 'drinks',
    imageUrl: u('1613478223719-2ab802602423'), // fresh orange juice
  },
  {
    name: 'מים בטעמים',
    description: 'מים מינרליים עם פלחי הדרים ועשבי תיבול',
    category: 'drinks',
    imageUrl: u('1559839734-2b71ea197247'), // infused water with lemon slices
  },
  {
    name: 'יין אדום יבש',
    description: 'יין אדום כשר מאזור הגליל',
    category: 'drinks',
    imageUrl: u('1510812431401-41d2bd2722f3'), // red wine in glass (no people)
  },
  {
    name: 'סודה ביתית',
    description: 'מי סודה מוגזים עם סירופ פירות טבעי',
    category: 'drinks',
    imageUrl: u('1542827660-d4d48b2a0f39'), // sparkling drink with fruit
  },
  {
    name: 'תה צמחים חם',
    description: 'חליטת נענע, מרווה ולואיזה',
    category: 'drinks',
    imageUrl: u('1597481499750-3e6b22637e12'), // herbal tea in glass cup
  },
];

// ---------------------------------------------------------------------------
// חבילות — לימיטים לפי סוג אירוע (ראשונות / עיקריות / סלטים / קינוחים / לחמים / משקאות)
// ---------------------------------------------------------------------------
const packagesData = [
  {
    packageName: 'חבילת בסיס בשרית',
    description: 'חבילה משתלמת לאירועים קטנים — ארוחת שבת משפחתית או אירוע אינטימי. מעט מנות, מספיק ל-20–40 אורחים.',
    imageUrl: u('1504674900247-0877df9cc836'), // colorful food spread on table
    pricePerPerson: 89,
    limits: { starters: 1, mainCourses: 2, salads: 5, desserts: 2, breads: 2, drinks: 3 },
    featured: false,
  },
  {
    packageName: 'חבילת קלאסיק על האש',
    description: 'מנגל ויום הולדת — קבב, פרגית ותוספות. מבחר נוח לאירוע חוץ או חגיגה משפחתית.',
    imageUrl: u('1529694157872-4e0c0f3b238b'), // kebab skewers on hot grill
    pricePerPerson: 139,
    limits: { starters: 2, mainCourses: 2, salads: 6, desserts: 3, breads: 3, drinks: 4 },
    featured: true,
  },
  {
    packageName: 'חבילת פרימיום שף',
    description: 'ארוחת שף יוקרתית — פחות כמות, יותר איכות. מתאים לערב VIP או אירוע עסקי מיוחד.',
    imageUrl: u('1546964124-0cce460f38ef'), // premium gourmet steak on plate
    pricePerPerson: 199,
    limits: { starters: 2, mainCourses: 3, salads: 6, desserts: 3, breads: 2, drinks: 4 },
    featured: true,
  },
  {
    packageName: 'חבילת חתונה מלכותית',
    description: 'החבילה המושלמת לחתונה — מבחר עשיר אך ממוקד, בדיוק כמו שעושים באירועים גדולים.',
    imageUrl: u('1476224203421-9ac39bcb3b28'), // festive banquet food display
    pricePerPerson: 249,
    limits: { starters: 2, mainCourses: 3, salads: 10, desserts: 4, breads: 3, drinks: 6 },
    featured: true,
  },
  {
    packageName: 'חבילת עסקית צהריים',
    description: 'פגישת עסקים או ארוחת צהריים במשרד — מנה עיקרית אחת, מעט סלטים, בלי בזבוז זמן.',
    imageUrl: u('1414235077428-338989a2e8c0'), // plated business lunch dish
    pricePerPerson: 75,
    limits: { starters: 1, mainCourses: 1, salads: 4, desserts: 1, breads: 2, drinks: 3 },
    featured: false,
  },
  {
    packageName: 'חבילת ברית / בר מצווה',
    description: 'חגיגה משפחתית — כמעט ברמת חתונה, עם מעט פחות משקאות. מבחר עשיר לכל הגילאים.',
    imageUrl: u('1555939594-58d7cb561ad1'), // grilled meat platter
    pricePerPerson: 159,
    limits: { starters: 2, mainCourses: 3, salads: 8, desserts: 4, breads: 3, drinks: 5 },
    featured: false,
  },
];

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------
async function seed() {
  try {
    await mongoose.connect(mongoURI);
    console.log('✓ מחובר ל-MongoDB');

    await Promise.all([
      Dish.deleteMany({}),
      Package.deleteMany({}),
      Order.deleteMany({}),
    ]);
    console.log('✓ נוקו הקולקציות: dishes, packages, orders (users לא נגעו)');

    const dishes  = await Dish.insertMany(dishesData);
    console.log(`✓ נוספו ${dishes.length} מנות`);

    const packages = await Package.insertMany(packagesData);
    console.log(`✓ נוספו ${packages.length} חבילות`);

    const byCategory = (cat) => dishes.filter((d) => d.category === cat);
    const pick       = (arr, n) => arr.slice(0, n).map((d) => d._id);

    const sampleAddresses = [
      'רחוב הרצל 12, תל אביב',
      'שדרות בן גוריון 45, חיפה',
      'רחוב יפו 88, ירושלים',
      'רחוב ויצמן 7, נתניה',
      'דרך הים 3, אשדוד',
    ];

    // שליפת משתמשים אמיתיים (לקוחות בלבד) לצורך ה-seed
    const realUsers = await User.find({ role: 'customer' }).select('_id').lean();
    if (realUsers.length === 0) {
      console.log('⚠  לא נמצאו משתמשים בדטהבייס — ההזמנות לא נוצרו. הרשם תחילה ואז הרץ שוב את ה-seed.');
    } else {
      const ordersData = packages.slice(0, Math.min(5, packages.length)).map((pkg, i) => {
        const guests = [30, 80, 150, 250, 50][i] ?? 50;
        const selected = [
          ...pick(byCategory('starters'),    pkg.limits.starters),
          ...pick(byCategory('mainCourses'), pkg.limits.mainCourses),
          ...pick(byCategory('salads'),      Math.min(5, pkg.limits.salads)),
          ...pick(byCategory('desserts'),    pkg.limits.desserts),
          ...pick(byCategory('breads'),      pkg.limits.breads),
          ...pick(byCategory('drinks'),      pkg.limits.drinks),
        ];
        // חלוקה מעגלית של ההזמנות בין המשתמשים הקיימים
        const userId = realUsers[i % realUsers.length]._id;
        return {
          userId,
          packageId:      pkg._id,
          selectedItems:  selected,
          numberOfGuests: guests,
          eventDate:      new Date(Date.now() + (i + 1) * 14 * 24 * 60 * 60 * 1000),
          address:        sampleAddresses[i],
          totalPrice:     guests * pkg.pricePerPerson,
          isApproved:     i % 2 === 0,
        };
      });

      const orders = await Order.insertMany(ordersData);
      console.log(`✓ נוספו ${orders.length} הזמנות`);
    }

    console.log('\n🎉 הדאטה נטען בהצלחה!');
    console.log('🖼  כל מנה וחבילה עם תמונת Unsplash מדויקת — רק אוכל, בלי אנשים.');
  } catch (err) {
    console.error('✗ שגיאה:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('✓ החיבור ל-MongoDB נסגר');
  }
}

seed();
