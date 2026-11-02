import React from "react";
import { WorkflowsNavbar } from "@/components/workflows/WorkflowsNavbar";
import { WorkflowsMainShell } from "@/components/workflows/WorkflowsMainShell";
import { WorkflowsFooter } from "@/components/workflows/WorkflowsFooter";

export default function WorkflowsPage() {
  return (
    <main className="w-full min-h-screen bg-[#09090B] flex flex-col items-center overflow-x-hidden">
      <div
        data-pencil-id="I5cAwn"
        data-pencil-name="RICO Workflows"
        className="box-border w-full h-fit flex flex-col gap-0 justify-start items-center bg-[#09090B] overflow-hidden"
      >
        <WorkflowsNavbar />
        <WorkflowsMainShell />
        <WorkflowsFooter />
      </div>
    </main>
  );
}
