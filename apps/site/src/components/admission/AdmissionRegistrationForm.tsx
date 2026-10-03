import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ADMISSION_FACULTIES } from "@/data/domains";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Upload, User, BookOpen, FileText, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import heroCampusBg from "@/assets/hero-bg.jpg";

/** Niveaux proposés à l’admission (pas de L4 à l’UPG). */
const ADMISSION_PROMOTIONS = ["L1", "L2", "L3", "M1", "M2", "Doc1", "Doc2"] as const;

/** Nationalité proposée (défaut : Congolaise (RDC)) */
const ADMISSION_NATIONALITIES = [
  "Algérienne",
  "Angolaise",
  "Béninoise",
  "Botswanaise",
  "Burkinabè",
  "Burundaise",
  "Camerounaise",
  "Cap-verdienne",
  "Centrafricaine",
  "Comorienne",
  "Congolaise (RDC)",
  "Congolaise (Congo-Brazzaville)",
  "Ivoirienne",
  "Djiboutienne",
  "Égyptienne",
  "Érythréenne",
  "Eswatinienne (ou Swazie)",
  "Éthiopienne",
  "Gabonaise",
  "Gambienne",
  "Ghanéenne",
  "Guinéenne",
  "Bissaoguinéenne",
  "Équatoguinéenne",
  "Kényane",
  "Lesothane (ou Sotho)",
  "Libérienne",
  "Libyenne",
  "Malgache",
  "Malawite",
  "Malienne",
  "Marocaine",
  "Mauricienne",
  "Mauritanienne",
  "Mozambicaine",
  "Namibienne",
  "Nigérienne",
  "Nigériane",
  "Ougandaise",
  "Rwandaise",
  "Santoméenne",
  "Sénégalaise",
  "Seychelloise",
  "Sierraléonaise",
  "Somalienne",
  "Soudanaise",
  "Sud-africaine",
  "Sud-soudanaise",
  "Tanzanienne",
  "Tchadienne",
  "Togolaise",
  "Tunisienne",
  "Zambienne",
  "Zimbabwéenne",
] as const;

const ADMISSION_NATIONALITY_SET = new Set<string>(ADMISSION_NATIONALITIES);

/** Doit être une entrée exacte de `ADMISSION_NATIONALITIES` (sinon Radix Select lève une erreur au rendu). */
const ADMISSION_DEFAULT_NATIONALITE = "Congolaise (RDC)" as const;
if (!ADMISSION_NATIONALITY_SET.has(ADMISSION_DEFAULT_NATIONALITE)) {
  throw new Error(
    "[AdmissionRegistrationForm] ADMISSION_DEFAULT_NATIONALITE absente de ADMISSION_NATIONALITIES",
  );
}

function isValidAdmissionNationalite(value: string): boolean {
  const t = value.trim();
  return t.length > 0 && ADMISSION_NATIONALITY_SET.has(t);
}

const ADMISSION_SUPPORT_EMAIL = "jacquesmasuruku2@gmail.com";

function formatAdmissionSubmitError(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return "Une erreur inattendue s’est produite.";
}

const steps = [
  { label: "Identité", title: "Identité personnelle", icon: User },
  { label: "Parcours Scolaire", title: "Parcours Scolaire", icon: BookOpen },
  { label: "Documents", title: "Documents", icon: FileText },
];

type FormState = {
  nom: string;
  postnom: string;
  prenom: string;
  sexe: string;
  date_naissance: string;
  lieu_naissance: string;
  nationalite: string;
  telephone: string;
  email: string;
  adresse: string;
  faculteSlug: string;
  filiere: string;
  promotion: string;
  annee_academique: string;
};

const initialForm: FormState = {
  nom: "",
  postnom: "",
  prenom: "",
  sexe: "",
  date_naissance: "",
  lieu_naissance: "",
  nationalite: ADMISSION_DEFAULT_NATIONALITE,
  telephone: "",
  email: "",
  adresse: "",
  faculteSlug: "",
  filiere: "",
  promotion: "",
  annee_academique: "2025-2026",
};

