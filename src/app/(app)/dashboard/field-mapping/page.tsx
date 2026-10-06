import type { Metadata } from "next";
import { AppPageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/Button";
import { FieldMappingForm } from "@/components/app/FieldMappingForm";

export const metadata: Metadata = { title: "Field Mapping" };

export default function FieldMappingPage() {
  return (
    <>
      <AppPageHeader title="Field Mapping" description="Tell us which Notion properties hold each part of your YouTube upload. Set it once."
        actions={<Button type="submit" form="field-mapping-form" variant="primary">Save</Button>}
      />
      <FieldMappingForm />
    </>
  );
}
