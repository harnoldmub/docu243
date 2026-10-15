const regionNames = new Intl.DisplayNames(["fr"], { type: "region" });

export const countries = Array.from({ length: 26 * 26 }, (_, index) =>
  String.fromCharCode(65 + Math.floor(index / 26), 65 + (index % 26)),
)
  .filter((code) => regionNames.of(code) !== code && !["AC", "CP", "DG", "EA", "EU", "IC", "QO", "TA", "UN", "XA", "XB", "XK", "ZZ"].includes(code))
  .map((code) => ({ code, name: regionNames.of(code) ?? code }))
  .sort((a, b) => a.name.localeCompare(b.name, "fr"));

export function countryName(code: string | null | undefined) {
  return countries.find((country) => country.code === code)?.name ?? code ?? "Non renseigné";
}
