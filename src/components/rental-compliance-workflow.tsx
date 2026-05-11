"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type AgreementType = "movable_appliance" | "immovable_commercial";
type SigningMode = "physical" | "electronic";

const INDIA_STATES_AND_UTS = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

const STAMP_CHECKS = [
  "Confirm instrument category and latest stamp duty applicable in your selected state/UT.",
  "Use valid e-stamp/franking/paper process accepted in your state before or at execution.",
  "Ensure both parties sign the same final version after stamp duty compliance.",
  "Store proof of stamp payment with agreement ID, date, and amount.",
];

const REGISTRATION_CHECKS = [
  "If compulsory, present the document to the correct Sub-Registrar office.",
  "Present for registration within the statutory timeline and keep receipt/acknowledgment.",
  "Carry IDs, address proof, photos, witnesses, and supporting annexures.",
  "Match property/address/appliance schedule details with the signed agreement version.",
  "Keep scanned registered copy and index/reference number in platform records.",
];

const ESIGN_CHECKS = [
  "Use an electronic signature flow recognized under Indian IT-law framework.",
  "Verify signer identity (KYC) before signature initiation.",
  "Capture explicit signer consent for electronic execution.",
  "Store signed artifact hash, timestamp, and signature verification result.",
  "Preserve signature certificate chain/audit trail for dispute evidence.",
  "Store revocation/status evidence for long-term verification readiness.",
];

function Checklist({
  title,
  items,
  values,
  onToggle,
  description,
}: {
  title: string;
  items: string[];
  values: boolean[];
  onToggle: (index: number) => void;
  description?: string;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
      <h3 className="text-sm font-semibold tracking-wide text-zinc-950 sm:text-base">{title}</h3>
      {description ? <p className="mt-1 text-xs leading-5 text-zinc-600">{description}</p> : null}
      <div className="mt-3 space-y-2">
        {items.map((item, index) => (
          <label
            key={item}
            className={cn(
              "flex cursor-pointer items-start gap-2 rounded-xl border px-3 py-2 text-sm transition",
              values[index] ? "border-zinc-400 bg-white" : "border-zinc-200 bg-white/70 hover:bg-white",
            )}
          >
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-zinc-400 text-zinc-900"
              checked={values[index]}
              onChange={() => onToggle(index)}
            />
            <span className="leading-5 text-zinc-700">{item}</span>
          </label>
        ))}
      </div>
    </section>
  );
}

