import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="tech-label">ERROR // 404-NOT-FOUND</p>
      <h1 className="font-sans-tech text-5xl font-bold text-[var(--color-line)]">Off the Grid</h1>
      <p className="max-w-md font-sans-tech text-sm text-[#8593ad]">
        This blueprint reference doesn&apos;t exist, or has been redrawn elsewhere.
      </p>
      <Link href="/" className="btn-primary mt-4">
        Return Home
      </Link>
    </div>
  );
}
