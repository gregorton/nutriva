/**
 * The 77 provinces, for the one `<select>` on the checkout address form.
 *
 * A plain list rather than a package: a province is not going to change, and this project runs on
 * five dependencies. Names are the standard English transcriptions; Bangkok is first because most
 * orders are metro, and the delivery estimate reads the metro window for it.
 */
export const BANGKOK_PROVINCE = "Bangkok";

export const PROVINCES = [
  "Bangkok",
  "Amnat Charoen",
  "Ang Thong",
  "Bueng Kan",
  "Buri Ram",
  "Chachoengsao",
  "Chai Nat",
  "Chaiyaphum",
  "Chanthaburi",
  "Chiang Mai",
  "Chiang Rai",
  "Chon Buri",
  "Chumphon",
  "Kalasin",
  "Kamphaeng Phet",
  "Kanchanaburi",
  "Khon Kaen",
  "Krabi",
  "Lampang",
  "Lamphun",
  "Loei",
  "Lop Buri",
  "Mae Hong Son",
  "Maha Sarakham",
  "Mukdahan",
  "Nakhon Nayok",
  "Nakhon Pathom",
  "Nakhon Phanom",
  "Nakhon Ratchasima",
  "Nakhon Sawan",
  "Nakhon Si Thammarat",
  "Nan",
  "Narathiwat",
  "Nong Bua Lam Phu",
  "Nong Khai",
  "Nonthaburi",
  "Pathum Thani",
  "Pattani",
  "Phang Nga",
  "Phatthalung",
  "Phayao",
  "Phetchabun",
  "Phetchaburi",
  "Phichit",
  "Phitsanulok",
  "Phra Nakhon Si Ayutthaya",
  "Phrae",
  "Phuket",
  "Prachin Buri",
  "Prachuap Khiri Khan",
  "Ranong",
  "Ratchaburi",
  "Rayong",
  "Roi Et",
  "Sa Kaeo",
  "Sakon Nakhon",
  "Samut Prakan",
  "Samut Sakhon",
  "Samut Songkhram",
  "Saraburi",
  "Satun",
  "Si Sa Ket",
  "Sing Buri",
  "Songkhla",
  "Sukhothai",
  "Suphan Buri",
  "Surat Thani",
  "Surin",
  "Tak",
  "Trang",
  "Trat",
  "Ubon Ratchathani",
  "Udon Thani",
  "Uthai Thani",
  "Uttaradit",
  "Yala",
  "Yasothon",
] as const;

/**
 * Metro Bangkok for delivery purposes: the capital and the provinces its courier network treats
 * as same-day reach. Everything else takes the upcountry window.
 */
const METRO = new Set(["Bangkok", "Nonthaburi", "Pathum Thani", "Samut Prakan"]);

export function isMetro(province: string): boolean {
  return METRO.has(province);
}
