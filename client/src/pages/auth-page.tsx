import { useEffect, useId, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { Controller, useForm, type UseFormRegisterReturn } from "react-hook-form";
import { isValidPhoneNumber } from "libphonenumber-js";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useAuth, isStaffRole, type User } from "@/hooks/use-auth";
import { ApiError } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Picture } from "@/components/picture";
import { safeNext } from "@/lib/auth-links";
import { cn } from "@/lib/utils";
import { PhoneInput } from "@/components/phone-input";
import { Logo } from "@/components/header";

const loginSchema = z.object({
  email: z.string().trim().min(1, "Indiquez votre adresse e-mail.").email("Cette adresse e-mail n'est pas valide."),
  password: z.string().min(1, "Indiquez votre mot de passe."),
});

const registerSchema = z.object({
  prenom: z.string().trim().min(2, "Indiquez votre prénom (2 caractères minimum)."),
  nom: z.string().trim().min(2, "Indiquez votre nom (2 caractères minimum)."),
  email: z.string().trim().min(1, "Indiquez votre adresse e-mail.").email("Cette adresse e-mail n'est pas valide."),
  phone: z.string().refine((value) => isValidPhoneNumber(value), "Indiquez un numéro de téléphone valide."),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const mode = params.get("mode") === "register" ? "register" : "login";
  const next = params.get("next");
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const destination = (u: User) => safeNext(next, isStaffRole(u.role) ? "/admin" : "/dashboard");

  useEffect(() => {
    if (user) setLocation(destination(user), { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    document.title = `${mode === "register" ? "Créer mon compte" : "Connexion"} — MesDémarches`;
  }, [mode]);

  const tabHref = (m: "login" | "register") => {
    const p = new URLSearchParams({ mode: m });
    if (next) p.set("next", next);
    return `/auth?${p.toString()}`;
  };

  return (
    <div className="grid min-h-svh lg:grid-cols-[0.95fr_1.05fr]">
      <div className="on-blue relative hidden overflow-hidden bg-brand-royal lg:block">
        <Picture
          name="connexion"
          sizes="45vw"
          className="absolute inset-0"
          imgClassName="object-[50%_20%]"
          alt=""
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-night/90 via-brand-night/50 to-transparent p-10 pt-32 text-white">
          <p className="display-2 max-w-md">Vos démarches, simplement.</p>
          <p className="mt-3 max-w-md text-white/85">Un compte pour transmettre vos dossiers et suivre chaque étape depuis votre téléphone.</p>
        </div>
        <div className="absolute right-0 top-10 h-24 w-4 rounded-l-md bg-brand-yellow" aria-hidden="true" />
      </div>

      <div className="flex items-start justify-center bg-white px-4 py-8 sm:px-8 lg:items-center lg:py-12">
        <div className="w-full max-w-[440px]">
          <div className="mb-8 flex items-center justify-between gap-4">
            <Link href="/" aria-label="MesDémarches, accueil" className="rounded-lg"><Logo className="h-8 sm:h-9" /></Link>
            <Link href="/" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-brand-ink-2 hover:text-brand-ink"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Accueil</Link>
          </div>
          <h1 className="display-2 text-brand-ink">{mode === "register" ? "Créer mon compte" : "Me connecter"}</h1>
          <p className="mt-2 text-brand-ink-2">
            {mode === "register" ? "Quelques informations suffisent. Vous pourrez ensuite commencer vos démarches." : "Accédez à vos dossiers et à vos documents."}
          </p>

          <nav aria-label="Choisir entre connexion et inscription" className="mt-8 grid grid-cols-2 rounded-xl bg-brand-mist p-1">
            {(["login", "register"] as const).map((m) => (
              <Link
                key={m}
                href={tabHref(m)}
                replace
                aria-current={mode === m ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center justify-center rounded-lg text-[0.9375rem] font-semibold transition-colors duration-150",
                  mode === m ? "bg-white text-brand-ink shadow-card" : "text-brand-ink-2 hover:text-brand-ink",
                )}
              >
                {m === "login" ? "Connexion" : "Inscription"}
              </Link>
            ))}
          </nav>

          <div className="mt-8">
            {mode === "login" ? <LoginForm onDone={(u) => setLocation(destination(u))} /> : <RegisterForm onDone={(u) => setLocation(destination(u))} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function FormAlert({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" className="flex gap-3 rounded-xl border border-[var(--st-danger)]/25 bg-[var(--st-danger-bg)] p-4 text-[0.9375rem] text-brand-ink">
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--st-danger)]" aria-hidden="true" />
      {message}
    </div>
  );
}

function Field({
  label,
  error,
  hint,
  registration,
  type = "text",
  autoComplete,
  inputMode,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  registration: UseFormRegisterReturn;
  type?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  children?: React.ReactNode;
}) {
  const id = useId();
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block font-semibold text-brand-ink">
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="mb-2 text-sm text-brand-ink-2">
          {hint}
        </p>
      )}
      <div className="relative">
        <input
          id={id}
          type={type}
          autoComplete={autoComplete}
          inputMode={inputMode}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn("field-input", children && "pr-14")}
          {...registration}
        />
        {children}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-[var(--st-danger)]">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" /> {error}
        </p>
      )}
    </div>
  );
}

