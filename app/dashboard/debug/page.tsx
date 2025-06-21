import { FirebaseDataInspector } from "@/components/firebase-data-inspector"

export default function DebugPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Debug Page</h1>

      {/* Add this section after the existing debug components: */}
      <div className="mb-8">
        <FirebaseDataInspector />
      </div>
    </div>
  )
}