export function RentalComplianceWorkflow() {
  const [stateName, setStateName] = useState("Delhi");
  const [agreementType, setAgreementType] = useState<AgreementType>("movable_appliance");
  const [tenureMonths, setTenureMonths] = useState(11);
  const [isYearToYear, setIsYearToYear] = useState(false);
  const [hasYearlyRent, setHasYearlyRent] = useState(false);
  const [signingMode, setSigningMode] = useState<SigningMode>("electronic");

  const [stampChecks, setStampChecks] = useState(() => STAMP_CHECKS.map(() => false));
  const [registrationChecks, setRegistrationChecks] = useState(() => REGISTRATION_CHECKS.map(() => false));
  const [esignChecks, setEsignChecks] = useState(() => ESIGN_CHECKS.map(() => false));

  const isImmovable = agreementType !== "movable_appliance";
  const registrationRequired = isImmovable && (isYearToYear || tenureMonths > 12 || hasYearlyRent);

  const registrationReason = useMemo(() => {
    if (!isImmovable) {
      return "Movable appliance rental: registration is usually optional; verify special local rules before execution.";
    }

    const reasons: string[] = [];
    if (isYearToYear) reasons.push("lease is year-to-year");
    if (tenureMonths > 12) reasons.push("term exceeds 12 months");
    if (hasYearlyRent) reasons.push("yearly rent is reserved");

    if (reasons.length === 0) {
      return "Current inputs do not trigger compulsory registration criteria under the standard immovable-lease rule, but local practice may still require registration.";
    }

    return `Compulsory registration likely because ${reasons.join(", ")}.`;
  }, [hasYearlyRent, isImmovable, isYearToYear, tenureMonths]);

  const stampDone = stampChecks.filter(Boolean).length;
  const registrationDone = registrationChecks.filter(Boolean).length;
  const esignDone = esignChecks.filter(Boolean).length;

  const stampReady = stampDone === STAMP_CHECKS.length;
  const registrationReady = registrationRequired ? registrationDone === REGISTRATION_CHECKS.length : true;
  const esignReady = signingMode === "electronic" ? esignDone === ESIGN_CHECKS.length : true;

  const overallReady = stampReady && registrationReady && esignReady;

  return (
    <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-5">
      <header className="space-y-1 border-b border-zinc-200 pb-4">
        <h2 className="text-lg font-semibold text-zinc-950 sm:text-xl">India Legal Execution Readiness Checklist</h2>
        <p className="text-sm leading-6 text-zinc-700">
          Configure your transaction and complete this checklist before final signing. This does not replace advocate
          review.
        </p>
      </header>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-xs uppercase tracking-[0.16em] text-zinc-500">State / UT</span>
          <Select value={stateName} onChange={(event) => setStateName(event.target.value)}>
            {INDIA_STATES_AND_UTS.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </Select>
        </label>

        <label className="space-y-1.5">
          <span className="text-xs uppercase tracking-[0.16em] text-zinc-500">Agreement Type</span>
          <Select
            value={agreementType}
            onChange={(event) => setAgreementType(event.target.value as AgreementType)}
          >
            <option value="movable_appliance">Movable appliance rental</option>
            <option value="immovable_commercial">Immovable property lease (commercial)</option>
          </Select>
        </label>

        <label className="space-y-1.5">
          <span className="text-xs uppercase tracking-[0.16em] text-zinc-500">Term (Months)</span>
          <Input
            type="number"
            min={1}
            max={120}
            value={tenureMonths}
            onChange={(event) => {
              const next = Number(event.target.value);
              if (Number.isNaN(next)) return;
              setTenureMonths(Math.max(1, Math.min(120, next)));
            }}
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-xs uppercase tracking-[0.16em] text-zinc-500">Execution Mode</span>
          <Select value={signingMode} onChange={(event) => setSigningMode(event.target.value as SigningMode)}>
            <option value="electronic">Electronic signature workflow</option>
            <option value="physical">Physical ink-sign workflow</option>
          </Select>
        </label>
      </div>

      <div className="mt-4 grid gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 sm:grid-cols-2">
        <label className={cn("flex items-center gap-2 text-sm", !isImmovable && "opacity-60")}>
          <input
            type="checkbox"
            checked={isYearToYear}
            disabled={!isImmovable}
            onChange={(event) => setIsYearToYear(event.target.checked)}
          />
          <span>Year-to-year lease</span>
        </label>
        <label className={cn("flex items-center gap-2 text-sm", !isImmovable && "opacity-60")}>
          <input
            type="checkbox"
            checked={hasYearlyRent}
            disabled={!isImmovable}
            onChange={(event) => setHasYearlyRent(event.target.checked)}
          />
          <span>Yearly rent is reserved</span>
        </label>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
          <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Stamp Duty Checks</p>
          <p className="mt-1 text-sm font-semibold text-zinc-950">
            {stampDone}/{STAMP_CHECKS.length} complete
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
          <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Registration Status</p>
          <p className="mt-1 text-sm font-semibold text-zinc-950">{registrationRequired ? "Likely compulsory" : "Likely optional"}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
          <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Overall Readiness</p>
          <p className={cn("mt-1 text-sm font-semibold", overallReady ? "text-emerald-700" : "text-amber-700")}>
            {overallReady ? "Ready to execute" : "Pending actions"}
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm leading-6 text-zinc-700">
        <p>
          <span className="font-semibold text-zinc-950">State selected:</span> {stateName}
        </p>
        <p className="mt-1">
          <span className="font-semibold text-zinc-950">Registration guidance:</span> {registrationReason}
        </p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Checklist
          title="Stamp and Documentation Checklist"
          description={`Confirm the latest state-specific duty schedule for ${stateName} before execution.`}
          items={STAMP_CHECKS}
          values={stampChecks}
          onToggle={(index) => setStampChecks((prev) => prev.map((value, current) => (current === index ? !value : value)))}
        />
        <Checklist
          title="Registration Checklist"
          description={registrationRequired ? "Follow all steps before concluding registration." : "Keep ready in case parties choose to register voluntarily."}
          items={REGISTRATION_CHECKS}
          values={registrationChecks}
          onToggle={(index) =>
            setRegistrationChecks((prev) => prev.map((value, current) => (current === index ? !value : value)))
          }
        />
      </div>

      <div className="mt-4">
        <Checklist
          title="E-Sign Readiness Checks"
          description={
            signingMode === "electronic"
              ? "Complete all points for stronger electronic enforceability evidence."
              : "Switch execution mode to electronic when you want to run e-sign readiness validation."
          }
          items={ESIGN_CHECKS}
          values={esignChecks}
          onToggle={(index) => setEsignChecks((prev) => prev.map((value, current) => (current === index ? !value : value)))}
        />
      </div>

      <p className="mt-4 text-xs leading-5 text-zinc-500">
        Legal references for checklist logic: Indian Contract Act, 1872 (contract essentials), Indian Stamp Act, 1899
        (duly stamped instrument), Registration Act, 1908 (registration triggers and effects), and Information
        Technology Act, 2000 (electronic contracts/signatures).
      </p>
    </section>
  );
}
