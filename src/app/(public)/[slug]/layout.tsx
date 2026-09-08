import React from "react";

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
