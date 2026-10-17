import { useId, useMemo, useState } from "react";
import { getCountries, getCountryCallingCode, parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";
import { cn } from "@/lib/utils";

const names = new Intl.DisplayNames(["fr"], { type: "region" });
const countryOptions = getCountries()
  .map((code) => ({ code, label: names.of(code) ?? code, callingCode: getCountryCallingCode(code) }))
  .sort((a, b) => a.label.localeCompare(b.label, "fr"));

function flag(code: CountryCode) {
  return code.split("").map((letter) => String.fromCodePoint(127397 + letter.charCodeAt(0))).join("");
}

function initialCountry(value: string): CountryCode {
  return parsePhoneNumberFromString(value)?.country ?? "CD";
}

export function PhoneInput({ value, onChange, onBlur, id, error, className }: {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  id?: string;
  error?: boolean;
  className?: string;
}) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [country, setCountry] = useState<CountryCode>(() => initialCountry(value));
  const [national, setNational] = useState(() => parsePhoneNumberFromString(value)?.formatNational() ?? value);
  const selected = useMemo(() => countryOptions.find((option) => option.code === country), [country]);

  const updateNational = (text: string, code: CountryCode = country) => {
    setNational(text);
    const parsed = parsePhoneNumberFromString(text, code);
    onChange(parsed?.isValid() ? parsed.number : "");
  };

  return (
    <div className={cn("flex min-w-0 gap-2", className)}>
      <label htmlFor={`${inputId}-country`} className="sr-only">Indicatif du pays</label>
      <select
        id={`${inputId}-country`}
        aria-label={`Indicatif du pays : ${selected?.label ?? country}, +${selected?.callingCode ?? getCountryCallingCode(country)}`}
        className="field-input !w-[116px] shrink-0 !px-2 sm:!w-[160px]"
        value={country}
        onChange={(event) => {
          const next = event.target.value as CountryCode;
          setCountry(next);
          updateNational(national, next);
        }}
      >
        {countryOptions.map((option) => (
          <option key={option.code} value={option.code}>
            {flag(option.code)} +{option.callingCode}
          </option>
        ))}
      </select>
      <div className="min-w-0 flex-1">
        <label htmlFor={inputId} className="sr-only">Numéro de téléphone sans indicatif</label>
        <input
          id={inputId}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={national}
          onChange={(event) => updateNational(event.target.value)}
          onBlur={onBlur}
          aria-invalid={error || undefined}
          aria-label={`Numéro de téléphone en ${selected?.label ?? country}, indicatif +${selected?.callingCode ?? getCountryCallingCode(country)}`}
          placeholder={country === "CD" ? "812 345 678" : "Numéro local"}
          className="field-input"
        />
      </div>
    </div>
  );
}
