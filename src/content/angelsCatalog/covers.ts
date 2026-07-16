// Bundled album covers, keyed by catalog `code`. Only these albums ship real
// cover art in the app (assets/angels/art/*.webp); every other album falls back
// to procedural celestial art. React Native require() needs string literals, so
// this map is explicit (mirrors heroBannerImages / personaImages).
export const CATALOG_COVERS: Record<string, number> = {
  ANSMX01001EN: require('../../../assets/angels/art/ANSMX01001EN.webp'),
  ANSMX01002EN: require('../../../assets/angels/art/ANSMX01002EN.webp'),
  ANSMX01003EN: require('../../../assets/angels/art/ANSMX01003EN.webp'),
  ANSMX01004EN: require('../../../assets/angels/art/ANSMX01004EN.webp'),
  ANSMX01005EN: require('../../../assets/angels/art/ANSMX01005EN.webp'),
  ANSMX01006EN: require('../../../assets/angels/art/ANSMX01006EN.webp'),
  ANSMX01007EN: require('../../../assets/angels/art/ANSMX01007EN.webp'),
  ANSMX01008EN: require('../../../assets/angels/art/ANSMX01008EN.webp'),
  ANSMX01009EN: require('../../../assets/angels/art/ANSMX01009EN.webp'),
  ANSMX02001EN: require('../../../assets/angels/art/ANSMX02001EN.webp'),
  ANSMX02002EN: require('../../../assets/angels/art/ANSMX02002EN.webp'),
  ANSMX2003EN: require('../../../assets/angels/art/ANSMX2003EN.webp'),
  ANSMX02004EN: require('../../../assets/angels/art/ANSMX02004EN.webp'),
  ANSMX02005EN: require('../../../assets/angels/art/ANSMX02005EN.webp'),
};

/** Bundled cover for a catalog code, or undefined to fall back to celestial art. */
export function catalogCover(code: string): number | undefined {
  return CATALOG_COVERS[code];
}