function PasswordToggle({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={shown ? "Masquer le mot de passe" : "Afficher le mot de passe"}
      aria-pressed={shown}
      className="absolute inset-y-0 right-1 my-auto flex h-11 w-11 items-center justify-center rounded-lg text-brand-ink-2 hover:bg-brand-mist hover:text-brand-ink"
    >
      {shown ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
    </button>
  );
}

function LoginForm({ onDone }: { onDone: (u: User) => void }) {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = async (values: LoginValues) => {
    setServerError(null);
    try {
      onDone(await login(values));
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "La connexion a échoué.");
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-5">
      <FormAlert message={serverError} />
      <Field label="Adresse e-mail" type="email" autoComplete="email" error={errors.email?.message} registration={form.register("email")} />
      <Field
        label="Mot de passe"
        type={showPassword ? "text" : "password"}
        autoComplete="current-password"
        error={errors.password?.message}
        registration={form.register("password")}
      >
        <PasswordToggle shown={showPassword} onToggle={() => setShowPassword((v) => !v)} />
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
        Se connecter
      </Button>
      <p className="text-sm text-brand-ink-2">
        Mot de passe oublié ? La réinitialisation en ligne n'est pas encore disponible.{" "}
        <Link href="/aide#compte" className="font-semibold text-brand-royal underline underline-offset-4">
          Que faire ?
        </Link>
      </p>
    </form>
  );
}

function RegisterForm({ onDone }: { onDone: (u: User) => void }) {
  const { register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { prenom: "", nom: "", email: "", phone: "", password: "" },
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = async (values: RegisterValues) => {
    setServerError(null);
    try {
      onDone(await register(values));
    } catch (e) {
      const field = e instanceof ApiError ? (e.data.field as keyof RegisterValues | undefined) : undefined;
      if (field && field in values) form.setError(field, { message: (e as Error).message }, { shouldFocus: true });
      else setServerError(e instanceof Error ? e.message : "L'inscription a échoué.");
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-5">
      <FormAlert message={serverError} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Prénom" autoComplete="given-name" error={errors.prenom?.message} registration={form.register("prenom")} />
        <Field label="Nom" autoComplete="family-name" error={errors.nom?.message} registration={form.register("nom")} />
      </div>
      <Field label="Adresse e-mail" type="email" autoComplete="email" error={errors.email?.message} registration={form.register("email")} />
      <div>
        <label htmlFor="register-phone" className="mb-1.5 block font-semibold text-brand-ink">Téléphone</label>
        <p className="mb-2 text-sm text-brand-ink-2">Choisissez l'indicatif, puis saisissez votre numéro local.</p>
        <Controller control={form.control} name="phone" render={({ field }) => (
          <PhoneInput id="register-phone" value={field.value} onChange={field.onChange} onBlur={field.onBlur} error={!!errors.phone} />
        )} />
        {errors.phone && <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-[var(--st-danger)]"><AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />{errors.phone.message}</p>}
      </div>
      <Field
        label="Mot de passe"
        type={showPassword ? "text" : "password"}
        autoComplete="new-password"
        hint="8 caractères minimum."
        error={errors.password?.message}
        registration={form.register("password")}
      >
        <PasswordToggle shown={showPassword} onToggle={() => setShowPassword((v) => !v)} />
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
        Créer mon compte
      </Button>
      <p className="text-sm text-brand-ink-2">
        En créant un compte, vous acceptez les{" "}
        <Link href="/conditions" className="font-semibold text-brand-royal underline underline-offset-4">conditions d'utilisation</Link> et la{" "}
        <Link href="/confidentialite" className="font-semibold text-brand-royal underline underline-offset-4">politique de confidentialité</Link>.
      </p>
    </form>
  );
}