const AdmissionRegistrationForm = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [diplomeFile, setDiplomeFile] = useState<File | null>(null);
  const [bulletinFile, setBulletinFile] = useState<File | null>(null);
  const [attestationFile, setAttestationFile] = useState<File | null>(null);

  const selectedFaculty = ADMISSION_FACULTIES.find((f) => f.slug === form.faculteSlug);
  const update = (key: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("La photo ne doit pas dépasser 5 Mo");
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      toast.error("Adresse email invalide");
      return;
    }
    if (!isValidAdmissionNationalite(form.nationalite)) {
      toast.error("Indiquez une nationalité dans la liste.");
      return;
    }

    if (!photoFile) {
      toast.error("La photo de passeport est obligatoire");
      return;
    }

    const maxPdf = 10 * 1024 * 1024;
    for (const f of [diplomeFile, bulletinFile, attestationFile]) {
      if (f && f.size > maxPdf) {
        toast.error("Chaque PDF ne doit pas dépasser 10 Mo");
        return;
      }
    }

    setSubmitting(true);
    try {
      const facultyRow = ADMISSION_FACULTIES.find((f) => f.slug === form.faculteSlug);
      if (!facultyRow) {
        toast.error("Choisissez une faculté.");
        setSubmitting(false);
        return;
      }

      const payload = new FormData();
      payload.append("nom", form.nom.trim());
      payload.append("postnom", form.postnom.trim());
      payload.append("prenom", form.prenom.trim());
      payload.append("sexe", form.sexe);
      payload.append("date_naissance", form.date_naissance);
      payload.append("lieu_naissance", form.lieu_naissance.trim());
      payload.append("nationalite", form.nationalite.trim());
      payload.append("telephone", form.telephone.trim());
      payload.append("email", form.email.trim());
      payload.append("adresse", form.adresse.trim());
      payload.append("domaine", facultyRow.label);
      payload.append("filiere", form.filiere);
      payload.append("promotion", form.promotion);
      payload.append("annee_academique", form.annee_academique.trim() || "2025-2026");
      payload.append("photo", photoFile);
      if (diplomeFile) payload.append("diplome", diplomeFile);
      if (bulletinFile) payload.append("bulletin", bulletinFile);
      if (attestationFile) payload.append("attestation", attestationFile);

      const configuredApiBase = import.meta.env.VITE_ADMISSION_API_BASE?.trim();
      if (import.meta.env.PROD && !configuredApiBase) {
        throw new Error("L’API d’inscription n’est pas configurée pour la production.");
      }
      const apiBase = (configuredApiBase || "").replace(/\/$/, "");
      const response = await fetch(`${apiBase}/api/admissions`, { method: "POST", body: payload });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.studentId) {
        throw new Error(result?.error || "Impossible d’enregistrer l’inscription.");
      }

      const studentId = String(result.studentId);
      const emailConfirmationSent = result.emailConfirmationSent === true;

      // Sauvegarder les données pour la page de succès
      const successData = {
        nom: form.nom.trim(),
        postnom: form.postnom.trim(),
        prenom: form.prenom.trim(),
        email: form.email.trim(),
        telephone: form.telephone.trim(),
        faculte: facultyRow.label,
        filiere: form.filiere,
        promotion: form.promotion,
        dateInscription: new Date().toLocaleDateString('fr-FR'),
        reference: result.reference || `UPG-ADM-${studentId.slice(0, 8).toUpperCase()}`,
        studentId,
        emailConfirmationSent,
      };
      
      localStorage.setItem('admissionSuccess', JSON.stringify(successData));

      if (emailConfirmationSent) {
        toast.success(`Inscription enregistrée. Confirmation envoyée à ${form.email.trim()}.`);
      } else {
        toast.error("Inscription enregistrée, mais l’e-mail n’a pas pu être envoyé. Vous pourrez le renvoyer depuis la page de confirmation.");
      }
      navigate("/admission-success");
    } catch (err: unknown) {
      if (import.meta.env.DEV) console.error("[admission submit]", err);
      const msg = formatAdmissionSubmitError(err);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed = () => {
    if (step === 0)
      return Boolean(
        form.nom &&
          form.postnom &&
          form.prenom &&
          form.sexe &&
          form.date_naissance &&
          form.lieu_naissance &&
          isValidAdmissionNationalite(form.nationalite) &&
          form.telephone &&
          form.email &&
          form.adresse,
      );
    if (step === 1) return Boolean(form.faculteSlug && form.filiere && form.promotion);
    if (step === 2) return Boolean(photoFile);
    return true;
  };

  return (
    <div className="relative min-h-[100dvh] min-h-screen overflow-x-hidden py-8 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] pt-[max(3rem,env(safe-area-inset-top,0px))] sm:py-6 sm:pb-6 sm:pt-8">
      {/* Même visuel que l’en-tête « Frais académiques » (/frais) */}
      <img
        src={heroCampusBg}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
        fetchPriority="low"
      />
      <div className="absolute inset-0 bg-black/55" aria-hidden />
      <div
        className="absolute inset-0 bg-gradient-to-br from-primary/92 via-primary/82 to-primary/68"
        aria-hidden
      />

      <div className="relative z-10 w-full max-w-4xl mx-auto px-3 sm:px-4 lg:px-4">
        {/* Stepper : défilement horizontal sur très petits écrans si besoin */}
        <div className="mb-3 -mx-1 overflow-x-auto overflow-y-visible px-1 pb-2 sm:mx-0 sm:mb-4 sm:overflow-visible sm:px-0 lg:mb-6 [scrollbar-width:thin] max-w-3xl mx-auto">
          <div className="flex min-w-min items-center justify-center gap-0 sm:min-w-0 sm:w-full">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const isCompleted = i < step;
            const isCurrent = i === step;
            const isUpcoming = i > step;
            return (
              <div key={s.label} className="flex items-center shrink-0">
                <div className="flex flex-col items-center gap-2 px-1">
                  <div
                    className={cn(
                      "h-12 w-12 sm:h-11 sm:w-11 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg touch-manipulation relative",
                      isCompleted
                        ? "bg-green-500 text-white shadow-green-500/25 ring-4 ring-green-500/30 scale-105"
                        : isCurrent
                          ? "bg-white text-primary ring-4 ring-white/50 shadow-black/30 scale-110"
                          : "bg-white/20 text-white/80 ring-2 ring-white/30 backdrop-blur-[2px]",
                    )}
                  >
                    {isCompleted && (
                      <div className="absolute inset-0 rounded-full bg-green-500 animate-pulse opacity-20"></div>
                    )}
                    {isCompleted ? (
                      <div className="relative">
                        <Check className="h-6 w-6 sm:h-5 sm:w-5" />
                        <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full border-2 border-white"></div>
                      </div>
                    ) : (
                      <Icon className="h-5 w-5 sm:h-4 sm:w-4" aria-hidden />
                    )}
                  </div>
                  <div className="text-center">
                    <span
                      className={cn(
                        "text-xs sm:text-xs font-bold text-center leading-tight drop-shadow-sm block",
                        isCompleted
                          ? "text-green-300 font-extrabold"
                          : isCurrent
                            ? "text-white font-extrabold text-sm"
                            : "text-white/60 font-medium",
                      )}
                    >
                      {s.label}
                    </span>
                    {isCompleted && (
                      <span className="text-[10px] text-green-400 font-medium mt-1 block">
                        ✓ Terminé
                      </span>
                    )}
                    {isCurrent && (
                      <span className="text-[10px] text-white/90 font-medium mt-1 block animate-pulse">
                        En cours...
                      </span>
                    )}
                  </div>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={cn(
                      "h-1 w-8 shrink-0 rounded-full transition-all duration-500 sm:mx-2 sm:w-24 lg:w-32 mx-2",
                      isCompleted
                        ? "bg-green-400 shadow-green-400/50"
                        : "bg-white/20",
                    )}
                  >
                    {isCompleted && (
                      <div className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full animate-pulse"></div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          </div>
        </div>

        <Card className="mx-auto w-full max-w-3xl border border-border/60 shadow-2xl bg-card/95 backdrop-blur-sm rounded-xl sm:rounded-2xl overflow-hidden ring-1 ring-black/5">
          <CardHeader className="border-b border-border/40 bg-muted/20 px-3 pb-2 pt-4 sm:px-4 sm:pt-5 sm:pb-3">
            <CardTitle className="text-base font-semibold leading-snug text-primary tracking-tight sm:text-lg md:text-xl">
              Étape {step + 1} sur {steps.length} — {steps[step].title}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-5 pt-4 sm:px-4 sm:pb-6 sm:pt-5 lg:px-5 [&_label]:text-sm [&_input]:min-h-11 [&_input]:text-base sm:[&_input]:min-h-10 sm:[&_input]:text-sm [&_button]:min-h-11 sm:[&_button]:min-h-10">
            {step === 0 && (
              <div className="grid gap-3.5 sm:gap-4 sm:grid-cols-2 xl:grid-cols-2">
                <div className="space-y-2">
                  <Label>
                    Nom <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={form.nom}
                    onChange={(e) => update("nom", e.target.value)}
                    placeholder="Votre nom"
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    Postnom <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={form.postnom}
                    onChange={(e) => update("postnom", e.target.value)}
                    placeholder="Votre postnom"
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    Prénom <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={form.prenom}
                    onChange={(e) => update("prenom", e.target.value)}
                    placeholder="Votre prénom"
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    Sexe <span className="text-destructive">*</span>
                  </Label>
                  <Select value={form.sexe} onValueChange={(v) => update("sexe", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Masculin</SelectItem>
                      <SelectItem value="F">Féminin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>
                    Date de naissance <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={form.date_naissance}
                    onChange={(e) => update("date_naissance", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    Lieu de naissance <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={form.lieu_naissance}
                    onChange={(e) => update("lieu_naissance", e.target.value)}
                    placeholder="Lieu de naissance"
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    Nationalité <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={
                      isValidAdmissionNationalite(form.nationalite)
                        ? form.nationalite.trim()
                        : undefined
                    }
                    onValueChange={(v) => update("nationalite", v)}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Choisir une nationalité" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[min(320px,70vh)]">
                      {ADMISSION_NATIONALITIES.map((n) => (
                        <SelectItem key={n} value={n}>
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>
                    Téléphone <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={form.telephone}
                    onChange={(e) => update("telephone", e.target.value)}
                    placeholder="+243 ..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="email@exemple.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    Adresse <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={form.adresse}
                    onChange={(e) => update("adresse", e.target.value)}
                    placeholder="Votre adresse complète"
                  />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="grid gap-5 sm:grid-cols-2 max-w-4xl">
                <div className="sm:col-span-2 space-y-2">
                  <Label>
                    Faculté <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={form.faculteSlug}
                    onValueChange={(v) => {
                      setForm((prev) => ({ ...prev, faculteSlug: v, filiere: "" }));
                    }}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Choisir une faculté" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[min(320px,70vh)]">
                      {ADMISSION_FACULTIES.map((f) => (
                        <SelectItem key={f.slug} value={f.slug}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label>
                    Filière / programme <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={form.filiere}
                    onValueChange={(v) => update("filiere", v)}
                    disabled={!selectedFaculty}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue
                        placeholder={
                          selectedFaculty ? "Choisir une filière" : "Choisissez d’abord une faculté"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="max-h-[min(320px,70vh)]">
                      {selectedFaculty?.filieres.map((filiere) => (
                        <SelectItem key={filiere} value={filiere}>
                          {filiere}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>
                    Promotion <span className="text-destructive">*</span>
                  </Label>
                  <Select value={form.promotion} onValueChange={(v) => update("promotion", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir" />
                    </SelectTrigger>
                    <SelectContent>
                      {ADMISSION_PROMOTIONS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Année académique</Label>
                  <Input
                    value={form.annee_academique}
                    onChange={(e) => update("annee_academique", e.target.value)}
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <p className="text-sm text-muted-foreground bg-muted/50 p-3.5 rounded-xl flex items-start gap-3 leading-relaxed">
                  <Camera className="h-5 w-5 shrink-0 text-primary mt-0.5" aria-hidden />
                  <span>
                    La photo passeport est <strong>obligatoire</strong>. Les autres documents ci-dessous sont facultatifs ;
                    vous pouvez les ajouter plus tard si besoin.
                  </span>
                </p>
                <div className="space-y-2">
                  <Label>
                    Photo passeport <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:flex-wrap sm:items-start">
                    <div className="min-w-0 w-full flex-1 sm:min-w-[200px]">
                      <label className="flex min-h-[8.5rem] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 px-4 py-6 transition-colors active:bg-primary/15 hover:bg-primary/10 sm:min-h-[7rem]">
                        <Upload className="mb-2 h-7 w-7 text-primary/60 sm:h-6 sm:w-6" aria-hidden />
                        <span className="text-center text-xs text-muted-foreground sm:text-xs">
                          Appuyez pour choisir une photo
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {photoPreview && (
                      <img
                        src={photoPreview}
                        alt="Aperçu photo passeport"
                        className="mx-auto h-28 w-24 shrink-0 rounded-lg border-2 border-primary/20 object-cover shadow-sm sm:mx-0 sm:h-24 sm:w-20"
                      />
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Diplôme d&apos;État (PDF)</Label>
                  <Input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => setDiplomeFile(e.target.files?.[0] ?? null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bulletin des 2 dernières années (PDF)</Label>
                  <Input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => setBulletinFile(e.target.files?.[0] ?? null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Attestation de bonne conduite (PDF)</Label>
                  <Input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => setAttestationFile(e.target.files?.[0] ?? null)}
                  />
                </div>
              </div>
            )}

            <div
              className={cn(
                "mt-8 flex gap-3 border-t border-border/50 pt-6",
                step > 0
                  ? "flex-col-reverse sm:flex-row sm:items-center sm:justify-between"
                  : "justify-end",
              )}
            >
              {step > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full touch-manipulation sm:w-auto"
                  onClick={() => setStep((s) => s - 1)}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" /> Précédent
                </Button>
              ) : null}
              {step < 2 ? (
                <Button
                  type="button"
                  className="w-full touch-manipulation sm:w-auto"
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!canProceed()}
                  size="lg"
                >
                  Suivant <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  type="button"
                  className="w-full touch-manipulation sm:w-auto"
                  onClick={() => void handleSubmit()}
                  disabled={submitting}
                  size="lg"
                >
                  {submitting ? "Envoi..." : "Soumettre l'inscription"}{" "}
                  <Check className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 max-w-2xl mx-auto px-2 text-center text-xs leading-relaxed text-white/90 drop-shadow-md sm:mt-8 sm:text-sm sm:px-4">
          Si vous rencontrez des difficultés, merci de nous contacter à{" "}
          <a
            href={`mailto:${ADMISSION_SUPPORT_EMAIL}?subject=Assistance%20formulaire%20d%27admission%20UPG`}
            className="font-semibold text-white underline decoration-white/60 underline-offset-2 hover:text-white hover:decoration-white"
          >
            cette adresse email
          </a>{" "}
          pour une assistance rapide.
        </p>
      </div>
    </div>
  );
};

export default AdmissionRegistrationForm;
