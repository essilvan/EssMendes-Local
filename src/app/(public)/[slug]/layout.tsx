import React from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function PublicShowcaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-full overflow-x-hidden">
      {children}
    </div>
  );
}
