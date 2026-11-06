"use client"

import type { AdminInfo, AdminKey } from "@/lib/admin-info"

type Props = {
  values: Partial<AdminInfo>
  onChange?: (key: AdminKey, value: string) => void
}

function Field({
  k, label, values, onChange, type = "text", placeholder, className,
}: Props & { k: AdminKey; label: string; type?: string; placeholder?: string; className?: string }) {
  return (
    <div className={className}>
      <label htmlFor={k} className="label">{label}</label>
      <input
        id={k} name={k} type={type} placeholder={placeholder} className="input-field"
        defaultValue={values[k] ?? ""}
        onChange={e => onChange?.(k, e.target.value)}
      />
    </div>
  )
}

function Select({
  k, label, options, values, onChange, className,
}: Props & { k: AdminKey; label: string; options: [string, string][]; className?: string }) {
  return (
    <div className={className}>
      <label htmlFor={k} className="label">{label}</label>
      <select id={k} name={k} className="input-field" defaultValue={values[k] ?? ""} onChange={e => onChange?.(k, e.target.value)}>
        <option value="">—</option>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  )
}

/** Nom d'usage, code lieu de naissance, adresse, téléphone fixe. */
export function IdentityFields(p: Props) {
  return (
    <div className="space-y-3">
      <Field k="usageName" label="Nom d'usage (si différent du nom de naissance)" placeholder="Ex : nom d'épouse" {...p} />
      <Field k="birthPostalCode" label="Code postal / INSEE du lieu de naissance" placeholder="Ex : 69123" {...p} />
      <Field k="address" label="Adresse" placeholder="N° et rue" {...p} />
      <div className="grid grid-cols-3 gap-3">
        <Field k="postalCode" label="Code postal" placeholder="75001" {...p} />
        <Field k="city" label="Ville" className="col-span-2" {...p} />
      </div>
      <Field k="landlinePhone" label="Téléphone fixe" type="tel" placeholder="01 23 45 67 89" {...p} />
    </div>
  )
}

/** Sécurité sociale, couverture, mutuelle, assuré principal. */
export function InsuranceFields(p: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Assurance maladie</h4>
        <Field k="socialSecurityNumber" label="N° de sécurité sociale" placeholder="1 85 05 78 006 084 36" {...p} />
        <Field k="healthFund" label="Caisse d'assurance maladie" placeholder="Ex : CPAM des Yvelines" {...p} />
        <div className="grid grid-cols-2 gap-3">
          <Select k="coverageType" label="Type de couverture"
            options={[["STANDARD", "Régime général"], ["ALD", "ALD (affection longue durée)"], ["CMU", "CMU / C2S"], ["AME", "AME"], ["AUCUNE", "Aucune couverture"]]} {...p} />
          <Field k="coverageEndDate" label="Fin de validité" type="date" {...p} />
        </div>
      </div>
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Mutuelle</h4>
        <Field k="mutuelleName" label="Nom de la mutuelle" {...p} />
        <div className="grid grid-cols-2 gap-3">
          <Field k="mutuelleNumber" label="N° d'adhérent" {...p} />
          <Field k="mutuelleEndDate" label="Fin de validité" type="date" {...p} />
        </div>
      </div>
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Assuré principal</h4>
        <p className="text-xs text-gray-400 -mt-2">Seulement si vous êtes ayant droit (enfant, conjoint…).</p>
        <Field k="insuredName" label="Nom de l'assuré" {...p} />
        <Field k="insuredAddress" label="Adresse de l'assuré" {...p} />
      </div>
    </div>
  )
}

/** Personne à prévenir, personne de confiance, directives anticipées. */
export function EntourageFields(p: Props) {
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Personne à prévenir</h4>
        <p className="text-xs text-gray-400 -mt-2">Avertie des changements administratifs (transfert, sortie…). Ne participe pas aux décisions médicales.</p>
        <div className="grid grid-cols-2 gap-3">
          <Field k="ecFirstName" label="Prénom" {...p} />
          <Field k="ecLastName" label="Nom" {...p} />
          <Field k="ecRelationship" label="Lien de parenté" placeholder="Ex : Conjoint(e), parent…" {...p} />
          <Field k="ecPhone" label="Téléphone" type="tel" {...p} />
          <Field k="ecEmail" label="Email" type="email" {...p} />
          <Field k="ecAddress" label="Adresse" {...p} />
        </div>
      </div>
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Personne de confiance (facultatif)</h4>
        <p className="text-xs text-gray-400 -mt-2">Vous accompagne et peut être consultée si vous ne pouvez plus exprimer votre volonté. Peut être différente de la personne à prévenir.</p>
        <div className="grid grid-cols-2 gap-3">
          <Field k="tpFirstName" label="Prénom" {...p} />
          <Field k="tpLastName" label="Nom" {...p} />
          <Field k="tpRelationship" label="Lien de parenté" placeholder="Ex : Conjoint(e), parent…" {...p} />
          <Field k="tpPhone" label="Téléphone" type="tel" {...p} />
          <Field k="tpEmail" label="Email" type="email" {...p} />
          <Field k="tpAddress" label="Adresse" {...p} />
        </div>
      </div>
      <Select k="advanceDirectives" label="Directives anticipées rédigées ?"
        options={[["OUI", "Oui"], ["NON", "Non"]]} {...p} />
    </div>
  )
}

/** Pièce d'identité, employeur, médecin traitant, statut légal / représentant. */
export function SituationFields(p: Props) {
  const status = p.values.legalStatus ?? ""
  return (
    <div className="space-y-3">
      <Select k="idDocumentType" label="Pièce d'identité qui sera présentée à l'accueil"
        options={[["CNI", "Carte d'identité"], ["PASSEPORT", "Passeport"], ["TITRE_SEJOUR", "Titre de séjour"]]} {...p} />
      <Field k="employer" label="Employeur (à prévenir si besoin)" {...p} />
      <Field k="treatingDoctorPhone" label="Téléphone du médecin traitant" type="tel" {...p} />
      <Select k="legalStatus" label="Situation"
        options={[["MAJEUR", "Majeur autonome"], ["MINEUR", "Mineur"], ["TUTELLE", "Majeur sous tutelle"]]} {...p} />
      {(status === "MINEUR" || status === "TUTELLE") && (
        <div className="grid grid-cols-2 gap-3 rounded-xl bg-amber-50 border border-amber-200 p-3">
          <p className="col-span-2 text-xs text-amber-800">
            {status === "MINEUR"
              ? "Un parent devra présenter sa pièce d'identité et signer l'autorisation d'hospitalisation."
              : "Le tuteur devra fournir un extrait du jugement et signer l'autorisation d'admission et de soins."}
          </p>
          <Field k="legalRepName" label={status === "MINEUR" ? "Parent / représentant légal" : "Tuteur"} {...p} />
          <Field k="legalRepPhone" label="Téléphone" type="tel" {...p} />
        </div>
      )}
    </div>
  )
}
